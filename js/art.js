// 常用的墨线造型：人物、鸟、鱼、树、山、水、云……
// 所有函数都在 Ink 的单位坐标里作画（原点在纸片底边中点，y 向上）
import { ellipsePts, smoothPts, WASH, VERM, INK, PAPER } from './ink.js';

const M = (pts, x, y, s, f = 1) => pts.map(([a, b]) => [x + a * s * f, y + b * s]);

// —— 人物：宽袍大袖的侧身像（默认面向右）——
// pose: stand | walk | bow | sit | lie | point | staff | arms（张臂）
// 其余选项：face(1/-1) hat beard lit robe(淡彩) w(线宽)
const ROBE = [[-0.03, 0.81], [-0.1, 0.775], [-0.135, 0.66], [-0.145, 0.52], [-0.105, 0.46], [-0.115, 0.3], [-0.15, 0.04], [-0.08, 0.0], [0.04, 0.0], [0.16, 0.02], [0.105, 0.3], [0.095, 0.445], [0.2, 0.43], [0.235, 0.5], [0.175, 0.62], [0.085, 0.72], [0.06, 0.785], [0.03, 0.81]];
const SIT = [[-0.03, 0.51], [-0.1, 0.475], [-0.135, 0.36], [-0.14, 0.22], [-0.12, 0.15], [-0.16, 0.02], [-0.1, 0.0], [0.27, 0.0], [0.31, 0.05], [0.27, 0.12], [0.24, 0.14], [0.25, 0.2], [0.18, 0.31], [0.085, 0.42], [0.06, 0.485], [0.03, 0.51]];
export function person(g, x, y, s, { pose = 'stand', face = 1, w = 0.0055, robe = null, lit = 0, hat = false, beard = false, alpha = 1 } = {}) {
  const f = face;
  const sit = pose === 'sit';
  const dy = sit ? -0.3 : 0;
  // 姿态变换（在单位坐标里）
  const tf = ([px, py]) => {
    let X = px, Y = py;
    if (pose === 'walk' && Y < 0.45) X += Math.sign(X - 0.02) * 0.06 * (0.45 - Y) / 0.45;
    if (pose === 'bow' && Y > 0.45) { const a = -0.42, ox = 0, oy = 0.45; const rx = X - ox, ry = Y - oy; X = ox + rx * Math.cos(a) - ry * Math.sin(a); Y = oy + rx * Math.sin(a) + ry * Math.cos(a); }
    if (pose === 'lie') { const t = X; X = -(Y - 0.45) * 0.95; Y = t + 0.15; }
    return [x + X * s * f, y + Y * s];
  };
  const T = (pts) => pts.map(tf);
  const up = (pts) => pts.map(([a, b]) => [a, b + dy]);   // 上半身（坐姿时下移）
  const washA = 0.22 * lit + (robe ? 0.12 : 0);
  const wc = robe || WASH.ochre;
  const lw = w;
  if (pose === 'lie') {
    // 枕头
    const P = (pts) => pts.map(([a, b]) => [x + a * s * f, y + b * s]);
    g.shape(P([[-0.49, 0.0], [-0.49, 0.115], [-0.33, 0.115], [-0.33, 0.0]]), lw * 0.7, { smooth: false, wash: WASH.ochre, washA: 0.25 });
    g.stroke(P([[-0.47, 0.06], [-0.35, 0.06]]), lw * 0.4, { alpha: 0.6 });
  }
  const body = sit ? SIT : ROBE;
  g.shape(T(body), lw, { wash: wc, washA });
  // 衣纹、交领、袖口、腰带
  const L = (pts, k = 0.55, o = {}) => g.stroke(T(pts), lw * k, o);
  if (!sit) {
    L([[-0.012, 0.8], [0.035, 0.68]], 0.5);
    L([[0.028, 0.8], [0.05, 0.71]], 0.45);
    L([[-0.02, 0.7], [0.04, 0.56], [0.19, 0.455]], 0.55);
    L([[-0.105, 0.465], [0.0, 0.452], [0.095, 0.445]], 0.6);
    L([[0.05, 0.448], [0.07, 0.36], [0.06, 0.26]], 0.45, { alpha: 0.8 });
    L([[-0.05, 0.42], [-0.075, 0.2], [-0.09, 0.05]], 0.35, { alpha: 0.6 });
    L([[0.02, 0.4], [0.05, 0.2], [0.07, 0.04]], 0.35, { alpha: 0.6 });
    L([[0.11, 0.015], [0.2, 0.0]], 0.8);
  } else {
    L([[-0.012, 0.5], [0.035, 0.38]], 0.5);
    L([[-0.02, 0.4], [0.06, 0.28], [0.22, 0.17]], 0.55);
    L([[-0.12, 0.17], [0.0, 0.16], [0.1, 0.15]], 0.5);
    L([[0.0, 0.1], [0.15, 0.08], [0.27, 0.06]], 0.35, { alpha: 0.6 });
  }
  // 手臂姿势
  if (pose === 'point' || pose === 'staff' || pose === 'arms') {
    const arm = pose === 'arms'
      ? [[0.06, 0.74], [0.18, 0.78], [0.3, 0.84], [0.33, 0.8], [0.2, 0.7], [0.1, 0.66]]
      : [[0.06, 0.74], [0.17, 0.7], [0.28, 0.66], [0.3, 0.6], [0.2, 0.6], [0.1, 0.62]];
    g.shape(T(up(arm)), lw * 0.9, { wash: wc, washA });
    const hand = pose === 'arms' ? [0.34, 0.83] : [0.31, 0.63];
    g.circle(...tf([hand[0], hand[1] + dy]), 0.018 * s, lw * 0.7);
    if (pose === 'staff') L([[0.31, 0.75], [0.33, 0.0]], 0.9);
  } else if (!sit && pose !== 'lie') {
    g.circle(...tf([0.215, 0.49]), 0.015 * s, lw * 0.6);
  }
  // 头
  const hc = tf([0.035, 0.885 + dy]);
  const hr = 0.06 * s;
  const head = T(up([[0.035 + 0.058, 0.9], [0.035 + 0.064, 0.885], [0.035 + 0.052, 0.86], [0.04, 0.825], [0.0, 0.835], [-0.022, 0.87], [-0.018, 0.92], [0.01, 0.945], [0.05, 0.945], [0.08, 0.93]]));
  g.shape(head, lw * 0.9);
  // 发
  g.fill(T(up([[-0.022, 0.87], [-0.018, 0.92], [0.01, 0.945], [0.05, 0.945], [0.07, 0.935], [0.03, 0.915], [0.0, 0.87], [-0.01, 0.84]])), 'rgba(38,34,30,.85)');
  if (hat) g.shape(T(up([[-0.01, 0.94], [-0.02, 0.995], [0.07, 1.0], [0.06, 0.94]])), lw * 0.8, { fill: 'rgba(38,34,30,.85)', smooth: false });
  else { const b = tf([0.005, 0.968 + dy]); g.circle(b[0], b[1], 0.024 * s, lw * 0.6, { fill: 'rgba(38,34,30,.9)' }); L(up([[-0.035, 0.975], [0.045, 0.962]]), 0.45); }
  g.dot(...tf([0.072, 0.895 + dy]), 0.006 * s);
  if (beard) L(up([[0.07, 0.84], [0.075, 0.78], [0.06, 0.74]]), 0.5);
}

