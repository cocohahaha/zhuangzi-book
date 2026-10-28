// 外篇插图（二）：天运、刻意、缮性、秋水、至乐、达生
import * as THREE from 'three';
import { WASH, VERM, INK, PAPER, ellipsePts } from '../ink.js';
import { person, fish, tree, mountains, waveRows, birdSide } from '../art.js';
import { clamp, lerp, smooth, win, easeInOut, easeOut } from '../util.js';
import * as sfx from '../audio.js';

// —— 小工具 ——
const fade = (it, f) => { for (const p of (it.parts || [it])) { p.mat.opacity *= f; p.mesh.visible = p.mat.opacity > 0.01; p.mesh.castShadow = p.mat.opacity > 0.45; } };
// 以中心为轴转动的纸片（风轮、翻身的人……）
function centered(k, o) {
  const G = k.group(o.parent);
  G.position.set(o.x || 0, o.y || 0, o.z || 0);
  const sp = k.sprite({ ...o, x: 0, y: 0, z: 0, parent: G });
  sp.obj.position.y = -o.h / 2;
  return { G, sp };
}
const circlePts = (cx, cy, cz, r, n = 48, axis = 'y') => {
  const o = [];
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    o.push(axis === 'y' ? [cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r] : [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]);
  }
  return o;
};
// 构图：把整幅图放大、压缩纵深、往读者这边挪（地面墨迹同步变换）
function framed(def, { s = 1.1, sz = 0.78, dz = 0.08 } = {}) {
  return {
    ground: def.ground && ((g) => {
      const c = g.c;
      c.save();
      c.translate(g.ox, g.oy + dz * g.k); c.scale(s, sz); c.translate(-g.ox, -g.oy);
      def.ground(g);
      c.restore();
    }),
    build(k) {
      const api = def.build(k);
      const st = new THREE.Group();
      for (const ch of [...k.root.children]) st.add(ch);
      st.scale.set(s, s, sz);
      st.position.z = dz;
      k.root.add(st);
      return api;
    },
  };
}

// —— 造型 ——
function sun(g, r = 0.04) {
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    g.stroke([[Math.cos(a) * r * 1.3, r * 1.45 + Math.sin(a) * r * 1.3], [Math.cos(a) * r * 1.65, r * 1.45 + Math.sin(a) * r * 1.65]], 0.0035, { color: VERM, smooth: false });
  }
  g.circle(0, r * 1.45, r, 0.004, { wash: WASH.verm, washA: 0.35 + 0.35 * g.lit });
}
function moon(g, r = 0.035) {
  const cy = r * 1.2;
  const outer = ellipsePts(0, cy, r, r, 24, Math.PI / 2, Math.PI * 1.5);
  const inner = ellipsePts(r * 0.38, cy, r * 0.72, r, 24, Math.PI * 1.5, Math.PI / 2);
  g.shape([...outer, ...inner.slice(1, -1)], 0.004, { wash: WASH.ochre, washA: 0.3 + 0.35 * g.lit });
}
function house(g, x, y, s, { lit = 0, door = true } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  g.shape(P([[-0.42, 0], [-0.42, 0.52], [0.42, 0.52], [0.42, 0]]), 0.004, { smooth: false, wash: WASH.ochre, washA: 0.12 + 0.2 * lit });
  g.shape(P([[-0.6, 0.48], [-0.5, 0.56], [-0.3, 0.86], [0.3, 0.86], [0.5, 0.56], [0.6, 0.48], [0.4, 0.52], [-0.4, 0.52]]), 0.004, { wash: WASH.ink, washA: 0.15 });
  for (let i = 0; i < 5; i++) g.stroke(P([[-0.28 + i * 0.14, 0.84], [-0.4 + i * 0.2, 0.56]]), 0.0022, { alpha: 0.6 });
  if (door) g.shape(P([[-0.12, 0], [-0.12, 0.36], [0.12, 0.36], [0.12, 0]]), 0.0035, { smooth: false, fill: 'rgba(38,34,30,.75)' });
  g.shape(P([[0.22, 0.2], [0.22, 0.36], [0.34, 0.36], [0.34, 0.2]]), 0.003, { smooth: false });
  g.line(x + 0.28 * s, y + 0.2 * s, x + 0.28 * s, y + 0.36 * s, 0.002);
}
function rooster(g, x, y, s, { lit = 0, wood = false } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  const w = 0.0045;
  const wc = wood ? WASH.ochre : WASH.ink;
  // 尾羽
  g.shape(P([[-0.16, 0.55], [-0.24, 0.78], [-0.36, 0.92], [-0.47, 0.86], [-0.46, 0.66], [-0.38, 0.46], [-0.2, 0.42]]), w, { wash: wc, washA: (wood ? 0.25 : 0.12) + 0.3 * lit });
  for (let i = 0; i < 3; i++) g.stroke(P([[-0.18, 0.5 + i * 0.03], [-0.3 - i * 0.03, 0.8 - i * 0.05], [-0.42 + i * 0.02, 0.78 - i * 0.12]]), w * 0.55, { alpha: 0.8 });
  // 身体
  const body = [[-0.2, 0.55], [0.0, 0.62], [0.16, 0.68], [0.2, 0.86], [0.27, 0.93], [0.33, 0.9], [0.4, 0.86], [0.33, 0.84], [0.3, 0.76], [0.31, 0.66], [0.33, 0.52], [0.22, 0.36], [0.02, 0.32], [-0.16, 0.4]];
  g.shape(P(body), w, { wash: wc, washA: (wood ? 0.28 : 0.06) + 0.3 * lit });
  // 翅
  g.stroke(P([[-0.06, 0.56], [0.1, 0.58], [0.2, 0.5], [0.06, 0.42], [-0.08, 0.46]]), w * 0.7);
  for (let i = 0; i < 3; i++) g.stroke(P([[0.0 + i * 0.05, 0.47], [0.04 + i * 0.05, 0.53]]), w * 0.45, { alpha: 0.7 });
  // 冠与肉垂
  g.shape(P([[0.2, 0.91], [0.21, 1.0], [0.25, 0.95], [0.28, 1.01], [0.31, 0.95], [0.34, 0.98], [0.34, 0.9]]), w * 0.7, { wash: wood ? WASH.ochre : WASH.verm, washA: wood ? 0.3 : 0.6 });
  g.shape(ellipsePts(x + 0.315 * s, y + 0.79 * s, 0.022 * s, 0.035 * s, 14).slice(0, -1), w * 0.6, { wash: wood ? WASH.ochre : WASH.verm, washA: wood ? 0.3 : 0.6 });
  g.dot(x + 0.285 * s, y + 0.885 * s, 0.012 * s);
  // 腿
  for (const lx of [0.05, 0.16]) {
    g.stroke(P([[lx, 0.34], [lx - 0.01, 0.16], [lx + 0.0, 0.03]]), w * 0.8);
    g.stroke(P([[lx - 0.06, 0.0], [lx, 0.03], [lx + 0.07, 0.0]]), w * 0.6);
  }
  if (wood) {
    // 木纹与底座
    for (let i = 0; i < 5; i++) g.stroke(P([[-0.12 + i * 0.07, 0.38 + i * 0.02], [-0.1 + i * 0.08, 0.58 + (i % 2) * 0.03]]), w * 0.35, { alpha: 0.6 });
    g.shape(P([[-0.3, -0.04], [-0.3, 0.02], [0.35, 0.02], [0.35, -0.04]]), w * 0.7, { smooth: false, wash: WASH.ochre, washA: 0.35 });
  }
}
function cicada(g, x, y, s, { lit = 0 } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  g.shape(P([[0.0, 0.0], [0.25, 0.3], [0.3, 0.75], [0.12, 0.95], [-0.12, 0.95], [-0.3, 0.75], [-0.25, 0.3]]), 0.0025, { wash: WASH.water, washA: 0.25 + 0.3 * lit });
  g.shape(P([[-0.14, 0.7], [-0.16, 1.05], [0.0, 1.15], [0.16, 1.05], [0.14, 0.7]]), 0.003, { wash: WASH.ochre, washA: 0.5 + 0.3 * lit });
  g.dot(x - 0.14 * s, y + 1.1 * s, 0.05 * s); g.dot(x + 0.14 * s, y + 1.1 * s, 0.05 * s);
  g.stroke(P([[0, 0.1], [0, 0.85]]), 0.0018, { alpha: 0.6 });
}
function coin(g, x, y, r, lit = 0) {
  g.circle(x, y, r, 0.003, { wash: WASH.ochre, washA: 0.35 + 0.3 * lit });
  g.shape([[x - r * 0.3, y - r * 0.3], [x - r * 0.3, y + r * 0.3], [x + r * 0.3, y + r * 0.3], [x + r * 0.3, y - r * 0.3]], 0.0025, { smooth: false, fill: 'rgba(247,240,226,1)' });
}
function crown(g, x, y, s, lit = 0) {
  const P = (pts) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  g.shape(P([[-0.3, 0.0], [-0.26, 0.42], [0.26, 0.42], [0.3, 0.0]]), 0.0035, { wash: WASH.ink, washA: 0.35 });
  g.shape(P([[-0.62, 0.42], [-0.62, 0.52], [0.62, 0.56], [0.62, 0.46]]), 0.0035, { smooth: false, wash: WASH.ink, washA: 0.5 });
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const bx = side * (0.42 + i * 0.07);
    g.line(x + bx * s, y + 0.46 * s, x + bx * s, y + 0.12 * s, 0.0016);
    for (let b = 0; b < 3; b++) g.dot(x + bx * s, y + (0.38 - b * 0.11) * s, 0.025 * s, b === 1 ? VERM : INK);
  }
  g.stroke(P([[-0.2, 0.2], [0.2, 0.2]]), 0.0025, { color: VERM, alpha: 0.6 + 0.4 * lit });
}
function wheelDraw(g, cx, cy, r, w = 0.004, lit = 0, spokes = 12) {
  g.circle(cx, cy, r, w, { wash: WASH.ochre, washA: 0.1 + 0.2 * lit });
  g.stroke(ellipsePts(cx, cy, r * 0.82, r * 0.82, 40), w * 0.5, { closed: true, taper: [0, 0] });
  for (let i = 0; i < spokes; i++) {
    const a = i / spokes * Math.PI * 2;
    g.stroke([[cx + Math.cos(a) * r * 0.15, cy + Math.sin(a) * r * 0.15], [cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82]], w * 0.55, { smooth: false });
  }
  g.circle(cx, cy, r * 0.15, w * 0.7, { wash: WASH.ink, washA: 0.3 });
}
function horse(g, x, y, s, lit = 0) {
  const P = (pts) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  g.shape(P([[-0.35, 0.5], [-0.1, 0.56], [0.2, 0.55], [0.32, 0.62], [0.42, 0.82], [0.5, 0.86], [0.56, 0.78], [0.48, 0.74], [0.4, 0.6], [0.34, 0.42], [0.2, 0.36], [-0.2, 0.36], [-0.36, 0.4]]), 0.004, { wash: WASH.ochre, washA: 0.15 + 0.25 * lit });
  g.stroke(P([[-0.35, 0.48], [-0.46, 0.36], [-0.44, 0.24]]), 0.004);
  g.stroke(P([[0.34, 0.66], [0.4, 0.84], [0.44, 0.88]]), 0.0025, { alpha: 0.7 });
  g.dot(x + 0.49 * s, y + 0.82 * s, 0.012 * s);
  for (const [lx, d] of [[-0.25, -0.05], [-0.15, 0.05], [0.15, -0.04], [0.25, 0.06]]) g.stroke(P([[lx, 0.38], [lx + d, 0.18], [lx + d * 0.6, 0.0]]), 0.004);
}

