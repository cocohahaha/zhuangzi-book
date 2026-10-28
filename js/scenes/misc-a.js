// 外篇末与杂篇插图：山木、田子方、知北游、庚桑楚、徐无鬼、则阳、外物
import { WASH, VERM, INK, PAPER, FONTS, smoothPts, ellipsePts } from '../ink.js';
import { person, fish, mountains, waveRows } from '../art.js';
import { clamp, lerp, smooth, win, easeOut } from '../util.js';

const TAU = Math.PI * 2;
const fade = (it, f) => { for (const p of (it.parts || [it])) { p.mat.opacity *= f; p.mesh.visible = p.mat.opacity > 0.01; } };
const both = (...its) => ({ meshes: its.flatMap(i => i.meshes || [i.mesh]), parts: its.flatMap(i => i.parts || [i]) });
const pulseT = (T, t0, d) => { const t = T - t0; return t > 0 && t < d ? Math.sin(t / d * Math.PI) : 0; };

// 有粗细的肢体：沿折线画出纸色的轮廓
function limb(g, pts, t, w, o = {}) {
  const P = smoothPts(pts, 5);
  const L = [], R = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    const u = i / (P.length - 1);
    const tt = t * (1 - (o.taper ?? 0.35) * u) / 2;
    L.push([P[i][0] - dy * tt, P[i][1] + dx * tt]);
    R.push([P[i][0] + dy * tt, P[i][1] - dx * tt]);
  }
  g.shape([...L, ...R.reverse()], w, { smooth: false, wash: o.wash, washA: o.washA || 0, fill: o.fill });
}

// 一条弧线上的点（三维）
function arcPts(a, b, lift, n = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * lift, lerp(a[2], b[2], t)]);
  }
  return out;
}
const blankPts = (n = 14) => Array.from({ length: n }, (_, i) => [i * 0.001, 0, 0]);

// —— 小动物与器物 ——
function cicada(g, x, y, L, { dir = -1, w = 0.0026, lit = 0 } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * L * dir, y + b * L]);
  g.shape(P(ellipsePts(0, 0.2, 0.3, 0.13, 24).slice(0, -1)), w, { wash: WASH.ochre, washA: 0.25 + 0.4 * lit });
  g.circle(x + 0.33 * L * dir, y + 0.22 * L, 0.11 * L, w);
  g.dot(x + 0.38 * L * dir, y + 0.27 * L, 0.03 * L);
  for (const lg of [[[0.15, 0.1], [0.22, 0.0]], [[0.0, 0.08], [0.02, 0.0]], [[-0.12, 0.09], [-0.18, 0.0]]]) g.stroke(P(lg), w * 0.7);
  // 收拢的透明翅膀
  g.shape(P([[0.16, 0.34], [-0.2, 0.42], [-0.72, 0.24], [-0.66, 0.13], [-0.1, 0.18]]), w, { fill: 'rgba(247,240,226,.72)', wash: WASH.green, washA: 0.1 + 0.3 * lit });
  g.stroke(P([[0.08, 0.31], [-0.62, 0.2]]), w * 0.45, { alpha: 0.6 });
  g.stroke(P([[-0.15, 0.36], [-0.4, 0.26]]), w * 0.45, { alpha: 0.6 });
}

function mantis(g, x, y, L, { dir = -1, w = 0.0026, lit = 0 } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * L * dir, y + b * L]);
  const o = { wash: WASH.green, washA: 0.25 + 0.4 * lit };
  for (const lg of [[[0.02, 0.26], [0.06, 0.12], [0.13, 0.0]], [[-0.06, 0.25], [-0.12, 0.1], [-0.2, 0.0]], [[-0.16, 0.24], [-0.32, 0.12], [-0.4, 0.0]]]) g.stroke(P(lg), w * 0.75);
  g.shape(P([[0.04, 0.3], [-0.2, 0.36], [-0.56, 0.28], [-0.64, 0.21], [-0.5, 0.17], [-0.16, 0.21], [0.04, 0.24]]), w, o);
  g.stroke(P([[-0.05, 0.31], [-0.55, 0.23]]), w * 0.45, { alpha: 0.6 });
  limb(g, P([[0.0, 0.27], [0.16, 0.42], [0.28, 0.56]]), 0.06 * L, w, { ...o, taper: 0.25 });
  g.shape(P([[0.25, 0.56], [0.36, 0.67], [0.44, 0.58], [0.34, 0.52]]), w, o);
  g.dot(x + 0.36 * L * dir, y + 0.6 * L, 0.018 * L);
  g.stroke(P([[0.37, 0.66], [0.5, 0.8], [0.62, 0.84]]), w * 0.5);
  g.stroke(P([[0.35, 0.66], [0.44, 0.84], [0.5, 0.92]]), w * 0.5);
  // 举起的“刀臂”
  limb(g, P([[0.2, 0.47], [0.36, 0.38], [0.44, 0.36]]), 0.045 * L, w, { ...o, taper: 0.2 });
  limb(g, P([[0.44, 0.36], [0.4, 0.48], [0.36, 0.58]]), 0.035 * L, w, { ...o, taper: 0.5 });
}

function magpie(g, x, y, L, { dir = -1, w = 0.003, lit = 0 } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * L * dir, y + b * L]);
  const dark = 'rgba(52,46,40,.9)';
  g.shape(P([[-0.22, 0.33], [-0.72, 0.42], [-0.76, 0.35], [-0.22, 0.27]]), w, { fill: dark });
  // 宽大的翅膀（异鹊“翼广七尺”）
  g.shape(P([[0.12, 0.38], [0.02, 0.6], [-0.14, 0.84], [-0.27, 0.92], [-0.3, 0.82], [-0.24, 0.6], [-0.12, 0.39]]), w, { wash: WASH.ink, washA: 0.25 + 0.2 * lit });
  for (let i = 0; i < 4; i++) g.stroke(P([[-0.02 - i * 0.05, 0.5 + i * 0.07], [-0.12 - i * 0.05, 0.62 + i * 0.08]]), w * 0.5, { alpha: 0.7 });
  g.shape(P([[0.3, 0.32], [0.2, 0.41], [-0.05, 0.41], [-0.25, 0.33], [-0.2, 0.24], [0.05, 0.22], [0.25, 0.25]]), w, { wash: WASH.verm, washA: 0.35 * lit });
  g.fill(P([[0.2, 0.41], [-0.05, 0.41], [-0.25, 0.33], [0.0, 0.34]]), dark);
  g.circle(x + 0.32 * L * dir, y + 0.37 * L, 0.085 * L, w, { fill: dark });
  // “目大运寸”
  g.circle(x + 0.34 * L * dir, y + 0.39 * L, 0.04 * L, w * 0.7);
  g.dot(x + 0.35 * L * dir, y + 0.39 * L, 0.018 * L);
  g.shape(P([[0.39, 0.38], [0.5, 0.35], [0.39, 0.33]]), w * 0.8, { smooth: false });
  g.stroke(P([[0.0, 0.23], [0.02, 0.13], [0.06, 0.1]]), w * 0.6);
}

function horse(g, x, y, L, { dir = 1, w = 0.003, lit = 0 } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * L * dir, y + b * L]);
  const o = { wash: WASH.water, washA: 0.12 + 0.25 * lit };
  const leg = (pts) => limb(g, P(pts), 0.06 * L, w, { ...o, taper: 0.45 });
  leg([[-0.2, 0.44], [-0.36, 0.2], [-0.44, 0.1]]);
  leg([[0.22, 0.44], [0.42, 0.24], [0.48, 0.14]]);
  // 鬃尾
  for (let i = 0; i < 4; i++) g.stroke(P([[-0.34, 0.62 - i * 0.02], [-0.55, 0.68 - i * 0.03], [-0.7 + i * 0.02, 0.6 - i * 0.04]]), w * 0.8, { taper: [0.05, 0.6] });
  g.shape(P([[0.32, 0.56], [0.26, 0.68], [0.0, 0.7], [-0.26, 0.68], [-0.37, 0.6], [-0.34, 0.45], [-0.2, 0.4], [0.1, 0.41], [0.3, 0.44]]), w, o);
  g.shape(P([[0.22, 0.66], [0.36, 0.86], [0.45, 0.94], [0.58, 0.88], [0.62, 0.8], [0.52, 0.79], [0.42, 0.72], [0.34, 0.52]]), w, o);
  for (let i = 0; i < 4; i++) g.stroke(P([[0.3 + i * 0.03, 0.72 + i * 0.05], [0.22 + i * 0.03, 0.78 + i * 0.05]]), w * 0.6);
  // 腹部与腿根的线，让缝里只露一截时也认得出
  g.stroke(P([[-0.28, 0.5], [-0.1, 0.44], [0.12, 0.45], [0.26, 0.5]]), w * 0.5, { alpha: 0.7 });
  g.stroke(P([[-0.22, 0.62], [-0.18, 0.5]]), w * 0.5, { alpha: 0.6 }); g.stroke(P([[0.18, 0.62], [0.2, 0.5]]), w * 0.5, { alpha: 0.6 });
  for (let i = 0; i < 5; i++) g.stroke(P([[-0.15 + i * 0.07, 0.66], [-0.17 + i * 0.07, 0.56]]), w * 0.35, { alpha: 0.5 });
  g.dot(x + 0.5 * L * dir, y + 0.88 * L, 0.012 * L);
  g.stroke(P([[0.45, 0.94], [0.46, 1.0]]), w * 0.8);
  leg([[0.26, 0.45], [0.48, 0.3], [0.62, 0.26]]);
  leg([[-0.26, 0.46], [-0.46, 0.28], [-0.62, 0.26]]);
}