// —— 鱼（侧面）——
export function fish(g, x, y, len, { dir = 1, w = 0.005, lit = 0, wash = WASH.water, tail = 0, fill = PAPER } = {}) {
  const d = dir, L = len;
  const P = (pts) => pts.map(([a, b]) => [x + a * L * d, y + b * L]);
  const body = P([[0.5, 0.0], [0.4, 0.09], [0.15, 0.15], [-0.15, 0.12], [-0.32, 0.04], [-0.32, -0.03], [-0.15, -0.1], [0.15, -0.13], [0.4, -0.08]]);
  g.shape(body, w, { wash, washA: 0.4 * lit, fill });
  const tw = tail;
  g.shape(P([[-0.3, 0.0], [-0.5, 0.16 + tw], [-0.44, 0.0 + tw * 0.4], [-0.52, -0.13 + tw], [-0.3, -0.02]]), w, { wash, washA: 0.4 * lit, fill });
  g.dot(x + 0.36 * L * d, y + 0.03 * L, 0.012 * L);
  g.stroke(P([[0.28, 0.1], [0.24, 0.0], [0.28, -0.09]]), w * 0.7);
  // 鳞
  for (let i = 0; i < 4; i++) for (let j = -1; j <= 1; j++) {
    const cx = 0.12 - i * 0.1, cy = j * 0.05;
    g.stroke(P([[cx + 0.02, cy + 0.03], [cx - 0.015, cy], [cx + 0.02, cy - 0.03]]), w * 0.4, { alpha: 0.6 });
  }
  g.stroke(P([[0.1, 0.14], [0.0, 0.22], [-0.12, 0.13]]), w * 0.7);
}