// —— 十四 · 天运：日月运转，云雨相生 ——
const ch14 = {
  ground(g) {
    const pts = ellipsePts(0, 0.12, 0.4, 0.2, 60);
    for (let i = 0; i < pts.length - 1; i += 2) g.stroke([pts[i], pts[i + 1]], 0.002, { smooth: false, alpha: 0.3 });
    g.text('天 其 运 乎', -0.36, 0.52, 0.022, { color: 'rgba(40,34,30,.45)', align: 'left' });
  },
  build(k) {
    const earth = k.card({ w: 0.62, h: 0.19, z: -0.1, delay: 0.1, draw: (g) => {
      mountains(g, -0.3, 0.3, 0, 0.17, { peaks: 3, seed: 5, w: 0.0045, hatch: true, lit: g.lit });
      house(g, 0.1, 0.0, 0.1, { lit: g.lit });
      tree(g, -0.17, 0.0, 0.12, { seed: 3 });
      tree(g, 0.22, 0.0, 0.09, { seed: 8, leaves: 'tall' });
    } });
    // 轨道
    const C = [0, 0.27, -0.12];
    const orbit = [];
    for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; orbit.push([C[0] + Math.cos(a) * 0.4, C[1] + Math.sin(a) * 0.08, C[2] + Math.sin(a) * 0.2]); }
    k.line(orbit, { width: 1.4, dashed: true, opacity: 0.5, delay: 0.5, dur: 1.2 });
    const sunS = k.sprite({ w: 0.16, h: 0.16, delay: 0.6, pad: 0.008, draw: (g) => sun(g, 0.047) });
    const moonS = k.sprite({ w: 0.11, h: 0.11, delay: 0.8, pad: 0.008, draw: (g) => moon(g, 0.042) });
    k.hot(sunS, 'ri'); k.hot(moonS, 'ri');
    // 云与雨
    const cloud = k.sprite({ w: 0.26, h: 0.1, delay: 0.9, pad: 0.008, draw: (g) => g.cloud(0, 0.045, 0.095, 0.0038, { wash: WASH.water, washA: 0.1 + 0.3 * g.lit }) });
    cloud.obj.position.set(-0.22, 0.33, -0.2);
    const cloud2 = k.sprite({ w: 0.2, h: 0.08, delay: 1.0, pad: 0.008, draw: (g) => g.cloud(0, 0.035, 0.075, 0.0035) });
    cloud2.obj.position.set(0.26, 0.36, -0.24);
    const rain = k.sprite({ w: 0.2, h: 0.16, delay: 1.0, pad: 0.006, draw: (g) => {
      for (let i = 0; i < 16; i++) {
        const x = -0.08 + (i % 8) * 0.022 + (i > 7 ? 0.011 : 0), y = 0.02 + ((i * 37) % 10) / 10 * 0.11;
        g.stroke([[x, y + 0.03], [x - 0.008, y]], 0.0028, { color: '#4d6a7a', smooth: false });
      }
    } });
    k.hot(cloud, 'yun'); k.hot(rain, 'yun'); k.hot(cloud2, 'yun');
    // 效颦：西施、学样的邻女、关门的人家
    const xishi = k.card({ w: 0.14, h: 0.21, x: -0.34, z: 0.15, delay: 1.1, draw: (g) => {
      person(g, 0, 0, 0.2, { pose: 'stand', face: 1, w: 0.0035, robe: WASH.verm, lit: g.lit });
      g.stroke([[0.017, 0.193], [0.031, 0.187]], 0.002);
    } });
    const copy = k.card({ w: 0.17, h: 0.2, x: -0.13, z: 0.17, delay: 1.25, draw: (g) => {
      person(g, 0, 0, 0.2, { pose: 'bow', face: -1, w: 0.004, lit: g.lit * 0.5 });
    } });
    const home = k.card({ w: 0.24, h: 0.18, x: 0.31, z: 0.14, delay: 1.35, draw: (g) => house(g, 0, 0, 0.2, { lit: g.lit, door: false }) });
    // 门：可以关上的一扇
    const doorG = k.group(); doorG.position.set(0.31 - 0.024, 0, 0.141);
    const door = k.sprite({ w: 0.048, h: 0.072, pad: 0.003, delay: 1.5, parent: doorG, cut: false, draw: (g) => {
      g.shape([[-0.024, 0], [-0.024, 0.072], [0.024, 0.072], [0.024, 0]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.5 });
      g.dot(0.014, 0.036, 0.003);
    } });
    door.obj.position.x = 0.024;
    k.hot(xishi, 'pin'); k.hot(copy, 'pin'); k.hot(home, 'pin');

    let boostRi = -9, rainAt = 3.5, pinAt = -9, ang = 0;
    return {
      hit(key) {
        if (key === 'ri') boostRi = k.T;
        if (key === 'yun' && (k.T - rainAt > 3.2 || k.T < rainAt)) rainAt = k.T;
        if (key === 'pin') pinAt = k.T;
      },
      update(T, dt) {
        const boost = clamp(1 - (T - boostRi) / 3);
        ang += dt * (0.22 + boost * 1.6);
        const at = (a) => [C[0] + Math.cos(a) * 0.4, C[1] + Math.sin(a) * 0.08, C[2] + Math.sin(a) * 0.2];
        const s = at(ang), m = at(ang + Math.PI);
        sunS.obj.position.set(s[0], s[1] - 0.08, s[2]);
        moonS.obj.position.set(m[0], m[1] - 0.05, m[2]);
        // 云：下雨时缩小，雨停后又聚起来
        if (T - rainAt > 14) rainAt = T;
        const r = T - rainAt;
        const raining = r >= 0 && r < 3.2 ? Math.sin(Math.PI * clamp(r / 3.2)) : 0;
        const shrink = r >= 0 && r < 6 ? (r < 3.2 ? smooth(r / 3.2) : 1 - smooth((r - 3.2) / 2.8)) : 0;
        cloud.obj.scale.setScalar(1 - 0.35 * shrink);
        cloud.obj.position.x = -0.22 + Math.sin(T * 0.15) * 0.03; cloud.obj.position.y = 0.33;
        cloud2.obj.position.x = 0.26 + Math.sin(T * 0.12 + 2) * 0.04;
        const fall = (T * 0.22) % 0.06;
        rain.obj.position.set(cloud.obj.position.x, 0.18 - fall, -0.195);
        // alphaTest 与透明度相乘会把半透明的雨丝整片裁掉，所以雨只做显隐
        fade(rain, raining > 0.12 ? 1 : 0);
        // 效颦
        const p = T - pinAt;
        const act = p > 0 && p < 3.5;
        copy.hinge.rotation.z = act ? Math.sin(p * 9) * 0.12 * (1 - p / 3.5) : Math.sin(T * 1.3) * 0.02;
        const open = p > 0 && p < 6 ? (p < 0.6 ? 1 : p < 1.1 ? 1 - smooth((p - 0.6) / 0.5) : p < 4.5 ? 0 : smooth((p - 4.5) / 1.5)) : 1;
        doorG.rotation.y = -0.8 * open;
        xishi.hinge.rotation.z = act ? Math.sin(p * 3) * 0.03 : 0;
      },
    };
  },
};

