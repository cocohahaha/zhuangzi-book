// 杂篇（下）七幅插图：寓言、让王、盗跖、说剑、渔父、列御寇、天下
import { WASH, VERM, INK, PAPER } from '../ink.js';
import { person, mountains, ellipsePts, tree } from '../art.js';
import { clamp, lerp, smooth, win, easeInOut, easeOut } from '../util.js';
import * as sfx from '../audio.js';

// 立着的纸片略向后仰，正对俯视的镜头时不显得矮
const tilt = (k, a = -0.3) => { for (const it of k.items) if (it.kind === 'card' && it.stand && !it.lean) it.lean = a; };
const fade = (it, f) => { for (const p of (it.parts || [it])) { p.mat.opacity *= f; p.mesh.visible = p.mat.opacity > 0.01; } };
const M = (pts, x, y, s, f = 1) => pts.map(([a, b]) => [x + a * s * f, y + b * s]);
const SHADOW = 'rgb(168,156,140)';
const PENUMBRA = 'rgb(214,204,188)';

// 沿折线围出一条有宽度的轮廓（腿、杆、剑刃……）
function limb(pts, wd) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = Array.isArray(wd) ? lerp(wd[0], wd[1], i / (pts.length - 1)) : wd;
    L.push([pts[i][0] - dy * w / 2, pts[i][1] + dx * w / 2]);
    R.push([pts[i][0] + dy * w / 2, pts[i][1] - dx * w / 2]);
  }
  return [...L, ...R.reverse()];
}

// —— 造型 ——
// 马（侧面，面向右）
function horse(g, x, y, s, { dir = 1, w = 0.005, lit = 0, rear = 0 } = {}) {
  const P = (pts) => M(pts, x, y, s, dir);
  const wash = WASH.ochre, washA = 0.15 + 0.3 * lit;
  // 远侧两条腿（淡一点）
  for (const leg of [[[0.08, 0.42], [0.06, 0.22], [0.04, 0.02]], [[-0.18, 0.42], [-0.22, 0.22], [-0.16, 0.02]]]) {
    g.shape(P(limb(leg, 0.045)), w * 0.8, { wash, washA: washA * 0.6 });
  }
  const body = [[-0.36, 0.6], [-0.18, 0.63], [0.02, 0.6], [0.14, 0.66], [0.24, 0.82], [0.3, 0.93], [0.33, 0.99], [0.35, 0.93], [0.47, 0.74], [0.45, 0.68], [0.37, 0.7], [0.27, 0.68], [0.2, 0.52], [0.17, 0.42], [0.0, 0.38], [-0.22, 0.39], [-0.33, 0.43], [-0.39, 0.53]];
  g.shape(P(body), w, { wash, washA });
  for (const leg of [[[0.15, 0.44], [0.17, 0.22], [0.16, 0.02]], [[-0.27, 0.44], [-0.32, 0.22], [-0.27, 0.02]]]) {
    g.shape(P(limb(leg, 0.05)), w * 0.9, { wash, washA });
    const f = leg[2];
    g.fill(P([[f[0] - 0.03, f[1]], [f[0] - 0.03, f[1] + 0.03], [f[0] + 0.035, f[1] + 0.03], [f[0] + 0.04, f[1]]]), INK, { smooth: false });
  }
  // 鬃、尾
  for (let i = 0; i < 6; i++) g.stroke(P([[0.31 - i * 0.035, 0.94 - i * 0.055], [0.25 - i * 0.04, 0.9 - i * 0.06]]), w * 0.6);
  for (let i = 0; i < 4; i++) g.stroke(P([[-0.37, 0.58], [-0.45 - i * 0.012, 0.45], [-0.44 - i * 0.02, 0.25 + i * 0.02]]), w * 0.6, { taper: [0.05, 0.5] });
  g.dot(...P([[0.37, 0.84]])[0], 0.012 * s);
  g.stroke(P([[0.45, 0.71], [0.41, 0.72]]), w * 0.5);
  // 鞍带
  g.stroke(P([[-0.02, 0.61], [-0.0, 0.39]]), w * 0.6, { color: VERM });
}

// 斗鸡
function rooster(g, x, y, s, { dir = 1, w = 0.004, lit = 0 } = {}) {
  const P = (pts) => M(pts, x, y, s, dir);
  // 尾羽
  for (let i = 0; i < 4; i++) g.stroke(P([[-0.18, 0.5], [-0.32 - i * 0.03, 0.72 + i * 0.05], [-0.42 - i * 0.04, 0.6 + i * 0.07]]), w * (1.1 - i * 0.15), { taper: [0.05, 0.6] });
  const body = [[0.24, 0.66], [0.16, 0.58], [0.0, 0.58], [-0.18, 0.52], [-0.26, 0.4], [-0.16, 0.24], [0.04, 0.2], [0.2, 0.28], [0.26, 0.42], [0.3, 0.58]];
  g.shape(P(body), w, { wash: WASH.ochre, washA: 0.2 + 0.35 * lit });
  // 颈与头
  g.shape(P([[0.2, 0.55], [0.22, 0.72], [0.3, 0.84], [0.38, 0.83], [0.4, 0.76], [0.33, 0.68], [0.3, 0.55]]), w, { wash: WASH.ochre, washA: 0.25 + 0.3 * lit });
  g.fill(P([[0.27, 0.84], [0.29, 0.9], [0.32, 0.86], [0.35, 0.91], [0.37, 0.85], [0.39, 0.86], [0.38, 0.81]]), VERM);
  g.fill(P([[0.4, 0.79], [0.47, 0.77], [0.4, 0.75]]), INK, { smooth: false });
  g.fill(P(ellipsePts(0.37, 0.7, 0.02, 0.035, 10)), VERM);
  g.dot(...P([[0.35, 0.79]])[0], 0.012 * s);
  // 翅
  g.stroke(P([[0.12, 0.5], [-0.05, 0.46], [-0.16, 0.38]]), w * 0.7);
  g.stroke(P([[0.08, 0.42], [-0.06, 0.38]]), w * 0.5);
  // 腿
  for (const lx of [0.0, 0.08]) {
    g.stroke(P([[lx, 0.22], [lx + 0.02, 0.1], [lx, 0.0]]), w * 0.9);
    g.stroke(P([[lx, 0.0], [lx + 0.07, 0.0]]), w * 0.6); g.stroke(P([[lx, 0.0], [lx - 0.04, 0.01]]), w * 0.6);
  }
}

// 冕：冠上一块长板，前后垂旒
function crown(g, x, y, s, lit = 0) {
  const P = (pts) => M(pts, x, y, s);
  g.shape(P([[-0.18, 0.0], [-0.2, 0.32], [0.2, 0.32], [0.18, 0.0]]), 0.004, { smooth: false, wash: WASH.ink, washA: 0.35 + 0.2 * lit });
  g.shape(P([[-0.5, 0.34], [-0.5, 0.42], [0.5, 0.42], [0.5, 0.34]]), 0.004, { smooth: false, wash: WASH.verm, washA: 0.2 + 0.4 * lit });
  for (let i = 0; i < 5; i++) {
    for (const side of [-1, 1]) {
      const bx = side * (0.47 - i * 0.04);
      g.stroke(P([[bx, 0.34], [bx, 0.08]]), 0.0018);
      for (let k = 0; k < 4; k++) g.dot(...P([[bx, 0.3 - k * 0.065]])[0], 0.018 * s, k % 2 ? VERM : INK);
    }
  }
  g.stroke(P([[-0.22, 0.12], [0.22, 0.12]]), 0.003, { color: VERM });
}

// 璧：中间有孔的玉环
function bi(g, x, y, r, { wash = WASH.green, washA = 0.25, w = 0.004, grains = true } = {}) {
  g.circle(x, y, r, w, { wash, washA });
  const c = g.c;
  c.save(); c.globalCompositeOperation = 'destination-out';
  c.beginPath(); c.arc(g.X(x), g.Y(y), r * 0.36 * g.k, 0, Math.PI * 2); c.fill(); c.restore();
  g.stroke(ellipsePts(x, y, r * 0.36, r * 0.36, 30), w * 0.8);
  if (grains) for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + (i % 2) * 0.2, rr = r * (i % 2 ? 0.58 : 0.78);
    g.stroke(ellipsePts(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.06, r * 0.06, 8, 0.5, 5.6), w * 0.45, { alpha: 0.7 });
  }
}