function ants(g, n, x0, gap, s, w = 0.0018) {
  for (let i = 0; i < n; i++) {
    const x = x0 + i * gap, y = s * 0.6;
    g.dot(x + s * 0.9, y + s * 0.1, s * 0.3);
    g.dot(x + s * 0.3, y, s * 0.25);
    g.dot(x - s * 0.5, y + s * 0.05, s * 0.4);
    for (const k of [-0.6, 0.2, 0.9]) {
      g.stroke([[x + s * k * 0.5, y], [x + s * (k * 0.5 - 0.3), 0]], w, { smooth: false, taper: [0.1, 0.1] });
      g.stroke([[x + s * k * 0.5, y], [x + s * (k * 0.5 + 0.3), 0]], w, { smooth: false, taper: [0.1, 0.1] });
    }
    g.stroke([[x + s * 1.1, y + s * 0.2], [x + s * 1.5, y + s * 0.7]], w * 0.8, { smooth: false });
  }
}

function soundArcs(g, x, y, s, dir = 1) {
  for (let i = 1; i <= 3; i++) g.stroke(ellipsePts(x, y, s * i * 0.33, s * i * 0.4, 12, dir > 0 ? -0.8 : Math.PI - 0.8, dir > 0 ? 0.8 : Math.PI + 0.8), 0.0025, { color: VERM });
}

// —— 二十 · 山木：螳螂捕蝉，异鹊在后 ——
const ch20 = {
  ground(g) {
    for (let i = 0; i < 9; i++) g.stroke([[-0.4 + i * 0.05, -0.05 - (i % 3) * 0.02], [-0.395 + i * 0.05, -0.03 - (i % 3) * 0.02]], 0.0016, { alpha: 0.35 });
    g.text('雕陵之樊', -0.37, -0.2, 0.022, { color: 'rgba(40,34,30,.4)' });
    // 落在地上的栗苞与叶
    for (const [x, y] of [[-0.25, -0.12], [-0.05, -0.17], [0.1, -0.1]]) { g.circle(x, y, 0.012, 0.0018, { fill: 'rgba(196,150,84,.25)' }); for (let a = 0; a < TAU; a += 0.7) g.line(x + Math.cos(a) * 0.012, y + Math.sin(a) * 0.012, x + Math.cos(a) * 0.019, y + Math.sin(a) * 0.019, 0.0011, { alpha: 0.5 }); }
    for (const [x, y, a] of [[-0.15, -0.08, 0.4], [0.02, -0.21, -0.6]]) g.stroke([[x, y], [x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05]], 0.006, { alpha: 0.2 });
  },
  build(k) {
    // 栗树：从左边斜伸出来的一根枝
    const BY = (lx) => 0.2 + 0.03 * Math.sin((lx + 0.25) * 4) - (lx + 0.25) * 0.05;
    const TX = -0.1, TZ = -0.14;
    const treeC = k.card({ w: 0.7, h: 0.36, x: TX, z: TZ, delay: 0.1, draw: (g) => {
      const leaf = (cx, cy, a, s) => {
        const pts = [];
        for (let i = 0; i <= 16; i++) { const t = i / 16, r = Math.sin(t * Math.PI) * s * 0.3; pts.push([t * s, r]); }
        for (let i = 16; i >= 0; i--) { const t = i / 16, r = Math.sin(t * Math.PI) * s * 0.3; pts.push([t * s, -r]); }
        const R2 = pts.map(([u, v]) => [cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)]);
        g.shape(R2, 0.0028, { wash: WASH.green, washA: 0.22 + 0.3 * g.lit });
        g.stroke([[cx, cy], [cx + Math.cos(a) * s * 0.9, cy + Math.sin(a) * s * 0.9]], 0.0018, { alpha: 0.7 });
        for (let k2 = 1; k2 < 4; k2++) { const u = s * k2 / 4.2; const bx2 = cx + Math.cos(a) * u, by2 = cy + Math.sin(a) * u; g.stroke([[bx2, by2], [bx2 + Math.cos(a + 0.7) * s * 0.12, by2 + Math.sin(a + 0.7) * s * 0.12]], 0.0012, { alpha: 0.5 }); }
      };
      limb(g, [[-0.33, 0.0], [-0.3, 0.1], [-0.27, 0.2], [-0.29, 0.34]], 0.05, 0.0045, { wash: WASH.ochre, washA: 0.3, taper: 0.4 });
      const br = []; for (let x = -0.28; x <= 0.32; x += 0.04) br.push([x, BY(x)]);
      limb(g, br, 0.026, 0.004, { wash: WASH.ochre, washA: 0.3, taper: 0.7 });
      for (let i = 0; i < 6; i++) { const x = -0.2 + i * 0.09; g.stroke([[x, BY(x) - 0.004], [x + 0.012, BY(x) - 0.007]], 0.0012, { alpha: 0.6 }); }
      g.stroke([[0.02, BY(0.02)], [0.07, 0.28], [0.13, 0.32]], 0.0035);
      g.stroke([[-0.16, BY(-0.16)], [-0.15, 0.27], [-0.1, 0.32]], 0.0035);
      // 蝉头顶的“美荫”
      leaf(-0.21, 0.31, -0.45, 0.12); leaf(-0.12, 0.33, -0.15, 0.11); leaf(-0.1, 0.32, 0.5, 0.09);
      leaf(0.13, 0.32, 0.35, 0.1); leaf(0.06, 0.27, -0.25, 0.09); leaf(0.22, 0.2, -0.5, 0.08); leaf(-0.28, 0.33, 1.2, 0.08);
      for (const [cx, cy] of [[0.16, 0.28], [-0.04, 0.31]]) {
        g.circle(cx, cy, 0.016, 0.0025, { wash: WASH.ochre, washA: 0.4 });
        for (let a = 0; a < TAU; a += 0.5) g.line(cx + Math.cos(a) * 0.016, cy + Math.sin(a) * 0.016, cx + Math.cos(a) * 0.025, cy + Math.sin(a) * 0.025, 0.0013);
      }
    } });
    const bx = (lx) => TX + lx;
    const CX = -0.17, MX = 0.05;
    const cic = k.sprite({ w: 0.14, h: 0.07, delay: 0.5, pad: 0.008, draw: (g) => cicada(g, 0, 0.0, 0.13, { lit: g.lit, w: 0.0032 }) });
    cic.obj.position.set(bx(CX), BY(CX) + 0.008, TZ + 0.012);
    const man = k.sprite({ w: 0.2, h: 0.19, delay: 0.7, pad: 0.008, draw: (g) => mantis(g, 0, 0, 0.19, { lit: g.lit, w: 0.0032 }) });
    man.obj.position.set(bx(MX), BY(MX) + 0.006, TZ + 0.014);
    const mag = k.sprite({ w: 0.26, h: 0.2, delay: 0.9, pad: 0.008, draw: (g) => magpie(g, 0, -0.04, 0.24, { lit: g.lit }) });
    mag.obj.position.set(0.16, 0.36, -0.19);
    // 庄周举弹
    const S = 0.3, ZX = 0.31, ZZ = 0.12;
    const zhou = k.card({ w: 0.2, h: 0.34, x: ZX, z: ZZ, delay: 1.1, draw: (g) => {
      person(g, 0.03, 0, S, { pose: 'arms', face: -1, w: 0.0045, lit: g.lit });
      const hx = 0.03 - 0.34 * S, hy = 0.83 * S;
      g.stroke([[hx, hy], [hx - 0.008, hy + 0.03]], 0.004);
      g.stroke([[hx - 0.008, hy + 0.03], [hx - 0.026, hy + 0.055]], 0.0035);
      g.stroke([[hx - 0.008, hy + 0.03], [hx + 0.008, hy + 0.058]], 0.0035);
      g.stroke([[hx - 0.026, hy + 0.055], [0.03 - 0.1 * S, 0.86 * S], [hx + 0.008, hy + 0.058]], 0.0016, { color: VERM, smooth: false });
    } });
    const walker = k.sprite({ w: 0.16, h: 0.3, delay: 0, draw: (g) => person(g, 0, 0, 0.28, { pose: 'walk', face: 1, w: 0.0045 }) });
    walker.obj.position.set(ZX, 0, ZZ + 0.02);
    const dropped = k.sprite({ w: 0.06, h: 0.03, delay: 0, pad: 0.006, draw: (g) => {
      g.stroke([[-0.02, 0.008], [0.01, 0.01]], 0.0035); g.stroke([[0.01, 0.01], [0.025, 0.022]], 0.003); g.stroke([[0.01, 0.01], [0.028, 0.002]], 0.003);
    } });
    dropped.obj.position.set(ZX - 0.08, 0, ZZ + 0.03);
    k.hot(cic, 'chan'); k.hot(man, 'tang'); k.hot(mag, 'que'); k.hot(zhou, 'zhou');
    const song = k.sprite({ w: 0.08, h: 0.06, delay: 0, pad: 0.006, draw: (g) => soundArcs(g, -0.02, 0.03, 0.05, -1) });
    // 目光
    const gaze = { tang: k.line(blankPts(), { width: 1.4, dashed: true, auto: false, opacity: 0.8, color: 0xb0432d }), que: k.line(blankPts(), { width: 1.4, dashed: true, auto: false, opacity: 0.8, color: 0xb0432d }), zhou: k.line(blankPts(), { width: 1.4, dashed: true, auto: false, opacity: 0.8, color: 0xb0432d }) };
    const gt = { tang: -9, que: -9, zhou: -9 };
    let chanT = -9, leaveT = -99;
    return {
      hit(key) {
        if (key === 'chan') chanT = k.T;
        else if (key === 'zhou') { gt.zhou = k.T; if (k.T - leaveT > 9) leaveT = k.T + 1.4; }
        else gt[key] = k.T;
      },
      update(T) {
        const lt = T - leaveT;                              // 庄周离开后的时间
        const relax = lt > 0 && lt < 8 ? smooth(win(lt, 0, 1.2)) * (1 - smooth(win(lt, 6.5, 8))) : 0;
        const creep = (ph) => (0.5 - 0.5 * Math.cos(T * 0.45 + ph)) * (1 - relax);
        cic.obj.position.x = bx(CX);
        cic.obj.rotation.z = Math.sin(T * 9) * 0.02 * (pulseT(T, chanT, 2.5) > 0 ? 1 : 0);
        const mx = MX - creep(0) * 0.06 + relax * 0.04;
        man.obj.position.x = bx(mx);
        man.obj.position.y = BY(mx) + 0.006;
        mag.obj.position.set(0.16 - creep(1.2) * 0.07 + relax * 0.1, 0.36 + Math.sin(T * 1.7) * 0.012 + relax * 0.06, -0.19);
        mag.obj.rotation.z = Math.sin(T * 1.7) * 0.05;
        // 蝉鸣
        song.obj.position.set(cic.obj.position.x - 0.06, cic.obj.position.y + 0.02, TZ + 0.014);
        fade(song, Math.max(pulseT(T, chanT, 2.5), 0.0) * (0.6 + 0.4 * Math.sin(T * 14)));
        // 庄周：举弹 → 扔下离开
        const zA = lt > 0 && lt < 8 ? 1 - smooth(win(lt, 0, 0.4)) + smooth(win(lt, 7, 8)) : 1;
        fade(zhou, clamp(zA));
        const wA = lt > 0 && lt < 6 ? smooth(win(lt, 0.2, 0.6)) * (1 - smooth(win(lt, 4.5, 6))) : 0;
        walker.obj.position.x = ZX + (lt > 0 ? Math.min(lt, 6) * 0.04 : 0);
        fade(walker, wA);
        fade(dropped, lt > 0 && lt < 8 ? smooth(win(lt, 0, 0.3)) * (1 - smooth(win(lt, 6.5, 8))) : 0);
        // 目光：捕食者 → 猎物
        const cp = cic.obj.position, mp = man.obj.position, gp = mag.obj.position;
        const ends = {
          tang: [[mp.x - 0.075, mp.y + 0.115, mp.z + 0.002], [cp.x, cp.y + 0.04, cp.z + 0.002]],
          que: [[gp.x - 0.08, gp.y + 0.05, gp.z], [mp.x, mp.y + 0.12, mp.z]],
          zhou: [[ZX - 0.08, 0.28, ZZ + 0.01], [gp.x + 0.03, gp.y + 0.05, gp.z]],
        };
        for (const key of Object.keys(gaze)) {
          const t = T - gt[key];
          const ln = gaze[key];
          ln.reveal = t > 0 && t < 6 ? easeOut(win(t, 0, 0.7)) : 0;
          ln.opacity = 0.8 * (1 - smooth(win(t, 4.5, 6)));
          if (ln.reveal > 0) ln.set(arcPts(...ends[key], 0.03));
        }
      },
    };
  },
};