// —— 十五 · 刻意：水静则清 ——
const ch15 = {
  ground(g) {
    g.stroke([[-0.44, 0.08], [-0.04, 0.08]], 0.002, { alpha: 0.3 });
    g.text('吐 故 纳 新', -0.43, -0.02, 0.02, { color: 'rgba(40,34,30,.45)', align: 'left' });
    g.text('不 杂 则 清', 0.0, -0.13, 0.02, { color: 'rgba(40,34,30,.45)', align: 'left' });
  },
  build(k) {
    // 剖面的水盆：盆壁是纸，盆里透空
    const VX = 0.09, VZ = 0.06;
    const vessel = k.card({ w: 0.46, h: 0.15, x: VX, z: VZ, delay: 0.2, draw: (g) => {
      const outer = [[-0.215, 0.14], [-0.205, 0.03], [-0.17, 0.0], [0.17, 0.0], [0.205, 0.03], [0.215, 0.14]];
      const inner = [[0.188, 0.14], [0.182, 0.035], [0.16, 0.02], [-0.16, 0.02], [-0.182, 0.035], [-0.188, 0.14]];
      g.fill([...outer, ...inner], PAPER, { smooth: false });
      g.wash([...outer, ...inner], WASH.ochre, 0.5 + 0.3 * g.lit, { smooth: false, blur: 1 });
      g.stroke(outer, 0.0045, { smooth: false, taper: [0.02, 0.02] });
      g.stroke(inner, 0.0032, { smooth: false, taper: [0.02, 0.02] });
      g.stroke([[-0.215, 0.14], [-0.188, 0.14]], 0.004, { smooth: false });
      g.stroke([[0.215, 0.14], [0.188, 0.14]], 0.004, { smooth: false });
      for (let i = 0; i < 6; i++) g.stroke([[-0.15 + i * 0.06, 0.008], [-0.13 + i * 0.06, 0.012]], 0.002, { alpha: 0.6 });
    } });
    k.hot(vessel, 'shui');
    const X0 = VX - 0.18, X1 = VX + 0.18, Y0 = 0.025, LEVEL = 0.105, ZW = VZ - 0.004;
    // 水色与浑浊
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x7d9aa8, transparent: true, opacity: 0, depthWrite: false });
    const mudMat = new THREE.MeshBasicMaterial({ color: 0xa88458, transparent: true, opacity: 0, depthWrite: false });
    const wGeo = new THREE.PlaneGeometry(X1 - X0, LEVEL - Y0); wGeo.translate((X0 + X1) / 2, (LEVEL + Y0) / 2, 0);
    const water = new THREE.Mesh(wGeo, waterMat); water.position.z = ZW - 0.002;
    const mud = new THREE.Mesh(wGeo.clone(), mudMat); mud.position.z = ZW - 0.001;
    const wg = k.group(); wg.add(water, mud);
    water.userData.hot = 'shui'; k.hot({ meshes: [water], parts: [] }, 'shui');
    // 泥沙
    const N = 70;
    const pp = new Float32Array(N * 3), vel = new Float32Array(N);
    const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.fillStyle = '#5a4630'; x.beginPath(); x.arc(8, 8, 6, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); return t; })();
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pMat = new THREE.PointsMaterial({ size: 4 * Math.min(2, window.devicePixelRatio), sizeAttenuation: false, map: dotTex, transparent: true, opacity: 0, depthWrite: false, alphaTest: 0.2 });
    const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; wg.add(pts);
    const stir = () => { for (let i = 0; i < N; i++) { pp[i * 3] = X0 + 0.01 + Math.random() * (X1 - X0 - 0.02); pp[i * 3 + 1] = Y0 + Math.random() * (LEVEL - Y0 - 0.01); pp[i * 3 + 2] = ZW - 0.0005; vel[i] = 0.004 + Math.random() * 0.012; } };
    stir();
    const surf = [];
    for (let i = 0; i <= 30; i++) surf.push([X0 + (X1 - X0) * i / 30, LEVEL, ZW]);
    const level = k.line(surf, { width: 1.8, color: 0x3d5866, auto: false, opacity: 0.9 });
    // 吐纳的人
    const sitter = k.card({ w: 0.26, h: 0.26, x: -0.25, z: -0.12, delay: 0.4, draw: (g) => person(g, -0.03, 0, 0.27, { pose: 'sit', face: 1, w: 0.0045, lit: g.lit }) });
    const breath = k.line(Array.from({ length: 19 }, (_, i) => [i * 0.001, 0, 0]), { width: 1.6, color: 0x5a7380, auto: false, opacity: 0.7 });
    // 熊经鸟申
    const stretcher = k.card({ w: 0.2, h: 0.26, x: -0.02, z: -0.4, delay: 0.7, draw: (g) => {
      person(g, -0.02, 0, 0.23, { pose: 'arms', face: 1, w: 0.004, lit: g.lit });
      birdSide(g, 0.07, 0.2, 0.05);
    } });
    k.hot(sitter, 'qi'); k.hot(stretcher, 'qi');
    // 素帛：挂在架上的一条白绢
    const rack = k.card({ w: 0.18, h: 0.27, x: 0.27, z: -0.34, delay: 0.9, draw: (g) => {
      g.shape([[-0.075, 0], [-0.075, 0.24], [-0.065, 0.24], [-0.065, 0]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.4 });
      g.shape([[0.065, 0], [0.065, 0.24], [0.075, 0.24], [0.075, 0]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.4 });
      g.shape([[-0.088, 0.235], [-0.088, 0.25], [0.088, 0.25], [0.088, 0.235]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.5 });
      g.stroke([[-0.09, 0.0], [-0.05, 0.0]], 0.004); g.stroke([[0.05, 0.0], [0.09, 0.0]], 0.004);
    } });
    const SN = 16, SL = 0.19, SW = 0.055;
    const silkGeo = new THREE.PlaneGeometry(SW, SL, 2, SN); silkGeo.translate(0, -SL / 2, 0);
    const base = silkGeo.attributes.position.array.slice();
    const silkMat = new THREE.MeshStandardMaterial({ color: 0xfbf6ea, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0, emissive: 0xffe2b0, emissiveIntensity: 0 });
    const silk = new THREE.Mesh(silkGeo, silkMat); silk.castShadow = true;
    const silkG = k.group(); silkG.position.set(0.27, 0.237, -0.33); silkG.add(silk);
    const edge = k.line(Array.from({ length: (SN + 1) * 2 }, (_, i) => [0, -i * 0.001, 0]), { width: 1.2, auto: false, opacity: 0.6, parent: silkG });
    k.hot({ meshes: [silk], parts: [] }, 'su'); k.hot(rack, 'su');

    let stirAt = 0, qiAt = -9, suAt = -9;
    let turb = 1;
    return {
      hit(key) {
        if (key === 'shui') { stirAt = k.T; stir(); turb = 1; }
        if (key === 'qi') qiAt = k.T;
        if (key === 'su') suAt = k.T;
      },
      update(T, dt, F) {
        const show = k.rise(0.2);
        // 水：搅动后慢慢变清、变平
        turb = Math.max(0, turb - dt * 0.16);
        let settled = 0;
        for (let i = 0; i < N; i++) {
          const y = pp[i * 3 + 1];
          if (y > Y0 + 0.003) { pp[i * 3 + 1] = Math.max(Y0 + 0.002, y - vel[i] * dt * (0.5 + turb)); pp[i * 3] += Math.sin(T * 2 + i) * 0.003 * dt * turb * 10; }
          else settled++;
        }
        pGeo.attributes.position.needsUpdate = true;
        pMat.opacity = 0.85 * show;
        waterMat.opacity = 0.2 * show;
        mudMat.opacity = 0.32 * turb * show;
        const amp = 0.012 * Math.exp(-(T - stirAt) * 0.45);
        for (let i = 0; i <= 30; i++) surf[i][1] = LEVEL + amp * Math.sin(i * 0.9 - T * 7) * Math.sin(Math.PI * i / 30);
        level.set(surf); level.reveal = show;
        // 呼吸
        const qb = clamp(1 - (T - qiAt) / 4);
        const ph = Math.sin(T * (0.9 + qb * 0.4));
        sitter.hinge.scale.set(1, 1 + 0.012 * ph * (1 + qb), 1);
        const wisp = [];
        const exhale = clamp(ph * 1.2 + 0.15);
        const mx = -0.25 - 0.03 + 0.1 * 0.27, my = 0.585 * 0.27, mz = -0.118;
        for (let i = 0; i <= 18; i++) {
          const t = i / 18;
          wisp.push([mx + t * (0.05 + qb * 0.04) + Math.sin(t * 7 - T * 2.4) * 0.014 * t, my + 0.005 + t * (0.11 + qb * 0.06), mz]);
        }
        breath.set(wisp); breath.reveal = exhale * show;
        stretcher.hinge.rotation.z = Math.sin(T * 0.7) * (0.04 + qb * 0.1);
        // 白绢随风
        const gust = 0.3 + clamp(1 - (T - suAt) / 3) * 1.4;
        const p = silkGeo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const by = base[i * 3 + 1], t = -by / SL;
          p.setXYZ(i, base[i * 3] + Math.sin(T * 1.7 + t * 3) * 0.006 * t * gust, by, Math.sin(T * 3 - t * 5) * 0.018 * t * gust + t * t * 0.03 * gust);
        }
        p.needsUpdate = true; silkGeo.computeVertexNormals();
        silkMat.opacity = k.appear(1.4, 0.6);
        silk.visible = silkMat.opacity > 0.01;
        silkMat.emissiveIntensity = clamp(1 - (T - suAt) / 2) * 0.4;
        const e = [];
        for (let j = 0; j <= SN; j++) { const vi = j * 3 + 2; e.push([p.getX(vi), p.getY(vi), p.getZ(vi) + 0.001]); }
        for (let j = SN; j >= 0; j--) { const vi = j * 3; e.push([p.getX(vi), p.getY(vi), p.getZ(vi) + 0.001]); }
        edge.set(e); edge.reveal = silkMat.opacity;
      },
    };
  },
};