// 芦苇一丛
function reeds(g, x0, x1, h, { seed = 3, lit = 0, w = 0.003 } = {}) {
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const n = Math.round((x1 - x0) / 0.022);
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + rnd() * 0.6) * (x1 - x0) / n;
    const hh = h * (0.55 + rnd() * 0.45), bend = (rnd() - 0.4) * 0.05;
    g.stroke([[x, 0], [x + bend * 0.4, hh * 0.6], [x + bend, hh]], w, { taper: [0.05, 0.4] });
    if (rnd() < 0.55) {
      const tip = [x + bend, hh];
      g.shape([[tip[0], tip[1]], [tip[0] + 0.012 + bend * 0.3, tip[1] + 0.03], [tip[0] + 0.004 + bend * 0.5, tip[1] + 0.06], [tip[0] - 0.006, tip[1] + 0.03]], w * 0.7, { wash: WASH.ochre, washA: 0.35 + 0.3 * lit });
    }
    const ly = hh * (0.3 + rnd() * 0.3), side = rnd() < 0.5 ? -1 : 1;
    g.stroke([[x + bend * 0.2, ly], [x + side * 0.03, ly + 0.03], [x + side * 0.05, ly + 0.02]], w * 0.8, { taper: [0.1, 0.7] });
  }
  g.wash([[x0, 0], [x0, h * 0.3], [x1, h * 0.3], [x1, 0]], WASH.green, 0.08 + 0.2 * lit, { blur: 6 });
}

// 剑：剑身轮廓 + 格 + 柄
function sword(g, h, { blade = 0.06, guard = 0.14, hilt = 0.1, lit = 0, w = 0.0045, inner } = {}) {
  const b0 = hilt + 0.03;
  const bl = [[-blade / 2, b0], [-blade / 2, h - blade * 1.6], [0, h], [blade / 2, h - blade * 1.6], [blade / 2, b0]];
  g.shape(bl, w, { smooth: false, wash: WASH.water, washA: 0.12 + 0.2 * lit });
  g.stroke([[0, b0 + 0.01], [0, h - 0.02]], w * 0.45, { alpha: 0.6 });
  if (inner) inner(g, b0, h);
  // 格（镡）
  g.shape([[-guard / 2, b0 - 0.006], [-guard / 2 - 0.008, b0 + 0.008], [-guard * 0.22, b0 + 0.018], [guard * 0.22, b0 + 0.018], [guard / 2 + 0.008, b0 + 0.008], [guard / 2, b0 - 0.006], [guard * 0.14, b0 - 0.014], [-guard * 0.14, b0 - 0.014]], w, { smooth: false, wash: WASH.ochre, washA: 0.35 + 0.3 * lit });
  g.dot(0, b0 + 0.002, 0.006, VERM);
  // 柄与首
  g.shape([[-0.014, 0.025], [-0.014, b0 - 0.012], [0.014, b0 - 0.012], [0.014, 0.025]], w * 0.8, { smooth: false, wash: WASH.ink, washA: 0.35 });
  for (let k = 0; k < 4; k++) g.line(-0.014, 0.04 + k * (b0 - 0.06) / 4, 0.014, 0.05 + k * (b0 - 0.06) / 4, w * 0.4);
  g.circle(0, 0.018, 0.02, w * 0.8, { wash: WASH.ochre, washA: 0.35 });
  // 剑穗
  g.stroke([[0, 0.0], [-0.02, -0.0], [-0.03, 0.03], [-0.025, 0.07]], w * 0.6, { color: VERM, smooth: true });
}

// 乌鸦（翅膀）
const crowWing = (g) => {
  g.shape([[-0.008, 0.0], [-0.016, 0.03], [-0.012, 0.06], [0.0, 0.085], [0.008, 0.07], [0.012, 0.04], [0.01, 0.0]], 0.0025, { fill: 'rgb(70,62,56)' });
  for (let i = 0; i < 3; i++) g.stroke([[0.0, 0.05 + i * 0.01], [0.008, 0.06 + i * 0.008]], 0.0015, { color: PAPER, alpha: 0.6 });
};
const crowBody = (g) => {
  g.shape([[0, 0.0], [0.009, 0.02], [0.008, 0.05], [0, 0.068], [-0.008, 0.05], [-0.009, 0.02]], 0.0025, { fill: 'rgb(60,54,48)' });
  g.fill([[0, 0.068], [0.004, 0.08], [-0.004, 0.08]], INK, { smooth: false });
};

// 蚂蚁
const ant = (g) => {
  g.fill(ellipsePts(-0.012, 0.006, 0.007, 0.005, 10), INK);
  g.fill(ellipsePts(0.0, 0.006, 0.005, 0.004, 10), INK);
  g.fill(ellipsePts(0.01, 0.007, 0.004, 0.0035, 10), INK);
  for (const lx of [-0.004, 0.0, 0.004]) { g.stroke([[lx, 0.006], [lx - 0.006, 0.0]], 0.0012, { smooth: false }); g.stroke([[lx, 0.006], [lx + 0.006, 0.0]], 0.0012, { smooth: false }); }
  g.stroke([[0.013, 0.009], [0.019, 0.016]], 0.001, { smooth: false });
};