// —— 二十一 · 田子方：杯水在肘的射箭；临渊的伯昏无人 ——
const ch21 = {
  ground(g) {
    // 深渊：一片向下的排线
    for (let i = 0; i < 10; i++) {
      const x = 0.37 + i * 0.009;
      g.stroke([[x - 0.05, 0.14 - (i % 3) * 0.01], [x - 0.046, -0.06 + (i % 4) * 0.01]], 0.0016, { alpha: 0.18 + (i % 2) * 0.08 });
    }
    g.text('百仞之渊', 0.37, -0.1, 0.02, { color: 'rgba(40,34,30,.45)' });
  },
  build(k) {
    // 悬崖
    const cliff = k.card({ w: 0.36, h: 0.38, x: 0.16, z: -0.14, delay: 0.1, draw: (g) => {
      const body = [[-0.17, 0.0], [-0.16, 0.12], [-0.13, 0.22], [-0.15, 0.3], [-0.1, 0.345], [0.0, 0.35], [0.08, 0.345], [0.125, 0.335], [0.11, 0.27], [0.12, 0.2], [0.095, 0.12], [0.11, 0.05], [0.1, 0.0]];
      g.shape(body, 0.005, { wash: WASH.ink, washA: 0.08 + 0.25 * g.lit });
      // 皴
      for (let i = 0; i < 9; i++) {
        const x = -0.12 + (i % 5) * 0.05, y = 0.04 + Math.floor(i / 2) * 0.07;
        g.stroke([[x, y + 0.04], [x + 0.02, y], [x + 0.045, y - 0.01]], 0.0025, { alpha: 0.6 });
      }
      for (let y = 0.05; y < 0.33; y += 0.045) g.stroke([[0.1, y], [0.075, y + 0.02]], 0.0022, { alpha: 0.7 });
      // 崖边一株斜松
      g.stroke([[0.11, 0.24], [0.15, 0.27], [0.17, 0.3]], 0.004);
      g.shape(ellipsePts(0.175, 0.31, 0.03, 0.012, 14).slice(0, -1), 0.0025, { wash: WASH.green, washA: 0.35 });
    } });
    const bohun = k.sprite({ w: 0.1, h: 0.19, delay: 0.6, pad: 0.008, draw: (g) => person(g, 0, 0, 0.18, { pose: 'stand', face: -1, w: 0.0034, beard: true, lit: g.lit }) });
    const EDGE = 0.16 + 0.125, CZ = -0.14;
    bohun.obj.position.set(EDGE - 0.04, 0.345, CZ + 0.02);
    const mist = [0, 1].map(i => { const c = k.sprite({ w: 0.16, h: 0.07, delay: 0.8 + i * 0.2, pad: 0.006, draw: (g) => g.cloud(0, 0.03, 0.05, 0.0028) }); return c; });
    const depth = k.line([[EDGE + 0.01, 0.34, CZ + 0.01], [EDGE + 0.01, 0.0, CZ + 0.01]], { width: 1.2, dashed: true, auto: false, opacity: 0.7, color: 0xb0432d });
    const halo = k.line(ellipsePts(0, 0, 0.075, 0.1, 40).map(([a, b]) => [a, b, 0]), { width: 1.3, auto: false, opacity: 0.8, color: 0xb0432d });
    // 靶
    const target = k.card({ w: 0.14, h: 0.24, x: 0.02, z: 0.1, delay: 0.4, draw: (g) => {
      g.stroke([[-0.045, 0.0], [-0.03, 0.12]], 0.004); g.stroke([[0.045, 0.0], [0.03, 0.12]], 0.004);
      for (const [r, f] of [[0.06, PAPER], [0.045, 'rgba(176,67,45,.18)'], [0.03, PAPER], [0.015, 'rgba(176,67,45,.85)']]) g.circle(0, 0.16, r, 0.003, { fill: f });
    } });
    // 列御寇引弓，肘上一杯水
    const S = 0.34;
    const archer = k.card({ w: 0.3, h: 0.38, x: -0.31, z: 0.1, delay: 0.25, draw: (g) => {
      const X = (a) => a * S, Y = (b) => b * S;
      person(g, 0, 0, S, { pose: 'point', face: 1, w: 0.0045, lit: g.lit });
      // 拉弦的手臂与肘
      limb(g, [[X(0.0), Y(0.75)], [X(-0.12), Y(0.7)], [X(0.06), Y(0.665)]], 0.03, 0.0035, { wash: WASH.ochre, washA: 0.2 * g.lit, taper: 0.3 });
      // 弓与弦
      g.stroke([[X(0.29), Y(0.95)], [X(0.37), Y(0.8)], [X(0.38), Y(0.63)], [X(0.37), Y(0.46)], [X(0.29), Y(0.31)]], 0.0045);
      g.stroke([[X(0.29), Y(0.95)], [X(0.06), Y(0.665)], [X(0.29), Y(0.31)]], 0.0013, { smooth: false });
      g.stroke([[X(0.06), Y(0.665)], [X(0.46), Y(0.63)]], 0.002, { smooth: false });
      // 杯水
      const cx = X(-0.125), cy = Y(0.725);
      g.shape([[cx - 0.014, cy + 0.024], [cx - 0.01, cy], [cx + 0.01, cy], [cx + 0.014, cy + 0.024]], 0.0025, { smooth: false, wash: WASH.water, washA: 0.3 + 0.5 * g.lit });
      g.stroke([[cx - 0.011, cy + 0.017], [cx + 0.011, cy + 0.017]], 0.0015, { color: 'rgba(96,132,150,.9)', smooth: false });
    } });
    const arrows = [0, 1, 2].map(() => k.sprite({ w: 0.12, h: 0.02, delay: 0, pad: 0.005, draw: (g) => {
      g.stroke([[-0.055, 0.01], [0.05, 0.01]], 0.0022, { smooth: false });
      g.shape([[0.05, 0.016], [0.062, 0.01], [0.05, 0.004]], 0.0015, { smooth: false, fill: INK });
      g.shape([[-0.06, 0.017], [-0.042, 0.012], [-0.042, 0.008], [-0.06, 0.003]], 0.0015, { smooth: false, wash: WASH.verm, washA: 0.6 });
    } }));
    const A0 = [-0.31 + 0.38 * S, 0.63 * S, 0.11], A1 = [0.02 - 0.06, 0.16, 0.11];
    k.hot(archer, 'she'); k.hot(both(cliff, mist[0], mist[1]), 'yuan'); k.hot(bohun, 'shen');
    let shoot = [1.6, 2.2, 2.8], rapid = -9, yuanT = -9, shenT = -9;
    return {
      hit(key) {
        if (key === 'she') { rapid = k.T; shoot = [k.T + 0.1, k.T + 0.4, k.T + 0.7]; }
        if (key === 'yuan') yuanT = k.T;
        if (key === 'shen') shenT = k.T;
      },
      update(T) {
        // 一支接一支：每 5 秒重新射一轮
        const cyc = Math.floor((T - 1.6) / 5);
        arrows.forEach((a, i) => {
          let t0 = shoot[i];
          if (T - rapid > 5) t0 = 1.6 + Math.max(0, cyc) * 5 + i * 0.6;
          const t = T - t0;
          const p = clamp(t / 0.3);
          a.obj.position.set(lerp(A0[0], A1[0] - i * 0.006, p), lerp(A0[1], A1[1] + (i - 1) * 0.008, p) + Math.sin(p * Math.PI) * 0.01, 0.115);
          fade(a, t > 0 && t < 4.2 ? 1 - smooth(win(t, 3.6, 4.2)) : 0);
        });
        // 伯昏无人：背对深渊往后退
        const yt = T - yuanT;
        const back = yt > 0 && yt < 6 ? smooth(win(yt, 0, 1.2)) * (1 - smooth(win(yt, 4.5, 6))) : 0;
        bohun.obj.position.x = EDGE - 0.04 + back * 0.035 + Math.sin(T * 0.6) * 0.003;
        bohun.obj.rotation.z = Math.sin(T * 1.3) * 0.01;
        mist.forEach((m, i) => m.obj.position.set(EDGE + 0.02 + ((T * 0.012 + i * 0.05) % 0.08), 0.05 + i * 0.07 + back * 0.05 + Math.sin(T * 0.5 + i) * 0.01, CZ + 0.03 + i * 0.03));
        depth.reveal = yt > 0 && yt < 6 ? easeOut(win(yt, 0.2, 1.2)) : 0;
        depth.opacity = 0.7 * (1 - smooth(win(yt, 4.5, 6)));
        const st = T - shenT;
        halo.reveal = st > 0 && st < 5 ? easeOut(win(st, 0, 1)) : 0;
        halo.opacity = 0.8 * (1 - smooth(win(st, 3.8, 5)));
        halo.obj.position.set(bohun.obj.position.x, 0.345 + 0.095, CZ + 0.03);
        halo.obj.scale.setScalar(1 + 0.05 * Math.sin(T * 2));
      },
    };
  },
};