// —— 鸟（侧面，小）——
export function birdSide(g, x, y, s, { dir = 1, w = 0.005, lit = 0, wing = 0.5 } = {}) {
  const P = (pts) => pts.map(([a, b]) => [x + a * s * dir, y + b * s]);
  g.shape(P([[0.42, 0.1], [0.3, 0.17], [0.1, 0.12], [-0.2, 0.06], [-0.45, 0.1], [-0.38, 0.0], [-0.1, -0.06], [0.2, -0.04], [0.36, 0.04]]), w, { wash: WASH.ochre, washA: 0.35 * lit });
  g.stroke(P([[0.42, 0.1], [0.55, 0.08], [0.42, 0.06]]), w * 0.8);
  g.dot(x + 0.34 * s * dir, y + 0.11 * s, 0.018 * s);
  g.shape(P([[0.1, 0.1], [-0.05, 0.3 + wing * 0.3], [-0.25, 0.4 + wing * 0.3], [-0.15, 0.1]]), w, { wash: WASH.ochre, washA: 0.35 * lit });
  g.stroke(P([[0.0, -0.05], [0.02, -0.16]]), w * 0.6);
  g.stroke(P([[0.08, -0.05], [0.1, -0.16]]), w * 0.6);
}

// —— 树：弯曲的主干、分枝，枝头一团团叶簇 ——
export function tree(g, x, y, s, { w = 0.006, gnarled = false, lit = 0, seed = 1, leaves = 'round', bare = false } = {}) {
  let r = seed * 7 + 3;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const P = (pts) => pts.map(([a, b]) => [x + a * s, y + b * s]);
  const tw = gnarled ? 0.11 : 0.06;
  // 主干（两侧轮廓）
  const lean = (rnd() - 0.5) * 0.08;
  const trunk = [[-tw, 0], [-tw * 0.8, 0.15], [-tw * (gnarled ? 1.1 : 0.6) + lean, 0.32], [-tw * 0.5 + lean * 1.5, 0.48], [tw * 0.5 + lean * 1.5, 0.5], [tw * (gnarled ? 1.0 : 0.6) + lean, 0.3], [tw * 0.8, 0.14], [tw * 1.1, 0]];
  // 枝
  const tips = [[-0.3, 0.62], [-0.12, 0.8], [0.12, 0.84], [0.32, 0.64], [0.0, 0.66]];
  const branches = tips.map(([tx, ty]) => [[lean * 1.5, 0.45], [tx * 0.5 + lean, (0.45 + ty) / 2 + 0.03], [tx, ty]]);
  // 叶簇
  const clump = (cx, cy, rr) => {
    const pts = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const rb = rr * (0.8 + rnd() * 0.25);
      for (let k = 0; k <= 4; k++) {
        const a = a0 + (a1 - a0) * k / 4;
        const bump = Math.sin(k / 4 * Math.PI) * 0.22;
        pts.push([cx + Math.cos(a) * rb * (1 + bump), cy + Math.sin(a) * rb * 0.78 * (1 + bump)]);
      }
    }
    return pts;
  };
  if (!bare) {
    const cl = leaves === 'tall'
      ? [[0, 0.95, 0.16], [-0.12, 0.78, 0.15], [0.13, 0.76, 0.15], [0, 0.62, 0.17]]
      : [[-0.28, 0.66, 0.15], [0.3, 0.66, 0.15], [-0.12, 0.84, 0.17], [0.13, 0.86, 0.17], [0.0, 0.7, 0.19]];
    for (const [cx, cy, rr] of cl) {
      const pts = P(clump(cx, cy, rr));
      g.shape(pts, w * 0.8, { wash: WASH.green, washA: 0.18 + 0.3 * lit });
      // 叶簇里的短线
      for (let k = 0; k < 4; k++) {
        const ax = cx + (rnd() - 0.5) * rr, ay = cy + (rnd() - 0.6) * rr * 0.7;
        g.stroke(P([[ax - rr * 0.18, ay], [ax, ay - rr * 0.12], [ax + rr * 0.18, ay]]), w * 0.4, { alpha: 0.6 });
      }
    }
  }
  for (const b of branches) g.stroke(P(b), w * (gnarled ? 1.4 : 1.1), { taper: [0.05, 0.6] });
  g.shape(P(trunk), w, { wash: WASH.ochre, washA: 0.25 + 0.25 * lit });
  // 树皮
  for (let i = 0; i < (gnarled ? 9 : 4); i++) {
    const yy = 0.05 + rnd() * 0.38, xx = (rnd() - 0.5) * tw;
    g.stroke(P([[xx, yy], [xx + (rnd() - 0.5) * 0.03, yy + 0.04 + rnd() * 0.04]]), w * 0.45, { alpha: 0.7 });
  }
  if (gnarled) { g.circle(x + 0.02 * s, y + 0.26 * s, 0.022 * s, w * 0.6, { fill: 'rgba(38,34,30,.6)' }); g.stroke(P([[-tw * 1.2, 0.0], [-tw * 1.8, -0.01]]), w * 0.8); g.stroke(P([[tw * 1.2, 0.0], [tw * 2, -0.005]]), w * 0.8); }
}

