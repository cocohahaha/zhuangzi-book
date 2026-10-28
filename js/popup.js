// 立体插图：墨线纸片先像印刷一样浮现在纸面，再一张张立起来
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { Ink, PAPER, PAPER_EDGE } from './ink.js';
import { clamp, easeBack, easeOut, win, damp } from './util.js';
import * as sfx from './audio.js';

const PPU = 900;           // 每单位像素
const MAXPX = 1024;

// 画一张纸片：墨线 + 外圈留白（像剪下来的纸）
function paintCard(canvas, w, h, pad, draw, state, seed) {
  const k = canvas._k;
  const cw = canvas.width, ch = canvas.height;
  const a = canvas._a || (canvas._a = document.createElement('canvas'));
  a.width = cw; a.height = ch;
  const ga = a.getContext('2d');
  ga.clearRect(0, 0, cw, ch);
  const ink = new Ink(ga, k, cw / 2, ch - pad * k, seed);
  ink.lit = state.lit || 0;
  ink.t = state.t || 0;
  draw(ink, state);
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, cw, ch);
  if (state.cut !== false) {
    // 外圈：先画深一点的纸边，再铺纸色
    const r = Math.max(3, pad * k * 0.55);
    const ring = (rad, color) => {
      g.save();
      for (let i = 0; i < 16; i++) {
        const an = i / 16 * Math.PI * 2;
        g.drawImage(a, Math.cos(an) * rad, Math.sin(an) * rad);
      }
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = color; g.fillRect(0, 0, cw, ch);
      g.restore();
    };
    ring(r, PAPER_EDGE);
    const b = canvas._b || (canvas._b = document.createElement('canvas'));
    b.width = cw; b.height = ch;
    const gb = b.getContext('2d');
    gb.clearRect(0, 0, cw, ch);
    for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; gb.drawImage(a, Math.cos(an) * (r - 2), Math.sin(an) * (r - 2)); }
    gb.globalCompositeOperation = 'source-in'; gb.fillStyle = PAPER; gb.fillRect(0, 0, cw, ch);
    gb.globalCompositeOperation = 'source-over';
    g.drawImage(b, 0, 0);
  }
  g.drawImage(a, 0, 0);
  canvas._alpha = null;
}

function makeCanvas(w, h, pad) {
  let k = PPU;
  const tw = (w + pad * 2) * k, th = (h + pad * 2) * k;
  const s = Math.min(1, MAXPX / Math.max(tw, th));
  k *= s;
  const c = document.createElement('canvas');
  c.width = Math.max(8, Math.round((w + pad * 2) * k));
  c.height = Math.max(8, Math.round((h + pad * 2) * k));
  c._k = k;
  return c;
}

function alphaAt(canvas, u, v) {
  if (!canvas._alpha) {
    const g = canvas.getContext('2d');
    canvas._alpha = g.getImageData(0, 0, canvas.width, canvas.height).data;
  }
  const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(u * canvas.width)));
  const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((1 - v) * canvas.height)));
  return canvas._alpha[(y * canvas.width + x) * 4 + 3] / 255;
}

export class Popup {
  constructor(def, { renderer, onNote, aniso = 8 }) {
    this.def = def;
    this.root = new THREE.Group();
    this.T = 0;
    this.F = 1;           // 打开程度（翻走时收起）
    this.closing = false;
    this.items = [];
    this.hots = [];
    this.renderer = renderer;
    this.onNote = onNote;
    this.aniso = aniso;
    this.res = new THREE.Vector2(renderer.domElement.width, renderer.domElement.height);
    this.lines = [];
    this.popped = 0;
    this.api = def.build(this) || {};
  }

