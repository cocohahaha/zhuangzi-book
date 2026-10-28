// 外篇（八至十三）插图：骈拇、马蹄、胠箧、在宥、天地、天道
import { WASH, VERM, INK, PAPER } from '../ink.js';
import { person, tree, birdSide, slips, ellipsePts } from '../art.js';
import { clamp, lerp, smooth, win, easeOut } from '../util.js';
import * as sfx from '../audio.js';

// 纸片透明度（在 kit 更新之后再乘）
const fade = (it, f) => { for (const p of (it.parts || [it])) { p.mat.opacity *= f; p.mesh.visible = p.mat.opacity > 0.01; } };
// 镜像坐标
const MX = (pts, f = 1, ox = 0, oy = 0, s = 1) => pts.map(([a, b]) => [ox + a * s * f, oy + b * s]);
// 有轮廓的肢体：粗墨线上叠一道纸色细线
const limb = (g, pts, w = 0.01) => { g.stroke(pts, w, { taper: [0.02, 0.02] }); g.stroke(pts, w * 0.45, { color: PAPER, taper: [0.02, 0.02] }); };
// 按比例放大一幅画（线宽一起放大）
const scaled = (draw, S) => (g, st) => { const k0 = g.k; g.k *= S; draw(g, st); g.k = k0; };
// 弹一下：t 秒前触发，持续 d 秒
const bump = (T, t0, d) => { const t = (T - t0) / d; return t > 0 && t < 1 ? Math.sin(t * Math.PI) : 0; };

// 芦苇丛：疏密不一，穗头下垂
function reeds(g, x0, x1, h, n = 14, seed = 3) {
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + rnd() * 0.8) / n;
    const hh = h * (0.45 + rnd() * 0.55);
    const bend = (rnd() - 0.3) * 0.05;
    const top = [x + bend, hh];
    g.stroke([[x, 0], [x + bend * 0.3, hh * 0.5], top], 0.0032, { taper: [0.05, 0.3] });
    // 叶：长而弯
    for (let k = 0; k < 2; k++) {
      const ly = hh * (0.15 + rnd() * 0.35), d = rnd() < 0.5 ? -1 : 1, L = 0.03 + rnd() * 0.04;
      g.stroke([[x + bend * ly / hh * 0.3, ly], [x + d * L * 0.5, ly + L * 0.6], [x + d * L, ly + L * 0.3]], 0.003, { taper: [0.05, 0.9] });
    }
    // 穗：一束下垂的细线
    if (rnd() < 0.7) for (let k = 0; k < 5; k++) g.stroke([top, [top[0] + 0.008 + k * 0.003, top[1] + 0.006 - k * 0.002], [top[0] + 0.016 + k * 0.004, top[1] - 0.012 - k * 0.004]], 0.0018, { taper: [0.1, 0.8], alpha: 0.85 });
  }
}

// —— 八 · 骈拇：凫胫短，鹤胫长 ——
const duckBody = (g) => {
  const lit = g.lit;
  const body = [[-0.095, 0.062], [-0.065, 0.036], [-0.04, 0.012], [0.0, 0.0], [0.05, 0.01], [0.075, 0.034], [0.07, 0.056], [0.05, 0.066], [0.055, 0.092], [0.058, 0.11], [0.072, 0.12], [0.088, 0.114], [0.116, 0.106], [0.118, 0.1], [0.09, 0.098], [0.076, 0.092], [0.04, 0.084], [0.0, 0.072], [-0.05, 0.068]];
  g.shape(body, 0.0042, { wash: WASH.ochre, washA: 0.25 + 0.3 * lit });
  g.wash([[0.05, 0.088], [0.056, 0.115], [0.088, 0.116], [0.08, 0.092]], WASH.green, 0.25 + 0.45 * lit, { blur: 2 });
  g.stroke([[0.052, 0.084], [0.078, 0.088]], 0.003, { color: PAPER });
  g.stroke([[0.05, 0.083], [0.078, 0.087]], 0.0025);
  g.stroke([[-0.06, 0.055], [-0.01, 0.034], [0.035, 0.044]], 0.0035);
  for (let i = 0; i < 3; i++) g.stroke([[-0.055 + i * 0.018, 0.05 - i * 0.004], [-0.035 + i * 0.018, 0.04 - i * 0.003]], 0.002, { alpha: 0.7 });
  g.dot(0.078, 0.108, 0.003);
  g.fill([[0.09, 0.112], [0.116, 0.106], [0.118, 0.1], [0.09, 0.099]], 'rgba(196,150,84,.8)');
};
const duckLegs = (g) => {
  for (const x of [-0.008, 0.012]) {
    g.stroke([[x, 0.034], [x + 0.002, 0.012], [x + 0.004, 0.003]], 0.0035);
    g.shape([[x + 0.004, 0.004], [x + 0.024, 0.0], [x - 0.006, 0.0]], 0.0022, { fill: 'rgba(196,150,84,.9)', smooth: false });
  }
};
// 鹤（面向左）
const craneBody = (g) => {
  const lit = g.lit;
  const f = -1;
  const M = (pts) => MX(pts, f);
  g.fill(M([[-0.07, 0.035], [-0.115, 0.012], [-0.125, -0.008], [-0.09, -0.002], [-0.05, 0.012]]), 'rgba(38,34,30,.9)');
  g.shape(M([[-0.085, 0.035], [-0.05, 0.004], [0.02, 0.0], [0.07, 0.025], [0.068, 0.05], [0.02, 0.064], [-0.05, 0.058]]), 0.0042, { wash: WASH.ink, washA: 0.04 + 0.08 * lit });
  for (let i = 0; i < 4; i++) g.stroke(M([[-0.06 + i * 0.022, 0.05], [-0.04 + i * 0.022, 0.025]]), 0.002, { alpha: 0.6 });
  g.stroke(M([[0.06, 0.045], [0.078, 0.1], [0.062, 0.15], [0.07, 0.19]]), 0.011, { taper: [0.02, 0.05] });
  g.circle(...M([[0.074, 0.198]])[0], 0.013, 0.003);
  g.dot(...M([[0.074, 0.212]])[0], 0.006, VERM);
  g.dot(...M([[0.08, 0.2]])[0], 0.0025);
  g.stroke(M([[0.086, 0.198], [0.135, 0.186]]), 0.0035, { taper: [0.05, 0.4] });
};
const craneLegs = (g) => {
  for (const [x, k] of [[-0.012, 0.006], [0.012, -0.004]]) {
    g.stroke([[x, 0.152], [x + k, 0.08], [x, 0.004]], 0.003, { taper: [0.02, 0.02] });
    g.dot(x + k, 0.08, 0.0035);
    g.stroke([[x - 0.02, 0.0], [x + 0.022, 0.0]], 0.0025);
  }
};
const craneWings = (g) => {
  const L = (pts) => g.shape(pts, 0.0035, { wash: WASH.ink, washA: 0.06 });
  L([[0, 0.0], [-0.07, 0.05], [-0.12, 0.12], [-0.1, 0.13], [-0.06, 0.1], [-0.02, 0.06]]);
  L([[0, 0.0], [0.07, 0.05], [0.12, 0.12], [0.1, 0.13], [0.06, 0.1], [0.02, 0.06]]);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) g.stroke([[s * (0.05 + i * 0.016), 0.06 + i * 0.016], [s * (0.07 + i * 0.016), 0.09 + i * 0.012]], 0.002);
  g.fill([[-0.12, 0.12], [-0.1, 0.13], [-0.09, 0.115]], 'rgba(38,34,30,.85)');
  g.fill([[0.12, 0.12], [0.1, 0.13], [0.09, 0.115]], 'rgba(38,34,30,.85)');
};