// —— 山：起伏的山脊、皴线、山脚淡彩 ——
export function mountains(g, x0, x1, y, h, { w = 0.006, peaks = 3, seed = 2, lit = 0, wash = WASH.green, fill = PAPER, hatch = true } = {}) {
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const ridge = [[x0, y], [x0, y + h * 0.12]];
  const tops = [];
  const n = peaks * 4;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const pk = Math.pow(Math.abs(Math.sin(t * Math.PI * peaks + seed)), 1.6);
    const yy = y + h * (0.22 + 0.7 * pk * (0.75 + rnd() * 0.25) + rnd() * 0.05);
    ridge.push([x, yy]);
    if (pk > 0.85) tops.push([x, yy]);
  }
  ridge.push([x1, y + h * 0.12], [x1, y]);
  g.shape(ridge, w, { wash, washA: 0.12 + 0.3 * lit, fill });
  // 山脚的雾气留白：一抹淡墨
  g.wash([[x0, y], [x0, y + h * 0.18], [x1, y + h * 0.18], [x1, y]], WASH.ink, 0.06, { blur: 8 });
  if (hatch) {
    for (const [px, py] of tops) {
      for (let k = 0; k < 4; k++) {
        const dx = (k - 1.5) * h * 0.09;
        g.stroke([[px + dx * 0.4, py - h * 0.06 - Math.abs(dx) * 0.6], [px + dx * 1.2, py - h * (0.3 + rnd() * 0.15)]], w * 0.45, { alpha: 0.55 });
      }
      g.dot(px - h * 0.05, py - h * 0.02, w * 0.5);
      g.dot(px + h * 0.06, py - h * 0.05, w * 0.4);
    }
  }
}

// —— 海水纹：一排卷起的浪头 + 下面层层鳞状弧线 ——
export function waveRows(g, x0, x1, y0, rows = 3, { w = 0.0045, amp = 0.012, wl = 0.08, gap = 0.028, phase = 0, crest = true } = {}) {
  // 浪头
  const top = y0;
  for (let x = x0 + phase; x < x1 - wl * 0.2; x += wl) {
    const c = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      c.push([x + t * wl, top + amp * Math.sin(t * Math.PI) * (1 + 0.6 * t)]);
    }
    // 卷回的浪尖
    const ex = x + wl, ey = top + amp * 0.3;
    for (let k = 1; k <= 8; k++) { const a = -0.3 + k / 8 * 3.4; c.push([ex - wl * 0.18 + Math.cos(a) * wl * 0.16 * (1 - k / 12), ey + amp * 0.9 + Math.sin(a) * amp * 0.9]); }
    g.stroke(c, w, { taper: [0.1, 0.5] });
  }
  // 鳞状水纹
  if (!crest) return;
  const dir = gap < 0 ? -1 : 1;
  for (let r = 1; r <= rows; r++) {
    const y = top + dir * Math.abs(gap) * r;
    const off = (r % 2) * wl * 0.5 + phase;
    for (let x = x0 + off - wl; x < x1; x += wl) {
      const arc = [];
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI * (0.15 + 0.7 * k / 10);
        const px = x + wl / 2 + Math.cos(a) * wl * 0.5;
        if (px < x0 || px > x1) continue;
        arc.push([px, y + Math.sin(a) * Math.abs(gap) * 0.8]);
      }
      if (arc.length > 2) g.stroke(arc, w * 0.55, { alpha: 0.7, taper: [0.2, 0.2] });
    }
  }
}

