import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';
import { getCarModelPath } from '../../utils/assetPaths';
import './VehicleModel.css';

// The car in the left panel.
//
// The body and the wheels are two separate glTF files, which is not an accident
// of packaging: one body wears any of dozens of wheel designs, so baking a set
// in would mean one copy of the car per wheel. The body carries four mount
// transforms instead, and the wheel is instanced into each.
//
// `useGLTF(path, false)` — the `false` is load-bearing. Draco defaults to ON in
// drei and points DRACOLoader at a Google CDN; these files are meshopt
// compressed, and that decoder ships inside three-stdlib, so turning Draco off
// keeps the whole model path local with no third-party fetch at runtime.
const CAR_MODEL = 'modely.glb';
const WHEEL_MODEL = 'wheel-gemini.glb';

// Wheel mounts, copied from the model set's manifest.json. Column-major 4x4, in
// the body's own space, applied verbatim rather than decomposed: the mounts are
// not uniformly scaled (1.05 across, 1 through) and round-tripping that through
// position/quaternion/scale loses it.
const WHEEL_MOUNTS = [
  [0, 0, 1.05, 0, 0, 1.05, 0, 0, -1, 0, 0, 0, -0.777816, 0.345, -1.51, 1],
  [0.000001, 0, 1.05, 0, 0, 1.05, 0, 0, -1, 0, 0.000001, 0, -0.778, 0.345, 1.37, 1],
  [0, 0, -1.05, 0, 0, 1.05, 0, 0, 1, 0, 0, 0, 0.778, 0.345, -1.51, 1],
  [0, 0, -1.05, 0, 0, 1.05, 0, 0, 1, 0, 0, 0, 0.778, 0.345, 1.37, 1],
];

// Everything in the file that is not the car as it sits on the panel.
//
// The TESLAFX_* nodes are projected light beams — screen-sized quads belonging
// to a night scene which, left in, stretch the bounding box from 4 m to 15 m,
// so auto-framing zooms the car down to a speck. `Floor` is the ground plane
// the source scene rendered on, and the rest is trim this car does not wear.
const HIDDEN_NODES = new Set([
  'Floor',
  'Interior_7_seater',
  'Interior_7_seater_Color',
  'Spoiler1',
  'TESLAFX_Fog_Lights_Front',
  'TESLAFX_Right_Turn_Signal',
  'TESLAFX_Left_Turn_Signal',
  'TESLAFX_DRL',
  'TESLAFX_Taillights_Projection',
  'TESLAFX_Headlights_Projections',
  'TESLAFX_Headlights',
  'TESLAFX_Brake_Lights_Right',
  'TESLAFX_Brake_Lights_Left',
  'TESLAFX_Brake_Lights_Center',
  'TESLAFX_Headlights_Trunk',
  'TESLAFX_Reverse_Lights',
]);

// Clip-name prefixes, not exact names: the same closure is called `Hood` in the
// manifest and `Hood2` in the file, and a prefix survives that.
const CLIPS = { frunk: 'Hood', trunk: 'Trunk' };
const DOOR_CLIPS = { Door_LF: 'LFDoor', Door_RF: 'RFDoor', Door_LR: 'LRDoor', Door_RR: 'RRDoor' };

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * The low-poly art style, applied to whatever materials the file shipped with.
 *
 * The geometry is already low-poly; the look is not, because the source
 * materials are full PBR — metallic paint, glossy glass, an environment implied
 * by every reflection. Faceted geometry under a mirror finish reads as a
 * *broken* smooth model rather than a stylised one, so the two have to agree.
 *
 * `flatShading` is what does it: normals per face instead of interpolated
 * across them, so every triangle reads as a plane and the facets become the
 * point rather than an artefact. The rest kills the reflections that would
 * fight it — matte, unlit by any environment, colour only.
 *
 * Materials are shared between meshes, so this walks a Set: assigning twice is
 * harmless, recompiling the shader twice is not.
 */