// —— 二十七 · 寓言：罔两问影 ——
const ch27 = {
  ground(g) {
    // 以人为表，脚下一圈刻度，像日晷
    const cx = -0.04, cy = 0.1;
    g.stroke(ellipsePts(cx, cy, 0.3, 0.3, 80), 0.002, { alpha: 0.25, closed: true });
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, r0 = i % 6 ? 0.285 : 0.27;
      g.stroke([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * 0.3, cy + Math.sin(a) * 0.3]], 0.002, { alpha: 0.35, smooth: false });
    }
    // 日行的虚线
    for (let i = 0; i < 18; i++) { const t = i / 18, x = -0.4 + t * 0.8; if (i % 2 === 0) g.stroke([[x, 0.47 - Math.sin(t * Math.PI) * 0.02], [x + 0.044, 0.47 - Math.sin((t + 0.055) * Math.PI) * 0.02]], 0.002, { alpha: 0.3, smooth: false }); }
    g.text('影', 0.24, -0.12, 0.026, { color: 'rgba(40,34,30,.45)' });
    g.text('淡影', -0.34, -0.15, 0.024, { color: 'rgba(40,34,30,.4)' });
  },
  build(k) {
    const FX = -0.04, FZ = -0.1;
    // 罔两（淡影）与景（影子）：平躺在纸面上，绕脚转动
    const drawShape = (color, fat) => (g) => {
      g.c.save();
      person(g, 0, 0, 0.26, { pose: 'stand', w: fat });
      g.c.globalCompositeOperation = 'source-in';
      g.c.fillStyle = color; g.c.fillRect(0, 0, g.c.canvas.width, g.c.canvas.height);
      g.c.restore();
      if (g.lit > 0.05 && color === PENUMBRA) {
        g.c.save(); g.c.setLineDash([6, 5]); g.c.globalAlpha = g.lit;
        g.c.strokeStyle = VERM; g.c.lineWidth = 2;
        g.c.strokeRect(g.X(-0.085), g.Y(0.285), 0.17 * g.k, 0.28 * g.k);
        g.c.restore();
      }
    };
    const pen = k.card({ w: 0.18, h: 0.29, x: FX, z: FZ, stand: false, cut: false, delay: 0.5, draw: drawShape(PENUMBRA, 0.04) });
    const shd = k.card({ w: 0.18, h: 0.29, x: FX, z: FZ, y: 0.0008, stand: false, cut: false, delay: 0.6, draw: drawShape(SHADOW, 0.006) });
    const fig = k.card({ w: 0.16, h: 0.28, x: FX, z: FZ, delay: 0.3, draw: (g) => person(g, 0, 0, 0.26, { pose: 'stand', w: 0.0045, lit: g.lit }) });
    // 日
    const sun = k.sprite({ w: 0.11, h: 0.11, delay: 0.2, draw: (g) => {
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.stroke([[Math.cos(a) * 0.036, 0.055 + Math.sin(a) * 0.036], [Math.cos(a) * 0.05, 0.055 + Math.sin(a) * 0.05]], 0.003, { color: VERM, smooth: false }); }
      g.circle(0, 0.055, 0.028, 0.003, { fill: 'rgb(214,120,84)', wash: WASH.verm, washA: 0.3 * g.lit });
    } });
    // 火：一只火盆
    const fire = k.card({ w: 0.15, h: 0.08, x: 0.32, z: 0.08, delay: 0.9, draw: (g) => {
      g.shape([[-0.06, 0.065], [-0.045, 0.03], [0.045, 0.03], [0.06, 0.065]], 0.0045, { smooth: false, wash: WASH.ink, washA: 0.3 + 0.3 * g.lit });
      for (let i = 0; i < 4; i++) g.line(-0.04 + i * 0.027, 0.06, -0.04 + i * 0.027, 0.035, 0.002, { alpha: 0.6 });
      g.line(-0.035, 0.03, -0.05, 0.0, 0.005); g.line(0.035, 0.03, 0.05, 0.0, 0.005); g.line(0, 0.03, 0, 0.0, 0.005);
    } });
    const flame = k.sprite({ w: 0.1, h: 0.11, delay: 1.0, pad: 0.006, draw: (g) => {
      g.shape([[0, 0.0], [0.022, 0.012], [0.026, 0.035], [0.012, 0.05], [0.014, 0.07], [0, 0.056], [-0.01, 0.074], [-0.02, 0.045], [-0.026, 0.02], [-0.018, 0.006]], 0.003, { fill: 'rgb(232,170,96)', wash: WASH.verm, washA: 0.4 });
      g.shape([[0, 0.004], [0.01, 0.015], [0.006, 0.032], [0, 0.04], [-0.008, 0.028], [-0.008, 0.012]], 0.002, { fill: 'rgb(246,222,160)' });
    } });
    flame.obj.position.set(0.32, 0.06, 0.07);
    flame.obj.scale.setScalar(1.4);
    k.hot(fig, 'jing'); k.hot(shd, 'jing'); k.hot(pen, 'wang');
    k.hot(sun, 'huo'); k.hot(fire, 'huo'); k.hot(flame, 'huo');

    let bob = -9, ask = -9, dark = -9;
    let ry = 0, len = 0.8;
    tilt(k);
    return {
      hit(key) { if (key === 'jing') bob = k.T; if (key === 'wang') ask = k.T; if (key === 'huo') dark = k.T; },
      update(T, dt) {
        // 日：缓缓从左到右；循环里有一段夜，火盆亮起
        const PER = 16, s = (T % PER) / PER;
        const day = s < 0.68;
        const tDay = clamp(s / 0.68);
        const sx = -0.4 + tDay * 0.8, sy = 0.1 + Math.sin(tDay * Math.PI) * 0.14;
        sun.obj.position.set(sx, sy, -0.34);
        const sunUp = smooth(win(s, 0.0, 0.05)) * (1 - smooth(win(s, 0.62, 0.68)));
        const fireUp = smooth(win(s, 0.68, 0.74)) * (1 - smooth(win(s, 0.94, 1)));
        // 点“火与日”：光熄灭两秒，影子随之消失
        const dk = T - dark;
        const out = dk > 0 && dk < 3 ? 1 - Math.sin(clamp(dk / 3) * Math.PI) : 1;
        fade(sun, sunUp * out + 0.15 * (1 - sunUp));
        flame.obj.scale.set(1.4 * (1 + Math.sin(T * 13) * 0.08), 1.4 * (0.4 + 0.6 * fireUp * out) * (1 + Math.sin(T * 17) * 0.12), 1);
        fade(flame, Math.max(0.0, fireUp * out));
        // 影子朝向：背离光源
        let lx, lz, elev;
        if (day) { lx = sx - FX; lz = -0.34 - FZ; elev = sy + 0.1; }
        else { lx = 0.32 - FX; lz = 0.08 - FZ; elev = 0.06; }
        const want = Math.atan2(-lx, -lz) + Math.PI;
        let d = want - ry; d = Math.atan2(Math.sin(d), Math.cos(d));
        ry += d * Math.min(1, dt * 3);
        const strength = day ? sunUp : fireUp;
        const wantLen = (day ? clamp(0.5 + (0.38 - elev) * 2.2, 0.45, 1.0) : 0.95) * strength * out;
        len += (wantLen - len) * Math.min(1, dt * 4);
        // 俯仰：影子跟着人一起
        const bt = T - bob;
        const bow = bt > 0 && bt < 2.4 ? Math.sin(bt / 2.4 * Math.PI * 2) * 0.35 : 0;
        fig.lean = -0.3 + bow;
        const askT = T - ask;
        const wob = askT > 0 && askT < 2 ? Math.sin(askT * 9) * 0.06 * (1 - askT / 2) : 0;
        for (const it of [shd, pen]) {
          it.hinge.rotation.y = ry + (it === pen ? wob : 0);
          const L = Math.max(0.02, len * (1 - bow * 0.8));
          it.pivot.scale.set(it === pen ? 1.05 + Math.abs(wob) : 1, L * (it === pen ? 1.06 : 1), 1);
        }
        shd.hinge.position.y = 0.0008;
      },
    };
  },
};

// —— 二十八 · 让王：天下让来让去 ——
const ch28 = {
  ground(g) {
    // 颍水
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([0.16 + Math.sin(t * 5) * 0.04 + t * 0.2, 0.42 - t * 0.5]); }
    g.stroke(pts, 0.0025, { alpha: 0.35 });
    g.stroke(pts.map(([a, b]) => [a + 0.06, b]), 0.0025, { alpha: 0.35 });
    g.text('箕山', -0.38, 0.5, 0.024, { color: 'rgba(40,34,30,.45)' });
    g.text('颍水', 0.42, 0.0, 0.024, { color: 'rgba(40,34,30,.45)' });
  },
  build(k) {
    k.card({ w: 0.86, h: 0.16, z: -0.4, delay: 0.1, draw: (g) => mountains(g, -0.43, 0.43, 0, 0.16, { peaks: 3, seed: 21, w: 0.0045, lit: g.lit }) });
    const water = k.card({ w: 0.24, h: 0.05, x: 0.3, z: -0.01, delay: 0.5, draw: (g) => {
      g.paper([[-0.12, 0], [-0.12, 0.03], [0.12, 0.03], [0.12, 0]], { smooth: false });
      g.wash([[-0.12, 0], [-0.12, 0.03], [0.12, 0.03], [0.12, 0]], WASH.water, 0.25 + 0.3 * g.lit, { smooth: false });
      for (let r = 0; r < 2; r++) g.waves(-0.11, 0.11, 0.025 - r * 0.012, 0.004, 0.04, 0.0025);
    } });
    const yao = k.card({ w: 0.2, h: 0.3, x: -0.05, z: -0.12, delay: 0.3, draw: (g) => person(g, -0.025, 0, 0.27, { pose: 'point', hat: true, beard: true, w: 0.0045, robe: WASH.verm, lit: g.lit }) });
    const xu = k.card({ w: 0.2, h: 0.21, x: 0.29, z: -0.13, delay: 0.6, draw: (g) => person(g, -0.01, 0, 0.27, { pose: 'sit', face: -1, w: 0.0045, lit: g.lit, robe: WASH.green }) });
    const zi = k.card({ w: 0.2, h: 0.21, x: -0.32, z: 0.05, delay: 0.8, draw: (g) => {
      person(g, -0.03, 0, 0.26, { pose: 'sit', w: 0.0045, lit: g.lit, beard: true });
      g.stroke([[0.08, 0.0], [0.06, 0.2]], 0.004);   // 拐杖
    } });
    const cr = k.sprite({ w: 0.13, h: 0.07, pad: 0.008, delay: 1.1, draw: (g) => crown(g, 0, 0.004, 0.12, g.lit) });
    const puff = k.sprite({ w: 0.08, h: 0.05, pad: 0.006, delay: 1.2, draw: (g) => g.cloud(0, 0.025, 0.025, 0.0025) });
    const splash = k.sprite({ w: 0.1, h: 0.06, pad: 0.006, delay: 1.2, draw: (g) => {
      for (let i = 0; i < 5; i++) { const a = 0.5 + i * 0.5; g.stroke([[Math.cos(a) * 0.01, 0.005 + Math.sin(a) * 0.006], [Math.cos(a) * 0.035, 0.008 + Math.sin(a) * 0.035]], 0.0025, { color: 'rgb(96,132,150)' }); }
    } });
    k.hot(xu, 'xu'); k.hot(water, 'xu'); k.hot(zi, 'zi'); k.hot(cr, 'tianxia'); k.hot(yao, 'tianxia');

    const A = [0.035, 0.17, -0.115], B = [0.29, 0.24, -0.125], C = [-0.32, 0.22, 0.055];
    const hop = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t) + Math.sin(t * Math.PI) * 0.12, lerp(p[2], q[2], t)];
    let xuHit = -9, ziHit = -9, txHit = -9;
    tilt(k);
    return {
      hit(key) { if (key === 'xu') xuHit = k.T; if (key === 'zi') ziHit = k.T; if (key === 'tianxia') txHit = k.T; },
      update(T, dt) {
        const PER = 12, s = T < 1.5 ? 0 : (T - 1.5) % PER;
        let p = A, xuTurn = 0, ziShake = 0;
        if (s < 2) p = A;
        else if (s < 3) p = hop(A, B, easeInOut(s - 2));
        else if (s < 4.2) { p = B; xuTurn = smooth(win(s, 3, 3.5)); }
        else if (s < 5.2) { p = hop(B, A, easeInOut(s - 4.2)); xuTurn = 1 - smooth(win(s, 4.6, 5.2)); }
        else if (s < 6.2) p = A;
        else if (s < 7.2) p = hop(A, C, easeInOut(s - 6.2));
        else if (s < 8.6) { p = C; ziShake = Math.sin((s - 7.2) * 14) * (1 - (s - 7.2) / 1.4); }
        else if (s < 9.6) p = hop(C, A, easeInOut(s - 8.6));
        // 点“天下”：冕高高浮起，没人接，又慢慢落回
        const tt = T - txHit;
        let lift = 0, spin = 0;
        if (tt > 0 && tt < 3) { lift = Math.sin(clamp(tt / 3) * Math.PI) * 0.22; spin = easeInOut(clamp(tt / 3)) * Math.PI * 2; }
        cr.obj.position.set(p[0], p[1] + lift, p[2]);
        cr.obj.rotation.y = spin;
        // 许由背过身去（翻转纸片就是转身）
        const xt = T - xuHit;
        if (xt > 0 && xt < 2.5) xuTurn = Math.max(xuTurn, Math.sin(clamp(xt / 2.5) * Math.PI) > 0.2 ? 1 : 0);
        xu.hinge.rotation.y = lerp(xu.hinge.rotation.y, xuTurn * Math.PI, Math.min(1, dt * 7));
        splash.obj.position.set(0.3, 0.02, 0.0);
        fade(splash, xt > 0 && xt < 2.5 ? Math.abs(Math.sin(xt * 5)) : (xuTurn > 0.5 ? 0.6 : 0));
        // 子州支父摇头、咳嗽
        const zt = T - ziHit;
        if (zt > 0 && zt < 1.6) ziShake = Math.sin(zt * 16) * (1 - zt / 1.6);
        zi.hinge.rotation.z = ziShake * 0.06;
        const cough = Math.max(zt > 0 && zt < 1.6 ? 1 : 0, ziShake !== 0 ? 1 : 0);
        const ph = (T * 0.8) % 1;
        puff.obj.position.set(-0.26 + ph * 0.05, 0.2 + ph * 0.08, 0.06);
        puff.obj.scale.setScalar(0.6 + ph * 0.8);
        fade(puff, cough * (1 - ph));
      },
    };
  },
};