// —— 二十二 · 知北游：白驹过隙 ——
const hillY = (x) => 0.11 + 0.035 * Math.sin(x * 9 + 0.5) + 0.018 * Math.sin(x * 17 + 1);
const ch22 = {
  ground(g) {
    // 墙缝透出的光
    for (let i = -5; i <= 5; i++) g.stroke([[0.06 + i * 0.006, 0.04], [0.06 + i * 0.028, -0.2]], 0.0016, { alpha: 0.18 });
    g.text('北', -0.42, 0.47, 0.03, { color: 'rgba(176,67,45,.7)' });
    g.stroke([[-0.42, 0.39], [-0.42, 0.44]], 0.002, { color: VERM });
    // 瓦甓与稊稗
    for (const [x, y] of [[0.16, -0.18], [0.3, -0.21], [0.4, -0.15]]) g.shape([[x, y], [x + 0.02, y + 0.006], [x + 0.016, y - 0.01]], 0.0016, { smooth: false });
    for (let i = 0; i < 5; i++) g.stroke([[0.22 + i * 0.012, -0.24], [0.225 + i * 0.012, -0.21]], 0.0014, { alpha: 0.5 });
  },
  build(k) {
    const hills = k.card({ w: 0.92, h: 0.2, x: 0, z: -0.34, delay: 0.1, draw: (g) => {
      const pts = [[-0.46, 0]];
      for (let x = -0.46; x <= 0.46; x += 0.02) pts.push([x, hillY(x)]);
      pts.push([0.46, 0]);
      g.shape(pts, 0.004, { wash: WASH.green, washA: 0.1 + 0.25 * g.lit });
      const path = [];
      for (let x = -0.44; x <= 0.44; x += 0.04) path.push([x, hillY(x) - 0.012 - 0.03 * Math.abs(Math.sin(x * 4))]);
      g.stroke(path, 0.002, { alpha: 0.5 });
      for (let x = -0.4; x < 0.44; x += 0.09) g.stroke([[x, hillY(x) - 0.03], [x + 0.02, hillY(x) - 0.06]], 0.0018, { alpha: 0.5 });
    } });
    const zhi = k.sprite({ w: 0.08, h: 0.13, delay: 0.5, pad: 0.006, draw: (g) => person(g, 0, 0, 0.12, { pose: 'walk', face: 1, w: 0.003, lit: g.lit }) });
    const qs = [0, 1, 2].map(i => k.sprite({ w: 0.04, h: 0.04, delay: 0, pad: 0.005, draw: (g) => g.text('？', 0, 0.02, 0.032, { color: VERM }) }));
    const horseS = k.sprite({ w: 0.27, h: 0.17, delay: 0.3, pad: 0.008, draw: (g) => horse(g, 0, 0, 0.16, { lit: g.lit, w: 0.0035 }) });
    horseS.obj.position.set(-0.4, 0, -0.075);
    horseS.mesh.receiveShadow = false;
    const wall = k.card({ w: 0.64, h: 0.27, x: 0.06, z: -0.05, delay: 0.2, draw: (g) => {
      const seg = (x0, x1, jag) => {
        const pts = [[x0, 0], [x0, 0.235], [x1, 0.235]];
        for (let i = 0; i <= 8; i++) pts.push([x1 + Math.sin(i * 2.3) * 0.004 * jag, 0.235 - i * 0.029]);
        pts.push([x1, 0]);
        if (jag < 0) pts.reverse();
        return pts;
      };
      const L = [[-0.31, 0], [-0.31, 0.235], [-0.04, 0.235]];
      for (let i = 0; i <= 8; i++) L.push([-0.04 + Math.sin(i * 2.3) * 0.006, 0.235 - i * 0.029]);
      const R = [[0.31, 0], [0.31, 0.235], [0.04, 0.235]];
      for (let i = 0; i <= 8; i++) R.push([0.04 + Math.sin(i * 1.7 + 1) * 0.006, 0.235 - i * 0.029]);
      for (const S of [L, R]) {
        g.shape(S, 0.004, { smooth: false, wash: WASH.ochre, washA: 0.22 + 0.2 * g.lit });
        // 夯土层
        const xs = S.map(p => p[0]); const a = Math.min(...xs) + 0.012, b = Math.max(...xs) - 0.012;
        for (let y = 0.04; y < 0.23; y += 0.038) g.stroke([[a, y], [b, y + 0.002]], 0.0016, { alpha: 0.5, smooth: false });
        // 瓦顶
        g.shape([[a - 0.02, 0.232], [a - 0.008, 0.258], [b + 0.008, 0.258], [b + 0.02, 0.232]], 0.0035, { smooth: false, fill: '#d9ccb2' });
        for (let x = a; x < b; x += 0.022) g.stroke([[x, 0.236], [x + 0.004, 0.255]], 0.0015, { alpha: 0.7 });
      }
      void seg;
    } });
    const antsS = [0, 1, 2].map(i => k.sprite({ w: 0.15, h: 0.03, delay: 0.9 + i * 0.1, pad: 0.004, draw: (g) => ants(g, 3, -0.05, 0.045, 0.009, 0.0024) }));
    k.hot(both(horseS, wall), 'ju'); k.hot(zhi, 'zhi'); k.hot(both(...antsS), 'dao');
    let slowT = -9, qT = -9, daoT = -9, hx = -0.4, nextRun = 1.4, slow = false;
    return {
      hit(key) {
        if (key === 'ju') { slowT = k.T; slow = true; hx = -0.1; nextRun = k.T; }
        if (key === 'zhi') qT = k.T;
        if (key === 'dao') daoT = k.T;
      },
      update(T, dt) {
        // 白驹：墙后一闪而过，只在缝里看得见
        if (T >= nextRun) {
          hx += dt * (slow ? 0.14 : 1.6);
          if (hx > 0.6) { hx = -0.4; nextRun = T + 2.4; slow = false; }
        }
        horseS.obj.position.x = hx;
        horseS.obj.position.y = Math.abs(Math.sin(T * 14)) * 0.006;
        fade(horseS, T >= nextRun && hx > -0.18 && hx < 0.3 ? 1 : 0);
        // 知：沿山脊往北走
        const px = -0.42 + ((T * 0.025) % 0.84);
        const hop = pulseT(T, qT, 0.6) * 0.03;
        zhi.obj.position.set(px, hillY(px) - 0.008 + hop, -0.325);
        qs.forEach((q, i) => {
          const t = T - qT - i * 0.7;
          q.obj.position.set(px + 0.03 + i * 0.02, hillY(px) + 0.13 + clamp(t) * 0.04, -0.32);
          fade(q, t > 0 && t < 2 ? smooth(win(t, 0, 0.3)) * (1 - smooth(win(t, 1.4, 2))) : 0);
        });
        // 蝼蚁
        const dtm = T - daoT;
        antsS.forEach((a, i) => {
          const lineX = 0.12 + ((T * 0.02 + i * 0.12) % 0.34);
          const ang = T * 1.5 + i * TAU / 3;
          const circ = dtm > 0 && dtm < 5 ? smooth(win(dtm, 0, 0.6)) * (1 - smooth(win(dtm, 4.2, 5))) : 0;
          a.obj.position.set(lerp(lineX, 0.27 + Math.cos(ang) * 0.09, circ), 0, lerp(0.15 + i * 0.015, 0.13 + Math.sin(ang) * 0.05, circ));
        });
        void hills;
      },
    };
  },
};