const DS = 1.6, CS = 1.35;   // 凫、鹤的放大比例
const ch8 = {
  ground(g) {
    for (let i = 0; i < 6; i++) g.stroke(ellipsePts(-0.3 + i * 0.13, -0.12 + (i % 2) * 0.03, 0.05, 0.008, 16, 0.2, 2.9), 0.002, { alpha: 0.3 });
  },
  build(k) {
    k.card({ w: 0.36, h: 0.26, x: -0.28, z: -0.34, delay: 0.1, draw: (g) => reeds(g, -0.17, 0.17, 0.24, 10, 5) });
    k.card({ w: 0.3, h: 0.22, x: 0.36, z: -0.36, delay: 0.2, draw: (g) => reeds(g, -0.12, 0.12, 0.2, 7, 11) });
    const water = k.card({ w: 0.9, h: 0.06, z: 0.15, delay: 0.25, draw: (g) => {
      const r = [[-0.45, 0], [-0.45, 0.024], [0.45, 0.024], [0.45, 0]];
      g.paper(r, { smooth: false }); g.wash(r, WASH.water, 0.2, { smooth: false });
      for (let i = 0; i < 9; i++) g.stroke([[-0.42 + i * 0.1, 0.014], [-0.39 + i * 0.1, 0.018], [-0.36 + i * 0.1, 0.014]], 0.0025, { alpha: 0.7 });
      reeds(g, -0.45, -0.3, 0.055, 4, 9); reeds(g, 0.32, 0.45, 0.05, 3, 2);
    } });
    // 凫：腿（可伸缩）+ 身
    const DX = -0.17, DZ = 0.06, LEG = 0.033 * DS;
    const dLegs = k.card({ w: 0.05 * DS, h: 0.036 * DS, x: DX, z: DZ, delay: 0.5, pad: 0.008, draw: scaled(duckLegs, DS) });
    const duck = k.card({ w: 0.22 * DS, h: 0.13 * DS, x: DX, y: LEG, z: DZ + 0.002, delay: 0.55, draw: scaled(duckBody, DS) });
    // 鹤
    const CX = 0.15, CZ = -0.12, CLEG = 0.15 * CS;
    const cLegs = k.card({ w: 0.05 * CS, h: 0.155 * CS, x: CX, z: CZ, delay: 0.75, pad: 0.008, draw: scaled(craneLegs, CS) });
    const crane = k.card({ w: 0.28 * CS, h: 0.23 * CS, x: CX, y: CLEG, z: CZ + 0.002, delay: 0.8, draw: scaled(craneBody, CS) });
    const wings = k.sprite({ w: 0.26 * CS, h: 0.14 * CS, delay: 9, draw: scaled(craneWings, CS) });
    // 假想的“续”“断”：朱色虚线
    const extend = k.line([[DX, 0.03, DZ + 0.01], [DX, 0, DZ + 0.01]], { width: 1.8, dashed: true, auto: false, opacity: 0.9, color: 0xb0432d });
    const cut = k.line([[CX - 0.07, 0.1, CZ + 0.01], [CX + 0.07, 0.1, CZ + 0.01]], { width: 2.2, auto: false, opacity: 0.9, color: 0xb0432d });
    // 朱笔圆圈（性）：平铺在纸面，圈住二者
    const ring = k.sprite({ w: 0.8, h: 0.48, delay: 9, pad: 0.004, cut: false, draw: (g) => {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const a = -0.6 + i / 60 * Math.PI * 2.05; pts.push([Math.cos(a) * 0.38, 0.24 + Math.sin(a) * 0.22]); }
      g.stroke(pts, 0.006, { color: VERM, taper: [0.05, 0.4] });
    } });
    ring.obj.rotation.x = -Math.PI / 2;
    ring.obj.position.set(0.01, 0.003, 0.16);
    k.hot(duck, 'fu'); k.hot(dLegs, 'fu');
    k.hot(crane, 'he'); k.hot(cLegs, 'he');
    k.hot(water, 'xing');
    let tf = -9, th = -9, tx = -9;
    return {
      hit(key) { if (key === 'fu') tf = k.T; if (key === 'he') th = k.T; if (key === 'xing') tx = k.T; },
      update(T) {
        const calm = T > tx && T - tx < 6;
        const amb = calm ? 0.15 : 1;
        // 凫：腿被接长，又弹回原样
        const ef = T - tf;
        let sF = 1;
        if (ef > 0 && ef < 2.2) sF = ef < 1.0 ? 1 + 2.4 * smooth(ef / 1.0) : 1 + 2.4 * Math.max(0, Math.cos((ef - 1.0) / 1.2 * Math.PI * 2.5)) * Math.exp(-(ef - 1.0) * 3);
        const dx = DX + Math.sin(T * 0.5) * 0.012 * amb;
        dLegs.pivot.scale.y = sF;
        duck.hinge.position.y = LEG * sF - 0.002;
        duck.hinge.rotation.z = (ef > 1 && ef < 2.2 ? Math.sin(ef * 30) * 0.12 * (2.2 - ef) : 0) + Math.sin(T * 1.3) * 0.03 * amb;
        duck.hinge.position.x = dLegs.hinge.position.x = dx;
        extend.reveal = ef > 0 && ef < 1.3 ? 1 : 0;
        extend.set([[dx + 0.012, LEG * sF + 0.006, DZ + 0.012], [dx + 0.012, 0.0, DZ + 0.012]]);
        // 鹤：腿被截短，又弹回，扑一扑翅
        const eh = T - th;
        let sH = 1;
        if (eh > 0 && eh < 2.2) sH = eh < 0.9 ? 1 - 0.6 * smooth(eh / 0.9) : 1 - 0.6 * Math.max(0, Math.cos((eh - 0.9) / 1.3 * Math.PI * 2.5)) * Math.exp(-(eh - 0.9) * 3);
        cLegs.pivot.scale.y = sH;
        crane.hinge.position.y = CLEG * sH;
        cut.reveal = eh > 0.1 && eh < 1.2 ? 1 : 0;
        const cy = CLEG * 0.55;
        cut.set([[CX - 0.06, cy, CZ + 0.012], [CX + 0.06, cy, CZ + 0.012]]);
        const flap = bump(T, th + 0.9, 1.4);
        wings.mat.opacity = flap * k.F;
        wings.mesh.visible = flap > 0.02;
        wings.obj.position.set(CX, crane.hinge.position.y + 0.07, CZ - 0.004);
        wings.obj.rotation.z = Math.sin(T * 14) * 0.08 * flap;
        crane.hinge.rotation.z = Math.sin(T * 0.7) * 0.025 * amb;
        // 朱圈
        const ra = clamp((T - tx) / 0.8) * clamp((tx + 6 - T) / 1);
        ring.mat.opacity = ra * k.F; ring.mesh.visible = ra > 0.01;
      },
    };
  },
};

