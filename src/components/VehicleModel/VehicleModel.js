import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';
import { getCarModelPath } from '../../utils/assetPaths';
import { useScene } from '../../contexts/SceneContext';
import { WrapLayer } from '../../utils/wrapLayer';
import { usePaint, finishFor, TRIMS } from '../../utils/paintStore';
import {
  LIGHT_COLORS,
  classifyLight,
  ENVIRONMENTS,
  REFLECTION_URL,
  CUBE_FACES,
  LANES,
  LANE_WIDTH,
  ROAD_LENGTH,
  DASH_CYCLE_M,
  LANE_TEXTURE,
  ROAD_SURFACE,
  ROAD_SURFACE_OPACITY,
} from '../../config/sceneOptions';
import {
  VEHICLES,
  WHEELS,
  MODEL_BASE,
  PARTS,
  DEFAULT_VEHICLE,
  DEFAULT_COLOR,
  colorByKey,
  resolvePart,
} from '../../config/vehicleConfig';
import './VehicleModel.css';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Opening angles, added to each closure's resting hinge rotation.
const FRUNK_OPEN = Math.PI / 6;    // hood tilts up at the front
const TRUNK_OPEN = -Math.PI / 3.5; // tailgate lifts at the rear
const DOOR_OPEN = Math.PI / 2.6;   // door swings out

const isPaint = (m) => !!m && /^TESLAPAINT_/.test(m.name || '');

/*
 * Meshes the app never shows in a plain exterior view.
 *
 * `_GLOBAL` nodes are the lighting FX duplicates, `Marker` nodes are the
 * placement anchors, and Defrost/Airflow belong to the climate visualisation.
 *
 * The floor group matters most here: the app's shadow is not a shadow map at
 * all - each car ships a Floor/Ground mesh carrying a baked shadow texture, and
 * the app's scene has no lights. Rendered under a normal lit setup that plate
 * shows up as an opaque black quad under the car, which is exactly what it
 * looked like before this was added.
 */
const HIDE_PATTERNS = [
  /_GLOBAL$/i,
  /Defrost/i,
  /Airflow/i,
  /Marker$/i,
];
const FLOOR_PATTERNS = [/Ground/i, /Shadow/i, /^Floor/i];

/**
 * Prepare the car's switchable light states.
 *
 * TESLAFX_ nodes are the app's own light meshes. They start off, and each one
 * gets its own copy of the material because the originals are shared across
 * every lamp on the car - without the clone, switching the headlights would
 * light the brakes too.
 *
 * The projected pools on the road ("beams") are emitted light: additive, no
 * depth write, tinted to their lamp, so the rear pool reads red and the front
 * one white. Lamps themselves glow via emissive.
 */
function tagLightMeshes(root) {
  const fx = [];
  root.traverse((node) => {
    if (!/^TESLAFX_/i.test(node.name || '')) return;
    const info = classifyLight(node.name);
    node.traverse((o) => {
      if (!o.isMesh) return;
      const col = new THREE.Color(LIGHT_COLORS[info.sub || info.group] || 0xffffff);
      o.userData.fxGroup = info.group;
      o.userData.fxSide = info.side || null;
      o.userData.fxBeam = !!info.beam;
      o.userData.isFx = true;
      o.visible = false;
      o.castShadow = false;
      o.receiveShadow = false;

      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const own = mats.map((m) => {
        if (!m) return m;
        const c = m.clone();
        c.name = m.name;
        if (info.beam || m.isMeshBasicMaterial) {
          c.transparent = true;
          c.blending = THREE.AdditiveBlending;
          c.depthWrite = false;
          c.side = THREE.DoubleSide;
          c.opacity = info.beam ? 0.5 : 0.9;
          if (c.color) c.color.copy(col);
        } else {
          c.emissive = col.clone();
          c.emissiveMap = c.map || null;
          c.emissiveIntensity = 0;
        }
        return c;
      });
      o.material = Array.isArray(o.material) ? own : own[0];
      if (info.beam) {
        // The pools sit on y=0 and would z-fight the ground.
        o.position.y += 0.012;
        o.renderOrder = 3;
      }
      fx.push(o);
    });
  });
  root.userData.fx = fx;
  return fx;
}