// —— 二十三 · 庚桑楚：吞舟之鱼，砀而失水 ——
function bigFish(g, x, y, L, { lit = 0, w = 0.0045, mouth = 1 } = {}) {
  // 头朝左，侧躺在沙上
  const P = (pts) => pts.map(([a, b]) => [x + a * L, y + b * L]);
  const o = { wash: WASH.water, washA: 0.15 + 0.35 * lit };
  g.shape(P([[0.36, 0.0], [0.5, 0.12], [0.46, 0.04], [0.52, -0.05], [0.36, -0.01]]), w, o);
  g.shape(P([[-0.42, 0.02 + 0.03 * mouth], [-0.3, 0.1], [-0.05, 0.15], [0.2, 0.11], [0.38, 0.03], [0.38, -0.02], [0.2, -0.09], [-0.05, -0.12], [-0.3, -0.08], [-0.42, -0.03 - 0.02 * mouth], [-0.36, 0.0]]), w, o);
  g.stroke(P([[-0.42, 0.02 + 0.03 * mouth], [-0.35, 0.0], [-0.42, -0.03 - 0.02 * mouth]]), w * 0.8);
  g.circle(x - 0.31 * L, y + 0.04 * L, 0.018 * L, w * 0.7);
  g.dot(x - 0.31 * L, y + 0.04 * L, 0.008 * L);
  g.stroke(P([[-0.22, 0.09], [-0.25, 0.0], [-0.22, -0.08]]), w * 0.8);
  g.stroke(P([[-0.19, 0.08], [-0.21, 0.0], [-0.19, -0.07]]), w * 0.5, { alpha: 0.7 });
  for (let i = 0; i < 6; i++) for (let j = -1; j <= 1; j++) {
    const cx = -0.12 + i * 0.075, cy = j * 0.045;
    g.stroke(P([[cx - 0.02, cy + 0.025], [cx + 0.012, cy], [cx - 0.02, cy - 0.025]]), w * 0.4, { alpha: 0.55 });
  }
  g.shape(P([[-0.05, 0.145], [0.05, 0.22], [0.15, 0.12]]), w * 0.8, o);
  g.shape(P([[-0.1, -0.11], [-0.04, -0.17], [0.02, -0.12]]), w * 0.8, o);
}

const ch23 = {
  ground(g) {
    // 岸线：后面是水，前面是沙
    const sh = [];
    for (let x = -0.46; x <= 0.46; x += 0.03) sh.push([x, 0.12 + 0.03 * Math.sin(x * 7)]);
    g.stroke(sh, 0.0025, { alpha: 0.45 });
    for (let i = 0; i < 60; i++) g.dot(-0.44 + (i * 0.0157) % 0.9, 0.09 - ((i * 37) % 40) * 0.007, 0.0018, 'rgba(120,95,60,.35)');
  },
  build(k) {
    const mts = k.card({ w: 0.42, h: 0.3, x: 0.24, z: -0.34, delay: 0.1, draw: (g) => mountains(g, -0.21, 0.21, 0, 0.28, { peaks: 2, seed: 5, w: 0.0045, lit: g.lit }) });
    const birds = [0, 1].map(i => k.sprite({ w: 0.06, h: 0.03, delay: 0.8, pad: 0.004, draw: (g) => {
      g.stroke([[-0.025, 0.02], [-0.01, 0.012], [0, 0.006], [0.01, 0.012], [0.025, 0.022]], 0.0028);
    } }));
    const deepF = k.sprite({ w: 0.18, h: 0.08, delay: 0.5, pad: 0.006, draw: (g) => fish(g, 0, 0.04, 0.16, { w: 0.003, lit: g.lit }) });
    const boat = k.sprite({ w: 0.08, h: 0.04, delay: 0.6, pad: 0.005, draw: (g) => {
      g.shape([[-0.035, 0.01], [-0.025, 0.0], [0.025, 0.0], [0.037, 0.012]], 0.0022, { smooth: false, wash: WASH.ochre, washA: 0.4 });
      g.line(0.0, 0.01, 0.002, 0.034, 0.0018); g.shape([[0.004, 0.032], [0.02, 0.016], [0.004, 0.014]], 0.0015, { smooth: false });
    } });
    const water = k.card({ w: 0.5, h: 0.1, x: -0.2, z: -0.16, delay: 0.2, draw: (g) => {
      const r = [[-0.25, 0], [-0.25, 0.065], [0.25, 0.065], [0.25, 0]];
      g.paper(r, { smooth: false }); g.wash(r, WASH.water, 0.18 + 0.3 * g.lit, { smooth: false });
      waveRows(g, -0.25, 0.25, 0.065, 2, { wl: 0.08, amp: 0.012, gap: -0.022, w: 0.0038 });
    } });
    const big = k.card({ w: 0.6, h: 0.19, x: 0.04, z: 0.04, delay: 0.4, draw: (g) => {
      bigFish(g, 0, 0.085, 0.56, { lit: g.lit });
      for (let i = 0; i < 4; i++) g.stroke(ellipsePts(-0.26 - i * 0.02, 0.13 + i * 0.012, 0.006 + i * 0.002, 0.006 + i * 0.002, 10), 0.0015, { alpha: 0.6 });
    } });
    const antsS = [0, 1, 2, 3].map(i => k.sprite({ w: 0.09, h: 0.02, delay: 0.9 + i * 0.1, pad: 0.004, draw: (g) => ants(g, 3, -0.03, 0.028, 0.0055) }));
    const baby = k.card({ w: 0.18, h: 0.19, x: -0.36, z: 0.16, delay: 0.8, draw: (g) => {
      g.c.save(); g.c.translate(g.X(0), g.Y(0)); g.c.scale(1.35, 1.35); g.c.translate(-g.X(0), -g.Y(0));
      const o = { wash: WASH.verm, washA: 0.1 + 0.3 * g.lit };
      g.shape([[-0.04, 0.0], [-0.045, 0.03], [-0.03, 0.06], [0.0, 0.065], [0.03, 0.06], [0.045, 0.03], [0.05, 0.0]], 0.003, o);
      g.circle(-0.03, 0.035, 0.009, 0.0025); g.circle(0.035, 0.035, 0.009, 0.0025);
      g.circle(0.0, 0.088, 0.03, 0.0032, { wash: WASH.ochre, washA: 0.15 });
      g.stroke([[-0.004, 0.118], [0.004, 0.126], [0.01, 0.12]], 0.002);
      g.dot(-0.01, 0.09, 0.0025); g.dot(0.01, 0.09, 0.0025);
      g.stroke([[-0.006, 0.075], [0.0, 0.072], [0.006, 0.075]], 0.0015);
      g.stroke([[-0.03, 0.0], [-0.06, 0.006]], 0.0035); g.stroke([[0.03, 0.0], [0.06, 0.004]], 0.0035);
      g.c.restore();
    } });
    const cry = k.sprite({ w: 0.06, h: 0.05, delay: 0, pad: 0.005, draw: (g) => soundArcs(g, -0.015, 0.025, 0.04, 1) });
    cry.obj.position.set(-0.33, 0.08, 0.16);
    k.hot(big, 'yu'); k.hot(both(water, mts, deepF), 'shui'); k.hot(baby, 'er');
    let yuT = -9, shuiT = -9, erT = -9;
    return {
      hit(key) { if (key === 'yu') yuT = k.T; if (key === 'shui') shuiT = k.T; if (key === 'er') erT = k.T; },
      update(T) {
        const flop = pulseT(T, yuT, 1.4);
        big.hinge.rotation.z = Math.sin(T * 0.9) * 0.012 + Math.sin(T * 12) * 0.03 * flop;
        big.hinge.position.y = flop * 0.02;
        // 蚂蚁：从沙上爬到鱼身上
        antsS.forEach((a, i) => {
          const t = ((T * 0.05 + i * 0.25) % 1);
          const scat = flop;
          const x = lerp(0.44, 0.1 - i * 0.05, smooth(win(t, 0, 0.55)));
          const y = smooth(win(t, 0.5, 0.85)) * (0.07 + (i % 2) * 0.03) * (1 - scat);
          a.obj.position.set(x + scat * 0.05, y, 0.07 + i * 0.006);
          a.obj.rotation.z = win(t, 0.5, 0.85) > 0 && win(t, 0.5, 0.85) < 1 ? 0.5 : 0;
          fade(a, 1 - smooth(win(t, 0.92, 1)));
        });
        // 深水里的鱼，高山上的鸟
        const st = pulseT(T, shuiT, 3);
        deepF.obj.position.set(-0.34 + ((T * 0.04) % 0.3), 0.02 - st * 0.035, -0.175);
        deepF.obj.rotation.z = Math.sin(T * 2) * 0.05;
        boat.obj.position.set(-0.06 + Math.sin(T * 0.3) * 0.03, 0.06 + Math.sin(T * 1.4) * 0.004, -0.155);
        birds.forEach((b, i) => {
          const a = T * 0.5 + i * Math.PI;
          b.obj.position.set(0.22 + Math.cos(a) * 0.12, 0.27 + i * 0.035 + st * 0.06 + Math.sin(a * 2) * 0.01, -0.28 + Math.sin(a) * 0.04);
          b.obj.rotation.z = Math.sin(T * 6 + i) * 0.15;
        });
        // 婴儿
        const et = pulseT(T, erT, 2.5);
        baby.hinge.rotation.z = Math.sin(T * 8) * 0.06 * et + Math.sin(T * 1.2) * 0.02;
        fade(cry, et * (0.6 + 0.4 * Math.sin(T * 12)));
      },
    };
  },
};

