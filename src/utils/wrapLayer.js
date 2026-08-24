import * as THREE from 'three';

/**
 * Paint Shop wraps.
 *
 * Ported from the tesla-3d-viewer's shared/tesla.js, minus its GLES2 gamma
 * hook: this app renders through three.js's ordinary sRGB pipeline, so the
 * textures are decoded as sRGB here rather than fed raw.
 *
 * The car's own shader (`opaque_skybox_overlay.shader`) samples the wrap from
 * the paint meshes' **TEXCOORD_1** and alpha-blends it over the paint colour.
 * So a wrap is not a material swap: it is a separate vinyl layer, and where the
 * template is transparent the paint underneath shows through. That is load
 * bearing - several of the shipped wraps (Acid Drip, the gradients) fade out
 * over part of the body and rely on the paint showing through - and it is why
 * recolouring the car while a wrap is on still changes the exposed panels.
 *
 * Only models exported with UV2 can place a wrap. The low-poly pack ships it
 * for the nine wrap-capable vehicles; the pre-2021 S/X and the Semi never had
 * it in the app either.
 */

const isPaint = (m) => !!m && /^TESLAPAINT_/.test(m.name || '');
const materialsOf = (o) => (Array.isArray(o.material) ? o.material : [o.material]).filter(Boolean);

const wrapTexCache = new Map();

function loadWrapTexture(w, base = '') {
  if (w.texture) return Promise.resolve(w.texture);
  if (!wrapTexCache.has(w.key)) {
    const p = new THREE.TextureLoader().loadAsync(base + w.url).then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(w.repeat || 1, w.repeat || 1);
      tex.channel = w.channel != null ? w.channel : 1;   // wrap UVs by default
      tex.flipY = false;                                 // glTF UV convention
      tex.anisotropy = 8;
      return tex;
    });
    // A failed load must not poison the cache with a rejected promise forever.
    p.catch(() => wrapTexCache.delete(w.key));
    wrapTexCache.set(w.key, p);
  }
  return wrapTexCache.get(w.key);
}

/**
 * A mesh that never got the wrap unwrap falls back to sampling over the AO UVs
 * - wrong placement, but better than an undefined attribute.
 */
function texForMesh(tex, geometry) {
  if (tex.channel === 0 || geometry.attributes.uv1) return tex;
  if (!tex.userData.uv0Variant) {
    const t = tex.clone();
    t.channel = 0;
    tex.userData.uv0Variant = t;
  }
  return tex.userData.uv0Variant;
}

const wrapHidden = new THREE.MeshBasicMaterial({ visible: false });

export class WrapLayer {
  constructor(base = '') {
    this.base = base;
    this.overlays = [];
    this.suppressed = [];   // meshes hidden while a wrap is on (see apply)
    this.current = null;
  }

  clear() {
    for (const overlay of this.overlays) {
      if (overlay.parent) overlay.parent.remove(overlay);
      for (const m of materialsOf(overlay)) if (m !== wrapHidden) m.dispose();
    }
    this.overlays = [];
    for (const o of this.suppressed) o.visible = true;
    this.suppressed = [];
  }

  async apply(root, w) {
    this.current = w;
    this.clear();
    if (!w || !root) return;

    const tex = await loadWrapTexture(w, this.base);
    if (this.current !== w) return;   // user picked something else meanwhile

    const makeVinyl = (geometry) => new THREE.MeshStandardMaterial({
      map: texForMesh(tex, geometry),
      transparent: true,
      metalness: w.metallic != null ? w.metallic : 0,
      roughness: w.roughness != null ? w.roughness : 0.9,
      // Coplanar with the panel underneath: nudge the depth test rather than
      // the geometry, and let the paint's depth write stand.
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      depthWrite: false,
    });

    // The "Rough" pass is the matte underside/cladding; real vinyl only covers
    // the body panels, so only the skybox paint meshes get a decal.
    const wantsWrap = (m) => isPaint(m) && !/rough/i.test(m.name);

    let modelHasWrapUVs = false;
    root.traverse((o) => {
      if (o.isMesh && o.geometry.attributes.uv1) modelHasWrapUVs = true;
    });

    root.traverse((o) => {
      if (!o.isMesh || o.userData.hidden || o.userData.isFx || o.userData.wrapOverlay) return;
      const mats = materialsOf(o);
      if (!mats.some(wantsWrap)) return;

      // A wrap-capable model can still hold a stray paint mesh without wrap
      // UVs: Static_Door_Exterior is a merged copy of the door skins. Coplanar
      // with the real (correctly wrapped) doors, it would z-fight through the
      // wrap with mis-sampled texture - and since its geometry duplicates
      // panels that ARE wrapped, hide it instead.
      if (tex.channel === 1 && modelHasWrapUVs && !o.geometry.attributes.uv1) {
        o.visible = false;
        this.suppressed.push(o);
        return;
      }

      const overlay = new THREE.Mesh(
        o.geometry,
        Array.isArray(o.material)
          ? mats.map((m) => (wantsWrap(m) ? makeVinyl(o.geometry) : wrapHidden))
          : makeVinyl(o.geometry),
      );
      overlay.userData.wrapOverlay = true;
      overlay.renderOrder = 1;
      o.add(overlay);   // identity transform: rides the panel through animations
      this.overlays.push(overlay);
    });
  }
}