function applyLowPolyStyle(root) {
  const seen = new Set();
  const drop = [];
  root.traverse((object) => {
    // Detached, not hidden. <Center> measures with Box3.setFromObject, which
    // walks the graph without consulting `visible` — so a hidden 15 m light
    // beam still votes on where the centre is, and the car lands off to one
    // side of the panel. Collected here and cut after the walk, because
    // removing mid-traverse skips siblings.
    if (HIDDEN_NODES.has(object.name)) drop.push(object);
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      material.flatShading = true;
      if ('metalness' in material) material.metalness = 0;
      if ('roughness' in material) material.roughness = 1;
      if ('envMapIntensity' in material) material.envMapIntensity = 0;
      if ('clearcoat' in material) material.clearcoat = 0;
      // Glass keeps its transparency but loses the shine, or the windows read
      // as chrome next to matte paint.
      if (material.transparent) material.opacity = Math.min(material.opacity, 0.55);
      material.needsUpdate = true;
    }
  });
  for (const object of drop) object.removeFromParent();
}

/**
 * Body + four wheels, assembled and sat on the origin.
 *
 * The offset is measured here rather than left to drei's <Center>, which
 * measures in a layout effect whose ordering against this component's own
 * preparation is not something to depend on — and got it wrong often enough to
 * leave the car parked over the Trunk label. Measuring after assembly, with the
 * beams already cut and the wheels already mounted, is the whole of it.
 *
 * Sitting on the origin matters twice over: the camera looks at the origin, so
 * that is what frames the car, and the body rotates about its own middle rather
 * than swinging around a point at its nose.
 */
function useCar() {
  const { scene, animations } = useGLTF(getCarModelPath(CAR_MODEL), false);
  const { scene: wheelScene } = useGLTF(getCarModelPath(WHEEL_MODEL), false);

  const car = useMemo(() => {
    applyLowPolyStyle(scene);

    // One load, four instances, each given its mount matrix whole — with
    // matrixAutoUpdate off, so three does not immediately recompose it from the
    // position/quaternion/scale it never read.
    const assembly = new THREE.Group();
    assembly.add(scene);
    for (const mount of WHEEL_MOUNTS) {
      const wheel = wheelScene.clone(true);
      applyLowPolyStyle(wheel);
      wheel.matrixAutoUpdate = false;
      wheel.matrix.fromArray(mount);
      assembly.add(wheel);
    }

    assembly.updateMatrixWorld(true);
    const centre = new THREE.Box3().setFromObject(assembly).getCenter(new THREE.Vector3());
    assembly.position.sub(centre);

    const root = new THREE.Group();
    root.add(assembly);
    return root;
  }, [scene, wheelScene]);

  return { car, animations };
}

function Car({ rotateToFrunk, rotateToTrunk, activeGear }) {
  const { car, animations } = useCar();
  const modelRef = useRef();
  const { actions } = useAnimations(animations, modelRef);
  const [openDoors, setOpenDoors] = useState({});

  const defaultRotation = Math.PI;
  const [startRotation, setStartRotation] = useState(defaultRotation);
  const [targetRotation, setTargetRotation] = useState(defaultRotation);
  const progressRef = useRef(1);
  const isAnimatingRef = useRef(false);

  const clipFor = useCallback((prefix) => {
    const name = Object.keys(actions).find((key) => key.startsWith(prefix));
    return name ? actions[name] : null;
  }, [actions]);

  // Every closure is a clip, and every clip is scrubbed rather than played:
  // parked at time 0 and paused, so the shared easing below is what moves it.
  // Playing them would give each closure its own clock and its own curve, and
  // the body rotation would drift out of step with the lid it is revealing.
  useEffect(() => {
    for (const action of Object.values(actions)) {
      if (!action) continue;
      action.play();
      action.paused = true;
      action.time = 0;
    }
  }, [actions]);

  useEffect(() => {
    setStartRotation(modelRef.current ? modelRef.current.rotation.y : defaultRotation);
    if (activeGear === 'D') {
      setTargetRotation(Math.PI / 4.3);
    } else if (rotateToTrunk) {
      // Swing round to the back, so the lid that is opening is the one facing.
      setTargetRotation(defaultRotation - Math.PI / 2);
    } else {
      setTargetRotation(defaultRotation);
    }
    progressRef.current = 0;
    isAnimatingRef.current = true;
  }, [rotateToFrunk, rotateToTrunk, activeGear, defaultRotation]);

  useFrame((_state, delta) => {
    if (!isAnimatingRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta * 0.5);
    if (progressRef.current === 1) isAnimatingRef.current = false;
    const eased = easeInOutCubic(progressRef.current);

    if (modelRef.current) {
      modelRef.current.rotation.y = THREE.MathUtils.lerp(startRotation, targetRotation, eased);
    }

    const scrub = (action, open) => {
      if (!action) return;
      action.time = (open ? eased : 1 - eased) * action.getClip().duration;
    };
    scrub(clipFor(CLIPS.frunk), rotateToFrunk);
    scrub(clipFor(CLIPS.trunk), rotateToTrunk);
    for (const [door, prefix] of Object.entries(DOOR_CLIPS)) {
      scrub(clipFor(prefix), Boolean(openDoors[door]));
    }
  });

  // A click lands on a mesh, and the door it belongs to is an ancestor: the
  // meshes are the panel, the card and the glass, none of them named for the
  // door itself.
  const handleClick = (event) => {
    let node = event.object;
    while (node && !DOOR_CLIPS[node.name]) node = node.parent;
    if (!node) return;
    event.stopPropagation();
    setOpenDoors((prev) => ({ ...prev, [node.name]: !prev[node.name] }));
    progressRef.current = 0;
    isAnimatingRef.current = true;
  };

  return (
    <group ref={modelRef} rotation-y={defaultRotation} onClick={handleClick}>
      <primitive object={car} />
    </group>
  );
}

function ControlledOrbitControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const [isInteracting, setIsInteracting] = useState(false);

  // Adjust the default rotation to be 200 degrees clockwise
  const defaultRotation = Math.PI + ((200 * Math.PI) / 170);

  const [springProps, setSpring] = useSpring(() => ({
    rotation: defaultRotation,
    config: { mass: 1, tension: 280, friction: 120 },
  }));

  useEffect(() => {
    if (controlsRef.current) {
      // Dead centre. The -0.5 this used to carry was tuned against the old
      // model's origin, which sat at the wheels; <Center> puts this one's
      // bounding box on the origin, and aiming below it threw the car up into
      // the Frunk/Trunk labels.
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();

      const controls = controlsRef.current;

      const onStart = () => setIsInteracting(true);
      const onEnd = () => {
        setIsInteracting(false);
        setSpring({ rotation: defaultRotation });
      };

      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onEnd);

      // Set initial rotation
      controls.setAzimuthalAngle(defaultRotation);
      controls.update();

      return () => {
        controls.removeEventListener('start', onStart);
        controls.removeEventListener('end', onEnd);
      };
    }
  }, [defaultRotation, setSpring]);

  useEffect(() => {
    if (controlsRef.current && !isInteracting) {
      controlsRef.current.setAzimuthalAngle(springProps.rotation.get());
      controlsRef.current.update();
    }
  }, [isInteracting, springProps.rotation]);

  return (
    <a.group rotation-y={springProps.rotation}>
      <OrbitControls
        ref={controlsRef}
        args={[camera, gl.domElement]}
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        minPolarAngle={Math.PI / 2 - Math.PI / 5.14}
        maxPolarAngle={Math.PI / 2 - Math.PI / 5.14}
      />
    </a.group>
  );
}

export function VehicleModel({ rotateToFrunk, rotateToTrunk, activeGear }) {
  const distance = 6.6;
  const horizontalAngle = Math.PI / 4; // 45 degrees
  const verticalAngle = activeGear === 'D' ? Math.PI / 3 : Math.PI / 5.14; // Increased angle for 'D' mode

  const cameraPosition = [
    distance * Math.cos(horizontalAngle) * Math.cos(verticalAngle),
    distance * Math.sin(verticalAngle),
    distance * Math.sin(horizontalAngle) * Math.cos(verticalAngle)
  ];

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{
        fov: 40,
        position: cameraPosition,
        near: 0.1,
        far: 1000
      }}
      style={{ "position": "relative" }}
      className="carModelWrapper"
    >
      <color attach="background" args={["#f1f1f1"]} />
      {/* Lit by hand rather than by an environment map. drei's <Stage> lights
          with an HDRI, which is exactly the glossy studio look flat shading is
          meant to replace — the facets need one clear key direction to read at
          all, and a soft fill so the shaded side does not go black. */}
      <hemisphereLight args={['#ffffff', '#9aa0a6', 2.1]} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} />
      <Car rotateToFrunk={rotateToFrunk} rotateToTrunk={rotateToTrunk} activeGear={activeGear} />
      <ControlledOrbitControls />
    </Canvas>
  );
}