// —— 二十四 · 徐无鬼：运斤成风 ——
const ch24 = {
  ground(g) {
    g.stroke([[-0.4, -0.08], [0.38, -0.08]], 0.0018, { alpha: 0.25 });
    for (let i = 0; i < 8; i++) g.stroke([[-0.38 + i * 0.1, -0.15], [-0.37 + i * 0.1, -0.13]], 0.0016, { alpha: 0.3 });
  },
  build(k) {
    const grave = k.card({ w: 0.34, h: 0.16, x: -0.24, z: -0.22, delay: 0.1, draw: (g) => {
      g.shape([[-0.15, 0.0], [-0.12, 0.05], [-0.06, 0.085], [0.02, 0.095], [0.09, 0.08], [0.14, 0.04], [0.16, 0.0]], 0.004, { wash: WASH.ochre, washA: 0.25 + 0.25 * g.lit });
      for (let i = 0; i < 9; i++) { const x = -0.12 + i * 0.03; g.stroke([[x, 0.0], [x + 0.004, 0.02 + (i % 3) * 0.006]], 0.0018, { alpha: 0.6 }); }
      g.shape([[0.07, 0.0], [0.07, 0.11], [0.08, 0.12], [0.11, 0.12], [0.12, 0.11], [0.12, 0.0]], 0.003, { smooth: false });
      g.text('惠', 0.095, 0.085, 0.022, { font: FONTS.serif });
      // 一棵小松
      g.stroke([[-0.13, 0.04], [-0.12, 0.1], [-0.13, 0.14]], 0.0035);
      for (const [cx, cy] of [[-0.12, 0.14], [-0.14, 0.11], [-0.1, 0.1]]) g.shape(ellipsePts(cx, cy, 0.022, 0.009, 12).slice(0, -1), 0.0022, { wash: WASH.green, washA: 0.4 });
    } });
    const S = 0.34;
    const jiang = k.card({ w: 0.2, h: 0.36, x: -0.2, z: 0.06, delay: 0.3, draw: (g) => person(g, 0, 0, S, { pose: 'stand', face: 1, w: 0.0045, beard: true, lit: g.lit }) });
    const ying = k.card({ w: 0.2, h: 0.36, x: 0.17, z: 0.06, delay: 0.5, draw: (g) => person(g, 0, 0, S, { pose: 'stand', face: -1, w: 0.0045, lit: g.lit }) });
    // 手臂 + 斧：以肩为轴转动
    const axe = k.sprite({ w: 0.1, h: 0.38, delay: 0.9, pad: 0.006, draw: (g) => {
      limb(g, [[0, 0.0], [0.004, 0.06], [0.0, 0.1]], 0.036, 0.0038, { wash: WASH.ochre, washA: 0.2, taper: 0.3 });
      g.circle(0.0, 0.108, 0.012, 0.003);
      g.stroke([[0.0, 0.1], [0.002, 0.34]], 0.0065, { taper: [0.02, 0.02], color: '#5a4630' });
      g.shape([[0.003, 0.305], [0.045, 0.29], [0.054, 0.322], [0.05, 0.356], [0.003, 0.345]], 0.003, { wash: WASH.ink, washA: 0.2 + 0.3 * g.lit });
      g.stroke([[0.05, 0.293], [0.055, 0.322], [0.051, 0.353]], 0.0025, { color: '#8a8f94' });
    } });
    const PIV = [-0.2 + 0.1 * S, 0.74 * S, 0.075];
    axe.obj.position.set(...PIV);
    const NOSE = [0.17 - 0.1 * S, 0.885 * S, 0.077];
    const fleck = k.sprite({ w: 0.02, h: 0.012, delay: 1.0, pad: 0.004, draw: (g) => g.shape(ellipsePts(0, 0.006, 0.006, 0.0035, 12).slice(0, -1), 0.0012, { fill: '#ffffff' }) });
    // 风声：三道弧线
    const R = Math.hypot(NOSE[0] - PIV[0], NOSE[1] - PIV[1]) + 0.01;
    const arcs = [1, 0.85, 0.7].map((f, i) => {
      const pts = [];
      for (let j = 0; j <= 24; j++) { const a = 1.9 - j / 24 * 2.2; pts.push([PIV[0] + Math.cos(a) * R * f, PIV[1] + Math.sin(a) * R * f, 0.08 + i * 0.002]); }
      return k.line(pts, { width: 1.6 - i * 0.3, auto: false, opacity: 0.75 - i * 0.15 });
    });
    k.hot(axe, 'fu'); k.hot(ying, 'ying'); k.hot(grave, 'hui');
    const PER = 6, HANG = -2.8, AIM = Math.atan2(NOSE[1] - PIV[1], NOSE[0] - PIV[0]) - Math.PI / 2;
    let c0 = 1.6, pauseT = -99;
    const leaf = k.sprite({ w: 0.03, h: 0.02, delay: 0, pad: 0.004, draw: (g) => g.shape([[-0.012, 0.01], [0, 0.017], [0.012, 0.01], [0, 0.003]], 0.0015, { wash: WASH.ochre, washA: 0.6 }) });
    return {
      hit(key) {
        if (key === 'hui') pauseT = k.T;
        else if (k.T - pauseT > 5) { const ph = (k.T - c0) % PER; if (ph > 2.6 || ph < 0) c0 = k.T - 0.6; }
      },
      update(T) {
        const paused = T - pauseT < 5;
        let ph = (T - c0) % PER;
        if (T < c0) ph = -1;
        // 角度：垂下 → 向后上扬 → 越过头顶劈下 → 收回（始终顺时针转一整圈）
        let a = HANG;
        const up = HANG - 2.58, strike = AIM - TAU, follow = strike - 0.55;
        let strikeP = 0;
        if (!paused && ph >= 0) {
          if (ph < 1.0) a = lerp(HANG, up, smooth(ph / 1.0));
          else if (ph < 1.25) { strikeP = (ph - 1.0) / 0.25; a = lerp(up, follow, strikeP * strikeP); }
          else if (ph < 2.6) a = lerp(follow, HANG - TAU, smooth((ph - 1.25) / 1.35));
        }
        axe.obj.rotation.z = a;
        arcs.forEach((l, i) => {
          l.reveal = ph >= 1.0 && ph < 2.4 && !paused ? clamp((ph - 1.0) / 0.25) : 0;
          l.opacity = (0.75 - i * 0.15) * (1 - smooth(win(ph, 1.4, 2.2)));
        });
        // 鼻尖的白灰：被削下飞走，下一轮再出现
        const ft = ph - 1.18;
        if (!paused && ft > 0 && ph < PER - 0.6) {
          fleck.obj.position.set(NOSE[0] + ft * 0.12, NOSE[1] + ft * 0.08 - ft * ft * 0.25, NOSE[2]);
          fleck.obj.rotation.z = ft * 9;
          fade(fleck, 1 - smooth(win(ft, 0.6, 1.2)));
        } else {
          fleck.obj.position.set(NOSE[0] - 0.003, NOSE[1] - 0.004, NOSE[2]);
          fleck.obj.rotation.z = 0;
          fade(fleck, paused || ph < 0 ? 1 : smooth(win(ph, PER - 0.6, PER)));
        }
        // 惠子墓前落叶
        const lt = T - pauseT;
        leaf.obj.position.set(-0.2 + Math.sin(lt * 2) * 0.03, 0.32 - clamp(lt / 4) * 0.24, -0.2);
        leaf.obj.rotation.z = Math.sin(lt * 3) * 0.6;
        fade(leaf, lt > 0 && lt < 5 ? smooth(win(lt, 0, 0.4)) * (1 - smooth(win(lt, 4.2, 5))) : 0);
        void jiang;
      },
    };
  },
};