// —— 十六 · 缮性：倒置之民 ——
const ch16 = {
  ground(g) {
    for (const [x, y] of [[-0.1, 0.0], [0.12, 0.04], [0.05, -0.08]]) g.stroke(ellipsePts(x, y, 0.02, 0.008, 14), 0.0018, { alpha: 0.3 });
    g.stroke([[-0.44, 0.48], [0.44, 0.48]], 0.0018, { alpha: 0.25 });
  },
  build(k) {
    // 倒立的人：以腰为轴
    const H = 0.3;
    const fig = centered(k, { w: 0.18, h: H, x: 0.04, y: H / 2 + 0.005, z: -0.08, delay: 0.3, draw: (g) => person(g, 0, 0, 0.29, { pose: 'arms', face: 1, w: 0.0042, lit: g.lit, robe: WASH.water }) });
    k.hot(fig.sp, 'dao');
    // 绕着他打转的外物
    const things = [
      k.sprite({ w: 0.06, h: 0.06, delay: 0.7, pad: 0.006, draw: (g) => coin(g, 0, 0.03, 0.025, g.lit) }),
      k.sprite({ w: 0.06, h: 0.06, delay: 0.8, pad: 0.006, draw: (g) => coin(g, 0, 0.03, 0.022, g.lit) }),
      k.sprite({ w: 0.07, h: 0.05, delay: 0.9, pad: 0.006, draw: (g) => {
        g.shape([[-0.03, 0.005], [-0.022, 0.03], [-0.012, 0.022], [0.0, 0.04], [0.012, 0.022], [0.022, 0.03], [0.03, 0.005]], 0.003, { wash: WASH.ochre, washA: 0.6 });
      } }),
      k.sprite({ w: 0.06, h: 0.06, delay: 1.0, pad: 0.006, draw: (g) => { g.circle(0, 0.03, 0.024, 0.003, { wash: WASH.green, washA: 0.45 }); g.circle(0, 0.03, 0.008, 0.0025); } }),
    ];
    things.forEach(t => k.hot(t, 'dao'));
    // 恬：静坐的人
    const calm = k.card({ w: 0.24, h: 0.24, x: -0.3, z: 0.14, delay: 0.5, draw: (g) => {
      person(g, -0.04, 0, 0.24, { pose: 'sit', face: 1, w: 0.004, lit: g.lit });
      g.shape([[0.07, 0], [0.065, 0.025], [0.105, 0.025], [0.1, 0]], 0.003, { wash: WASH.ochre, washA: 0.4 });
      g.circle(0.07, 0.19, 0.025, 0.003, { wash: WASH.ochre, washA: 0.2 + 0.3 * g.lit });
    } });
    k.hot(calm, 'tian');
    const halo = k.line(circlePts(-0.33, 0.17, 0.145, 0.06, 48, 'z'), { width: 1.4, color: 0xb0432d, auto: false, opacity: 0.6 });
    // 轩冕：车与冠，偶然而来，寄而复去
    const cg = k.group(); cg.position.set(0.44, 0, -0.5);
    const cart = k.sprite({ w: 0.36, h: 0.2, delay: 0.2, parent: cg, pad: 0.008, draw: (g) => {
      horse(g, 0.1, 0.0, 0.18, g.lit);
      g.stroke([[-0.04, 0.06], [0.07, 0.085]], 0.0035);
      g.shape([[-0.15, 0.05], [-0.15, 0.11], [-0.03, 0.11], [-0.03, 0.05]], 0.0035, { smooth: false, wash: WASH.ochre, washA: 0.3 + 0.2 * g.lit });
      g.line(-0.09, 0.11, -0.09, 0.15, 0.003);
      g.shape([[-0.17, 0.15], [-0.12, 0.175], [-0.06, 0.175], [-0.01, 0.15]], 0.0035, { wash: WASH.verm, washA: 0.45 });
    } });
    const wheel = centered(k, { w: 0.08, h: 0.08, x: -0.09, y: 0.04, z: 0.002, parent: cg, delay: 0.25, pad: 0.004, draw: (g) => wheelDraw(g, 0, 0.04, 0.036, 0.003, g.lit, 10) });
    const crownS = k.sprite({ w: 0.12, h: 0.08, delay: 0.3, parent: cg, pad: 0.006, draw: (g) => crown(g, 0, 0.01, 0.09, g.lit) });
    crownS.obj.position.set(-0.09, 0.2, 0.003);
    k.hot(cart, 'xuan'); k.hot(crownS, 'xuan'); k.hot(wheel.sp, 'xuan');

    let daoAt = -99, tianAt = -9, xuanAt = -99;
    return {
      hit(key) {
        if (key === 'dao' && k.T - daoAt > 2) daoAt = k.T;
        if (key === 'tian') tianAt = k.T;
        if (key === 'xuan') xuanAt = k.T;
      },
      update(T, dt) {
        // 倒置 → 被点后翻正，外物落地；过一阵又被外物牵着倒过去
        const d = T - daoAt;
        const upright = d >= 0 ? (d < 8 ? smooth(win(d, 0, 1.4)) : 1 - smooth(win(d, 8, 10))) : 0;
        fig.G.rotation.z = Math.PI * (1 - upright) + Math.sin(T * 1.3) * 0.06 * (1 - upright);
        fig.G.position.y = H / 2 + 0.005 + Math.sin(T * 2.6) * 0.004 * (1 - upright);
        things.forEach((t, i) => {
          const a = T * 0.8 + i * Math.PI / 2;
          const orbitY = 0.16 + Math.sin(T * 1.5 + i) * 0.03;
          const fallY = 0.0;
          const y = lerp(orbitY, fallY, smooth(win(upright, 0, 0.6)));
          const r = lerp(0.15, 0.1 + i * 0.03, upright);
          t.obj.position.set(0.02 + Math.cos(a * (1 - upright * 0.95)) * r, y, -0.12 + Math.sin(a * (1 - upright * 0.95)) * r * 0.6);
          t.obj.rotation.z = (1 - upright) * Math.sin(T * 2 + i) * 0.4;
        });
        // 恬：一圈淡淡的光
        const tp = T - tianAt;
        if (tp > 0 && tp < 3) { halo.reveal = 1; halo.obj.scale.setScalar(1 + tp * 0.5); halo.mat.opacity *= 1 - tp / 3; }
        else halo.reveal = 0;
        halo.obj.position.set(-0.33 * (1 - halo.obj.scale.x), 0.17 * (1 - halo.obj.scale.x), 0.145 * (1 - halo.obj.scale.z));
        calm.hinge.scale.y = 1 + Math.sin(T * 0.6) * 0.006;
        // 轩冕：从右往左缓缓驶过
        const per = 13;
        const s = ((T - 1.0) % per + per) % per / per;
        const x = lerp(0.44, -0.44, s);
        cg.position.x = x;
        const vis = clamp((0.44 - Math.abs(x)) / 0.12);
        fade(cart, vis); fade(wheel.sp, vis);
        wheel.G.rotation.z = T * 2.2;
        const xp = T - xuanAt;
        const lift = xp > 0 && xp < 4 ? easeOut(xp / 3) : 0;
        crownS.obj.position.set(-0.09 + lift * 0.05, 0.2 + Math.sin(T * 2) * 0.008 + lift * 0.22, 0.003);
        crownS.obj.rotation.z = lift * 0.6;
        fade(crownS, vis * (1 - lift));
      },
    };
  },
};