// —— 九 · 马蹄：践霜雪的马，与伯乐的辔头栅栏 ——
function horseRun(g) {
  const lit = g.lit;
  // 腿（先画，身体压在上面）
  limb(g, [[0.055, 0.075], [0.11, 0.045], [0.155, 0.03]], 0.011);
  limb(g, [[0.045, 0.075], [0.075, 0.035], [0.09, 0.006]], 0.011);
  limb(g, [[-0.055, 0.08], [-0.1, 0.045], [-0.155, 0.035]], 0.012);
  limb(g, [[-0.045, 0.08], [-0.06, 0.035], [-0.04, 0.004]], 0.012);
  const body = [[-0.078, 0.104], [-0.084, 0.085], [-0.07, 0.066], [-0.03, 0.062], [0.03, 0.062], [0.06, 0.07], [0.082, 0.088], [0.102, 0.112], [0.126, 0.116], [0.146, 0.118], [0.152, 0.131], [0.137, 0.151], [0.118, 0.161], [0.108, 0.175], [0.101, 0.161], [0.082, 0.142], [0.052, 0.117], [0.0, 0.109], [-0.05, 0.112]];
  g.shape(body, 0.0042, { wash: WASH.ochre, washA: 0.12 + 0.35 * lit });
  // 鬃与尾
  for (let i = 0; i < 5; i++) g.stroke([[0.1 - i * 0.012, 0.16 - i * 0.009], [0.08 - i * 0.014, 0.162 - i * 0.006], [0.06 - i * 0.016, 0.155 - i * 0.004]], 0.003, { taper: [0.1, 0.7] });
  for (let i = 0; i < 4; i++) g.stroke([[-0.078, 0.102], [-0.11, 0.112 - i * 0.006], [-0.15, 0.1 - i * 0.012], [-0.18, 0.105 - i * 0.02]], 0.003, { taper: [0.05, 0.8] });
  g.dot(0.13, 0.142, 0.0035);
  g.stroke([[0.02, 0.105], [0.03, 0.075]], 0.002, { alpha: 0.6 });
  g.stroke([[-0.05, 0.1], [-0.06, 0.075]], 0.002, { alpha: 0.6 });
}
function horseTied(g) {
  const lit = g.lit;
  limb(g, [[0.05, 0.072], [0.052, 0.035], [0.05, 0.003]], 0.011);
  limb(g, [[0.035, 0.072], [0.03, 0.035], [0.032, 0.003]], 0.011);
  limb(g, [[-0.05, 0.078], [-0.058, 0.04], [-0.055, 0.003]], 0.012);
  limb(g, [[-0.035, 0.078], [-0.03, 0.04], [-0.034, 0.003]], 0.012);
  const body = [[-0.074, 0.1], [-0.082, 0.084], [-0.07, 0.066], [-0.03, 0.06], [0.03, 0.061], [0.058, 0.07], [0.08, 0.08], [0.1, 0.07], [0.118, 0.05], [0.13, 0.036], [0.142, 0.038], [0.144, 0.052], [0.132, 0.068], [0.118, 0.088], [0.104, 0.104], [0.098, 0.116], [0.09, 0.104], [0.07, 0.106], [0.04, 0.11], [0.0, 0.104], [-0.045, 0.108]];
  g.shape(body, 0.0042, { wash: WASH.ink, washA: 0.06 + 0.1 * lit });
  for (let i = 0; i < 4; i++) g.stroke([[0.1 - i * 0.012, 0.106 - i * 0.002], [0.09 - i * 0.012, 0.096 - i * 0.002]], 0.003);
  g.stroke([[-0.075, 0.1], [-0.088, 0.07], [-0.085, 0.03]], 0.003);
  // 辔头与缰绳、烙印
  g.stroke([[0.118, 0.094], [0.13, 0.058]], 0.003, { color: VERM });
  g.stroke([[0.11, 0.08], [0.14, 0.066]], 0.003, { color: VERM });
  g.stroke([[0.135, 0.06], [0.17, 0.04], [0.2, 0.05]], 0.0025, { color: VERM });
  g.circle(-0.045, 0.09, 0.008, 0.002, { fill: 'rgba(176,67,45,.25)', color: VERM });
}
const fence = (g) => {
  const r1 = [[-0.45, 0.06], [0.45, 0.06]], r2 = [[-0.45, 0.03], [0.45, 0.03]];
  for (let i = 0; i < 9; i++) {
    const x = -0.42 + i * 0.105;
    g.shape([[x - 0.008, 0], [x - 0.008, 0.085], [x, 0.095], [x + 0.008, 0.085], [x + 0.008, 0]], 0.003, { wash: WASH.ochre, washA: 0.35, smooth: false });
  }
  for (const r of [r1, r2]) { g.stroke(r, 0.009, { smooth: false }); g.stroke(r, 0.004, { color: '#e9d9b8', smooth: false }); }
};

const HS = 1.45;   // 马的放大比例
const ch9 = {
  ground(g) {
    // 霜雪地
    for (let i = 0; i < 60; i++) {
      const x = -0.44 + ((i * 37) % 88) / 100, y = -0.3 + ((i * 53) % 40) / 100;
      g.stroke([[x, y], [x + 0.012, y + 0.004]], 0.0018, { alpha: 0.35 });
    }
  },
  build(k) {
    k.card({ w: 0.9, h: 0.2, z: -0.4, delay: 0.1, draw: (g) => {
      // 远山覆雪
      const ridge = [[-0.45, 0], [-0.45, 0.06], [-0.3, 0.14], [-0.2, 0.1], [-0.05, 0.18], [0.1, 0.11], [0.22, 0.15], [0.35, 0.08], [0.45, 0.1], [0.45, 0]];
      g.shape(ridge, 0.004, { wash: WASH.water, washA: 0.1 });
      for (const [x, y] of [[-0.3, 0.14], [-0.05, 0.18], [0.22, 0.15]]) g.stroke([[x - 0.04, y - 0.04], [x - 0.015, y - 0.025], [x, y - 0.04], [x + 0.02, y - 0.022], [x + 0.045, y - 0.045]], 0.0028);
      for (let i = 0; i < 30; i++) g.dot(-0.43 + (i * 29 % 86) / 100, 0.02 + (i * 17 % 20) / 100, 0.002, 'rgba(38,34,30,.35)');
    } });
    const horses = [0, 1, 2].map((i) => {
      const free = k.sprite({ w: 0.36 * HS, h: 0.19 * HS, delay: 0.4 + i * 0.2, draw: scaled(horseRun, HS), seed: i + 3 });
      const tied = k.sprite({ w: 0.32 * HS, h: 0.19 * HS, delay: 0.4 + i * 0.2, draw: scaled(horseTied, HS), seed: i + 7 });
      return { free, tied, z: -0.22 + i * 0.13, ph: i * 0.37, x: -0.3 + i * 0.3 };
    });
    for (const h of horses) { k.hot(h.free, 'ma'); k.hot(h.tied, 'ma'); }
    const fenceCard = k.card({ w: 0.92, h: 0.1, z: 0.19, delay: 0.2, draw: fence });
    k.card({ w: 0.9, h: 0.05, z: 0.15, delay: 0.3, draw: (g) => {
      for (let i = 0; i < 30; i++) { const x = -0.43 + i * 0.03 + Math.sin(i * 5) * 0.008; const hh = 0.015 + Math.abs(Math.sin(i * 2.3)) * 0.025; g.stroke([[x, 0], [x + 0.004, hh * 0.6], [x + 0.01, hh]], 0.0025); g.dot(x + 0.01, hh, 0.003, 'rgba(96,132,150,.6)'); }
      g.fill([[-0.45, 0], [0.45, 0], [0.45, 0.006], [-0.45, 0.006]], 'rgba(38,34,30,.4)');
    } });
    k.hot(fenceCard, 'bole');
    // 伯乐（拿着辔头）
    const bole = k.card({ w: 0.15, h: 0.26, x: 0.38, z: 0.1, delay: 0.9, draw: (g) => {
      person(g, 0, 0, 0.25, { pose: 'point', face: -1, hat: true, lit: g.lit, w: 0.0042 });
      g.stroke([[-0.076, 0.158], [-0.092, 0.1], [-0.08, 0.06]], 0.0035, { color: VERM });
    } });
    k.hot(bole, 'bole');
    let tied = 0, want = 0, tm = -9, run = 0;
    return {
      hit(key) { if (key === 'bole') want = 1; if (key === 'ma') { want = 0; tm = k.T; } },
      update(T, dt) {
        tied = lerp(tied, want, 1 - Math.exp(-2.2 * dt));
        const speed = 1 - tied;
        run += dt * 0.55 * speed * (1 + bump(T, tm, 1.5) * 0.8);
        horses.forEach((h, i) => {
          // 在霜地上绕圈奔跑，转弯时纸片侧过身去
          const a = run + i * 2.1;
          const x = Math.cos(a) * 0.2, z = -0.04 + Math.sin(a) * 0.1;
          const vx = -Math.sin(a);
          // 掉头时纸片一窄一宽地翻过来
          const th = vx >= 0 ? 0 : Math.PI;
          const sq = 0.3 + 0.7 * Math.min(1, Math.abs(vx) * 2.2);
          const gal = Math.sin(T * 9 + h.ph * 10) * speed;
          for (const sp of [h.free, h.tied]) {
            sp.obj.position.set(x, Math.max(0, gal) * 0.025 * speed, z);
            sp.obj.rotation.set(0, th, gal * 0.06);
            sp.obj.scale.x = lerp(sq, 1, tied);
          }
          fade(h.free, 1 - tied);
          fade(h.tied, tied);
        });
        // 栅栏：伯乐来了才立起
        const fa = smooth(tied * 1.4);
        fenceCard.pivot.rotation.x = -Math.PI / 2 * (1 - fa * fenceCard.rise);
        fenceCard.mat.opacity *= fa;
        fenceCard.mesh.visible = fa > 0.02;
        bole.hinge.position.x = lerp(0.52, 0.38, smooth(tied * 1.5));
        bole.mat.opacity *= clamp(tied * 3);
        bole.mesh.visible = bole.mat.opacity > 0.01;
      },
    };
  },
};