// —— 二十五 · 则阳：蜗角触蛮 ——
const ch25 = {
  ground(g) {
    // 无穷的四方上下
    for (let i = 0; i < 90; i++) { const a = i / 90 * TAU; if (i % 3) g.dot(Math.cos(a) * 0.43, 0.04 + Math.sin(a) * 0.3, 0.0018, 'rgba(40,34,30,.35)'); }
    for (const [x, y] of [[-0.3, 0.32], [0.25, 0.36], [0.35, -0.05], [-0.36, -0.08], [0.05, 0.4]]) g.dot(x, y, 0.003, 'rgba(40,34,30,.4)');
  },
  build(k) {
    const grp = k.group();
    grp.position.set(0, 0, 0.0);
    // 蜗牛：头朝右，两只角
    const HL = [0.1, 0.3], HR = [0.25, 0.31];
    const snail = k.card({ w: 0.52, h: 0.34, x: 0, z: 0, parent: grp, delay: 0.1, draw: (g) => {
      const o = { wash: WASH.ochre, washA: 0.12 + 0.25 * g.lit };
      g.shape([[-0.25, 0.0], [-0.22, 0.03], [0.05, 0.04], [0.16, 0.07], [0.2, 0.13], [0.24, 0.13], [0.26, 0.08], [0.25, 0.02], [0.28, 0.0]], 0.004, o);
      g.stroke([[0.18, 0.12], HL], 0.006, { taper: [0.05, 0.3] });
      g.stroke([[0.23, 0.12], HR], 0.006, { taper: [0.05, 0.3] });
      g.dot(HL[0], HL[1], 0.007); g.dot(HR[0], HR[1], 0.007);
      // 壳与螺纹
      g.circle(-0.07, 0.15, 0.135, 0.0045, { wash: WASH.ochre, washA: 0.25 + 0.25 * g.lit });
      const sp = [];
      for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * TAU * 2.6, r = 0.125 * (1 - t * 0.92); sp.push([-0.07 + Math.cos(a) * r, 0.15 + Math.sin(a) * r]); }
      g.stroke(sp, 0.003, { taper: [0.02, 0.3] });
      for (let i = 0; i < 7; i++) { const a = i * 0.9; g.stroke([[-0.07 + Math.cos(a) * 0.09, 0.15 + Math.sin(a) * 0.09], [-0.07 + Math.cos(a) * 0.12, 0.15 + Math.sin(a) * 0.12]], 0.0018, { alpha: 0.5 }); }
      g.stroke([[-0.2, 0.012], [0.2, 0.02]], 0.0018, { alpha: 0.5 });
    } });
    const city = (label, flip) => k.sprite({ w: 0.09, h: 0.1, parent: grp, delay: 0.6, pad: 0.006, draw: (g) => {
      g.shape([[-0.03, 0.0], [-0.03, 0.03], [-0.02, 0.03], [-0.02, 0.025], [-0.01, 0.025], [-0.01, 0.03], [0.0, 0.03], [0.0, 0.025], [0.01, 0.025], [0.01, 0.03], [0.02, 0.03], [0.02, 0.025], [0.03, 0.025], [0.03, 0.0]], 0.0022, { smooth: false, wash: WASH.ochre, washA: 0.3 + 0.3 * g.lit });
      g.shape([[-0.006, 0.0], [-0.006, 0.012], [0.006, 0.012], [0.006, 0.0]], 0.0015, { smooth: false, fill: INK });
      g.line(0.0, 0.03, 0.0, 0.085, 0.0022);
      const d = flip ? -1 : 1;
      g.shape([[0, 0.085], [0.034 * d, 0.078], [0.03 * d, 0.066], [0, 0.06]], 0.0018, { fill: flip ? 'rgba(60,60,70,.75)' : 'rgba(176,67,45,.85)' });
      g.text(label, 0.016 * d, 0.072, 0.014, { color: PAPER });
    } });
    const chu = city('触', true), man = city('蛮', false);
    chu.obj.position.set(HL[0] - 0.012, HL[1] - 0.002, 0.004);
    man.obj.position.set(HR[0] + 0.012, HR[1] - 0.002, 0.004);
    const army = (flip) => k.sprite({ w: 0.06, h: 0.03, parent: grp, delay: 0.9, pad: 0.004, draw: (g) => {
      const d = flip ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 0.016;
        g.dot(x, 0.022, 0.0035); g.line(x, 0.019, x, 0.008, 0.002); g.line(x, 0.008, x - 0.003, 0.0, 0.0015); g.line(x, 0.008, x + 0.003, 0.0, 0.0015);
        g.line(x - 0.004 * d, 0.004, x + 0.01 * d, 0.03, 0.0012, { color: flip ? INK : VERM });
      }
    } });
    const aL = army(true), aR = army(false);
    const volley = [0, 1, 2].map(() => k.line(blankPts(10), { width: 1.1, dashed: true, auto: false, opacity: 0.7, color: 0xb0432d }));
    const ring = k.line(ellipsePts(0, 0, 0.44, 0.44, 64).map(([a, b]) => [a, 0.004, b * 0.75 - 0.02]), { width: 1.4, auto: false, opacity: 0.6 });
    const ring2 = k.line(ellipsePts(0, 0, 0.36, 0.36, 64).map(([a, b]) => [a, b * 0.8 + 0.0, -0.02]), { width: 1.2, auto: false, opacity: 0.45, dashed: true });
    k.hot(chu, 'chu'); k.hot(man, 'man'); k.hot(both(snail, aL, aR), 'zhan');
    let cT = -9, mT = -9, zT = -9;
    const mid = [(HL[0] + HR[0]) / 2, 0.2];
    return {
      hit(key) { if (key === 'chu') cT = k.T; if (key === 'man') mT = k.T; if (key === 'zhan') zT = k.T; },
      update(T) {
        const zt = T - zT;
        const battle = zt > 0 && zt < 6 ? 1 : 0;
        // 两军沿角而下，交锋又退回
        const base = 0.5 - 0.5 * Math.cos(T * 0.8);
        const lAdv = clamp(Math.max(base * 0.6, pulseT(T, cT, 3) * 1.2, battle));
        const rAdv = clamp(Math.max(base * 0.6, pulseT(T, mT, 3) * 1.2, battle));
        aL.obj.position.set(lerp(HL[0] - 0.01, mid[0] - 0.02, lAdv), lerp(HL[1] - 0.06, mid[1] - 0.04, lAdv), 0.005);
        aR.obj.position.set(lerp(HR[0] + 0.01, mid[0] + 0.02, rAdv), lerp(HR[1] - 0.06, mid[1] - 0.04, rAdv), 0.005);
        aL.obj.rotation.z = Math.sin(T * 10) * 0.05 * lAdv; aR.obj.rotation.z = Math.sin(T * 10 + 1) * 0.05 * rAdv;
        chu.obj.rotation.z = Math.sin(T * 3) * 0.04 + pulseT(T, cT, 1) * 0.15;
        man.obj.rotation.z = Math.sin(T * 3 + 1) * 0.04 - pulseT(T, mT, 1) * 0.15;
        // 箭雨（在组里，坐标随蜗牛缩放）
        volley.forEach((v, i) => {
          const on = battle * (zt < 4 ? 1 : 0);
          v.reveal = on ? ((zt * 1.5 + i * 0.33) % 1) : 0;
          v.opacity = 0.7 * on;
          if (on) {
            const s = grp.scale.x;
            const ox = grp.position.x;
            const a = [ox + HL[0] * s, (HL[1] + 0.06) * s, 0.008], b = [ox + HR[0] * s, (HR[1] + 0.06) * s, 0.008];
            v.set(i % 2 ? arcPts(b, a, 0.05 * s, 10) : arcPts(a, b, (0.04 + i * 0.01) * s, 10));
          }
        });
        // 放到无穷之中看：蜗牛缩小
        const zoom = zt > 2.5 && zt < 9 ? smooth(win(zt, 2.5, 4)) * (1 - smooth(win(zt, 7.5, 9))) : 0;
        grp.scale.setScalar(lerp(1.22, 0.32, zoom));
        grp.position.x = Math.sin(T * 0.15) * 0.02;
        ring.reveal = zoom; ring2.reveal = zoom;
      },
    };
  },
};