// —— 二十九 · 盗跖：执辔三失 ——
const ch29 = {
  ground(g) {
    g.stroke([[-0.44, -0.03], [-0.1, 0.0], [0.2, -0.02], [0.44, 0.01]], 0.0022, { alpha: 0.3 });
    for (let i = 0; i < 8; i++) g.stroke([[-0.4 + i * 0.1, 0.0], [-0.37 + i * 0.1, -0.005]], 0.002, { alpha: 0.25 });
    g.text('泰山南边', -0.32, 0.47, 0.022, { color: 'rgba(40,34,30,.4)' });
  },
  build(k) {
    k.card({ w: 0.88, h: 0.22, z: -0.4, delay: 0.1, draw: (g) => {
      mountains(g, -0.44, 0.44, 0, 0.22, { peaks: 3, seed: 7, w: 0.0045, lit: g.lit });
      // 山上的营寨与小人
      for (const [x, y] of [[-0.25, 0.1], [0.05, 0.13], [0.28, 0.09]]) {
        g.shape([[x - 0.035, y], [x - 0.035, y + 0.025], [x, y + 0.05], [x + 0.035, y + 0.025], [x + 0.035, y]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.3 });
      }
      for (let i = 0; i < 7; i++) person(g, -0.15 + i * 0.045, 0.04 + (i % 2) * 0.012, 0.05, { pose: 'arms', face: i % 2 ? 1 : -1, w: 0.0022 });
    } });
    const flags = [[-0.3, -0.37], [0.18, -0.38]].map(([x, z], i) => {
      const f = k.sprite({ w: 0.1, h: 0.16, pad: 0.008, delay: 0.4 + i * 0.1, draw: (g) => {
        g.stroke([[-0.04, 0], [-0.04, 0.15]], 0.003);
        g.shape([[-0.04, 0.15], [0.045, 0.14], [0.03, 0.115], [0.045, 0.09], [-0.04, 0.095]], 0.003, { fill: 'rgb(196,98,70)' });
        g.text('跖', 0.0, 0.12, 0.022, { color: PAPER });
      } });
      f.obj.position.set(x, 0.1, z);
      return f;
    });
    const zhi = k.card({ w: 0.24, h: 0.3, x: -0.3, z: -0.16, delay: 0.5, draw: (g) => person(g, -0.03, 0, 0.28, { pose: 'arms', beard: true, w: 0.005, lit: g.lit, robe: WASH.ink }) });
    // 车：车厢、车轮、车辕
    const box = k.card({ w: 0.24, h: 0.13, x: 0.08, z: 0.06, delay: 0.7, draw: (g) => {
      g.shape([[-0.09, 0.06], [-0.09, 0.115], [0.07, 0.115], [0.07, 0.06]], 0.004, { smooth: false, wash: WASH.ochre, washA: 0.3 + 0.3 * g.lit });
      for (let i = 0; i < 6; i++) g.line(-0.08 + i * 0.03, 0.065, -0.08 + i * 0.03, 0.11, 0.002);
      g.stroke([[0.06, 0.07], [0.12, 0.06], [0.115, 0.03]], 0.0045);   // 辕
    } });
    const axle = k.group();
    const wheel = k.sprite({ w: 0.13, h: 0.13, pad: 0.006, delay: 0.75, parent: axle, draw: (g) => {
      g.circle(0, 0.065, 0.06, 0.0045, { fill: null });
      g.stroke(ellipsePts(0, 0.065, 0.052, 0.052, 36), 0.0025);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.line(Math.cos(a) * 0.012, 0.065 + Math.sin(a) * 0.012, Math.cos(a) * 0.052, 0.065 + Math.sin(a) * 0.052, 0.0022); }
      g.circle(0, 0.065, 0.012, 0.003, { wash: WASH.ochre, washA: 0.5 });
    } });
    // 孔子站在车上
    const kong = k.sprite({ w: 0.14, h: 0.23, delay: 0.85, draw: (g) => person(g, -0.01, 0, 0.21, { pose: 'point', hat: true, w: 0.004, lit: g.lit, robe: g.lit > 0.05 ? WASH.ink : null }) });
    const horse1 = k.card({ w: 0.27, h: 0.23, x: 0.32, z: 0.08, delay: 0.95, draw: (g) => horse(g, -0.01, 0, 0.22, { lit: g.lit, w: 0.0042 }) });
    const reins = k.line([[0, 0, 0], [0, 0, 0]], { width: 1.5, delay: 1.3, dur: 0.4 });
    k.hot(box, 'che'); k.hot(wheel, 'che'); k.hot(horse1, 'che'); k.hot(zhi, 'zhi'); k.hot(kong, 'kong');
    let cheHit = -9, zhiHit = -9, kongHit = -9;
    const pts = [];
    tilt(k);
    return {
      hit(key) { if (key === 'che') cheHit = k.T; if (key === 'zhi') zhiHit = k.T; if (key === 'kong') kongHit = k.T; },
      update(T) {
        // 马不安地踏步，车一顿一顿
        const ct = T - cheHit;
        const rear = ct > 0 && ct < 1.8 ? Math.sin(clamp(ct / 1.8) * Math.PI) : 0;
        horse1.hinge.rotation.z = rear * 0.35 + Math.sin(T * 3.1) * 0.015;
        horse1.hinge.position.y = rear * 0.03;
        horse1.hinge.position.x = 0.32 + rear * 0.02;
        const jolt = Math.max(0, Math.sin(T * 1.7)) * 0.004;
        axle.position.set(0.04, 0.065 + jolt, 0.075);
        wheel.obj.position.set(0, -0.065, 0);
        axle.rotation.z = -T * (0.4 + rear * 3);
        box.hinge.position.y = jolt;
        // 孔子：发抖，三次没抓住缰绳
        const kt = T - kongHit;
        const tremble = (kt > 0 && kt < 2.5 ? 1 : 0.25) * Math.sin(T * 40) * 0.006;
        kong.obj.position.set(0.05 + tremble, 0.065 + jolt, 0.045);
        kong.obj.rotation.z = (kt > 0 && kt < 2.5 ? Math.sin(kt * 6) * 0.08 : 0);
        const PER = 6, s = T % PER;
        // 三次失手：手端落下又抓起
        let drop = 0;
        for (let i = 0; i < 3; i++) drop = Math.max(drop, Math.sin(clamp((s - 0.6 - i * 1.4) / 1.0) * Math.PI));
        const hand = [0.05 + 0.31 * 0.21, 0.065 + 0.63 * 0.21 + jolt - drop * 0.08, 0.045];
        const my = 0.7 * 0.22 + rear * 0.12;
        const mouth = [0.31 + 0.44 * 0.22 * Math.cos(horse1.hinge.rotation.z), my * Math.cos(0.3), 0.08 - my * Math.sin(0.3)];
        pts.length = 0;
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          pts.push([lerp(hand[0], mouth[0], t), lerp(hand[1], mouth[1], t) - Math.sin(t * Math.PI) * (0.02 + drop * 0.05), lerp(hand[2], mouth[2], t)]);
        }
        reins.set(pts);
        // 盗跖：怒目大喝，旗子猎猎
        const zt = T - zhiHit;
        zhi.hinge.position.y = zt > 0 && zt < 1.2 ? Math.abs(Math.sin(zt * 8)) * 0.02 * (1 - zt / 1.2) : 0;
        flags.forEach((f, i) => { f.obj.rotation.y = Math.sin(T * 2.4 + i) * 0.5 + (zt > 0 && zt < 2 ? Math.sin(zt * 12) * 0.4 : 0); });
      },
    };
  },
};