// —— 十 · 胠箧：捆紧锁牢的箱子，被巨盗整个背走 ——
const chest = (g) => {
  const lit = g.lit;
  const front = [[-0.1, 0.0], [-0.1, 0.1], [0.08, 0.1], [0.08, 0.0]];
  g.shape([[-0.1, 0.1], [-0.07, 0.125], [0.11, 0.125], [0.08, 0.1]], 0.004, { smooth: false, wash: WASH.ochre, washA: 0.35 + 0.3 * lit });
  g.shape([[0.08, 0.0], [0.08, 0.1], [0.11, 0.125], [0.11, 0.025]], 0.004, { smooth: false, wash: WASH.ochre, washA: 0.5 + 0.3 * lit });
  g.shape(front, 0.0045, { smooth: false, wash: WASH.ochre, washA: 0.25 + 0.3 * lit });
  g.stroke([[-0.1, 0.075], [0.08, 0.075]], 0.0025, { smooth: false, alpha: 0.6 });
  for (let i = 0; i < 5; i++) g.stroke([[-0.09 + i * 0.035, 0.012], [-0.085 + i * 0.035, 0.06]], 0.0015, { alpha: 0.35 });
  // 绳（缄縢）
  for (const [a, b] of [[[-0.045, 0.0], [-0.045, 0.1]], [[0.03, 0.0], [0.03, 0.1]]]) { g.stroke([a, b], 0.007, { smooth: false, color: '#8a5a32' }); g.stroke([a, b], 0.0025, { smooth: false, color: '#e7cf9e' }); }
  g.stroke([[-0.1, 0.04], [0.08, 0.04], [0.11, 0.065]], 0.007, { smooth: false, color: '#8a5a32' });
  g.stroke([[-0.045, 0.1], [-0.015, 0.125]], 0.006, { color: '#8a5a32' });
  g.stroke([[0.03, 0.1], [0.06, 0.125]], 0.006, { color: '#8a5a32' });
  g.circle(-0.045, 0.04, 0.009, 0.003, { fill: '#c49a5a' });
  // 锁（扃𫔎）
  g.shape([[-0.022, 0.05], [0.005, 0.05], [0.005, 0.07], [-0.022, 0.07]], 0.003, { fill: '#b9b2a2', smooth: false });
  g.shape([[-0.03, 0.052], [0.013, 0.052], [0.013, 0.058], [-0.03, 0.058]], 0.0025, { fill: '#8f877a', smooth: false });
  g.stroke(ellipsePts(-0.0085, 0.07, 0.009, 0.01, 12, 0, Math.PI), 0.003);
};
const balance = (g) => {
  // 衡木（中心为支点，原点在中下）
  g.shape([[-0.17, 0.0], [-0.17, 0.01], [0.17, 0.01], [0.17, 0.0]], 0.0035, { smooth: false, wash: WASH.ochre, washA: 0.4 });
  g.circle(0, 0.005, 0.01, 0.003, { fill: '#c49a5a' });
  g.dot(-0.165, 0.005, 0.004); g.dot(0.165, 0.005, 0.004);
};
const pan = (label, item) => (g) => {
  // 原点在挂点下方：绳 + 盘
  g.stroke([[0, 0.13], [-0.035, 0.035]], 0.0022); g.stroke([[0, 0.13], [0.035, 0.035]], 0.0022);
  g.shape([[-0.045, 0.035], [-0.035, 0.02], [0.035, 0.02], [0.045, 0.035]], 0.003, { wash: WASH.ochre, washA: 0.3 });
  item(g);
  g.text(label, 0, 0.004, 0.018, { color: VERM });
};
const hookItem = (g) => { g.stroke([[-0.008, 0.04], [0.0, 0.048], [0.008, 0.044], [0.006, 0.038]], 0.0035); };
const crownItem = (g) => {
  g.shape([[-0.028, 0.036], [-0.03, 0.06], [-0.015, 0.05], [0, 0.068], [0.015, 0.05], [0.03, 0.06], [0.028, 0.036]], 0.003, { wash: WASH.verm, washA: 0.35, smooth: false });
  g.stroke([[-0.04, 0.062], [0.04, 0.062]], 0.0035, { smooth: false });
};