// —— 十七 · 秋水：河伯望洋 ——
const ch17 = {
  ground(g) {
    // 一条由近而远、越来越宽的河
    const L = [], R = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = -0.2 + t * 0.62, cx = -0.18 + t * 0.12 + Math.sin(t * 4) * 0.04, hw = 0.06 + Math.pow(t, 2.2) * 0.42;
      L.push([cx - hw, y]); R.push([cx + hw, y]);
    }
    g.wash([...L, ...R.slice().reverse()], WASH.water, 0.12);
    g.stroke(L, 0.0025, { alpha: 0.5 }); g.stroke(R, 0.0025, { alpha: 0.5 });
    for (let i = 0; i < 9; i++) { const t = 0.1 + i * 0.09; const y = -0.2 + t * 0.62; const cx = -0.18 + t * 0.12 + Math.sin(t * 4) * 0.04; g.stroke([[cx - 0.03, y], [cx, y + 0.006], [cx + 0.03, y]], 0.0018, { alpha: 0.35 }); }
    g.text('河', -0.25, -0.12, 0.022, { color: 'rgba(40,34,30,.45)' });
    g.text('北 海', 0.36, 0.44, 0.022, { color: 'rgba(40,34,30,.45)' });
  },
  build(k) {
    const sea = (wl, amp, top, ph) => (g) => {
      const rect = [[-0.4, 0], [-0.4, top], [0.4, top], [0.4, 0]];
      g.paper(rect, { smooth: false });
      g.wash(rect, WASH.water, 0.15 + 0.3 * g.lit, { smooth: false });
      waveRows(g, -0.4, 0.4, top, 3, { wl, amp, gap: -0.022, phase: ph, w: 0.004 });
    };
    const seaB = k.card({ w: 0.84, h: 0.13, z: -0.55, delay: 0.1, draw: sea(0.12, 0.018, 0.095, 0) });
    const seaF = k.card({ w: 0.8, h: 0.09, z: -0.44, x: 0.03, delay: 0.25, draw: sea(0.09, 0.013, 0.06, 0.05) });
    k.hot(seaB, 'hebo');
    const hebo = k.card({ w: 0.13, h: 0.25, x: 0.3, z: -0.27, delay: 0.5, draw: (g) => {
      person(g, 0, 0, 0.24, { pose: 'stand', face: -1, w: 0.0042, hat: true, beard: true, robe: WASH.water, lit: g.lit });
    } });
    k.hot(hebo, 'hebo');
    // 井与蛙
    const well = k.card({ w: 0.16, h: 0.1, x: 0.31, z: 0.1, delay: 0.7, draw: (g) => {
      const top = 0.075;
      g.shape([[-0.07, 0], [-0.07, top], [0.07, top], [0.07, 0]], 0.004, { smooth: false, wash: WASH.ink, washA: 0.08 + 0.15 * g.lit });
      g.shape(ellipsePts(0, top, 0.07, 0.016, 30).slice(0, -1), 0.004, { wash: WASH.ink, washA: 0.12 });
      g.shape(ellipsePts(0, top, 0.052, 0.009, 30).slice(0, -1), 0.003, { fill: 'rgba(38,34,30,.8)' });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const x = -0.07 + c * 0.035 + (r % 2) * 0.0175, y = 0.012 + r * 0.022;
        g.stroke([[x, y], [x + 0.03, y]], 0.0018, { alpha: 0.5, smooth: false });
      }
    } });
    const frog = k.sprite({ w: 0.06, h: 0.045, delay: 1.0, pad: 0.005, draw: (g) => {
      g.shape([[-0.024, 0.0], [-0.026, 0.014], [-0.012, 0.028], [0.006, 0.032], [0.02, 0.026], [0.026, 0.012], [0.02, 0.0]], 0.0028, { wash: WASH.green, washA: 0.35 + 0.3 * g.lit });
      g.circle(0.012, 0.032, 0.006, 0.0022); g.dot(0.013, 0.033, 0.0025);
      g.stroke([[-0.018, 0.012], [-0.006, 0.006], [-0.016, 0.001]], 0.0022);
      g.stroke([[0.012, 0.012], [0.02, 0.002]], 0.002);
    } });
    frog.obj.position.set(0.3, 0.07, 0.105);
    k.hot(well, 'wa'); k.hot(frog, 'wa');
    // 濠梁与鱼
    const bridge = k.card({ w: 0.32, h: 0.13, x: -0.26, z: -0.02, delay: 0.8, draw: (g) => {
      const arch = ellipsePts(0, 0.0, 0.11, 0.065, 30, 0, Math.PI);
      g.fill([[-0.15, 0], [-0.15, 0.055], [-0.1, 0.07], [0.1, 0.07], [0.15, 0.055], [0.15, 0], [0.11, 0], ...arch, [-0.11, 0]], PAPER, { smooth: false });
      g.wash([[-0.15, 0], [-0.15, 0.055], [-0.1, 0.07], [0.1, 0.07], [0.15, 0.055], [0.15, 0], [0.11, 0], ...arch, [-0.11, 0]], WASH.ochre, 0.18 + 0.2 * g.lit, { smooth: false });
      g.stroke([[-0.155, 0.055], [-0.1, 0.072], [0.1, 0.072], [0.155, 0.055]], 0.004);
      g.stroke(arch, 0.0038);
      for (let i = 0; i < 7; i++) { const x = -0.09 + i * 0.03; g.line(x, 0.072, x, 0.088, 0.0022); }
      g.stroke([[-0.1, 0.088], [0.1, 0.088]], 0.0025);
      person(g, -0.04, 0.072, 0.06, { pose: 'point', face: 1, w: 0.0026 });
      person(g, 0.04, 0.072, 0.06, { pose: 'stand', face: -1, w: 0.0026, hat: true });
    } });
    const fishes = [0, 1].map(i => {
      const f = k.sprite({ w: 0.09, h: 0.04, delay: 1.1 + i * 0.15, pad: 0.004, draw: (g) => fish(g, 0, 0.02, 0.075, { w: 0.0028, lit: g.lit, dir: 1 }) });
      return f;
    });
    k.hot(bridge, 'yu'); fishes.forEach(f => k.hot(f, 'yu'));
    // 曳尾涂中的龟
    const tort = k.sprite({ w: 0.13, h: 0.06, delay: 1.2, pad: 0.005, draw: (g) => {
      g.shape([[-0.05, 0.008], [-0.045, 0.03], [-0.02, 0.048], [0.015, 0.048], [0.04, 0.032], [0.048, 0.008]], 0.0032, { wash: WASH.green, washA: 0.3 + 0.3 * g.lit });
      g.stroke([[-0.03, 0.03], [0.0, 0.04], [0.03, 0.03]], 0.0018); g.stroke([[-0.02, 0.012], [-0.01, 0.04]], 0.0018); g.stroke([[0.015, 0.012], [0.01, 0.042]], 0.0018);
      g.shape([[0.045, 0.012], [0.062, 0.022], [0.07, 0.016], [0.062, 0.006], [0.048, 0.006]], 0.0025);
      g.dot(0.064, 0.017, 0.002);
      g.stroke([[-0.05, 0.01], [-0.06, 0.006], [-0.064, 0.0]], 0.0025);
      g.stroke([[-0.03, 0.006], [-0.034, 0.0]], 0.003); g.stroke([[0.03, 0.006], [0.034, 0.0]], 0.003);
    } });
    const trail = k.line(Array.from({ length: 13 }, (_, i) => [i * 0.001, 0, 0]), { width: 1.4, auto: false, opacity: 0.5, dashed: true });
    k.hot(tort, 'gui');

    let heboAt = -9, waAt = -9, yuAt = -9, guiAt = -9, tx = 0.05;
    return {
      hit(key) {
        if (key === 'hebo') heboAt = k.T;
        if (key === 'wa') waAt = k.T;
        if (key === 'yu') yuAt = k.T;
        if (key === 'gui') guiAt = k.T;
      },
      update(T, dt) {
        const hb = clamp(1 - (T - heboAt) / 3.5);
        seaB.hinge.position.x = Math.sin(T * 0.6) * (0.01 + hb * 0.015);
        seaF.hinge.position.x = 0.03 + Math.sin(T * 0.6 + 1.7) * (0.012 + hb * 0.02);
        seaB.hinge.position.y = Math.abs(Math.sin(T * 1.2)) * hb * 0.015;
        hebo.lean = -0.28 * smooth(hb > 0 ? Math.sin(Math.PI * clamp((T - heboAt) / 3.5)) : 0);
        // 蛙
        const w = T - waAt;
        const j = w > 0 && w < 0.9 ? Math.sin(w / 0.9 * Math.PI) : 0;
        frog.obj.position.set(0.3 + (w > 0 && w < 0.9 ? Math.sin(w / 0.9 * Math.PI * 2) * 0.015 : 0), 0.07 + j * 0.07, 0.105);
        frog.obj.rotation.z = j * 0.4;
        // 鱼
        fishes.forEach((f, i) => {
          const ph = T * 0.35 + i * 1.7;
          const s = Math.sin(ph);
          const dir = Math.cos(ph) >= 0 ? 0 : Math.PI;
          let x = -0.27 + s * 0.13, y = 0.0, z = 0.07 + i * 0.03;
          const yp = T - yuAt - i * 0.4;
          if (yp > 0 && yp < 1) { y += Math.sin(yp * Math.PI) * 0.09; f.obj.rotation.z = Math.cos(yp * Math.PI) * 0.7 * (dir ? -1 : 1); }
          else f.obj.rotation.z = Math.sin(T * 3 + i) * 0.05;
          f.obj.position.set(x, y, z);
          f.obj.rotation.y = dir;
        });
        // 龟：慢慢地爬，尾巴在泥里拖出一道
        const gb = clamp(1 - (T - guiAt) / 3);
        tx += dt * (0.006 + gb * 0.03) * (Math.sin(T * 0.08) >= 0 ? 1 : -1);
        tx = clamp(tx, -0.04, 0.16);
        const tz = 0.15;
        tort.obj.position.set(tx, Math.abs(Math.sin(T * (3 + gb * 8))) * 0.004, tz);
        tort.obj.rotation.z = Math.sin(T * (3 + gb * 8)) * 0.04;
        tort.obj.rotation.y = Math.sin(T * 0.08) >= 0 ? 0 : Math.PI;
        const tp = [];
        for (let i = 0; i <= 12; i++) tp.push([tx - (Math.sin(T * 0.08) >= 0 ? 1 : -1) * (0.06 + i * 0.012), 0.001, tz + Math.sin(i * 0.9 + T) * 0.003]);
        trail.set(tp); trail.reveal = k.appear(1.4);
      },
    };
  },
};