// —— 三十 · 说剑：三把剑 ——
const ch30 = {
  ground(g) {
    g.text('诸侯的剑', -0.28, -0.19, 0.022, { color: 'rgba(40,34,30,.5)' });
    g.text('天子的剑', 0.0, -0.19, 0.024, { color: 'rgba(176,67,45,.7)' });
    g.text('平民的剑', 0.28, -0.19, 0.022, { color: 'rgba(40,34,30,.5)' });
    g.stroke([[-0.42, -0.15], [0.42, -0.15]], 0.002, { alpha: 0.25 });
  },
  build(k) {
    const tz = k.card({ w: 0.2, h: 0.46, x: 0, z: -0.16, delay: 0.3, draw: (g) => sword(g, 0.45, { blade: 0.085, guard: 0.18, hilt: 0.09, lit: g.lit, inner: (g2, b0, h) => {
      // 剑身上是山河：燕谿石城为锋，齐岱为锷
      const top = h - 0.14;
      for (let i = 0; i < 4; i++) {
        const y = b0 + 0.02 + i * (top - b0) / 4;
        const pts = [];
        for (let k2 = 0; k2 <= 8; k2++) { const t = k2 / 8; pts.push([-0.036 + t * 0.072, y + Math.pow(Math.abs(Math.sin(t * Math.PI * 2 + i)), 1.5) * 0.04]); }
        g2.stroke(pts, 0.0025, { color: g2.lit > 0.1 ? 'rgb(90,110,70)' : INK });
        g2.wash([...pts, [0.036, y], [-0.036, y]], WASH.green, 0.1 + 0.35 * g2.lit, { blur: 2 });
      }
      for (let i = 0; i < 3; i++) g2.waves(-0.03, 0.03, b0 + 0.015 + i * 0.1, 0.003, 0.02, 0.0015, { alpha: 0.6 });
      g2.dot(0, top + 0.05, 0.006, VERM);
    } }) });
    const zh = k.card({ w: 0.16, h: 0.38, x: -0.28, z: -0.12, delay: 0.5, draw: (g) => sword(g, 0.37, { blade: 0.065, guard: 0.14, hilt: 0.08, lit: g.lit, inner: (g2, b0, h) => {
      // 剑身由一个个直立的人组成
      for (let i = 0; i < 4; i++) person(g2, -0.004, b0 + 0.01 + i * 0.056, 0.05, { pose: 'stand', w: 0.0018, lit: g2.lit, robe: WASH.ochre });
    } }) });
    const sr = k.card({ w: 0.12, h: 0.24, x: 0.28, z: -0.12, delay: 0.7, draw: (g) => sword(g, 0.23, { blade: 0.04, guard: 0.08, hilt: 0.06, lit: g.lit }) });
    const cockA = k.sprite({ w: 0.13, h: 0.11, delay: 1.0, draw: (g) => rooster(g, 0, 0, 0.1, { dir: 1, lit: g.lit }) });
    const cockB = k.sprite({ w: 0.13, h: 0.11, delay: 1.05, draw: (g) => rooster(g, 0, 0, 0.1, { dir: -1, lit: g.lit }) });
    const feather = k.sprite({ w: 0.04, h: 0.03, pad: 0.004, delay: 1.1, draw: (g) => { g.stroke([[-0.012, 0.005], [0, 0.015], [0.014, 0.02]], 0.003, { color: 'rgb(180,120,70)' }); } });
    k.hot(tz, 'tianzi'); k.hot(zh, 'zhuhou'); k.hot(sr, 'shuren'); k.hot(cockA, 'shuren'); k.hot(cockB, 'shuren');
    let tzHit = -9, zhHit = -9, srHit = -9;
    tilt(k);
    return {
      hit(key) { if (key === 'tianzi') tzHit = k.T; if (key === 'zhuhou') zhHit = k.T; if (key === 'shuren') srHit = k.T; },
      update(T) {
        const sw = [tz, zh, sr];
        sw.forEach((it, i) => {
          it.hinge.rotation.z = Math.sin(T * 0.9 + i * 2) * 0.02;
          // 剑光：依次掠过
          const gl = Math.max(0, Math.sin(T * 0.8 - i * 1.3)) ** 12;
          it.mat.emissiveIntensity += gl * 0.25;
        });
        // 天子剑：升起、缓缓自转一周
        const tt = T - tzHit;
        if (tt > 0 && tt < 4) {
          const p = clamp(tt / 4);
          tz.hinge.position.y = Math.sin(p * Math.PI) * 0.12;
          tz.hinge.rotation.y = easeInOut(p) * Math.PI * 2;
        } else { tz.hinge.position.y = 0; tz.hinge.rotation.y = 0; }
        const zt = T - zhHit;
        zh.hinge.position.y = zt > 0 && zt < 2 ? Math.sin(clamp(zt / 2) * Math.PI) * 0.05 : 0;
        // 斗鸡：时不时扑在一起
        const st = T - srHit;
        const fierce = st > 0 && st < 3 ? 1 : 0;
        const ph = (T * (fierce ? 2.2 : 0.7)) % 1;
        const clash = Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2)), 3);
        const gap = 0.075 - clash * 0.04;
        cockA.obj.position.set(0.28 - gap, clash * 0.025 * (fierce ? 2 : 1), 0.06);
        cockB.obj.position.set(0.28 + gap, clash * 0.02 * (fierce ? 2 : 1), 0.06);
        cockA.obj.rotation.z = clash * 0.25; cockB.obj.rotation.z = -clash * 0.25;
        feather.obj.position.set(0.28 + Math.sin(T * 3) * 0.02, 0.05 + ((T * 0.7) % 1) * 0.06, 0.07);
        feather.obj.rotation.z = T * 3;
        fade(feather, fierce * (1 - ((T * 0.7) % 1)));
      },
    };
  },
};

