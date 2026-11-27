// Smudge in 3D, drawn to sit with the 2D cards: toon shading in three flat bands, a black outline like the
// cards' ink line, and a warm rim light. His tail has its own bones (tools/tail_rig.py) and swings in code. One file, /assets/v2/3d/smudge.glb, carries the mesh, the skeleton and
// his clips (idle, walk, run). Usage: const s = await Smudge3D.mount(el, { clip: 'idle', ink: 0.012 });
//   s.play('walk'); s.turn(radians); s.dispose();
import * as THREE from 'three';
import { GLTFLoader } from '/js/vendor/three/GLTFLoader.js';

const INK = 0x0b0b0e;            // the outline colour: near-black, like the card art's line
const cache = {};
const load = src => cache[src] || (cache[src] = new GLTFLoader().loadAsync(src + (window.OS && OS.VER ? '?v=' + OS.VER : '')));
// how the tail moves in each clip: side-to-side swing (radians per bone), speed, and how far it lifts off the floor
const TAIL = { idle: { amp: 0.05, hz: 0.45, lift: 0 }, walk: { amp: 0.1, hz: 1.1, lift: 0.1 }, run: { amp: 0.13, hz: 1.9, lift: 0.55 } };

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

// fur colours: rotate the hue of the warm browns only (eyes, nose, cream chest and cloth keep theirs).
// opt.fur = { hue: radians, sat: multiplier, val: multiplier }
function furShift(mat, f) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.furHue = { value: f.hue || 0 }; sh.uniforms.furSat = { value: f.sat ?? 1 }; sh.uniforms.furVal = { value: f.val ?? 1 };
    sh.fragmentShader = 'uniform float furHue, furSat, furVal;\nvec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}\nvec3 hsv2rgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  { vec3 h = rgb2hsv(diffuseColor.rgb);
    float fur = smoothstep(0.0, 0.03, h.x) * (1.0 - smoothstep(0.11, 0.14, h.x)) * smoothstep(0.28, 0.45, h.y);
    vec3 n = hsv2rgb(vec3(fract(h.x + furHue / 6.2831853), clamp(h.y * furSat, 0.0, 1.0), clamp(h.z * furVal, 0.0, 1.0)));
    diffuseColor.rgb = mix(diffuseColor.rgb, n, fur); }`);
  };
}

// a static accessory (crown, glasses, satchel...): its own toon material and a plain inverted-hull outline
function inkStatic(o, width) {
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 6 });
  m.onBeforeCompile = sh => { sh.uniforms.inkW = { value: width }; sh.vertexShader = 'uniform float inkW;\nattribute vec3 inkNormal;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normalize(inkNormal) * inkW;'); };
  inkNormals(o.geometry, 3); const h = new THREE.Mesh(o.geometry, m); h.frustumCulled = false; o.add(h);
}

// flames for the rocket pack: two layered cones per nozzle, flickering in length and width every frame
function flames(at) {
  const g = new THREE.Group(), parts = [];
  for (const [c, r, l] of [[0xffe680, 0.32, 1.1], [0xff8a1a, 0.5, 1.9]]) {
    const geo = new THREE.ConeGeometry(r, l, 10, 1, true); geo.translate(0, -l / 2, 0); geo.rotateX(Math.PI);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: c === 0xffd23a ? 1 : 0.8, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI; g.add(m); parts.push(m);
  }
  g.userData.tick = t => parts.forEach((m, i) => { const f = 0.75 + 0.35 * Math.sin(t * (23 + i * 7)) * Math.sin(t * 9.3 + i); m.scale.set(1 + 0.15 * Math.sin(t * 31 + i), f, 1 + 0.15 * Math.sin(t * 27 + i)); });
  at.add(g); return g;
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

  const g = await load(opt.src || '/assets/v2/3d/smudge.glb');
  const { clone } = await import('/js/vendor/three/SkeletonUtils.js');
  const m = clone(g.scene), ramp = bands(opt.bands || 3);
  const meshes = [], hulls = []; m.traverse(o => { if (o.isMesh) meshes.push(o); });   // collect first: the outline adds meshes
  meshes.forEach(o => {
    const src = o.material;
    if (opt.toon !== false) {
      o.material = new THREE.MeshToonMaterial({ map: src.map, gradientMap: ramp, normalMap: opt.fur === false ? null : src.normalMap,
        normalScale: new THREE.Vector2(0.45, 0.45), side: THREE.FrontSide });
      if (opt.furColor) furShift(o.material, opt.furColor);
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
  // accessories: [{src, bone, pos:[x,y,z], rot:[x,y,z], scale, flames:[[x,y,z],...]}], positions in his
  // world units (metres, he is ~1 tall) relative to the bone, so the same numbers work on every model of him
  const worn = [], fx = [];
  for (const w of opt.wear || []) {
    let bone = null; m.traverse(o => { if (!bone && o.isBone && o.name === w.bone) bone = o; });
    if (!bone) continue;
    const ga = await load(w.src), a = ga.scene.clone(true);
    const parts = []; a.traverse(o => { if (o.isMesh) parts.push(o); });
    parts.forEach(o => {
      o.material = new THREE.MeshToonMaterial({ map: o.material.map, gradientMap: ramp, color: w.tint ? new THREE.Color(w.tint) : 0xffffff, side: w.clear ? THREE.DoubleSide : THREE.FrontSide });
      // glass: the pale, colourless parts of the texture (lenses) are cut out so his eyes show through
      if (w.clear) o.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { float hi = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)), lo = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
          if (hi > 0.62 && hi - lo < 0.16) discard; }`); };
      o.frustumCulled = false; if (opt.ink !== 0 && !w.clear) inkStatic(o, 0.012 * (w.ink ?? 1));
    });
    // bones carry the rig's 0.01 scale: undo it so the accessory's numbers are in plain metres
    const holder = new THREE.Group(), bs = bone.getWorldScale(new THREE.Vector3()), ms = m.getWorldScale(new THREE.Vector3());
    holder.scale.setScalar(ms.y / bs.y);
    const wq = bone.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(m.getWorldQuaternion(new THREE.Quaternion()));
    holder.quaternion.copy(wq);       // the holder's axes line up with Smudge's: +y up, +z forward
    const b3 = new THREE.Box3().setFromObject(a), c = b3.getCenter(new THREE.Vector3()), sz = b3.getSize(new THREE.Vector3());
    a.position.sub(c); const inner = new THREE.Group(); inner.add(a);
    inner.scale.setScalar((w.scale || 0.2) / Math.max(sz.x, sz.y, sz.z));            // scale = its longest side, in metres
    if (w.rot) inner.rotation.set(...w.rot); if (w.pos) inner.position.set(...w.pos);
    holder.add(inner); bone.add(holder); worn.push(holder);
    (w.flames || []).forEach(p => { const f = flames(inner); f.position.set(...p).multiplyScalar(1 / inner.scale.x); f.scale.setScalar((w.flameSize || 0.1) / inner.scale.x); fx.push(f); });
  }

  const look = size.y * (opt.lookAt ?? 0.52), dist = size.y / (2 * Math.tan(cam.fov * Math.PI / 360)) * (opt.zoom || 1.18);
  cam.position.set(0, look + size.y * 0.03, dist); cam.lookAt(0, look, 0);

  // the tail chain: the clips never touch it, so each frame it gets a travelling wave on top of its rest pose,
  // swinging side to side about the body's up axis and lifting about its side axis; every bone lags the one before
  const tail = []; m.traverse(o => { if (o.isBone && /^tail\d+$/.test(o.name)) tail.push(o); });
  tail.sort((a, b) => +a.name.slice(4) - +b.name.slice(4));
  let up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(1, 0, 0);
  if (tail.length) { const q = tail[0].parent.getWorldQuaternion(new THREE.Quaternion()).invert(); up.applyQuaternion(q).normalize(); side.applyQuaternion(q).normalize(); }
  const rest = tail.map(b => b.quaternion.clone()), tq = new THREE.Quaternion(), tl = new THREE.Quaternion();
  let tmode = { ...TAIL.idle }, tgoal = TAIL.idle, tt = 0;
  const swing = dt => {
    if (!tail.length || opt.tailSwing === false) return; tt += dt; const k = Math.min(1, dt * 3);
    for (const p of ['amp', 'hz', 'lift']) tmode[p] += (tgoal[p] - tmode[p]) * k;
    tail.forEach((b, i) => {
      const w = Math.sin(tt * tmode.hz * Math.PI * 2 - i * 0.55) * tmode.amp * (0.6 + i * 0.12);
      tq.setFromAxisAngle(up, w); tl.setFromAxisAngle(side, tmode.lift * [0.25, 0.55, 0.6, 0.35, 0.2, 0.1][i] || 0);
      b.quaternion.copy(rest[i]).multiply(tq).multiply(tl);
    });
  };

  let act = null;
  const play = (k, fade = 0.3) => { const c = clips[k]; if (!c) return false; const a = mixer.clipAction(c); a.reset().play(); if (act && act !== a) act.crossFadeTo(a, fade, false); act = a; tgoal = TAIL[k] || TAIL.idle; return true; };
  play(opt.clip || 'idle', 0); tmode = { ...tgoal };

  let ft = 0; const tick = dt => { mixer.update(dt); swing(dt); ft += dt; fx.forEach(f => f.userData.tick(ft)); };
  const clock = new THREE.Clock(); let raf = 0, alive = true;
  const frame = () => { if (!alive) return; tick(Math.min(clock.getDelta(), 0.05)); r.render(scene, cam); raf = requestAnimationFrame(frame); };
  if (opt.still) { tick(opt.still); r.render(scene, cam); } else frame();
  const ro = new ResizeObserver(() => { r.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }); ro.observe(el);
  return {
    play, clips: Object.keys(clips), size: size.toArray(),
    turn: a => { pivot.rotation.y = a; r.render(scene, cam); },
    step: dt => { tick(dt); r.render(scene, cam); }, tail: tail.length, root: m,
    dispose: () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); el.removeChild(r.domElement); },
  };
}