// —— 十八 · 至乐：鼓盆而歌 ——
const ch18 = {
  ground(g) {
    g.stroke([[-0.44, -0.06], [0.44, -0.06]], 0.0018, { alpha: 0.25 });
    for (let i = 0; i < 8; i++) g.stroke([[-0.4 + i * 0.03, -0.1], [-0.395 + i * 0.03, -0.08]], 0.0018, { alpha: 0.3 });
  },
  build(k) {
    const tr = k.card({ w: 0.3, h: 0.32, x: -0.1, z: -0.56, delay: 0.1, draw: (g) => tree(g, 0, 0, 0.3, { seed: 6, lit: g.lit * 0.3 }) });
    const hui = k.card({ w: 0.14, h: 0.22, x: -0.34, z: -0.38, delay: 0.3, draw: (g) => person(g, 0, 0, 0.2, { pose: 'bow', face: 1, w: 0.004, hat: true }) });
    const zz = k.card({ w: 0.26, h: 0.2, x: -0.08, z: -0.2, delay: 0.5, draw: (g) => {
      person(g, -0.04, 0, 0.21, { pose: 'sit', face: 1, w: 0.0042, lit: g.lit });
      // 伸出的腿（箕踞）
      g.shape([[0.0, 0.0], [0.0, 0.025], [0.11, 0.022], [0.125, 0.03], [0.13, 0.0]], 0.0035, { wash: WASH.ochre, washA: 0.15 });
    } });
    // 鼓槌（随拍子起落）
    const stickG = k.group(); stickG.position.set(0.0, 0.085, -0.195);
    const stick = k.sprite({ w: 0.12, h: 0.02, delay: 0.7, parent: stickG, pad: 0.004, draw: (g) => {
      g.stroke([[-0.055, 0.01], [0.05, 0.01]], 0.0035, { smooth: false });
      g.circle(0.052, 0.01, 0.006, 0.0025, { wash: WASH.ochre, washA: 0.5 });
    } });
    stick.obj.position.set(0.055, -0.01, 0);
    const BX = 0.12, BZ = -0.1;
    const basin = k.card({ w: 0.17, h: 0.07, x: BX, z: BZ, delay: 0.6, draw: (g) => {
      const body = [[-0.075, 0.055], [-0.065, 0.02], [-0.04, 0.0], [0.04, 0.0], [0.065, 0.02], [0.075, 0.055]];
      g.shape([...body, [0.075, 0.06], [-0.075, 0.06]], 0.004, { wash: WASH.ochre, washA: 0.45 + 0.25 * g.lit });
      g.shape(ellipsePts(0, 0.058, 0.077, 0.01, 30).slice(0, -1), 0.0035, { wash: WASH.ochre, washA: 0.25 });
      g.stroke([[-0.06, 0.035], [-0.03, 0.03], [0, 0.034], [0.03, 0.03], [0.06, 0.035]], 0.0022, { color: VERM, alpha: 0.7 });
      for (let i = 0; i < 5; i++) g.stroke([[-0.04 + i * 0.02, 0.012], [-0.035 + i * 0.02, 0.02]], 0.0018, { alpha: 0.6 });
    } });
    k.hot(basin, 'pen'); k.hot(zz, 'pen');
    const rings = [0, 1, 2].map(() => k.line(circlePts(BX, 0.035, BZ + 0.0, 0.08, 56, 'y'), { width: 1.5, color: 0x8a5a36, auto: false, opacity: 0.7 }));
    // 四时之轮
    const post = k.card({ w: 0.08, h: 0.2, x: 0.25, z: -0.46, delay: 0.8, draw: (g) => {
      g.shape([[-0.006, 0], [-0.006, 0.19], [0.006, 0.19], [0.006, 0]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.4 });
      g.stroke([[-0.035, 0], [0.035, 0]], 0.004);
    } });
    const seasons = centered(k, { w: 0.22, h: 0.22, x: 0.25, y: 0.2, z: -0.452, delay: 0.9, pad: 0.006, draw: (g) => {
      const c = 0.11, R = 0.1;
      g.circle(0, c, R, 0.004, { wash: WASH.ochre, washA: 0.08 + 0.2 * g.lit });
      g.circle(0, c, 0.018, 0.003, { wash: WASH.ink, washA: 0.3 });
      const names = ['春', '夏', '秋', '冬'];
      const tint = [WASH.green, WASH.verm, WASH.ochre, WASH.water];
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 2 - i * Math.PI / 2;
        const a2 = a - Math.PI / 4;
        g.stroke([[Math.cos(a2) * 0.02, c + Math.sin(a2) * 0.02], [Math.cos(a2) * R, c + Math.sin(a2) * R]], 0.0025, { smooth: false });
        const sec = [[0, c], ...ellipsePts(0, c, R * 0.97, R * 0.97, 10, a - Math.PI / 4, a + Math.PI / 4)];
        g.wash(sec, tint[i], 0.15 + 0.3 * g.lit, { blur: 3 });
        g.text(names[i], Math.cos(a) * 0.062, c + Math.sin(a) * 0.062, 0.03, { color: INK });
      }
    } });
    k.hot(post, 'si'); k.hot(seasons.sp, 'si');
    // 路边的髑髅
    const skull = k.card({ w: 0.13, h: 0.075, x: -0.32, z: 0.12, delay: 1.1, draw: (g) => {
      g.shape([[-0.03, 0.005], [-0.035, 0.03], [-0.025, 0.055], [0.0, 0.065], [0.026, 0.056], [0.036, 0.032], [0.03, 0.012], [0.018, 0.005], [0.016, -0.0], [-0.016, 0.0]], 0.0032, { wash: WASH.ochre, washA: 0.12 + 0.3 * g.lit });
      g.shape(ellipsePts(-0.013, 0.03, 0.009, 0.008, 12).slice(0, -1), 0.002, { fill: 'rgba(38,34,30,.85)' });
      g.shape(ellipsePts(0.014, 0.03, 0.009, 0.008, 12).slice(0, -1), 0.002, { fill: 'rgba(38,34,30,.85)' });
      g.stroke([[0, 0.02], [-0.003, 0.012], [0.003, 0.012]], 0.0018);
      for (let i = 0; i < 4; i++) g.line(-0.009 + i * 0.006, 0.0, -0.009 + i * 0.006, 0.006, 0.0014);
      for (let i = 0; i < 9; i++) { const x = -0.06 + i * 0.015; g.stroke([[x, 0], [x + 0.004, 0.012 + (i % 3) * 0.006]], 0.0018); }
    } });
    const talk = k.sprite({ w: 0.1, h: 0.05, delay: 1.2, pad: 0.005, draw: (g) => { g.cloud(0, 0.024, 0.032, 0.0025); g.text('……', 0.004, 0.022, 0.016); } });
    talk.obj.position.set(-0.27, 0.08, 0.12);
    k.hot(skull, 'kulou');

    let penAt = -9, siAt = -9, kuAt = -9, lastBeat = -1, ang = 0;
    return {
      hit(key) {
        if (key === 'pen') penAt = k.T;
        if (key === 'si') siAt = k.T;
        if (key === 'kulou') kuAt = k.T;
      },
      update(T, dt) {
        const loud = T - penAt < 4.5 && T > penAt;
        const period = loud ? 0.55 : 1.15;
        const bt = T / period;
        const beat = Math.floor(bt), ph = bt - beat;
        if (beat !== lastBeat) {
          lastBeat = beat;
          if (loud) sfx.tap(beat % 4 === 0 ? 180 : 240, 0.35, 0.22);
        }
        // 鼓槌落下的一瞬
        stickG.rotation.z = -0.3 + (ph < 0.25 ? -0.3 * (1 - ph / 0.25) : 0.3 * Math.sin((ph - 0.25) / 0.75 * Math.PI) * 0.7);
        basin.hinge.position.y = ph < 0.12 ? (0.12 - ph) * 0.02 : 0;
        rings.forEach((r, i) => {
          const p = ((bt + i / 3) % 1);
          r.reveal = k.T > 1.2 ? 1 : 0;
          r.obj.scale.set(1 + p * (loud ? 2.6 : 1.8), 1, 1 + p * (loud ? 2.6 : 1.8));
          r.obj.position.set(BX * (1 - r.obj.scale.x), 0, BZ * (1 - r.obj.scale.z));
          r.mat.opacity *= (1 - p) * (loud ? 1 : 0.6);
        });
        // 四时
        const sb = clamp(1 - (T - siAt) / 2.5);
        ang += dt * (0.25 + sb * 2.2);
        seasons.G.rotation.z = -ang;
        // 髑髅
        const kp = T - kuAt;
        const act = kp > 0 && kp < 3;
        skull.hinge.position.y = act ? Math.abs(Math.sin(kp * 8)) * 0.012 * (1 - kp / 3) : 0;
        fade(talk, act ? Math.sin(Math.PI * clamp(kp / 3)) : 0);
        talk.obj.position.y = 0.08 + (act ? kp * 0.01 : 0);
        hui.hinge.rotation.z = Math.sin(T * 0.5) * 0.015;
        tr.hinge.rotation.z = Math.sin(T * 0.4) * 0.01;
      },
    };
  },
};