// —— 三十一 · 渔父：刺船而去，延缘苇间 ——
const ch31 = {
  ground(g) {
    // 水面
    for (let r = 0; r < 6; r++) g.waves(-0.08 + (r % 2) * 0.03, 0.42, -0.15 + r * 0.075, 0.004, 0.06, 0.0018, { alpha: 0.28 });
    // 逃影者留下的脚印
    for (let i = 0; i < 5; i++) { const x = -0.44 + i * 0.045, y = -0.2 + (i % 2) * 0.012; g.fill(ellipsePts(x, y, 0.008, 0.004, 10), 'rgba(40,34,30,.25)'); }
    g.text('杏坛', -0.4, 0.4, 0.022, { color: 'rgba(40,34,30,.45)' });
  },
  build(k) {
    const altar = k.card({ w: 0.36, h: 0.3, x: -0.26, z: -0.34, delay: 0.1, draw: (g) => {
      tree(g, 0.06, 0.07, 0.24, { seed: 5, lit: g.lit });
      // 杏花
      for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.04 + (i % 5) * 0.012; g.dot(0.06 + Math.cos(a) * r * 1.4, 0.24 + Math.sin(a) * r * 0.8, 0.005, i % 3 ? VERM : 'rgb(230,160,150)'); }
      g.shape([[-0.17, 0], [-0.15, 0.07], [0.17, 0.07], [0.17, 0]], 0.004, { smooth: false, wash: WASH.ochre, washA: 0.25 });
      for (let i = 0; i < 3; i++) g.line(-0.17, 0.02 + i * 0.02, 0.17, 0.02 + i * 0.02, 0.0018, { alpha: 0.5 });
      person(g, -0.08, 0.07, 0.12, { pose: 'sit', hat: true, w: 0.0032 });
      g.shape([[-0.05, 0.1], [0.03, 0.105], [0.03, 0.095], [-0.05, 0.09]], 0.0025, { smooth: false, wash: WASH.ochre, washA: 0.5 });  // 琴
    } });
    const reedBack = k.card({ w: 0.38, h: 0.28, x: 0.27, z: -0.36, delay: 0.3, draw: (g) => reeds(g, -0.18, 0.18, 0.27, { seed: 9, lit: g.lit }) });
    const reedMid = k.card({ w: 0.24, h: 0.22, x: 0.36, z: -0.16, delay: 0.45, draw: (g) => reeds(g, -0.11, 0.11, 0.19, { seed: 4, lit: g.lit }) });
    const reedFront = k.card({ w: 0.2, h: 0.13, x: 0.38, z: 0.16, delay: 0.6, draw: (g) => reeds(g, -0.09, 0.09, 0.11, { seed: 13, lit: g.lit }) });
    // 船与渔父
    const boatG = k.group();
    const boat = k.sprite({ w: 0.26, h: 0.06, delay: 0.7, parent: boatG, draw: (g) => {
      g.shape([[-0.12, 0.04], [-0.08, 0.008], [0.07, 0.006], [0.125, 0.045], [0.06, 0.03], [-0.06, 0.03]], 0.004, { wash: WASH.ochre, washA: 0.3 + 0.3 * g.lit });
      g.stroke([[-0.07, 0.022], [0.07, 0.02]], 0.0022, { alpha: 0.7 });
      g.shape([[0.02, 0.03], [0.03, 0.05], [0.06, 0.05], [0.065, 0.03]], 0.0025, { smooth: false });   // 鱼篓
    } });
    const fisher = k.sprite({ w: 0.16, h: 0.17, delay: 0.8, parent: boatG, draw: (g) => {
      person(g, -0.01, 0.0, 0.15, { pose: 'stand', face: 1, beard: true, w: 0.0035, lit: g.lit, robe: WASH.water });
      g.stroke([[0.05, 0.13], [-0.07, 0.0]], 0.0035);   // 篙
      // 斗笠
      g.shape([[-0.04, 0.142], [0.0, 0.165], [0.05, 0.142]], 0.003, { wash: WASH.ochre, washA: 0.5 });
    } });
    fisher.obj.position.set(-0.02, 0.022, 0.002);
    const ripples = [0, 1, 2].map(() => {
      const ring = [];
      for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; ring.push([Math.cos(a) * 0.05, 0.002, Math.sin(a) * 0.025]); }
      return k.line(ring, { width: 1.2, opacity: 0.5, delay: 1.0, dur: 0.1 });
    });
    // 畏影恶迹的人：跑，影子紧跟；进了树荫，坐下，影子没了
    const shade = k.card({ w: 0.2, h: 0.12, x: -0.16, z: 0.18, stand: false, cut: false, delay: 0.5, draw: (g) => { g.fill(ellipsePts(0, 0.06, 0.095, 0.055, 30), 'rgb(200,190,172)'); } });
    const willow = k.card({ w: 0.16, h: 0.15, x: -0.16, z: 0.1, delay: 0.6, draw: (g) => tree(g, 0, 0, 0.15, { seed: 8, lit: g.lit, leaves: 'round' }) });
    const runner = k.sprite({ w: 0.11, h: 0.14, delay: 0.9, draw: (g) => person(g, 0, 0, 0.13, { pose: 'walk', face: -1, w: 0.0035, lit: g.lit }) });
    const sitter = k.sprite({ w: 0.11, h: 0.1, delay: 0.9, draw: (g) => person(g, -0.012, 0, 0.13, { pose: 'sit', face: 1, w: 0.0035, lit: g.lit }) });
    const rshadow = k.card({ w: 0.11, h: 0.14, x: 0, z: 0, stand: false, cut: false, delay: 0.9, draw: (g) => {
      g.c.save(); person(g, 0, 0, 0.13, { pose: 'walk', face: -1, w: 0.006 });
      g.c.globalCompositeOperation = 'source-in'; g.c.fillStyle = SHADOW; g.c.fillRect(0, 0, g.c.canvas.width, g.c.canvas.height); g.c.restore();
    } });
    k.hot(fisher, 'yu'); k.hot(boat, 'chuan'); k.hot(runner, 'ying'); k.hot(rshadow, 'ying'); k.hot(sitter, 'ying');
    let yuHit = -9, yingHit = 1.0, chHit = -9;
    tilt(k);
    return {
      hit(key) { if (key === 'yu') yuHit = k.T; if (key === 'ying') yingHit = k.T; if (key === 'chuan') chHit = k.T; },
      update(T, dt) {
        // 芦苇随风
        [reedBack, reedMid, reedFront].forEach((r, i) => { r.hinge.rotation.z = Math.sin(T * 1.3 + i) * 0.03; });
        // 船：慢慢撑进芦苇，消失后回到起点
        const ct = T - chHit;
        const speed = ct > 0 && ct < 3 ? 2.2 : 1;
        boatG.userData.s = ((boatG.userData.s || 0) + dt * 0.055 * speed) % 1;
        const s = boatG.userData.s;
        const bx = lerp(-0.02, 0.3, s), bz = lerp(0.12, -0.28, s);
        boatG.position.set(bx, 0.0, bz);
        boatG.rotation.y = 0.18;
        const vis = smooth(win(s, 0, 0.08)) * (1 - smooth(win(s, 0.8, 0.97)));
        // 撑篙的节奏
        const yt = T - yuHit;
        fisher.obj.rotation.z = Math.sin(T * 2.2) * 0.08 + (yt > 0 && yt < 1.5 ? Math.sin(yt * 10) * 0.1 : 0);
        fade(boat, vis); fade(fisher, vis);
        ripples.forEach((rp, i) => {
          const p = ((T * 0.45 + i / 3) % 1);
          rp.obj.position.set(bx - 0.08, 0.0, bz + 0.02);
          rp.obj.scale.setScalar(0.4 + p * 1.6);
          rp.opacity = 0.55 * (1 - p) * vis;
        });
        // 逃影者
        const rt = (T - yingHit) % 11;
        const run = rt < 5;
        const p = clamp(rt / 5);
        const rx = lerp(-0.44, -0.2, easeOut(p)), rz = 0.17 + Math.sin(p * 9) * 0.01;
        runner.obj.position.set(rx, Math.abs(Math.sin(rt * (run ? 14 : 0))) * 0.01, rz);
        sitter.obj.position.set(-0.19, 0.0, 0.16);
        const sitA = smooth(win(rt, 5, 5.6)) * (1 - smooth(win(rt, 10.4, 11)));
        fade(runner, 1 - sitA); fade(sitter, sitA);
        rshadow.hinge.position.set(rx, 0.0008, rz);
        rshadow.hinge.rotation.y = -0.9;
        rshadow.pivot.scale.set(1, Math.max(0.01, (1 - sitA) * (1 - smooth(win(p, 0.85, 1)) * 0.9)), 1);
        fade(rshadow, 1 - sitA);
      },
    };
  },
};