const ch10 = {
  ground(g) {
    g.stroke([[-0.42, 0.02], [0.42, 0.02]], 0.002, { alpha: 0.3 });
    for (let i = 0; i < 8; i++) g.stroke([[-0.4 + i * 0.11, 0.0], [-0.36 + i * 0.11, 0.04]], 0.0015, { alpha: 0.25 });
  },
  build(k) {
    // 天平（窃钩者诛，窃国者为诸侯）
    const BS = 0.85, BX = 0.27, BZ = -0.3, BY = 0.26 * BS, ARM = 0.165 * BS, HANG = 0.135 * BS;
    const post = k.card({ w: 0.08 * BS, h: 0.27 * BS, x: BX, z: BZ, delay: 0.1, draw: scaled((g) => {
      g.shape([[-0.006, 0.01], [-0.006, 0.26], [0.006, 0.26], [0.006, 0.01]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.4 });
      g.shape([[-0.035, 0.0], [-0.03, 0.015], [0.03, 0.015], [0.035, 0.0]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.4 });
    }, BS) });
    const beam = k.sprite({ w: 0.36 * BS, h: 0.02 * BS, delay: 0.3, pad: 0.008, draw: scaled(balance, BS) });
    beam.obj.position.set(BX, BY, BZ + 0.002);
    const panL = k.sprite({ w: 0.1 * BS, h: 0.14 * BS, delay: 0.4, pad: 0.008, draw: scaled(pan('钩', hookItem), BS) });
    const panR = k.sprite({ w: 0.1 * BS, h: 0.14 * BS, delay: 0.45, pad: 0.008, draw: scaled(pan('国', crownItem), BS) });
    k.hot(post, 'gou'); k.hot(panL, 'gou'); k.hot(panR, 'gou'); k.hot(beam, 'gou');
    // 箱子
    const CHS = 1.3, HOME = [-0.02, 0, -0.04];
    const box = k.card({ w: 0.24 * CHS, h: 0.13 * CHS, x: HOME[0], z: HOME[2], delay: 0.5, draw: scaled(chest, CHS) });
    k.hot(box, 'xiang');
    const glint = k.sprite({ w: 0.05, h: 0.05, delay: 9, pad: 0.004, cut: false, draw: (g) => {
      g.stroke([[0, 0.002], [0, 0.048]], 0.0035, { color: '#e2b04a' }); g.stroke([[-0.023, 0.025], [0.023, 0.025]], 0.0035, { color: '#e2b04a' });
    } });
    // 巨盗
    const TX0 = -0.34;
    const thief = k.card({ w: 0.24, h: 0.39, x: TX0, z: 0.06, delay: 0.8, draw: (g) => {
      person(g, 0, 0, 0.37, { pose: 'walk', face: 1, robe: WASH.ink, lit: g.lit, w: 0.005 });
      g.stroke([[-0.006, 0.346], [0.058, 0.354], [0.074, 0.337]], 0.005, { color: VERM });
    } });
    k.hot(thief, 'dao');
    // 一圈收紧的绳
    const cordPts = (s) => { const p = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; p.push([HOME[0] + 0.02 + Math.cos(a) * 0.22 * s, 0.08, HOME[2] + Math.sin(a) * 0.07 * s]); } return p; };
    const cord = k.line(cordPts(1.4), { width: 1.6, dashed: true, auto: false, opacity: 0.6, color: 0x8a5a32 });
    let td = -99, tx = -9, tg = -9;
    return {
      hit(key) { if (key === 'dao' && k.T - td > 6.5) td = k.T; if (key === 'xiang') tx = k.T; if (key === 'gou') tg = k.T; },
      update(T) {
        // 绳收紧
        const ct = T - tx;
        const ts = ct > 0 && ct < 1.6 ? 1.4 - 0.45 * smooth(ct / 1.0) : 1.4;
        cord.reveal = ct > 0 && ct < 1.8 ? 1 : 0;
        cord.set(cordPts(ts));
        // 锁上一闪
        const gp = (T % 4.5) / 4.5;
        const ga = (gp > 0.85 ? Math.sin((gp - 0.85) / 0.15 * Math.PI) : 0) + bump(T, tx + 1, 0.6);
        glint.mat.opacity = Math.min(1, ga) * k.F; glint.mesh.visible = ga > 0.02;
        // 巨盗：走来，背起箱子，走出画面，再送回
        const d = T - td;
        const GRAB = HOME[0] - 0.18;
        let tX = TX0 + Math.sin(T * 0.5) * 0.01, bX = HOME[0], bY = 0, bZ = HOME[2], bR = 0, carry = 0, face = 1, out = 1;
        if (d > 0 && d < 7.4) {
          if (d < 1.6) tX = lerp(TX0, GRAB, smooth(d / 1.6));
          else if (d < 2.3) { tX = GRAB; carry = smooth((d - 1.6) / 0.7); }
          else if (d < 4.0) { tX = lerp(GRAB, 0.5, smooth((d - 2.3) / 1.7)); carry = 1; }
          else if (d < 5.6) { tX = lerp(0.5, GRAB, smooth((d - 4.0) / 1.6)); carry = 1; face = -1; }
          else if (d < 6.3) { tX = GRAB; carry = 1 - smooth((d - 5.6) / 0.7); face = -1; }
          else { tX = lerp(GRAB, TX0, smooth((d - 6.3) / 1.1)); face = d < 6.6 ? -1 : 1; }
          const walk = Math.abs(Math.sin(d * 8)) * 0.012;
          thief.hinge.position.y = walk;
          bX = lerp(HOME[0], tX - 0.11 * face, carry); bY = lerp(0, 0.17 + walk, carry); bZ = lerp(HOME[2], 0.04, carry); bR = -0.3 * face * carry;
          out = clamp((0.42 - tX) / 0.12);
        } else thief.hinge.position.y = 0;
        thief.hinge.position.x = tX;
        thief.hinge.rotation.y = face < 0 ? Math.PI : 0;
        thief.mat.opacity *= out; thief.mesh.visible = thief.mat.opacity > 0.01;
        box.mat.opacity *= out; box.mesh.visible = box.mat.opacity > 0.01;
        box.hinge.position.set(bX, bY, bZ);
        box.hinge.rotation.z = bR;
        glint.obj.position.set(bX - 0.015, bY + 0.11, bZ + 0.006);
        // 天平：钩沉，国升
        const tilt = 0.035 * Math.sin(T * 0.8) + (T > tg && T - tg < 4 ? 0.32 * smooth(Math.min(1, (T - tg) / 0.8)) * clamp((tg + 4 - T) / 0.8) : 0);
        beam.obj.rotation.z = tilt;
        const c = Math.cos(tilt), sn = Math.sin(tilt);
        panL.obj.position.set(BX - ARM * c, BY + 0.005 - ARM * sn - HANG, BZ + 0.004);
        panR.obj.position.set(BX + ARM * c, BY + 0.005 + ARM * sn - HANG, BZ + 0.004);
      },
    };
  },
};

// —— 十一 · 在宥：云将东游，遇鸿蒙拊髀雀跃 ——
const hongA = (g) => {
  // 跳起，张臂
  person(g, 0, 0.0, 0.27, { pose: 'arms', face: -1, beard: true, lit: g.lit, w: 0.0048 });
};
const hongB = (g) => {
  // 落地，俯身拍腿
  person(g, 0, 0.0, 0.27, { pose: 'bow', face: -1, beard: true, lit: g.lit, w: 0.0048 });
};