// —— 十九 · 达生：呆若木鸡 / 佝偻承蜩 ——
const ch19 = {
  ground(g) {
    const r = ellipsePts(0.04, 0.03, 0.34, 0.1, 60);
    for (let i = 0; i < r.length - 1; i += 2) g.stroke([r[i], r[i + 1]], 0.002, { smooth: false, alpha: 0.3 });
  },
  build(k) {
    const tr = k.card({ w: 0.4, h: 0.38, x: 0.02, z: -0.42, delay: 0.1, draw: (g) => tree(g, 0, 0, 0.36, { seed: 11, lit: g.lit * 0.4 }) });
    const cicadas = [[-0.07, 0.28], [0.11, 0.3]].map(([x, y], i) => {
      const c = k.sprite({ w: 0.04, h: 0.05, delay: 0.9 + i * 0.1, pad: 0.004, draw: (g) => cicada(g, 0, 0.003, 0.038, { lit: g.lit }) });
      c.obj.position.set(x, y, -0.405);
      c.home = [x, y, -0.405];
      return c;
    });
    k.hot(tr, 'tiao'); cicadas.forEach(c => k.hot(c, 'tiao'));
    const hunch = k.card({ w: 0.2, h: 0.21, x: -0.3, z: -0.26, delay: 0.4, draw: (g) => person(g, -0.02, 0, 0.21, { pose: 'bow', face: 1, w: 0.004, lit: g.lit, beard: true }) });
    k.hot(hunch, 'shen');
    const HAND = [-0.3 - 0.02 + 0.212 * 0.21, 0.399 * 0.21, -0.255];
    const pole = k.line([HAND, [-0.1, 0.3, -0.5]], { width: 2.2, color: 0x5a4630, auto: false, opacity: 1 });
    // 木鸡与斗鸡
    const wood = k.card({ w: 0.18, h: 0.18, x: 0.05, z: -0.06, delay: 0.6, draw: (g) => rooster(g, 0, 0.012, 0.16, { wood: true, lit: g.lit }) });
    k.hot(wood, 'ji');
    const cocks = [-1, 1].map((side, i) => {
      const c = k.sprite({ w: 0.15, h: 0.14, delay: 1.0 + i * 0.2, pad: 0.006, draw: (g) => rooster(g, 0, 0.004, 0.13, { lit: g.lit }) });
      c.side = side;
      c.t = i * 2.2;
      return c;
    });

    let tiaoAt = -99, shenAt = -99, jiAt = -9;
    return {
      hit(key) {
        if (key === 'tiao' && k.T - tiaoAt > 4.5) tiaoAt = k.T;
        if (key === 'shen') shenAt = k.T;
        if (key === 'ji') jiAt = k.T;
      },
      update(T, dt) {
        // 凝神：周围的一切慢慢静下来
        const sp = T - shenAt;
        const calm = sp > 0 && sp < 6 ? (sp < 1 ? smooth(sp) : sp > 5 ? 1 - smooth(sp - 5) : 1) : 0;
        const live = 1 - calm;
        const jb = clamp(1 - (T - jiAt) / 2);
        // 斗鸡：逼近、迟疑、掉头逃走
        cocks.forEach((c) => {
          c.t += dt * live * (1 + jb * 0.8);
          const P = 9, s = c.t % P;
          const sd = c.side;
          let x, face, alpha = 1, bob = 0;
          const far = 0.36, near = 0.16;
          if (s < 4) { const t = s / 4; x = lerp(far, near, easeInOut(t)); face = -sd; bob = Math.abs(Math.sin(c.t * 7)) * 0.012; alpha = clamp(t * 4); }
          else if (s < 5) { x = near + Math.sin((s - 4) * 25) * 0.004 * live; face = -sd; }
          else if (s < 6.4) { const t = (s - 5) / 1.4; x = lerp(near, far + 0.05, easeOut(t)); face = sd; bob = Math.abs(Math.sin(c.t * 14)) * 0.02; alpha = 1 - clamp((t - 0.6) / 0.4); }
          else { x = far; face = -sd; alpha = 0; }
          c.obj.position.set(0.05 + sd * x, bob * live, -0.02 + (sd > 0 ? 0.04 : 0));
          // 画面上的鸡朝右；翻转背面就朝左
          c.obj.rotation.y = face > 0 ? 0 : Math.PI;
          c.obj.rotation.z = (s >= 4 && s < 5 ? -0.12 : 0) * live;
          fade(c, alpha);
        });
        wood.hinge.rotation.z = jb * Math.sin(T * 30) * 0.0;   // 木鸡纹丝不动
        tr.hinge.rotation.z = Math.sin(T * 0.6) * 0.012 * live;
        // 承蜩：竹竿伸向蝉，粘住，收回
        const tp = T - tiaoAt;
        const target = cicadas[0];
        let tip = [-0.12 + Math.sin(T * 0.7) * 0.02 * live, 0.26 + Math.sin(T * 0.9) * 0.012 * live, -0.38];
        cicadas[1].obj.position.y = cicadas[1].home[1];
        if (tp > 0 && tp < 4.5) {
          const h = target.home;
          const near = [h[0] - 0.005, h[1] + 0.015, h[2] + 0.01];
          if (tp < 1.0) tip = tip.map((v, i) => lerp(v, near[i], easeInOut(tp)));
          else if (tp < 1.3) tip = near;
          else if (tp < 3.0) { const t = easeInOut((tp - 1.3) / 1.7); const back = [-0.18, 0.16, -0.32]; tip = near.map((v, i) => lerp(v, back[i], t)); }
          else tip = [-0.18, 0.16, -0.32];
          if (tp >= 1.15) { target.obj.position.set(tip[0], tip[1] - 0.03, tip[2] + 0.004); fade(target, tp > 3 ? 1 - clamp((tp - 3) / 0.6) : 1); }
          else target.obj.position.set(...h);
        } else {
          target.obj.position.set(...target.home);
          if (tp >= 4.5 && tp < 5.5) fade(target, tp - 4.5);
        }
        pole.set([HAND, tip]);
        pole.reveal = k.appear(0.9);
        hunch.hinge.rotation.z = Math.sin(T * 0.8) * 0.01 * live;
      },
    };
  },
};

export const scenes = {
  ch14: framed(ch14, { s: 1.08, sz: 0.8, dz: 0.06 }),
  ch15: framed(ch15, { s: 1.22, sz: 0.72, dz: 0.12 }),
  ch16: framed(ch16, { s: 1.12, sz: 0.75, dz: 0.1 }),
  ch17: framed(ch17, { s: 1.05, sz: 0.78, dz: 0.08 }),
  ch18: framed(ch18, { s: 1.12, sz: 0.75, dz: 0.1 }),
  ch19: framed(ch19, { s: 1.1, sz: 0.75, dz: 0.1 }),
};