/** Switch the tagged light meshes to match the current state. */
function applyLights(root, lights, blinkPhase) {
  for (const o of root.userData.fx || []) {
    const on = lightMeshOn(o, lights, blinkPhase);
    o.visible = on;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      // Bright enough that the lamp reads as glowing rather than just tinted.
      if (m && !o.userData.fxBeam && 'emissiveIntensity' in m) {
        m.emissiveIntensity = on ? 2.4 : 0;
      }
    }
  }
}

/** Whether one light mesh should be lit, given the switch state and blink phase. */
function lightMeshOn(o, lights, blinkPhase) {
  const g = o.userData.fxGroup;
  if (g === 'turn') {
    if (!blinkPhase) return false;
    if (lights.hazard) return true;
    return (o.userData.fxSide === 'L' && lights.turnL)
      || (o.userData.fxSide === 'R' && lights.turnR);
  }
  return !!lights[g];
}

const GLASS_ANY = /glass|window/i;
const GLASS_INTERIOR = /^Glass_.*Interior/i;

/**
 * Make the glass read as glass, and stop it glitching at angles.
 *
 * Two faults come straight from the Godot export:
 *
 *  - Every pane is alphaMode BLEND but keeps depthWrite on and the default
 *    render order, so the windscreen, side windows and roof write depth over
 *    one another. At some viewing angles a near pane then occludes a far one it
 *    should show through, and the transparent sort flips - panes flicker or
 *    drop out. Glass must draw AFTER all opaque geometry (renderOrder 10) and
 *    write no depth, so the panes simply blend in whatever order they arrive.
 *
 *  - The `Glass_*Interior` meshes are the panes' cabin-facing skins, modelled
 *    to be seen from inside. From outside their wrapped rims surface through the
 *    outer panes and, drawn late, paint sharp dark patches over the roof and
 *    rear window. They are hidden here (this view is always exterior).
 *
 * Materials are cloned before mutation so the shared glTF cache is not touched
 * when several vehicles are viewed in a session.
 */
function prepareGlass(root) {
  if (root.userData.glassPrepared) return;
  root.userData.glassPrepared = true;

  root.traverse((o) => {
    if (!o.isMesh || o.userData.isFx) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const names = mats.map((m) => (m && m.name) || '');
    const isGlass = names.some((n) => GLASS_ANY.test(n));
    if (!isGlass) return;

    // Cabin-facing skins are for the inside view only.
    if (names.some((n) => GLASS_INTERIOR.test(n))) {
      o.visible = false;
      o.userData.hidden = true;
      return;
    }

    o.renderOrder = 10;
    const own = mats.map((m) => {
      if (!m || !GLASS_ANY.test(m.name || '')) return m;
      const c = m.clone();
      c.name = m.name;
      c.transparent = true;
      c.depthWrite = false;   // the fix: no depth from glass, so panes blend
      if (!(c.opacity > 0 && c.opacity < 1)) c.opacity = 0.86;
      c.needsUpdate = true;
      return c;
    });
    o.material = Array.isArray(o.material) ? own : own[0];
  });
}

function hideNonExteriorMeshes(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.name || '';
    if (HIDE_PATTERNS.some((r) => r.test(name)) || FLOOR_PATTERNS.some((r) => r.test(name))) {
      o.visible = false;
      return;
    }
    // These models are meshopt-compressed with KHR_mesh_quantization, and the
    // bounding sphere that comes back from quantised position attributes is not
    // trustworthy - three.js then frustum-culls geometry that is squarely in
    // shot, and the car renders as nothing at all. Recompute it, and stop
    // culling anything that still looks wrong.
    if (o.geometry) {
      o.geometry.computeBoundingBox();
      o.geometry.computeBoundingSphere();
    }
    o.frustumCulled = false;
  });
}

// Equirectangular studio panorama, used as scene.environment.

// The car card has no panel of its own on the real display - it sits straight
// on the screen background, so the clear colour has to follow the theme.
const isDarkTheme = () =>
  typeof document !== 'undefined' && document.body.classList.contains('theme-dark');

/**
 * Tint the paint materials.
 *
 * The app's paint shader (opaque_skybox.shader) assigns `color` straight to
 * ALBEDO, so the values in colors.json are already linear - no sRGB decode.
 * Those albedos are near-black and read almost entirely as tinted reflection,
 * which comes out muted against a neutral studio environment, so a small chroma
 * lift restores the punch the app gets from its own coloured surroundings.
 * Greys are left alone.
 */