const ch11 = {
  ground(g) {
    g.text('游', 0.3, -0.12, 0.05, { color: 'rgba(176,67,45,.25)' });
  },
  build(k) {
    const fuyao = k.card({ w: 0.28, h: 0.3, x: -0.3, z: -0.32, delay: 0.1, draw: (g) => tree(g, 0, 0, 0.28, { seed: 6, lit: g.lit, w: 0.0045 }) });
    const clouds = [[0.12, 0.3, -0.34, 0.9], [-0.08, 0.36, -0.22, 0.7], [0.24, 0.26, -0.18, 0.65]].map(([x, y, z, s], i) => {
      const c = k.sprite({ w: 0.24 * s + 0.05, h: 0.1 * s, delay: 0.3 + i * 0.15, pad: 0.008, draw: (g) => g.cloud(0, 0.045 * s, 0.085 * s, 0.004) });
      c.obj.position.set(x, y, z);
      return { c, x, y };
    });
    // 云将：立于云头
    const yun = k.sprite({ w: 0.34, h: 0.34, delay: 0.6, draw: (g) => {
      g.cloud(0, 0.05, 0.11, 0.0048, { wash: WASH.water, washA: 0.15 + 0.3 * g.lit });
      person(g, 0.0, 0.07, 0.25, { pose: 'bow', face: 1, hat: true, lit: g.lit, w: 0.0042 });
    } });
    k.hot(yun, 'yunjiang');
    // 鸿蒙
    const hA = k.sprite({ w: 0.22, h: 0.3, delay: 0.8, draw: hongA });
    const hB = k.sprite({ w: 0.22, h: 0.3, delay: 0.8, draw: hongB });
    k.hot(hA, 'hongmeng'); k.hot(hB, 'hongmeng');
    const sparrow = k.sprite({ w: 0.1, h: 0.07, delay: 1.0, pad: 0.006, draw: (g) => birdSide(g, 0, 0.02, 0.08, { dir: -1, w: 0.0035, lit: g.lit }) });
    // 自己生长的草木
    const plants = [[-0.38, 0.14], [-0.22, 0.19], [-0.02, 0.16], [0.2, 0.2], [0.39, 0.15]].map(([x, z], i) => {
      const p = k.card({ w: 0.12, h: 0.15, x, z, delay: 1.0 + i * 0.08, pad: 0.008, draw: scaled((g) => {
        g.stroke([[0, 0], [0.004, 0.05], [-0.002, 0.09]], 0.003);
        for (const [y, d] of [[0.025, -1], [0.045, 1], [0.065, -1]]) g.shape([[0.002, y], [d * 0.02, y + 0.012], [d * 0.032, y + 0.006], [d * 0.015, y - 0.002]], 0.0025, { wash: WASH.green, washA: 0.25 + 0.35 * g.lit });
        g.circle(-0.002, 0.092, 0.008 + 0.004 * g.lit, 0.0025, { wash: WASH.verm, washA: 0.6 * g.lit });
      }, 1.5) });
      return p;
    });
    plants.forEach(p => k.hot(p, 'xin'));
    let gx = -9, tm = -9, ty = -9;
    return {
      hit(key) {
        if (key === 'xin') { gx = k.T; plants.forEach(p => { p.litTarget = 1; }); }
        if (key === 'hongmeng') tm = k.T; if (key === 'yunjiang') ty = k.T;
      },
      update(T) {
        clouds.forEach(({ c, x, y }, i) => { c.obj.position.x = x + Math.sin(T * 0.25 + i * 2) * 0.05; c.obj.position.y = y + Math.sin(T * 0.4 + i) * 0.01; });
        // 云将从西边飘来（东游），停在鸿蒙面前
        const arrive = smooth(clamp((T - 0.6) / 3));
        const bow = bump(T, ty, 1.2);
        yun.obj.position.set(lerp(-0.4, -0.16, arrive) + Math.sin(T * 0.6) * 0.012, 0.06 + Math.sin(T * 0.9) * 0.012, -0.1);
        yun.obj.rotation.z = -bow * 0.15;
        // 鸿蒙一刻不停地跳
        const rate = 2.2 + bump(T, tm, 2) * 1.8;
        const ph = (T * rate) % 1;
        const up = Math.sin(ph * Math.PI);
        const air = ph < 0.6;
        for (const h of [hA, hB]) h.obj.position.set(0.18, up * 0.08, -0.02);
        hA.obj.rotation.z = Math.sin(T * 3) * 0.05;
        fade(hA, air ? 1 : 0);
        fade(hB, air ? 0 : 1);
        // 麻雀也跳
        const sp = (T * 2.6 + 0.3) % 1;
        sparrow.obj.position.set(0.36 + Math.sin(T * 0.7) * 0.02, Math.sin(sp * Math.PI) * 0.05, 0.04);
        // 草木自己长起来
        const grow = T > gx ? easeOut(clamp((T - gx) / 2.5)) : 0;
        plants.forEach((p, i) => {
          const gi = clamp(grow * 1.4 - i * 0.08);
          p.pivot.scale.setScalar(0.3 + 0.7 * gi + Math.sin(T * 2 + i) * 0.02 * gi);
        });
        fuyao.hinge.rotation.z = Math.sin(T * 0.6) * 0.01;
      },
    };
  },
};