// —— 三十二 · 列御寇：屠龙之技 / 以天地为棺椁 ——
const ch32 = {
  ground(g) {
    // 地：一条平线与长方的“棺椁”
    g.stroke([[-0.2, 0.06], [0.44, 0.06]], 0.0025, { alpha: 0.35 });
    g.stroke([[-0.12, 0.0], [0.32, 0.0], [0.32, 0.14], [-0.12, 0.14], [-0.12, 0.0]], 0.002, { alpha: 0.22, smooth: false });
    g.text('天地当棺材', 0.24, -0.05, 0.022, { color: 'rgba(40,34,30,.4)' });
  },
  build(k) {
    const CX = 0.1, CZ = -0.26, R = 0.3;
    const dome = [];
    for (let i = 0; i <= 60; i++) { const a = Math.PI - i / 60 * Math.PI; dome.push([CX + Math.cos(a) * R, 0.01 + Math.sin(a) * R * 0.95, CZ]); }
    const domeL = k.line(dome, { width: 1.5, delay: 0.3, dur: 1.4, opacity: 0.7 });
    const sun = k.sprite({ w: 0.1, h: 0.1, delay: 0.8, draw: (g) => bi(g, 0, 0.05, 0.045, { wash: WASH.verm, washA: 0.35 + 0.35 * g.lit }) });
    const moon = k.sprite({ w: 0.1, h: 0.1, delay: 0.95, draw: (g) => bi(g, 0, 0.05, 0.045, { wash: WASH.water, washA: 0.15 + 0.35 * g.lit }) });
    sun.obj.position.set(CX + Math.cos(Math.PI * 0.8) * R, Math.sin(Math.PI * 0.8) * R * 0.95 - 0.04, CZ + 0.005);
    moon.obj.position.set(CX + Math.cos(Math.PI * 0.2) * R, Math.sin(Math.PI * 0.2) * R * 0.95 - 0.04, CZ + 0.005);
    const pearls = [0.34, 0.42, 0.5, 0.58, 0.66].map((t, i) => {
      const p = k.sprite({ w: 0.03, h: 0.03, pad: 0.005, delay: 1.1 + i * 0.06, draw: (g) => { g.circle(0, 0.015, 0.011, 0.0025, { wash: WASH.water, washA: 0.2 + 0.3 * g.lit }); g.dot(-0.004, 0.019, 0.0028, '#fff'); } });
      p.obj.position.set(CX + Math.cos(Math.PI * t) * R, Math.sin(Math.PI * t) * R * 0.95 - 0.015, CZ + 0.006);
      return p;
    });
    const rest = k.card({ w: 0.42, h: 0.12, x: 0.1, z: -0.12, delay: 0.5, draw: (g) => person(g, 0.07, 0, 0.32, { pose: 'lie', beard: true, w: 0.0038, lit: g.lit }) });
    // 云龙：龙头 + 一串云团
    const head = k.sprite({ w: 0.13, h: 0.08, delay: 1.0, pad: 0.008, draw: (g) => {
      g.shape([[-0.05, 0.03], [-0.02, 0.05], [0.02, 0.052], [0.05, 0.04], [0.06, 0.025], [0.04, 0.022], [0.055, 0.008], [0.02, 0.012], [-0.03, 0.008], [-0.055, 0.015]], 0.003, { wash: WASH.water, washA: 0.2 + 0.3 * g.lit });
      g.stroke([[-0.01, 0.05], [-0.03, 0.07], [-0.05, 0.075]], 0.003);
      g.stroke([[0.0, 0.05], [-0.01, 0.072], [-0.025, 0.08]], 0.0025);
      g.dot(0.025, 0.038, 0.004);
      g.stroke([[0.05, 0.02], [0.065, 0.005], [0.06, -0.005]], 0.002);
      g.stroke([[0.045, 0.032], [0.065, 0.045], [0.062, 0.058]], 0.002);
      for (let i = 0; i < 3; i++) g.stroke([[-0.04 + i * 0.012, 0.042], [-0.045 + i * 0.012, 0.02]], 0.0015, { alpha: 0.6 });
    } });
    const puffs = [0, 1, 2, 3, 4, 5].map(i => k.sprite({ w: 0.12, h: 0.06, pad: 0.006, delay: 1.0 + i * 0.05, draw: (g) => g.cloud(0, 0.03, 0.03 - i * 0.002, 0.0028, { wash: WASH.water, washA: 0.12 }) }));
    const slayer = k.card({ w: 0.17, h: 0.24, x: -0.33, z: 0.08, delay: 0.7, draw: (g) => {
      person(g, -0.02, 0, 0.21, { pose: 'arms', face: 1, w: 0.0042, lit: g.lit });
      g.stroke([[0.05, 0.175], [0.1, 0.225]], 0.005);   // 屠龙刀
      g.shape([[0.095, 0.218], [0.13, 0.235], [0.122, 0.205]], 0.003, { wash: WASH.ink, washA: 0.4 });
    } });
    const crows = [0, 1].map(i => k.winged({ body: crowBody, wing: crowWing, bw: 0.02, bh: 0.08, ww: 0.035, wh: 0.09, pad: 0.004, delay: 1.3 + i * 0.1 }));
    const ants = [0, 1, 2, 3, 4].map(i => k.sprite({ w: 0.04, h: 0.025, pad: 0.004, delay: 1.2 + i * 0.05, draw: ant }));
    k.hot(head, 'long'); puffs.forEach(p => k.hot(p, 'long')); k.hot(slayer, 'long');
    k.hot(sun, 'riyue'); k.hot(moon, 'riyue'); pearls.forEach(p => k.hot(p, 'riyue'));
    crows.forEach(c => k.hot(c, 'wu')); ants.forEach(a => k.hot(a, 'wu'));
    let longHit = -9, ryHit = -9, wuHit = -9;
    const path = (u, T) => [-0.42 + u * 0.5, 0.3 + Math.sin(u * 7 - T * 1.6) * 0.04 + u * 0.07, 0.0 + Math.cos(u * 4 - T) * 0.03];
    tilt(k);
    return {
      hit(key) {
        if (key === 'long') longHit = k.T;
        if (key === 'riyue') { ryHit = k.T; domeL.auto = false; }
        if (key === 'wu') wuHit = k.T;
      },
      update(T) {
        // 云龙：游动，周期性地散成云，又聚拢
        const lt = T - longHit;
        const PER = 12, s = T % PER;
        let scatter = smooth(win(s, 8, 9.5)) * (1 - smooth(win(s, 10.5, 12)));
        if (lt > 0 && lt < 4) scatter = Math.max(scatter, Math.sin(clamp(lt / 4) * Math.PI));
        const hp = path(1, T);
        head.obj.position.set(hp[0], hp[1] + scatter * 0.05, hp[2]);
        head.obj.scale.setScalar(1.7);
        head.obj.rotation.z = Math.sin(T * 1.6) * 0.15;
        fade(head, 1 - scatter);
        puffs.forEach((p, i) => {
          const u = 0.85 - i * 0.15;
          const q = path(u, T);
          const dx = Math.sin(i * 2.3) * 0.1, dy = Math.cos(i * 1.7) * 0.06 + 0.05;
          p.obj.position.set(q[0] + dx * scatter, q[1] + dy * scatter, q[2] + 0.005 * i);
          p.obj.scale.setScalar(1.45 * (1 + scatter * 0.6));
          fade(p, 1 - scatter * 0.85);
        });
        slayer.hinge.rotation.z = lt > 0 && lt < 1.2 ? Math.sin(lt / 1.2 * Math.PI) * 0.25 : 0;
        // 日月星辰：点亮时天穹重画一遍，珠玑闪烁
        const rt = T - ryHit;
        if (rt > 0 && rt < 2) domeL.reveal = easeOut(rt / 1.6); else domeL.auto = domeL.auto || rt > 2;
        if (rt >= 2) domeL.reveal = 1;
        pearls.forEach((p, i) => { p.obj.scale.setScalar(1 + Math.max(0, Math.sin(T * 2.5 + i * 1.3)) * (rt > 0 && rt < 3 ? 0.6 : 0.2)); });
        sun.obj.rotation.z = T * 0.2; moon.obj.rotation.z = -T * 0.15;
        // 乌鸢盘旋，蝼蚁爬行
        const wt = T - wuHit;
        const dive = wt > 0 && wt < 2.5 ? Math.sin(clamp(wt / 2.5) * Math.PI) : 0;
        crows.forEach((c, i) => {
          const a = T * 0.5 + i * Math.PI;
          c.obj.position.set(0.12 + Math.cos(a) * 0.18, 0.34 - dive * 0.18 + i * 0.03, -0.12 + Math.sin(a) * 0.08);
          c.obj.scale.setScalar(0.7);
          c.obj.rotation.y = -a;
          c.flap(Math.sin(T * 6 + i) * 0.5);
        });
        ants.forEach((a, i) => {
          const u = ((T * (0.025 + dive * 0.08) + i * 0.05) % 0.5);
          a.obj.position.set(-0.1 + u * 0.8, 0.0, -0.02);
        });
      },
    };
  },
};