// —— 二十六 · 外物：得鱼而忘荃 ——
const ch26 = {
  ground(g) {
    // 两道干涸的车辙
    for (const off of [0, 0.07]) {
      const pts = [];
      for (let x = 0.1; x <= 0.46; x += 0.02) pts.push([x, -0.05 - off - 0.08 * (x - 0.1) + 0.01 * Math.sin(x * 20)]);
      g.stroke(pts, 0.006, { alpha: 0.25 });
      g.stroke(pts.map(([x, y]) => [x, y - 0.012]), 0.002, { alpha: 0.35 });
    }
    for (let i = 0; i < 10; i++) { const x = 0.14 + i * 0.032; g.stroke([[x, -0.02 - (i % 3) * 0.04], [x + 0.012, -0.035 - (i % 3) * 0.04], [x + 0.01, -0.05 - (i % 3) * 0.04]], 0.0015, { alpha: 0.35 }); }
  },
  build(k) {
    const sea = (x0, x1, top) => (g) => {
      const r = [[x0, 0], [x0, top], [x1, top], [x1, 0]];
      g.paper(r, { smooth: false }); g.wash(r, WASH.water, 0.15 + 0.3 * g.lit, { smooth: false });
      waveRows(g, x0, x1, top, 1, { wl: 0.07, amp: 0.01, gap: -0.018, w: 0.0034 });
    };
    const back = k.card({ w: 0.64, h: 0.08, x: -0.13, z: -0.14, delay: 0.1, draw: sea(-0.32, 0.32, 0.045) });
    const fishS = k.sprite({ w: 0.17, h: 0.08, delay: 0.6, pad: 0.006, draw: (g) => fish(g, 0, 0.04, 0.15, { w: 0.003, lit: g.lit }) });
    const trap = k.card({ w: 0.34, h: 0.14, x: -0.11, z: -0.03, delay: 0.3, pad: 0.006, draw: (g) => {
      g.c.save(); g.c.translate(g.X(0), g.Y(0)); g.c.scale(1.25, 1.25); g.c.translate(-g.X(0), -g.Y(0));
      // 竹编的鱼笱：大口在左，尾端收拢
      const top = (x) => 0.07 + 0.055 * (1 - (x + 0.15) / 0.31);
      const bot = (x) => 0.07 - 0.055 * (1 - (x + 0.15) / 0.31);
      const c = 'rgba(120,88,50,1)';
      for (let x = -0.15; x <= 0.16; x += 0.035) g.stroke([[x, top(x)], [x + 0.004, bot(x)]], 0.0028, { color: c, smooth: false });
      for (let i = 0; i <= 6; i++) { const f = i / 6; const pts = []; for (let x = -0.15; x <= 0.165; x += 0.02) pts.push([x, lerp(bot(x), top(x), f)]); g.stroke(pts, 0.0022, { color: c, alpha: 0.85 }); }
      g.stroke(ellipsePts(-0.15, 0.07, 0.014, 0.056, 20), 0.0035, { color: c });
      g.stroke([[0.16, 0.072], [0.19, 0.08], [0.205, 0.07]], 0.003, { color: c });
      if (g.lit > 0.05) g.wash([[-0.16, 0.125], [0.17, 0.08], [0.17, 0.06], [-0.16, 0.015]], WASH.ochre, 0.3 * g.lit);
      g.c.restore();
    } });
    const front = k.card({ w: 0.66, h: 0.07, x: -0.13, z: 0.08, delay: 0.2, draw: sea(-0.33, 0.33, 0.045) });
    // 车辙里的小鲋鱼
    const fu = k.sprite({ w: 0.13, h: 0.06, delay: 0.8, pad: 0.006, draw: (g) => { fish(g, 0, 0.026, 0.11, { w: 0.0028, lit: g.lit, dir: -1 }); g.circle(-0.064, 0.036, 0.005, 0.0012); g.circle(-0.072, 0.048, 0.0035, 0.0012); } });
    fu.obj.position.set(0.3, 0.0, 0.16);
    const drop = k.sprite({ w: 0.03, h: 0.04, delay: 0, pad: 0.004, draw: (g) => g.shape([[0, 0.035], [0.01, 0.014], [0.006, 0.004], [0, 0.002], [-0.006, 0.004], [-0.01, 0.014]], 0.002, { wash: WASH.water, washA: 0.7 }) });
    const ripple = k.line(ellipsePts(0, 0, 0.04, 0.025, 36).map(([a, b]) => [a, 0.003, b]), { width: 1.3, auto: false, opacity: 0.7, color: 0x60849a });
    ripple.obj.position.set(0.29, 0, 0.16);
    // 言：从竹简上浮起又散去的字
    const book = k.card({ w: 0.22, h: 0.2, x: 0.32, z: -0.1, delay: 0.5, draw: (g) => {
      for (let i = 0; i < 6; i++) {
        const x = -0.08 + i * 0.03;
        g.shape([[x, 0], [x, 0.17], [x + 0.026, 0.17], [x + 0.026, 0]], 0.0028, { smooth: false, wash: WASH.ochre, washA: 0.2 + 0.3 * g.lit });
        for (let j = 0; j < 4; j++) g.line(x + 0.009, 0.03 + j * 0.035, x + 0.017, 0.03 + j * 0.035, 0.002, { alpha: 0.7 });
      }
      for (const t of [0.04, 0.13]) g.stroke([[-0.085, t], [0.1, t + 0.002]], 0.0025, { color: VERM });
    } });
    const words = [...'言者所以在意'].map((c, i) => k.sprite({ w: 0.05, h: 0.05, delay: 0, pad: 0.005, draw: (g) => g.text(c, 0, 0.025, 0.036, { font: FONTS.serif, color: c === '意' ? VERM : INK }) }));
    const yi = k.sprite({ w: 0.07, h: 0.07, delay: 0, pad: 0.005, draw: (g) => { g.circle(0, 0.035, 0.028, 0.003, { fill: 'rgba(176,67,45,.12)', color: VERM }); g.text('意', 0, 0.035, 0.03, { font: FONTS.brush, color: VERM }); } });
    k.hot(trap, 'quan'); k.hot(fu, 'fu'); k.hot(both(book, ...words), 'yan');
    const PER = 11;
    let c0 = 1.2, fuT = -9, yanT = -9;
    return {
      hit(key) {
        if (key === 'quan') { const ph = (k.T - c0) % PER; if (ph < 5.5) c0 = k.T - 5.5; }
        if (key === 'fu') fuT = k.T;
        if (key === 'yan') yanT = k.T;
      },
      update(T) {
        // 鱼：游进荃 → 被困 → 荃散去，鱼游走
        const ph = T < c0 ? -1 : (T - c0) % PER;
        let fx, fa = 1, trapA = 1;
        if (ph < 0) fx = -0.5;
        else if (ph < 3) fx = lerp(-0.5, -0.1, smooth(ph / 3));
        else if (ph < 5.5) fx = -0.1 + Math.sin((ph - 3) * 5) * 0.012;
        else if (ph < 8.5) { const t = (ph - 5.5) / 3; fx = lerp(-0.1, 0.22, smooth(t)); trapA = 1 - smooth(win(t, 0.0, 0.5)); fa = 1 - smooth(win(t, 0.75, 1)); }
        else { fx = 0.3; fa = 0; trapA = smooth(win(ph, 9.5, 11)); }
        fishS.obj.position.set(fx, 0.03 + Math.sin(T * 3) * 0.004, -0.045);
        fishS.obj.rotation.z = Math.sin(T * 6) * (ph > 3 && ph < 5.5 ? 0.12 : 0.04);
        fade(fishS, fa * (ph < 0 ? 0 : smooth(win(ph, 0, 0.6))));
        fade(trap, trapA);
        trap.hinge.position.y = (1 - trapA) * 0.02;
        // 涸辙之鲋
        const ft = T - fuT;
        const wet = ft > 0 && ft < 4 ? 1 - smooth(win(ft, 3, 4)) : 0;
        fu.obj.rotation.z = 0.25 + Math.sin(T * (wet > 0 ? 10 : 3)) * (wet > 0 ? 0.15 : 0.06);
        fu.obj.position.x = 0.3 + (wet > 0 ? Math.sin(ft * 3) * 0.02 : 0);
        drop.obj.position.set(0.28, Math.max(0, 0.3 - Math.max(0, ft) * Math.max(0, ft) * 0.9), 0.16);
        fade(drop, ft > 0 && ft < 0.6 ? 1 : 0);
        const rt = ft - 0.55;
        ripple.reveal = rt > 0 && rt < 2 ? 1 : 0;
        ripple.opacity = 0.7 * (1 - clamp(rt / 2));
        ripple.obj.scale.setScalar(0.5 + clamp(rt / 2) * 1.6);
        // 字浮起、散去；点“言”后一齐散去，留下一个“意”
        const yt = T - yanT;
        const burst = yt > 0 && yt < 6;
        words.forEach((w, i) => {
          let t = burst ? clamp((yt - i * 0.1) / 2.2) : ((T * 0.07 + i / 6) % 1) * 2;
          if (T < 1.5 && !burst) t = 0;
          if (t > 1) t = 0;
          const wx = burst ? 0.23 + i * 0.036 : 0.24 + ((i * 0.37) % 1) * 0.16;
          w.obj.position.set(wx + Math.sin(t * 5 + i) * 0.012, 0.21 + t * 0.22, -0.09);
          w.obj.scale.setScalar(1 + t * 0.6);
          fade(w, (T < 1.5 && !burst) ? 0 : smooth(win(t, 0, 0.15)) * (1 - smooth(win(t, 0.5, 1))));
        });
        yi.obj.position.set(0.32, 0.32 + Math.sin(T) * 0.01, -0.08);
        fade(yi, burst ? smooth(win(yt, 1.5, 2.3)) * (1 - smooth(win(yt, 4.5, 6))) : 0);
        void back; void front;
      },
    };
  },
};

export const scenes = { ch20, ch21, ch22, ch23, ch24, ch25, ch26 };