// —— 十二 · 天地：抱瓮灌园，不用桔槔 ——
const gardener = (g) => {
  person(g, 0, 0, 0.17, { pose: 'bow', face: 1, beard: true, lit: g.lit, w: 0.0042 });
  // 怀里的瓮
  const jx = 0.06, jy = 0.07;
  g.shape([[jx - 0.018, jy + 0.04], [jx - 0.03, jy + 0.02], [jx - 0.026, jy - 0.005], [jx, jy - 0.012], [jx + 0.026, jy - 0.005], [jx + 0.03, jy + 0.02], [jx + 0.018, jy + 0.04]], 0.0035, { wash: WASH.ochre, washA: 0.45 + 0.2 * g.lit });
  g.stroke([[jx - 0.02, jy + 0.04], [jx + 0.02, jy + 0.04]], 0.003);
  g.stroke([[jx - 0.024, jy + 0.012], [jx + 0.024, jy + 0.012]], 0.0018, { alpha: 0.6 });
};
const wellDraw = (g) => {
  // 井栏：一圈石砌
  g.shape([[-0.075, 0.0], [-0.075, 0.05], [0.075, 0.05], [0.075, 0.0]], 0.004, { smooth: false, wash: WASH.ink, washA: 0.06 });
  g.shape(ellipsePts(0, 0.05, 0.075, 0.018, 24).slice(0, -1), 0.004, { fill: '#5b544b' });
  g.shape(ellipsePts(0, 0.053, 0.06, 0.012, 24).slice(0, -1), 0.0025, { fill: '#3a352f', wash: WASH.water, washA: 0.4 });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) g.stroke([[-0.075 + i * 0.033 + (r % 2) * 0.016, r * 0.025 + 0.002], [-0.075 + i * 0.033 + (r % 2) * 0.016, r * 0.025 + 0.022]], 0.002, { alpha: 0.6 });
  g.stroke([[-0.075, 0.025], [0.075, 0.025]], 0.002, { alpha: 0.6, smooth: false });
};
const sweepPost = (g) => {
  g.shape([[-0.007, 0], [-0.007, 0.25], [0.007, 0.25], [0.007, 0]], 0.0035, { smooth: false, wash: WASH.ochre, washA: 0.45 });
  g.stroke([[-0.007, 0.25], [-0.016, 0.275]], 0.005); g.stroke([[0.007, 0.25], [0.016, 0.275]], 0.005);
};
const sweepBeam = (g) => {
  // 长杆：右端系石（后重），左端系桶（前轻）；原点为支点
  g.shape([[0.09, -0.004], [0.09, 0.006], [-0.2, 0.004], [-0.2, -0.003]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.5 + 0.3 * g.lit });
  g.shape([[0.095, -0.002], [0.11, -0.03], [0.085, -0.045], [0.065, -0.03], [0.075, -0.004]], 0.0035, { wash: WASH.ink, washA: 0.25 });
  g.circle(0, 0.001, 0.006, 0.0025, { fill: '#c49a5a' });
};
const bucket = (g) => {
  // 原点在杆端：绳往下，桶在底
  g.stroke([[0, 0.13], [0, 0.03]], 0.002);
  g.shape([[-0.016, 0.032], [-0.013, 0.0], [0.013, 0.0], [0.016, 0.032]], 0.003, { wash: WASH.ochre, washA: 0.45 + 0.3 * g.lit, smooth: false });
  g.stroke([[-0.016, 0.032], [0, 0.045], [0.016, 0.032]], 0.0022);
};
const heartGear = (g) => {
  const H = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 2; H.push([0.0045 * 16 * Math.pow(Math.sin(t), 3), 0.055 + 0.0045 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
  g.stroke(H, 0.004, { color: VERM, closed: true, taper: [0.02, 0.02] });
};
const gear = (g) => {
  const pts = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = i % 2 ? 0.022 : 0.03; pts.push([Math.cos(a) * r, 0.032 + Math.sin(a) * r], [Math.cos(a + 0.13) * r, 0.032 + Math.sin(a + 0.13) * r]); }
  g.shape(pts, 0.003, { smooth: false, wash: WASH.ink, washA: 0.2 });
  g.circle(0, 0.032, 0.008, 0.0025);
};

const ch12 = {
  ground(g) {
    // 菜畦
    for (let r = 0; r < 4; r++) {
      g.stroke([[-0.44, -0.04 + r * 0.06], [-0.12, -0.04 + r * 0.06]], 0.002, { alpha: 0.3 });
      for (let i = 0; i < 6; i++) g.stroke(ellipsePts(-0.41 + i * 0.055, -0.02 + r * 0.06, 0.012, 0.008, 10, 0.2, 2.9), 0.0018, { alpha: 0.35 });
    }
    g.stroke([[-0.1, 0.02], [0.05, 0.08], [0.2, 0.18]], 0.0018, { alpha: 0.25 });
  },
  build(k) {
    k.card({ w: 0.7, h: 0.16, x: -0.08, z: -0.36, delay: 0.1, draw: (g) => {
      const r = [[-0.35, 0], [-0.34, 0.05], [-0.22, 0.1], [-0.06, 0.07], [0.08, 0.13], [0.22, 0.08], [0.35, 0.05], [0.35, 0]];
      g.shape(r, 0.004, { wash: WASH.green, washA: 0.12 });
      for (const [x, y] of [[-0.22, 0.1], [0.08, 0.13]]) g.stroke([[x - 0.04, y - 0.035], [x, y - 0.012], [x + 0.04, y - 0.035]], 0.0025, { alpha: 0.6 });
      g.text('汉 阴', -0.02, 0.03, 0.022, { color: 'rgba(40,34,30,.45)' });
    } });
    const WS = 1.7, WX = 0.05, WZ = -0.12;
    const well = k.card({ w: 0.17 * WS, h: 0.08 * WS, x: WX, z: WZ, delay: 0.3, draw: scaled(wellDraw, WS) });
    const SS = 1.3, PX = 0.3, PZ = -0.16, PY = 0.25 * SS, ARM = 0.2 * SS;
    const post = k.card({ w: 0.05 * SS, h: 0.28 * SS, x: PX, z: PZ, delay: 0.4, draw: scaled(sweepPost, SS) });
    const beam = k.sprite({ w: 0.36 * SS, h: 0.02 * SS, delay: 0.6, pad: 0.008, draw: scaled(sweepBeam, SS) });
    beam.obj.position.set(PX, PY + 0.008, PZ + 0.006);
    const buck = k.sprite({ w: 0.05 * SS, h: 0.14 * SS, delay: 0.7, pad: 0.006, draw: scaled(bucket, SS) });
    k.hot(post, 'gao'); k.hot(beam, 'gao'); k.hot(buck, 'gao'); k.hot(well, 'gao');
    const GS = 1.6;
    const man = k.sprite({ w: 0.14 * GS, h: 0.19 * GS, delay: 0.8, draw: scaled(gardener, GS) });
    k.hot(man, 'weng');
    // 菜
    const greens = k.card({ w: 0.44, h: 0.08, x: -0.22, z: 0.17, delay: 0.5, draw: scaled((g) => {
      for (let i = 0; i < 7; i++) {
        const x = -0.16 + i * 0.053;
        for (const d of [-1, 0, 1]) g.shape([[x, 0], [x + d * 0.02, 0.025 + (d ? 0 : 0.01)], [x + d * 0.012, 0.04 + (d ? 0 : 0.01)], [x + d * 0.003, 0.012]], 0.0025, { wash: WASH.green, washA: 0.3 + 0.3 * g.lit });
      }
    }, 1.25) });
    k.hot(greens, 'weng');
    const heart = k.sprite({ w: 0.2, h: 0.15, delay: 9, pad: 0.004, cut: false, draw: scaled(heartGear, 1.3) });
    const gearG = k.group();
    const gr = k.sprite({ w: 0.09, h: 0.09, delay: 9, pad: 0.004, draw: scaled(gear, 1.3), parent: gearG });
    gr.obj.position.y = -0.042;
    k.hot(heart, 'xin');
    let tg = -9, tw = -9, tx = -9;
    return {
      hit(key) { if (key === 'gao') tg = k.T; if (key === 'weng') tw = k.T; if (key === 'xin') tx = k.T; },
      update(T) {
        // 槔：平时微晃，点它则飞快地一起一落，桶探入井中
        const fast = T > tg && T - tg < 4;
        const ang = fast ? -Math.abs(Math.sin((T - tg) * 3)) * 0.34 : -0.04 + Math.sin(T * 0.5) * 0.02;
        beam.obj.rotation.z = -ang;
        buck.obj.position.set(PX - ARM * Math.cos(ang), PY + 0.008 + ARM * Math.sin(ang) - 0.135 * SS, PZ + 0.01);
        // 老人：慢慢走到井边，又抱瓮走回菜畦
        const cyc = 14, p = ((T - 1.2) % cyc + cyc) % cyc;
        const A = -0.27, B = -0.1;
        let x, face = 1, tilt = 0, dip = 0;
        if (p < 5) x = lerp(A, B, smooth(p / 5));
        else if (p < 7) { x = B; dip = Math.sin((p - 5) / 2 * Math.PI) * 0.03; }
        else if (p < 12) { x = lerp(B, A, smooth((p - 7) / 5)); face = -1; }
        else { x = A; face = -1; tilt = Math.sin((p - 12) / 2 * Math.PI) * 0.35; }
        const pw = T - tw;
        if (pw > 0 && pw < 2) tilt = Math.max(tilt, Math.sin(pw / 2 * Math.PI) * 0.3);
        const walking = (p < 5 || (p > 7 && p < 12));
        man.obj.position.set(x, -dip + (walking ? Math.abs(Math.sin(T * 5)) * 0.008 : 0), 0.04);
        man.obj.rotation.set(0, face < 0 ? Math.PI : 0, tilt * 0.4);
        // 机心
        const ha = clamp((T - tx) / 0.6) * clamp((tx + 4 - T) / 1);
        heart.mat.opacity = ha * k.F; heart.mesh.visible = ha > 0.01;
        gr.mat.opacity = ha * k.F; gr.mesh.visible = ha > 0.01;
        heart.obj.position.set(x, 0.33, 0.05);
        gearG.position.set(x, 0.33 + 0.056 * 1.3, 0.055);
        gearG.rotation.z = T * 3;
      },
    };
  },
};

// —— 十三 · 天道：轮扁斫轮于堂下 ——
const hall = (g) => {
  // 台基与台阶
  g.shape([[-0.25, 0], [-0.25, 0.07], [0.25, 0.07], [0.25, 0]], 0.004, { smooth: false, wash: WASH.ochre, washA: 0.18 });
  for (let i = 1; i < 4; i++) g.stroke([[0.12 + i * 0.03, 0.07 - i * 0.0175], [0.25, 0.07 - i * 0.0175]], 0.0025, { smooth: false, alpha: 0.7 });
  // 柱
  for (const x of [-0.21, 0.21]) g.shape([[x - 0.01, 0.07], [x - 0.01, 0.24], [x + 0.01, 0.24], [x + 0.01, 0.07]], 0.0035, { smooth: false, wash: WASH.verm, washA: 0.3 });
  // 屋檐
  g.shape([[-0.27, 0.24], [-0.29, 0.255], [-0.24, 0.27], [-0.15, 0.31], [0.15, 0.31], [0.24, 0.27], [0.29, 0.255], [0.27, 0.24]], 0.0045, { wash: WASH.ink, washA: 0.2 });
  for (let i = 0; i < 10; i++) g.stroke([[-0.22 + i * 0.048, 0.25], [-0.2 + i * 0.044, 0.3]], 0.002, { alpha: 0.55 });
  g.stroke([[-0.16, 0.31], [0.16, 0.31]], 0.006);
  // 帘
  g.stroke([[-0.2, 0.235], [0.2, 0.235]], 0.0025, { alpha: 0.6 });
};
const duke = (g) => {
  person(g, 0, 0, 0.17, { pose: 'sit', face: 1, hat: true, lit: g.lit * 0.5, w: 0.004 });
};
const book = (g) => {
  // 摊开的竹简，字随 lit 化为糟粕
  const lit = g.lit;
  const n = 9, sw = 0.012, x0 = -n * sw / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sw;
    g.shape([[x, 0], [x, 0.07], [x + sw, 0.07], [x + sw, 0]], 0.0022, { smooth: false, wash: WASH.ochre, washA: 0.25 });
    for (let j = 0; j < 5; j++) {
      const y = 0.012 + j * 0.012;
      if (lit < 0.95) g.line(x + sw * 0.3, y, x + sw * 0.7, y + 0.002, 0.0025, { alpha: 1 - lit });
      if (lit > 0.05) g.dot(x + sw * 0.5 + Math.sin(i * 7 + j * 3) * 0.004, 0.006 + (j * 0.004) * (1 - lit) + Math.abs(Math.sin(i + j * 5)) * 0.004, 0.0018, `rgba(38,34,30,${0.7 * lit})`);
    }
  }
  g.stroke([[x0 - 0.004, 0.022], [x0 + n * sw + 0.004, 0.022]], 0.002, { color: VERM });
  g.stroke([[x0 - 0.004, 0.05], [x0 + n * sw + 0.004, 0.05]], 0.002, { color: VERM });
};
const wheelwright = (g) => {
  person(g, 0, 0, 0.16, { pose: 'sit', face: 1, beard: true, lit: g.lit, w: 0.004 });
};
const wheel = (g) => {
  // 原点在轮底，轮心在 (0, r)
  const r = 0.07, c = r;
  g.shape(ellipsePts(0, c, r, r, 40).slice(0, -1), 0.0045, { wash: WASH.ochre, washA: 0.3 + 0.3 * g.lit });
  g.shape(ellipsePts(0, c, r * 0.82, r * 0.82, 40).slice(0, -1), 0.003, { fill: 'rgba(0,0,0,0)' });
  // 镂空：用纸色描辐条之间（保持可读）
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    g.stroke([[Math.cos(a) * 0.012, c + Math.sin(a) * 0.012], [Math.cos(a) * r * 0.82, c + Math.sin(a) * r * 0.82]], 0.003, { smooth: false, taper: [0.02, 0.02] });
  }
  g.circle(0, c, 0.014, 0.003, { wash: WASH.ochre, washA: 0.5 });
  g.dot(0, c, 0.004);
};
const chisel = (g) => {
  g.shape([[-0.004, 0.0], [-0.005, 0.04], [0.005, 0.04], [0.004, 0.0]], 0.0025, { fill: '#b9b2a2', smooth: false });
  g.shape([[-0.006, 0.04], [-0.006, 0.07], [0.006, 0.07], [0.006, 0.04]], 0.0025, { wash: WASH.ochre, washA: 0.5, smooth: false });
};