// 波浪纸片的外形（顶边起伏）
export function waveCardShape(x0, x1, y0, top, wl = 0.08, amp = 0.014) {
  const pts = [[x0, y0]];
  for (let x = x0; x <= x1 + 1e-6; x += wl / 8) pts.push([x, top + amp * Math.sin((x - x0) / wl * Math.PI * 2)]);
  pts.push([x1, y0]);
  return pts;
}

// —— 蝴蝶翅膀（右翅，翅根在原点，向上展开）——
export function butterflyWing(g, s, { lit = 0, w = 0.004 } = {}) {
  const fore = [[0, 0.01], [0.15, 0.25], [0.35, 0.62], [0.5, 0.95], [0.72, 1.0], [0.82, 0.82], [0.62, 0.55], [0.4, 0.25], [0.05, 0.0]].map(([a, b]) => [(a - 0.42) * s * 0.9 + 0.0, b * s * 0.9]);
  const hind = [[0.0, 0.0], [0.4, 0.12], [0.75, 0.25], [0.85, 0.45], [0.6, 0.55], [0.3, 0.38], [0.05, 0.08]].map(([a, b]) => [(a - 0.05) * s * 0.75 + 0.0, (b - 0.02) * s * 0.75]);
  // 翅膀向上展开：x 左右，y 为长度方向
  const rot = (pts, ang) => pts.map(([a, b]) => [a * Math.cos(ang) - b * Math.sin(ang), a * Math.sin(ang) + b * Math.cos(ang)]);
  const F = rot(fore, -0.15), Hh = rot(hind, 0.9);
  g.shape(Hh, w, { wash: WASH.verm, washA: 0.45 * lit });
  g.shape(F, w, { wash: WASH.ochre, washA: 0.55 * lit });
  // 翅脉与斑点
  const veins = [[[0, 0], [0.18, 0.55]], [[0, 0], [0.0, 0.62]], [[0, 0], [0.1, 0.75]]];
  for (const v of veins) g.stroke(rot(v.map(([a, b]) => [a * s, b * s]), -0.15), w * 0.45, { alpha: 0.7 });
  g.dot(...rot([[0.08 * s, 0.72 * s]], -0.15)[0], 0.03 * s, lit > 0.5 ? VERM : INK);
  g.dot(...rot([[-0.02 * s, 0.6 * s]], -0.15)[0], 0.018 * s);
  g.stroke(rot([[0, 0], [0.25 * s, 0.25 * s]], 0.9), w * 0.45, { alpha: 0.7 });
}

// —— 竹简一束 ——
export function slips(g, x, y, n, h, { w = 0.004, lit = 0, tie = true, label = '', sw = 0.026 } = {}) {
  const x0 = x - n * sw / 2;
  for (let i = 0; i < n; i++) {
    const xx = x0 + i * sw;
    const lean = (i - n / 2) * 0.002;
    g.shape([[xx, y], [xx + lean, y + h], [xx + sw + lean, y + h], [xx + sw, y]], w, { smooth: false, wash: WASH.ochre, washA: 0.15 + 0.3 * lit });
    for (let k = 0; k < 6; k++) g.line(xx + sw * 0.35, y + h * (0.12 + k * 0.13), xx + sw * 0.65, y + h * (0.12 + k * 0.13), w * 0.6, { alpha: 0.6 });
  }
  if (tie) for (const t of [0.25, 0.75]) g.stroke([[x0 - 0.005, y + h * t], [x0 + n * sw * 0.5, y + h * t - 0.006], [x0 + n * sw + 0.005, y + h * t]], w * 1.2, { color: VERM });
  if (label) g.text(label, x, y + h + 0.04, 0.04, { color: INK });
}

// 平滑工具转发
export { smoothPts, ellipsePts };
