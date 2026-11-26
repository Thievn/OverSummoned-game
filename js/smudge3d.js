// Smudge in 3D, drawn to sit with the 2D cards: toon shading in three flat bands, a dark navy outline like the
// cards' ink line, and a warm rim light. One file, /assets/v2/3d/smudge.glb, carries the mesh, the skeleton and
// his clips (idle, walk, run). Usage: const s = await Smudge3D.mount(el, { clip: 'idle', ink: 0.012 });
//   s.play('walk'); s.turn(radians); s.dispose();
import * as THREE from 'three';
import { GLTFLoader } from '/js/vendor/three/GLTFLoader.js';

const INK = 0x14182e;            // the outline colour, the same navy as the card art's line
let cache = null;
const load = () => cache || (cache = new GLTFLoader().loadAsync('/assets/v2/3d/smudge.glb' + (window.OS && OS.VER ? '?v=' + OS.VER : '')));

function bands(n) {              // the toon ramp: n flat steps of light, nearest-filtered so the edges stay hard
  const d = new Uint8Array(n * 4), lv = n === 3 ? [120, 200, 255] : Array.from({ length: n }, (_, i) => 90 + i * 165 / (n - 1));
  lv.forEach((v, i) => d.set([v, v, v, 255], i * 4));
  const t = new THREE.DataTexture(d, n, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}

// The sculpted fur makes the mesh's own normals noisy, and an outline pushed along noisy normals pokes through the
// body as scratches. This welds seams and averages each vertex's normal with its neighbours a few times, and stores
// the result as inkNormal, used only by the outline.
function inkNormals(geo, passes = 7) {
  if (geo.attributes.inkNormal) return;
  const pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count, key = new Map(), weld = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`; let w = key.get(k); if (w === undefined) { w = i; key.set(k, i); } weld[i] = w; }
  let a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const w = weld[i]; a[w * 3] += nor.getX(i); a[w * 3 + 1] += nor.getY(i); a[w * 3 + 2] += nor.getZ(i); }
  const idx = geo.index ? geo.index.array : Uint32Array.from({ length: n }, (_, i) => i), nb = Array.from({ length: n }, () => new Set());
  for (let t = 0; t < idx.length; t += 3) { const v = [weld[idx[t]], weld[idx[t + 1]], weld[idx[t + 2]]]; for (let j = 0; j < 3; j++) { nb[v[j]].add(v[(j + 1) % 3]); nb[v[j]].add(v[(j + 2) % 3]); } }
  for (let p = 0; p < passes; p++) {
    const b = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { if (weld[i] !== i) continue; let x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2]; nb[i].forEach(j => { x += a[j * 3]; y += a[j * 3 + 1]; z += a[j * 3 + 2]; }); const l = Math.hypot(x, y, z) || 1; b[i * 3] = x / l; b[i * 3 + 1] = y / l; b[i * 3 + 2] = z / l; }
    a = b;
  }
  const out = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const w = weld[i]; out[i * 3] = a[w * 3]; out[i * 3 + 1] = a[w * 3 + 1]; out[i * 3 + 2] = a[w * 3 + 2]; }
  geo.setAttribute('inkNormal', new THREE.BufferAttribute(out, 3));
}

function inkMaterial(width) {    // inverted hull: the same skinned mesh, pushed out along its normals, back faces only
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 6 });
  m.onBeforeCompile = sh => {
    sh.uniforms.inkW = { value: width };
    sh.vertexShader = 'uniform float inkW;\nattribute vec3 inkNormal;\n' + sh.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal = inkNormal;').replace('#include <skinning_vertex>',
      '#include <skinning_vertex>\n  transformed += normalize(objectNormal) * inkW;');
  };
  return m;
}

export async function mount(el, opt = {}) {
  const W = () => el.clientWidth || 300, H = () => el.clientHeight || 400;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opt.keep });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, opt.dpr || 2)); r.setSize(W(), H()); r.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(r.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(opt.fov || 24, W() / H(), 0.01, 50);
  const toon = opt.toon !== false;
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x4a3a5a, toon ? 0.55 : 1.15));
  const key = new THREE.DirectionalLight(0xfff0d8, toon ? 1.55 : 2.3); key.position.set(1.4, 2.4, 2.4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd28a, toon ? 1.1 : 1.6); rim.position.set(-1.8, 1.4, -2.2); scene.add(rim);

  const g = await load();
  const { clone } = await import('/js/vendor/three/SkeletonUtils.js');
  const m = clone(g.scene), ramp = bands(opt.bands || 3);
  const meshes = [], hulls = []; m.traverse(o => { if (o.isMesh) meshes.push(o); });   // collect first: the outline adds meshes
  meshes.forEach(o => {
    const src = o.material;
    if (opt.toon !== false) {
      o.material = new THREE.MeshToonMaterial({ map: src.map, gradientMap: ramp, normalMap: opt.fur === false ? null : src.normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45), side: THREE.FrontSide });
      if (opt.ink !== 0 && o.isSkinnedMesh) hulls.push(o);
    }
    o.frustumCulled = false;
  });
  const pivot = new THREE.Group(); pivot.add(m); scene.add(pivot);
  const mixer = new THREE.AnimationMixer(m), clips = {};
  g.animations.forEach(c => { const k = /walk/i.test(c.name) ? 'walk' : /run/i.test(c.name) ? 'run' : 'idle'; clips[k] = c; });
  if (clips.idle) { mixer.clipAction(clips.idle).play(); mixer.update(0); }
  // measure the posed skin, not the raw geometry: the rig carries a 0.01 scale (it was built in centimetres)
  m.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m, true), size = box.getSize(new THREE.Vector3());
  m.position.y -= box.min.y; m.position.x -= (box.min.x + box.max.x) / 2; m.position.z -= (box.min.z + box.max.z) / 2;
  mixer.stopAllAction();
  // the outline width is a share of his height on screen; the rig scales the mesh down 100x on the way there, so
  // divide that back out to get the push in the mesh's own units
  hulls.forEach(o => {
    const ws = o.getWorldScale(new THREE.Vector3()).y || 1; inkNormals(o.geometry);
    const hull = new THREE.SkinnedMesh(o.geometry, inkMaterial((opt.ink || 0.006) * size.y / ws)); hull.bind(o.skeleton, o.bindMatrix);
    hull.frustumCulled = false; o.parent.add(hull);
  });
  const look = size.y * (opt.lookAt ?? 0.52), dist = size.y / (2 * Math.tan(cam.fov * Math.PI / 360)) * (opt.zoom || 1.18);
  cam.position.set(0, look + size.y * 0.03, dist); cam.lookAt(0, look, 0);

  let act = null;
  const play = (k, fade = 0.3) => { const c = clips[k]; if (!c) return false; const a = mixer.clipAction(c); a.reset().play(); if (act && act !== a) act.crossFadeTo(a, fade, false); act = a; return true; };
  play(opt.clip || 'idle', 0);

  const clock = new THREE.Clock(); let raf = 0, alive = true;
  const frame = () => { if (!alive) return; mixer.update(Math.min(clock.getDelta(), 0.05)); r.render(scene, cam); raf = requestAnimationFrame(frame); };
  if (opt.still) { mixer.update(opt.still); r.render(scene, cam); } else frame();
  const ro = new ResizeObserver(() => { r.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }); ro.observe(el);
  return {
    play, clips: Object.keys(clips), size: size.toArray(),
    turn: a => { pivot.rotation.y = a; r.render(scene, cam); },
    step: dt => { mixer.update(dt); r.render(scene, cam); },
    dispose: () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); el.removeChild(r.domElement); },
  };
}