const ch13 = {
  ground(g) {
    // 木屑
    for (let i = 0; i < 18; i++) {
      const x = 0.0 + ((i * 23) % 30) / 100, y = -0.08 - ((i * 13) % 12) / 100;
      g.stroke([[x, y], [x + 0.01, y + 0.004], [x + 0.016, y]], 0.0016, { alpha: 0.35 });
    }
    g.text('堂上', -0.33, 0.52, 0.022, { color: 'rgba(40,34,30,.4)' });
    g.text('堂下', -0.38, 0.0, 0.022, { color: 'rgba(40,34,30,.4)' });
  },
  build(k) {
    k.card({ w: 0.6, h: 0.32, x: -0.06, z: -0.3, delay: 0.1, draw: hall });
    const lord = k.sprite({ w: 0.24, h: 0.2, delay: 0.5, draw: scaled(duke, 1.5) });
    lord.obj.position.set(-0.14, 0.07, -0.27);
    const bk = k.sprite({ w: 0.2, h: 0.12, delay: 0.6, pad: 0.008, draw: scaled(book, 1.5) });
    bk.obj.position.set(0.01, 0.075, -0.255);
    k.hot(bk, 'shu'); k.hot(lord, 'shu');
    const WW = 1.75;
    const ww = k.sprite({ w: 0.15 * WW, h: 0.13 * WW, delay: 0.8, draw: scaled(wheelwright, WW) });
    ww.obj.position.set(-0.2, 0, 0.09);
    k.hot(ww, 'bian');
    const R = 0.07 * WW;
    const wheelG = k.group();
    wheelG.position.set(0.17, R, 0.07);
    const wh = k.sprite({ w: 0.15 * WW, h: 0.15 * WW, delay: 0.9, pad: 0.008, draw: scaled(wheel, WW), parent: wheelG });
    wh.obj.position.y = -R;
    k.hot(wh, 'lun');
    const ch = k.sprite({ w: 0.045, h: 0.11, delay: 1.0, pad: 0.006, draw: scaled(chisel, 1.6) });
    // 手到心：一道虚线
    const arc = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; arc.push([-0.02 - t * 0.14, 0.11 + Math.sin(t * Math.PI) * 0.09 + t * 0.06, 0.1]); }
    const link = k.line(arc, { width: 1.8, dashed: true, auto: false, opacity: 0.85, color: 0xb0432d });
    let tl = -9, tb = -9, ts = -9, nextTap = 0;
    return {
      hit(key) { if (key === 'lun') { tl = k.T; nextTap = k.T; } if (key === 'bian') tb = k.T; if (key === 'shu') ts = k.T; },
      update(T, dt) {
        const fast = T > tl && T - tl < 3.5;
        wheelG.rotation.z -= dt * (fast ? 4.5 : 0.35);
        // 凿子：一下一下
        const rate = fast ? 5 : 0.8;
        const tp = (T * rate) % 1;
        const hitp = tp < 0.2 ? Math.sin(tp / 0.2 * Math.PI) : 0;
        ch.obj.position.set(0.04 - hitp * 0.015, 0.1 + hitp * 0.012, 0.1);
        ch.obj.rotation.z = 1.0 + hitp * 0.25;
        ww.obj.rotation.z = -hitp * 0.03;
        if (fast && T >= nextTap) { sfx.tap(880, 0.08, 0.06); nextTap = T + 1 / rate; }
        link.reveal = T > tb && T - tb < 3 ? smooth(clamp((T - tb) / 0.8)) : 0;
        ww.obj.position.y = bump(T, tb, 0.6) * 0.012;
        // 书页翻动
        const fan = bump(T, ts, 1.6);
        bk.obj.rotation.x = -fan * 0.5;
        bk.obj.rotation.z = Math.sin(T * 12) * 0.05 * fan;
        lord.obj.rotation.z = Math.sin(T * 0.6) * 0.01;
      },
    };
  },
};

export const scenes = { ch8, ch9, ch10, ch11, ch12, ch13 };