function applyPaint(root, color, paintType = 'Metallic') {
  const finish = finishFor(color, paintType);
  root.traverse((o) => {
    // A wrap overlay is vinyl, not paint: leave its material alone.
    if (!o.isMesh || o.userData.wrapOverlay) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!isPaint(m)) continue;
      m.color.setRGB(color.rgb[0], color.rgb[1], color.rgb[2], THREE.LinearSRGBColorSpace);
      const hsl = m.color.getHSL({});
      if (hsl.s > 0.06) {
        m.color.setHSL(
          hsl.h,
          Math.min(1, hsl.s * 1.35),
          Math.min(1, hsl.l * 1.12),
          THREE.LinearSRGBColorSpace
        );
      }
      m.metalness = finish.metalness;
      // The "Rough" variant is the app's matte/underside pass - keep it dull.
      m.roughness = /rough/i.test(m.name) ? Math.max(0.6, finish.roughness) : finish.roughness;
      m.needsUpdate = true;
    }
  });
}

/**
 * Window surrounds and mirror caps. Tesla's "chrome delete" is a real trim
 * option on the car's own paint override, and the models carry the parts as
 * their own `Trim*` materials, so it is a material tweak rather than geometry.
 */
function applyTrim(root, trimKey) {
  const t = TRIMS[trimKey] || TRIMS.Chrome;
  root.traverse((o) => {
    if (!o.isMesh || o.userData.wrapOverlay) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || !/^trim/i.test(m.name || '')) continue;
      m.color.setHex(t.color);
      m.metalness = t.metalness;
      m.roughness = t.roughness;
      m.needsUpdate = true;
    }
  });
}

/**
 * Hang the wheels off the body.
 *
 * Each vehicle carries wheel mount matrices in the manifest. Where the exported
 * scene still has the matching Wheel_*_Spatial node we parent to that instead,
 * so anything animating the suspension carries the wheel with it. Names repeat
 * (the Semi has three Wheel_L_Spatial), so mounts are matched on position.
 */
function mountWheels(body, vehicle, wheelProto) {
  const group = new THREE.Group();
  group.name = '__simWheels';
  const spinners = [];

  const wanted = new Set((vehicle.mounts || []).map((m) => m.name));
  const candidates = [];
  body.traverse((o) => { if (wanted.has(o.name)) candidates.push(o); });
  body.updateMatrixWorld(true);

  const attached = [];

  for (const mount of vehicle.mounts || []) {
    const target = new THREE.Vector3(mount.matrix[12], mount.matrix[13], mount.matrix[14]);
    let node = null;
    let best = 0.05;
    for (const c of candidates) {
      if (c.name !== mount.name || c.userData.__taken) continue;
      const d = body.worldToLocal(c.getWorldPosition(new THREE.Vector3())).distanceTo(target);
      if (d < best) { best = d; node = c; }
    }

    const inst = wheelProto.clone(true);
    inst.name = '__simWheel';

    /* Work out which local axis is the axle and which way it points, from the
       mount basis. It is not the same axis on every vehicle - the cars spin
       about local Z because the scenes carry a 90 degree turn, while the Semi
       spins about X - and the left-hand mounts are turned 180 degrees so one
       wheel model fits both sides. Rolling them all the same way would spin the
       two sides in opposite directions. */
    const m = mount.matrix;
    const cols = [[m[0], m[1], m[2]], [m[4], m[5], m[6]], [m[8], m[9], m[10]]];
    let axle = 0;
    for (let i = 1; i < 3; i++) {
      if (Math.abs(cols[i][0]) > Math.abs(cols[axle][0])) axle = i;
    }
    inst.userData.spinAxis = ['x', 'y', 'z'][axle];
    inst.userData.spinSign = cols[axle][0] >= 0 ? 1 : -1;
    spinners.push(inst);

    if (node) {
      node.userData.__taken = true;
      node.add(inst);
      attached.push(inst);
    } else {
      const pivot = new THREE.Object3D();
      pivot.matrixAutoUpdate = false;
      pivot.matrix.fromArray(mount.matrix);
      pivot.add(inst);
      group.add(pivot);
    }
  }

  for (const c of candidates) delete c.userData.__taken;
  body.add(group);
  body.userData.spinners = spinners;
  body.userData.wheelRadius = vehicle.wheel_radius || 0.34;

  return () => {
    body.userData.spinners = [];
    body.remove(group);
    group.clear();
    for (const inst of attached) if (inst.parent) inst.parent.remove(inst);
  };
}