// —— 三十三 · 天下：一尺之捶，日取其半 ——
const ch33 = {
  ground(g) {
    // 尺：刻度与“日取其半”的标记
    const x0 = -0.3, L = 0.6, y = -0.17;
    g.stroke([[x0, y], [x0 + L, y]], 0.0025, { alpha: 0.5, smooth: false });
    for (let i = 0; i <= 10; i++) g.stroke([[x0 + i * L / 10, y], [x0 + i * L / 10, y - (i % 5 ? 0.012 : 0.022)]], 0.002, { alpha: 0.5, smooth: false });
    const names = ['一日', '二日', '三日', '四日'];
    let a = L;
    for (let i = 0; i < 4; i++) { a /= 2; g.stroke([[x0 + a, y + 0.008], [x0 + a, y - 0.03]], 0.002, { color: VERM, alpha: 0.7, smooth: false }); g.text(names[i], x0 + a, y - 0.05, 0.016 - i * 0.002, { color: 'rgba(176,67,45,.7)' }); }
    g.text('一尺', x0 + L + 0.04, y, 0.02, { color: 'rgba(40,34,30,.5)' });
    // 飞鸟之景：每一刻都停在一处
    for (let i = 0; i < 6; i++) {
      const x = -0.35 + i * 0.14, yy = 0.065;
      g.fill([[x - 0.04, yy], [x - 0.012, yy + 0.01], [x, yy + 0.018], [x + 0.012, yy + 0.01], [x + 0.04, yy], [x + 0.008, yy - 0.004], [x, yy - 0.02], [x - 0.008, yy - 0.004]], INK, { alpha: 0.12 });
    }
    g.text('飞鸟的影子不动', 0.26, 0.15, 0.018, { color: 'rgba(40,34,30,.4)' });
  },
  build(k) {
    // 捶：一组木棍，每段可以独立滑走
    const L0 = 0.6, X0 = -0.3, Z0 = 0.13, RAD = 0.009;
    const rods = [0, 1].map(() => k.tube([[0, RAD, 0], [L0, RAD, 0]], { radius: RAD, color: 0xa47a4c, delay: 0.3, dur: 0.6 }));
    // 道术：一块完整的玉璧，裂成几片各自散去
    const BX = -0.28, BZ = -0.3, BR = 0.1;
    const disc = k.card({ w: 0.22, h: 0.22, x: BX, z: BZ, delay: 0.2, draw: (g) => bi(g, 0, 0.11, BR, { wash: WASH.green, washA: 0.25 + 0.3 * g.lit }) });
    const N = 5;
    const pieces = Array.from({ length: N }, (_, i) => {
      const a0 = i / N * Math.PI * 2 + 0.3, a1 = (i + 1) / N * Math.PI * 2 + 0.3 + (i % 2 ? 0.05 : -0.04);
      const p = k.sprite({ w: 0.22, h: 0.22, pad: 0.004, delay: 0.2, draw: (g) => {
        const pts = [];
        for (let j = 0; j <= 10; j++) { const a = lerp(a0, a1, j / 10); pts.push([Math.cos(a) * BR, 0.11 + Math.sin(a) * BR]); }
        for (let j = 10; j >= 0; j--) { const a = lerp(a0, a1, j / 10); pts.push([Math.cos(a) * BR * 0.36, 0.11 + Math.sin(a) * BR * 0.36]); }
        // 裂口有一点锯齿
        g.shape(pts, 0.0035, { wash: WASH.green, washA: 0.3 + 0.3 * g.lit, smooth: false });
      } });
      p.mid = (a0 + a1) / 2;
      return p;
    });
    // 飞鸟与它的影子
    const birdWing = (g) => g.shape([[-0.008, 0.0], [-0.016, 0.03], [-0.01, 0.058], [0.004, 0.08], [0.008, 0.055], [0.01, 0.02], [0.008, 0.0]], 0.0025, { wash: WASH.ink, washA: 0.2 + 0.3 * g.lit });
    const bird = k.winged({ body: (g) => g.shape([[0, 0.0], [0.008, 0.02], [0.006, 0.045], [0, 0.06], [-0.006, 0.045], [-0.008, 0.02]], 0.0025, { wash: WASH.ink, washA: 0.3 }), bw: 0.02, bh: 0.07, wing: birdWing, ww: 0.035, wh: 0.085, pad: 0.004, delay: 0.9 });
    const bshadow = k.card({ w: 0.1, h: 0.05, x: 0, z: -0.04, stand: false, cut: false, delay: 0.9, draw: (g) => {
      g.fill([[-0.045, 0.02], [-0.012, 0.03], [0, 0.04], [0.012, 0.03], [0.045, 0.02], [0.008, 0.016], [0, 0.0], [-0.008, 0.016]], SHADOW);
    } });
    // 鸟本身不投影：纸面上只留那个“不动”的影子
    for (const m of bird.meshes) { m.castShadow = false; m.userData.noShadow = true; }
    rods.forEach(r => k.hot(r, 'chui'));
    k.hot(bird, 'niao'); k.hot(bshadow, 'niao');
    k.hot(disc, 'lie'); pieces.forEach(p => k.hot(p, 'lie'));
    let chuiT0 = 1.2, crackT = 6, niaoHit = -9, chuiHit = -9;
    tilt(k);
    return {
      hit(key) {
        if (key === 'chui') { chuiT0 = k.T; chuiHit = k.T; }
        if (key === 'lie') crackT = k.T;
        if (key === 'niao') niaoHit = k.T;
      },
      update(T, dt) {
        // 一尺之捶：每 1.4 秒截去一半，剩下的越来越短，八次后长回一尺重来
        const STEP = 1.4, DAYS = 8;
        const e = T - chuiT0;
        const t = e < 0 ? 0 : e % (STEP * (DAYS + 2));
        const day = Math.floor(t / STEP), fr = (t % STEP) / STEP;
        const glow = clamp(1 - (T - chuiHit) / 1.5);
        const [rest, cut] = rods;
        let restLen, cutA = 0;
        if (day < DAYS) {
          const full = L0 / Math.pow(2, day);
          restLen = fr < 0.35 ? full : full / 2;
          if (fr >= 0.35) {
            const m = smooth(win(fr, 0.35, 1));
            cut.obj.position.set(X0 + full / 2 + 0.004, Math.sin(m * Math.PI) * 0.03, Z0 + m * 0.07);
            cut.obj.scale.set(full / 2 / L0, 1, 1);
            cutA = 1 - smooth(win(fr, 0.55, 1));
          }
        } else {
          restLen = lerp(L0 / Math.pow(2, DAYS), L0, smooth(win(t - DAYS * STEP, 0.3, STEP * 2 - 0.2)));
        }
        rest.obj.position.set(X0, 0, Z0);
        rest.obj.scale.set(Math.max(0.003, restLen) / L0, 1, 1);
        cut.mat.opacity *= cutA; cut.mesh.visible = cutA > 0.01;
        for (const r of rods) r.mat.emissive.setRGB(glow * 0.35, glow * 0.22, glow * 0.08);

        // 飞鸟：连续飞过，影子却一格一格跳
        const nt = T - niaoHit;
        const sp = nt > 0 && nt < 4 ? 0.06 : 0.11;
        bird.userData = bird.userData || {};
        bird.u = ((bird.u || 0) + dt * sp) % 1;
        const bx = -0.42 + bird.u * 0.86;
        bird.obj.position.set(bx, 0.34 + Math.sin(bird.u * Math.PI) * 0.04, -0.1);
        bird.obj.rotation.set(0, -Math.PI / 2, 0);
        bird.obj.rotateZ(-0.2);
        bird.flap(Math.sin(T * 8) * 0.5);
        const vis = smooth(win(bird.u, 0, 0.06)) * (1 - smooth(win(bird.u, 0.92, 1)));
        fade(bird, vis);
        const q = Math.round((bx + 0.35) / 0.14);
        const qx = -0.35 + clamp(q, 0, 5) * 0.14;
        bshadow.hinge.position.set(qx, 0.0008, -0.04);
        bshadow.hinge.rotation.y = 0;
        bshadow.pivot.scale.set(1, 1, 1);
        fade(bshadow, vis);
        // 道术将为天下裂
        const ct = T - crackT;
        const PER = 14;
        const c = ct < 0 ? -1 : ct % PER;
        let spread = 0;
        if (c >= 0) spread = smooth(win(c, 0.3, 2.2)) * (1 - smooth(win(c, 5.5, 7)));
        const broken = c >= 0 && c < 7.3;
        fade(disc, broken ? 0 : 1);
        pieces.forEach((p, i) => {
          const d = spread * (0.06 + (i % 3) * 0.03);
          p.obj.position.set(BX + 0.06 * spread + Math.cos(p.mid) * d * 1.3, Math.max(0, Math.sin(p.mid) * d * 0.25), BZ + 0.002 + (0.05 + 0.05 * Math.abs(Math.sin(p.mid * 1.7 + i))) * spread);
          p.obj.rotation.z = spread * (i % 2 ? 0.4 : -0.3);
          fade(p, broken ? 1 - spread * 0.5 : 0);
        });
        if (ct > 0 && ct < 0.4 && !this._snd) { this._snd = true; sfx.tap(300, 0.2, 0.12); }
        if (ct > 1) this._snd = false;
      },
    };
  },
};

export const scenes = { ch27, ch28, ch29, ch30, ch31, ch32, ch33 };
export const _art = { horse, rooster, crown, bi, reeds, sword, crowWing, crowBody, ant };