/* ------------------------------------------------------------ uploaded art */

// Offsets are primes-ish, tuned on a 1024px template, and scale with the image.
const FILL_OFFSETS = [
  [210, 0], [0, 330], [-210, 0], [0, -330], [140, 220], [-140, -220],
  [300, 110], [-300, -110], [70, 470], [-70, -470], [380, 260], [-380, -260],
  [510, 90], [-510, -90], [160, -360], [-160, 360],
];

/**
 * Prepare a dropped template the way the shipped wraps were authored.
 *
 * The alpha channel is authored data (transparent = paint shows through) and is
 * kept untouched. What gets fixed is only the RGB *under* the near-transparent
 * pixels: templates park arbitrary colours there, which bleed into island edges
 * through texture filtering and mipmaps. Those pixels take the RGB of a shifted
 * copy of the artwork instead. A template with no alpha (pattern on black)
 * becomes fully opaque with the black keyed out the same way.
 */
function fillTemplate(img) {
  const W = img.width, H = img.height;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, W, H), d = id.data, n = W * H;

  let hasAlpha = false;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 128) { hasAlpha = true; break; }

  // 1 = artwork, 0 = gutter to refill. Keying on alpha when there is any
  // protects designs that use black inside the artwork (lettering, shadows).
  const good = new Uint8Array(n);
  let gaps = 0;
  for (let i = 0; i < n; i++) {
    const ok = hasAlpha
      ? d[i * 4 + 3] >= 8
      : Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) > 40;
    good[i] = ok ? 1 : 0;
    if (!ok) gaps++;
  }

  for (let it = 0; it < 8 && gaps; it++) {
    for (const [oy, ox] of FILL_OFFSETS) {
      if (!gaps) break;
      const dy = Math.round(oy * H / 1024), dx = Math.round(ox * W / 1024);
      if (!dy && !dx) continue;
      for (let y = 0; y < H; y++) {
        const sy = ((y - dy) % H + H) % H;
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (good[i]) continue;
          const s = sy * W + ((x - dx) % W + W) % W;
          if (good[s] !== 1) continue;   // 2 = filled this pass; no chain-copies
          d[i * 4] = d[s * 4]; d[i * 4 + 1] = d[s * 4 + 1]; d[i * 4 + 2] = d[s * 4 + 2];
          good[i] = 2; gaps--;
        }
      }
      for (let i = 0; i < n; i++) if (good[i] === 2) good[i] = 1;
    }
  }

  // A black-keyed template has no meaningful alpha; make it explicit vinyl.
  if (!hasAlpha) for (let i = 3; i < d.length; i += 4) d[i] = 255;

  g.putImageData(id, 0, 0);
  return c;
}

/** Turn a user-chosen image file into a wrap the layer can apply. */
export async function customWrapFromFile(file, index) {
  if (!file || !/^image\//.test(file.type)) return null;
  const img = await createImageBitmap(file);
  const canvas = fillTemplate(img);
  const tex = new THREE.CanvasTexture(canvas);
  img.close();
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.channel = 1;      // templates are authored on the wrap UVs
  tex.flipY = false;    // glTF UV convention
  tex.anisotropy = 8;

  const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
    .trim().slice(0, 18) || 'Custom';

  return {
    key: `custom${index}`,
    name,
    repeat: 1,
    metallic: 0.0,
    roughness: 0.9,
    texture: tex,
    thumb: canvas.toDataURL('image/png'),
    custom: true,
  };
}