function Model({ rotateToFrunk, rotateToTrunk, activeGear, vehicleId, colorKey, wheelKey, lights, driving, speedMph, ...props }) {
  const paint = usePaint();
  const wrapRef = useRef(null);
  if (!wrapRef.current) wrapRef.current = new WrapLayer(process.env.PUBLIC_URL || '');
  const vehicle = VEHICLES[vehicleId] || VEHICLES[DEFAULT_VEHICLE];
  const wheelDef = WHEELS[wheelKey] || WHEELS[vehicle.default_wheel];

  const { scene: loaded } = useGLTF(getCarModelPath(MODEL_BASE + vehicle.file));
  const { scene: wheelScene } = useGLTF(getCarModelPath(MODEL_BASE + wheelDef.file));

  // A clone per vehicle keeps mutations (paint, mounted wheels) from leaking
  // back into drei's shared cache when you switch cars.
  const scene = useMemo(() => loaded.clone(true), [loaded]);

  const modelRef = useRef();
  const frunkRef = useRef();
  const trunkRef = useRef();
  const doorRefs = useRef({});
  const [targetRotation, setTargetRotation] = useState(Math.PI);
  const [startRotation, setStartRotation] = useState(Math.PI);
  const [frunkTargetAngle, setFrunkTargetAngle] = useState(0);
  const [frunkStartAngle, setFrunkStartAngle] = useState(0);
  const [trunkTargetAngle, setTrunkTargetAngle] = useState(0);
  const [trunkStartAngle, setTrunkStartAngle] = useState(0);
  const [doorStates, setDoorStates] = useState({});
  const animationProgressRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const blinkRef = useRef(0);
  const lastPhaseRef = useRef(null);
  const lightsRef = useRef(null);
  /* Tesla's Ego models face -Z (FrontMarker sits at z = -2.35) and OrbitControls
     pins the camera to an azimuth of ~32 degrees, essentially on +Z - so the
     model needs a half turn to present its nose, which is the front
     three-quarter view the car card uses. */
  const defaultRotation = Math.PI;

  useLayoutEffect(() => mountWheels(scene, vehicle, wheelScene), [scene, vehicle, wheelScene]);

  useLayoutEffect(() => {
    hideNonExteriorMeshes(scene);
    tagLightMeshes(scene);
    prepareGlass(scene);
  }, [scene]);

  /* Steady lamps switch here rather than in useFrame: a throttled or paused
     frame loop should not be able to leave the headlights stuck off. */
  useEffect(() => {
    applyLights(scene, lights, true);
    lastPhaseRef.current = true;
  }, [scene, lights]);

  /* Paint, finish and trim all come from the Colorizer store; colorKey is the
     prop fallback for the URL-driven default. */
  useLayoutEffect(() => {
    applyPaint(scene, colorByKey(paint.colorKey || colorKey), paint.paintType);
    applyTrim(scene, paint.trim);
  }, [scene, colorKey, paint.colorKey, paint.paintType, paint.trim]);

  /* The wrap is a vinyl layer over the paint, rebuilt whenever the chosen wrap
     or the underlying scene changes. */
  useEffect(() => {
    const layer = wrapRef.current;
    layer.apply(scene, paint.wrap);
    return () => layer.clear();
  }, [scene, paint.wrap]);

  /* Recentre once the scene is final. drei's <Center> measures on mount, but
     the wheels are attached and the FX meshes hidden in the effects above, so
     its offset would be taken from the wrong bounding box - which parked the
     camera inside the bodywork. */
  useLayoutEffect(() => {
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    scene.traverse((o) => {
      if (o.isMesh && o.visible && o.geometry && !o.userData.isFx) box.expandByObject(o);
    });
    if (!box.isEmpty()) {
      const centre = box.getCenter(new THREE.Vector3());
      scene.position.set(-centre.x, -box.min.y, -centre.z);
    }
    // Seat the resting orientation here too: the effect that animates it bails
    // while the ref is still null, which is exactly the case on first mount.
    if (modelRef.current && !isAnimatingRef.current) {
      modelRef.current.rotation.y = defaultRotation;
    }
  }, [scene, vehicle, wheelScene, colorKey]);

  useEffect(() => {
    // Resolve the hinge nodes by trying each candidate name; the set differs
    // across the fleet, so a fixed name silently animated nothing on the cars
    // that use a different one (the Juniper Model Y has no bare `Hood`).
    frunkRef.current = resolvePart(scene, PARTS.frunk);
    trunkRef.current = resolvePart(scene, PARTS.trunk);
    frunkRef.current && (frunkRef.current.userData.restX = frunkRef.current.rotation.x);
    trunkRef.current && (trunkRef.current.userData.restX = trunkRef.current.rotation.x);

    doorRefs.current = {};
    const next = {};
    const clickable = new Set();
    [...PARTS.doors, ...PARTS.falconDoors].forEach((candidates, i) => {
      const part = resolvePart(scene, candidates);
      if (!part) return;
      const key = 'door' + i;
      part.userData.restY = part.rotation.y;
      doorRefs.current[key] = part;
      next[key] = { isOpen: false, angle: part.rotation.y };
      // Any mesh under the hinge should open the door when clicked.
      part.traverse((o) => { if (o.isMesh) clickable.add(o); });
    });
    setDoorStates(next);
    scene.traverse((o) => { o.userData.doorKey = null; });
    for (const [key, node] of Object.entries(doorRefs.current)) {
      node.traverse((o) => { if (o.isMesh) o.userData.doorKey = key; });
    }
  }, [scene]);

  useEffect(() => {
    if (!modelRef.current) return;
    setStartRotation(modelRef.current.rotation.y);
    setFrunkStartAngle(frunkRef.current ? frunkRef.current.rotation.x : 0);
    setTrunkStartAngle(trunkRef.current ? trunkRef.current.rotation.x : 0);

    const frunkRest = frunkRef.current ? (frunkRef.current.userData.restX || 0) : 0;
    const trunkRest = trunkRef.current ? (trunkRef.current.userData.restX || 0) : 0;

    if (activeGear === 'D') {
      /* Driving: the car points straight down the road, away from the camera,
         which is the view the Autopilot visualisation shows. */
      setTargetRotation(0);
      setFrunkTargetAngle(frunkRest);
      setTrunkTargetAngle(trunkRest);
    } else if (rotateToFrunk) {
      setFrunkTargetAngle(frunkRest + FRUNK_OPEN);
      setTrunkTargetAngle(trunkRest);
      setTargetRotation(modelRef.current.rotation.y);
    } else if (rotateToTrunk) {
      setTargetRotation(defaultRotation - Math.PI / 2);
      setFrunkTargetAngle(frunkRest);
      setTrunkTargetAngle(trunkRest + TRUNK_OPEN);
    } else {
      setTargetRotation(defaultRotation);
      setFrunkTargetAngle(frunkRest);
      setTrunkTargetAngle(trunkRest);
    }
    animationProgressRef.current = 0;
    isAnimatingRef.current = true;
  }, [scene, rotateToFrunk, rotateToTrunk, activeGear, defaultRotation]);

  useFrame((state, delta) => {
    /* Roll the wheels from road speed and wheel radius, the way the app does -
       it never translates the car, it spins the wheel nodes and scrolls the
       lane markings. */
    if (driving && speedMph > 0) {
      const v = speedMph * 0.44704;
      const r = scene.userData.wheelRadius || 0.34;
      for (const w of scene.userData.spinners || []) {
        w.rotation[w.userData.spinAxis] -= (v / r) * delta * w.userData.spinSign;
      }
    }

    // Only the indicators need the frame loop; the steady lamps are applied in
    // an effect so they do not depend on it.
    if (lights.turnL || lights.turnR || lights.hazard) {
      blinkRef.current += delta;
      const phase = Math.floor(blinkRef.current / 0.45) % 2 === 0;
      if (phase !== lastPhaseRef.current) {
        lastPhaseRef.current = phase;
        applyLights(scene, lights, phase);
      }
    }

    if (!isAnimatingRef.current) return;
    animationProgressRef.current += delta * 0.5;
    if (animationProgressRef.current >= 1) {
      animationProgressRef.current = 1;
      isAnimatingRef.current = false;
    }
    const easedProgress = easeInOutCubic(animationProgressRef.current);

    if (modelRef.current && (rotateToTrunk || (!rotateToFrunk && !rotateToTrunk))) {
      modelRef.current.rotation.y = THREE.MathUtils.lerp(startRotation, targetRotation, easedProgress);
    }
    if (frunkRef.current) {
      frunkRef.current.rotation.x = THREE.MathUtils.lerp(frunkStartAngle, frunkTargetAngle, easedProgress);
    }
    if (trunkRef.current) {
      trunkRef.current.rotation.x = THREE.MathUtils.lerp(trunkStartAngle, trunkTargetAngle, easedProgress);
    }
    Object.entries(doorStates).forEach(([doorKey, doorState]) => {
      const part = doorRefs.current[doorKey];
      if (!part) return;
      const rest = part.userData.restY || 0;
      const targetAngle = rest + (doorState.isOpen ? DOOR_OPEN : 0);
      const newAngle = THREE.MathUtils.lerp(doorState.angle, targetAngle, easedProgress);
      part.rotation.y = newAngle;
      setDoorStates((prev) => ({ ...prev, [doorKey]: { ...prev[doorKey], angle: newAngle } }));
    });
  });

  const handleClick = (event) => {
    event.stopPropagation();
    const key = event.object.userData.doorKey;
    if (!key || !doorRefs.current[key]) return;
    setDoorStates((prev) => ({ ...prev, [key]: { ...prev[key], isOpen: !prev[key].isOpen } }));
    animationProgressRef.current = 0;
    isAnimatingRef.current = true;
  };

  return (
    <group onClick={handleClick}>
      <primitive ref={modelRef} object={scene} {...props} />
    </group>
  );
}

class SceneErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) {
    // react-three-fiber swallows errors thrown inside <Canvas>: the canvas
    // element mounts, the children never do, and nothing reaches the console.
    console.error('[car-card] scene failed:', err && err.message, info && info.componentStack);
  }
  render() { return this.state.err ? null : this.props.children; }
}

/** Exposes the r3f state on window, for diagnosing from the console. */
/**
 * The road under the car in the driving visualisation.
 *
 * Three strips, positioned with the app's own numbers, alpha-scissored rather
 * than blended because that is what the app's material does. The dashed texture
 * scrolls rearward at road speed: the strip's v=1 end points forward (-Z), so a
 * rising offset slides the markings past the car, which is what driving forward
 * looks like.
 */
function Road({ visible, speedMph }) {
  const texture = useLoader(THREE.TextureLoader, LANE_TEXTURE);

  const lanes = useMemo(() => {
    const tex = texture.clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, ROAD_LENGTH / DASH_CYCLE_M);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return { tex };
  }, [texture]);

  useFrame((state, delta) => {
    if (!visible) return;
    const v = (speedMph || 0) * 0.44704; // mph -> m/s
    lanes.tex.offset.y = (lanes.tex.offset.y + (v * delta) / DASH_CYCLE_M) % 1;
  });

  return (
    <group visible={visible}>
      {LANES.map((lane) => (
        <mesh
          key={lane.x}
          position={[lane.x, 0.004, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={2}
        >
          <planeGeometry args={[LANE_WIDTH, ROAD_LENGTH]} />
          <meshBasicMaterial
            transparent
            alphaTest={0.5}
            depthWrite={false}
            toneMapped={false}
            map={lane.dashed ? lanes.tex : null}
            color={lane.color}
          />
        </mesh>
      ))}
      {/* The road surface. Transparent by default so only the lane markings
          show, floating on the screen background; ROAD_SURFACE_OPACITY dials a
          grey road back in. */}
      {ROAD_SURFACE_OPACITY > 0 && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <planeGeometry args={[26, ROAD_LENGTH]} />
          <meshBasicMaterial color={ROAD_SURFACE} transparent opacity={ROAD_SURFACE_OPACITY} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function SceneProbe() {
  const state = useThree();
  useEffect(() => { window.__r3fState = state; }, [state]);
  return null;
}

/**
 * Reflections, backdrop and exposure.
 *
 * scene.environment is always the studio panorama, whichever backdrop is
 * selected - the viewer settled on that because the app's paint is almost
 * entirely tinted reflection, and borrowing the studio's reflections is what
 * keeps every environment looking like the app. Only scene.background changes.
 *
 * Deliberately not drei's <Environment>: this never suspends, so a slow or
 * missing image degrades to flat lighting instead of blanking the whole scene.
 */
function SceneRig({ environment, exposure, ambient }) {
  const { scene, gl } = useThree();

  // Reflections: loaded once, shared by every backdrop.
  useEffect(() => {
    let cancelled = false;
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    new THREE.TextureLoader().load(
      REFLECTION_URL,
      (tex) => {
        if (cancelled) { tex.dispose(); pmrem.dispose(); return; }
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        scene.environment = pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
        pmrem.dispose();
      },
      undefined,
      () => pmrem.dispose()
    );
    return () => { cancelled = true; scene.environment = null; };
  }, [scene, gl]);

  // Backdrop.
  useEffect(() => {
    const env = ENVIRONMENTS.find((e) => e.key === environment) || ENVIRONMENTS[0];
    let cancelled = false;
    let created = null;

    if (env.kind === 'solid') {
      // Transparent: let the underlying panel colour show through.
      scene.background = null;
    } else if (env.kind === 'cube') {
      new THREE.CubeTextureLoader().load(
        CUBE_FACES.map((f) => env.dir + f + '.png'),
        (cube) => {
          if (cancelled) { cube.dispose(); return; }
          cube.colorSpace = THREE.SRGBColorSpace;
          scene.background = cube;
          created = cube;
        }
      );
    } else {
      new THREE.TextureLoader().load(env.url, (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        scene.background = tex;
        created = tex;
      });
    }

    return () => { cancelled = true; if (created) created.dispose(); };
  }, [scene, environment]);

  // Exposure.
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  // Reflection strength, from the Ambient slider. The car's paint reads almost
  // entirely as reflected environment, so this - not the fill light - is what
  // makes it look bright or dim. Ambient runs 0..8; 5 lands a touch above 1x.
  useEffect(() => {
    scene.environmentIntensity = ambient / 4.2;
  }, [scene, ambient]);

  return null;
}

function ControlledOrbitControls({ driving }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const [isInteracting, setIsInteracting] = useState(false);

  const defaultRotation = Math.PI + ((200 * Math.PI) / 170);

  const [springProps, setSpring] = useSpring(() => ({
    rotation: defaultRotation,
    config: { mass: 1, tension: 280, friction: 120 },
  }));

  useEffect(() => {
    if (!controlsRef.current) return undefined;
    const controls = controlsRef.current;

    /* Place the camera outright for both modes. OrbitControls preserves whatever
       radius it currently has, so setting only the azimuth (as this used to) left
       the parked view stuck at the driving radius after a D -> P switch - the car
       appeared zoomed out. Positioning from a Spherical each time resets it. */
    if (driving) {
      // Behind the car, a little above, aimed a short way down the road so the
      // car sits high in frame with the lane lines running to a vanishing point.
      controls.target.set(0, 1.0, -3.4);
      const dist = 13;
      const polar = Math.PI / 2 - 0.34; // slight downward tilt
      const azimuth = 0;                 // dead behind a car whose nose is -Z
      const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(dist, polar, azimuth));
      camera.position.copy(controls.target).add(off);
    } else {
      // Parked: front three-quarter, centred on the middle of the car.
      controls.target.set(0, 0.6, 0);
      const dist = 6.2;
      const polar = Math.PI / 2 - Math.PI / 5.14;
      const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(dist, polar, defaultRotation));
      camera.position.copy(controls.target).add(off);
    }
    controls.update();

    const onStart = () => setIsInteracting(true);
    const onEnd = () => {
      setIsInteracting(false);
      setSpring({ rotation: defaultRotation });
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, [defaultRotation, setSpring, driving, camera]);

  useEffect(() => {
    // Driving owns the camera; letting the parked spring run would snap the
    // azimuth back off the road every render.
    if (driving) return;
    if (controlsRef.current && !isInteracting) {
      controlsRef.current.setAzimuthalAngle(springProps.rotation.get());
      controlsRef.current.update();
    }
  }, [isInteracting, springProps.rotation, driving]);

  return (
    <a.group rotation-y={driving ? 0 : springProps.rotation}>
      <OrbitControls
        ref={controlsRef}
        args={[camera, gl.domElement]}
        enableZoom={false}
        enablePan={false}
        enableRotate={!driving}
        minPolarAngle={driving ? Math.PI / 2 - 0.34 : Math.PI / 2 - Math.PI / 5.14}
        maxPolarAngle={driving ? Math.PI / 2 - 0.34 : Math.PI / 2 - Math.PI / 5.14}
      />
    </a.group>
  );
}

export function VehicleModel({
  rotateToFrunk,
  rotateToTrunk,
  activeGear,
  vehicleId: vehicleIdProp = DEFAULT_VEHICLE,
  colorKey = DEFAULT_COLOR,
  wheelKey: wheelKeyProp,
}) {
  const { lights, environment, ambient, exposure, speed } = useScene();
  /* The Colorizer (Software settings) owns the car on screen; the props stay as
     the URL-driven fallback for callers that pin a vehicle. */
  const config = usePaint();
  const vehicleId = config.vehicleId || vehicleIdProp;
  const wheelKey = config.wheelKey || wheelKeyProp;
  const driving = activeGear === 'D';
  /* A 4.7 m car viewed at 45 degrees projects about 4.8 m across. At the old
     5 m the frame cut the bumpers off; 7 m leaves it room to breathe. */
  // Driving pulls the camera back so the road runs to a vanishing point.
  const distance = driving ? 11 : 6.2;
  const horizontalAngle = Math.PI / 4;
  const verticalAngle = driving ? 0.30 : Math.PI / 5.14;

  const cameraPosition = [
    distance * Math.cos(horizontalAngle) * Math.cos(verticalAngle),
    distance * Math.sin(verticalAngle),
    distance * Math.sin(horizontalAngle) * Math.cos(verticalAngle)
  ];

  const stageKey = vehicleId + ':' + (wheelKey || '');

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      camera={{ fov: 40, position: cameraPosition, near: 0.1, far: 1000 }}
      style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent' }}
      className="carModelWrapper"
      /* react-three-fiber only renders its children once react-use-measure has
         reported a non-zero size. This container is laid out by flexbox and does
         not change size again after mount, so with the default debounce the
         resize observation can land after the measurement pass and never fire
         again - the canvas element mounts, the scene never does, and nothing is
         logged. Measuring undebounced makes it deterministic. */
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
    >
      {/* No scene.background - the canvas is transparent so the panel colour
          shows through, matching the block the card sits in. SceneRig only sets
          a background for the textured environments (Studio / Clouds / Night). */}
      <SceneErrorBoundary>
      {/* Lighting is built here rather than with drei's <Environment>: its
          presets pull an HDRI from a CDN and, when that request hangs, Stage
          suspends forever and the whole 3D tree - model included - never
          mounts. This loads the studio panorama the tesla-3d-renders pipeline
          settled on for matching the app, straight off our own origin. */}
      <ambientLight intensity={ambient / 10} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <SceneProbe />
      <SceneRig environment={environment} exposure={exposure} ambient={ambient} />
      <Suspense fallback={null}>
        <Road visible={driving} speedMph={speed} />
      </Suspense>
      <Suspense fallback={null}>
        {/* Deliberately NOT drei's <Stage>. Stage normalises whatever it is
            given to a unit box, which blew a 4.7 m Model 3 up to 14.7 m and put
            the camera (fixed at 5 m) inside the car - the scene was rendering
            correctly the whole time, from within the bodywork. These models are
            already authored in metres, so they only need centring. */}
        <group key={stageKey}>
          <Model
            rotateToFrunk={rotateToFrunk}
            rotateToTrunk={rotateToTrunk}
            activeGear={activeGear}
            vehicleId={vehicleId}
            colorKey={colorKey}
            wheelKey={wheelKey}
            lights={lights}
            driving={driving}
            speedMph={speed}
          />
        </group>
      </Suspense>
      </SceneErrorBoundary>
      <ControlledOrbitControls driving={driving} />
    </Canvas>
  );
}