  // —— 纸片 ——
  card(o) {
    const { w, h, x = 0, y = 0, z = 0, ry = 0, draw, delay = 0, fold = 'back', pad = 0.014, stand = true, lean = 0, seed = 1, parent, cut = true, glow = 0xffd9a0 } = o;
    const canvas = makeCanvas(w, h, pad);
    const state = { lit: 0, t: 0, cut };
    paintCard(canvas, w, h, pad, draw, state, seed);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.aniso;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, alphaTest: 0.5, transparent: true, side: THREE.DoubleSide, roughness: 0.93, metalness: 0,
      emissive: new THREE.Color(glow), emissiveIntensity: 0, emissiveMap: tex, opacity: 0,
    });
    // 镂空只看纸片本身的透明度，淡入淡出交给透明混合（否则一淡就整块消失）
    mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', 'if ( diffuseColor.a < alphaTest * opacity ) discard;'); };
    mat.customProgramCacheKey = () => 'paper-card';
    const geo = new THREE.PlaneGeometry(w + pad * 2, h + pad * 2);
    geo.translate(0, h / 2, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const pivot = new THREE.Group();          // 折叠用
    pivot.add(mesh);
    const hinge = new THREE.Group();          // 摆放用
    hinge.position.set(x, y, z);
    hinge.rotation.y = ry;
    hinge.add(pivot);
    (parent || this.root).add(hinge);
    const item = {
      kind: 'card', hinge, pivot, mesh, mat, tex, canvas, w, h, pad, draw, state, seed,
      delay, fold, stand, lean, lit: 0, litTarget: 0, glow: 0, glowT: 0, ink: 0, rise: 0, popped: false,
      obj: hinge,
      redraw: () => { paintCard(canvas, w, h, pad, draw, state, seed); tex.needsUpdate = true; },
    };
    mesh.userData.item = item;
    this.items.push(item);
    return item;
  }

  // 自由移动的纸片（鸟、云……）：只淡入，不折叠
  sprite(o) {
    const it = this.card({ ...o, stand: false });
    it.kind = 'sprite';
    it.pivot.rotation.x = 0;
    return it;
  }

  // 有一对翅膀的：身体纸片 + 左右翅膀纸片
  winged(o) {
    const { body, wing, bw = 0.06, bh = 0.12, ww = 0.12, wh = 0.12, x = 0, y = 0, z = 0, delay = 0, seed = 1, parent, pad = 0.008 } = o;
    const group = new THREE.Group();
    group.position.set(x, y, z);
    (parent || this.root).add(group);
    // 默认姿态：平躺（从上往下看），头朝 −z，翅膀向 ±x 展开
    const b = body ? this.sprite({ w: bw, h: bh, draw: body, delay, seed, parent: group, pad }) : null;
    if (b) { b.pivot.rotation.x = -Math.PI / 2; b.hinge.position.z = bh / 2; b.hinge.position.y = 0.002; }
    const mk = (side) => {
      const piv = new THREE.Group();
      group.add(piv);
      const it = this.sprite({ w: ww, h: wh, draw: (g, s) => { g.c.save(); if (side < 0) { g.c.translate(g.c.canvas.width, 0); g.c.scale(-1, 1); } wing(g, s); g.c.restore(); }, delay, seed: seed + (side > 0 ? 1 : 2), parent: piv, pad });
      it.pivot.rotation.x = -Math.PI / 2;
      it.hinge.rotation.y = -side * Math.PI / 2;
      return { piv, it };
    };
    const R = mk(1), L = mk(-1);
    const item = {
      kind: 'winged', obj: group, body: b, R, L,
      flap: (a) => { R.piv.rotation.z = a; L.piv.rotation.z = -a; },
      meshes: [b && b.mesh, R.it.mesh, L.it.mesh].filter(Boolean),
      parts: [b, R.it, L.it].filter(Boolean),
    };
    return item;
  }

  // —— 墨线（三维） ——
  line(points, o = {}) {
    const { width = 2.2, color = 0x26221e, delay = 0, dur = 0.8, parent, opacity = 1, dashed = false } = o;
    const geo = new LineGeometry();
    geo.setPositions(points.flatMap(p => [p[0], p[1], p[2]]));
    const mat = new LineMaterial({ color, linewidth: width * Math.min(2, window.devicePixelRatio), transparent: true, opacity: 0, dashed, dashSize: 0.02, gapSize: 0.015, worldUnits: false });
    mat.resolution.copy(this.res);
    const ln = new Line2(geo, mat);
    if (dashed) ln.computeLineDistances();
    ln.renderOrder = 3;
    (parent || this.root).add(ln);
    const n = points.length - 1;
    const item = {
      kind: 'line', obj: ln, mat, geo, delay, dur, opacity, n, reveal: 0, auto: o.auto !== false,
      set: (pts) => {
        geo.setPositions(pts.flatMap(p => [p[0], p[1], p[2]]));
        if (dashed) ln.computeLineDistances();
      },
    };
    this.items.push(item);
    this.lines.push(item);
    return item;
  }

  // 有体积的线（发光的刀路等）
  tube(points, o = {}) {
    const { radius = 0.004, color = 0xb0432d, emissive = 0x000000, delay = 0, dur = 1, parent, closed = false } = o;
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
    const segs = Math.max(20, points.length * 8);
    const geo = new THREE.TubeGeometry(curve, segs, radius, 6, closed);
    const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 1, roughness: 0.6, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    (parent || this.root).add(mesh);
    const total = geo.index.count;
    const item = { kind: 'tube', obj: mesh, mesh, mat, geo, delay, dur, total, reveal: 0, curve, auto: o.auto !== false };
    this.items.push(item);
    return item;
  }

  group(parent) { const g = new THREE.Group(); (parent || this.root).add(g); return g; }

  // 可点的东西
  hot(item, key, o = {}) {
    const meshes = item.meshes || (item.mesh ? [item.mesh] : []);
    const parts = item.parts || [item];
    for (const m of meshes) { m.userData.hot = key; this.hots.push(m); }
    (this._hotItems ||= {})[key] = { item, parts, ...o };
    return item;
  }

  // 由外部调用：点到了 key
  hit(key) {
    const h = this._hotItems && this._hotItems[key];
    if (!h) return;
    for (const p of h.parts) { p.glowT = 1; p.litTarget = 1; }
    if (this.api.hit) this.api.hit(key);
    this.onNote && this.onNote(key);
  }

  // 当前应该响应点击的网格（考虑纸片的透明部分）
  pick(raycaster) {
    if (this.F < 0.9) return null;
    const hits = raycaster.intersectObjects(this.hots, false);
    for (const h of hits) {
      const it = h.object.userData.item;
      if (it && it.canvas && h.uv && alphaAt(it.canvas, h.uv.x, h.uv.y) < 0.4) continue;
      return h.object.userData.hot;
    }
    return null;
  }

  // 进度工具，供各篇使用
  rise(delay) { return easeBack(win(this.T, delay + 0.35, delay + 1.05)) * this.F; }
  appear(delay, dur = 0.5) { return easeOut(win(this.T, delay, delay + dur)) * this.F; }

  close() { this.closing = true; }

  update(dt) {
    this.T += dt;
    if (this.closing) this.F = Math.max(0, this.F - dt * (this.closeRate || 3.2));
    const T = this.T, F = this.F;
    this.res.set(this.renderer.domElement.width, this.renderer.domElement.height);
    for (const it of this.items) {
      if (it.kind === 'card' || it.kind === 'sprite') {
        const ink = easeOut(win(T, it.delay, it.delay + 0.45));
        it.mat.opacity = ink * clamp(F * 1.6);
        it.mesh.visible = it.mat.opacity > 0.01;
        if (it.kind === 'card') {
          const r = it.stand ? easeBack(win(T, it.delay + 0.4, it.delay + 1.1)) * F : 0;
          it.rise = r;
          const flat = it.fold === 'back' ? -Math.PI / 2 : Math.PI / 2;
          it.pivot.rotation.x = flat * (1 - r) + it.lean * r;
          // 纸面上“印着”时略微抬高，避免与页面重叠闪烁
          it.pivot.position.y = 0.0012;
          if (it.stand && !it.popped && r > 0.08) { it.popped = true; if (this.popped++ < 10) sfx.pop(); }
        }
        // 点亮：重画纸片上的淡彩
        if (Math.abs(it.lit - it.litTarget) > 0.01) {
          it.lit = damp(it.lit, it.litTarget, 6, dt);
          it.state.lit = it.lit;
          it.redraw();
        }
        if (it.glowT > 0) {
          it.glow = damp(it.glow, it.glowT, 10, dt);
          it.glowT = Math.max(0, it.glowT - dt * 0.9);
        } else it.glow = damp(it.glow, it.hover ? 0.25 : 0, 8, dt);
        it.mat.emissiveIntensity = it.glow * 0.45;
      } else if (it.kind === 'line') {
        if (it.auto) it.reveal = easeOut(win(T, it.delay, it.delay + it.dur));
        it.mat.opacity = it.opacity * clamp(it.reveal * 4) * F;
        it.obj.visible = it.mat.opacity > 0.01;
        it.geo.instanceCount = Math.max(0, Math.ceil(it.n * it.reveal));
        it.mat.resolution.copy(this.res);
      } else if (it.kind === 'tube') {
        if (it.auto) it.reveal = easeOut(win(T, it.delay, it.delay + it.dur));
        it.mat.opacity = clamp(it.reveal * 3) * F;
        it.mesh.visible = it.mat.opacity > 0.01;
        it.geo.setDrawRange(0, Math.floor(it.total * it.reveal / 6) * 6);
      }
    }
    if (this.api.update) this.api.update(T, dt, F);
    // 半透明的纸片不投影（影子贴图不认透明度）
    for (const it of this.items) if (it.mesh && it.mat) it.mesh.castShadow = it.mat.opacity > 0.55 && it.mesh.visible && !it.mesh.userData.noShadow;
  }

  setHover(key) {
    for (const [k, h] of Object.entries(this._hotItems || {})) for (const p of h.parts) p.hover = k === key;
  }

  dispose() {
    this.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) { if (m.map) m.map.dispose(); m.dispose(); }
      }
      if (o.customDepthMaterial) o.customDepthMaterial.dispose();
    });
    this.root.removeFromParent();
  }
}
