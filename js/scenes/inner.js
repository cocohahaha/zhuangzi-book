// 内篇七幅插图
import { WASH, VERM, INK, PAPER } from '../ink.js';
import { person, fish, birdSide, tree, mountains, waveRows, waveCardShape, butterflyWing, ellipsePts } from '../art.js';
import { clamp, lerp, smooth, win, easeInOut } from '../util.js';

const fade = (it, f) => { for (const p of (it.parts || [it])) { p.mat.opacity *= f; p.mesh.visible = p.mat.opacity > 0.01; } };

// 鹏的翅膀：长而宽，羽毛分叉
const pengWing = (g) => {
  const L = 0.3;
  const out = [[-0.035, 0.0], [-0.05, L * 0.35], [-0.04, L * 0.7], [-0.01, L], [0.02, L * 0.92], [0.04, L * 0.82], [0.055, L * 0.66], [0.06, L * 0.48], [0.062, L * 0.3], [0.05, 0.0]];
  g.shape(out, 0.004, { wash: WASH.ink, washA: 0.08 + 0.15 * g.lit });
  for (let i = 0; i < 6; i++) {
    const y = L * (0.35 + i * 0.1);
    g.stroke([[-0.03 + i * 0.004, y - 0.04], [0.05 - i * 0.002, y]], 0.0025, { alpha: 0.65 });
  }
  g.stroke([[-0.02, 0.01], [-0.025, L * 0.6]], 0.0025, { alpha: 0.6 });
};
const pengBody = (g) => {
  g.shape([[0, 0.0], [0.03, 0.03], [0.034, 0.1], [0.022, 0.17], [0.01, 0.2], [0, 0.215], [-0.01, 0.2], [-0.022, 0.17], [-0.034, 0.1], [-0.03, 0.03]], 0.004, { wash: WASH.ink, washA: 0.1 + 0.15 * g.lit });
  // 尾羽
  g.stroke([[0, 0.02], [-0.03, -0.0], [-0.04, -0.01]], 0.003);
  g.stroke([[0, 0.02], [0.03, -0.0], [0.04, -0.01]], 0.003);
  g.dot(-0.008, 0.19, 0.003); g.dot(0.008, 0.19, 0.003);
  g.stroke([[0, 0.215], [0, 0.23]], 0.004);
};

// —— 一 · 逍遥游：鲲化为鹏 ——
const ch1 = {
  ground(g) {
    g.text('北 冥', -0.4, -0.06, 0.026, { color: 'rgba(40,34,30,.5)' });
    g.text('南 冥', 0.38, 0.5, 0.026, { color: 'rgba(176,67,45,.7)' });
    const pts = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([-0.3 + t * 0.66, 0.0 + Math.sin(t * Math.PI) * 0.5 * t + t * 0.0]); }
    for (let i = 0; i < pts.length - 1; i += 2) g.stroke([pts[i], pts[i + 1]], 0.0022, { smooth: false, alpha: 0.35 });
  },
  build(k) {
    // 云
    const clouds = [[-0.28, 0.46, -0.48], [0.1, 0.55, -0.55], [0.34, 0.42, -0.3]].map(([x, y, z], i) => {
      const c = k.sprite({ w: 0.22, h: 0.09, draw: (g) => g.cloud(0, 0.045, 0.085, 0.0045), delay: 0.2 + i * 0.15 });
      c.obj.position.set(x, y, z);
      return c;
    });
    // 两层海浪
    const sea = (x0, x1, top, wl, amp, ph) => (g) => {
      const rect = [[x0, 0], [x0, top], [x1, top], [x1, 0]];
      g.paper(rect, { smooth: false });
      g.wash(rect, WASH.water, 0.1 + 0.3 * g.lit, { smooth: false });
      waveRows(g, x0, x1, top, 2, { wl, amp, gap: -0.022, phase: ph, w: 0.0042 });
    };
    const back = k.card({ w: 0.9, h: 0.1, z: 0.0, delay: 0.1, draw: sea(-0.45, 0.45, 0.07, 0.1, 0.014, 0) });
    const kun = k.sprite({ w: 0.4, h: 0.15, delay: 0.6, draw: (g) => fish(g, 0, 0.075, 0.36, { lit: g.lit, w: 0.0045 }) });
    kun.obj.position.set(-0.3, 0.0, 0.06);
    const frontW = k.card({ w: 0.92, h: 0.08, z: 0.12, delay: 0.3, draw: sea(-0.46, 0.46, 0.052, 0.085, 0.012, 0.04) });
    k.hot(kun, 'kun');
    // 榆枋上的蜩与鸴鸠
    const elm = k.card({ w: 0.2, h: 0.2, x: -0.37, z: 0.2, delay: 0.9, draw: (g) => {
      g.stroke([[0.02, 0], [0.0, 0.08], [-0.02, 0.14], [0.01, 0.19]], 0.006);
      g.stroke([[0.0, 0.1], [0.06, 0.13], [0.09, 0.12]], 0.004);
      g.stroke([[-0.015, 0.14], [-0.07, 0.17]], 0.004);
      for (const [x, y] of [[0.09, 0.125], [-0.07, 0.175], [0.01, 0.19], [0.05, 0.14]]) {
        g.shape(ellipsePts(x, y + 0.008, 0.016, 0.009, 12).slice(0, -1), 0.0025, { wash: WASH.green, washA: 0.2 + 0.3 * g.lit });
      }
      // 蝉
      g.shape([[0.005, 0.06], [0.014, 0.075], [0.012, 0.095], [0.0, 0.1], [-0.008, 0.08]], 0.0025, { wash: WASH.ochre, washA: 0.5 * g.lit });
    } });
    const dove = k.sprite({ w: 0.08, h: 0.06, delay: 1.1, draw: (g) => birdSide(g, 0, 0.02, 0.07, { dir: 1, w: 0.003, lit: g.lit }) });
    dove.obj.position.set(-0.32, 0.135, 0.2);
    k.hot(elm, 'tiao'); k.hot(dove, 'tiao');

    // 扶摇：盘旋而上的风
    const helix = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90, a = t * Math.PI * 3.2;
      const r = 0.04 + 0.12 * t;
      helix.push([0.1 + Math.cos(a) * r, 0.07 + 0.5 * t, -0.14 + Math.sin(a) * r * 0.8]);
    }
    const wind = k.line(helix, { width: 1.6, auto: false, opacity: 0.55, dashed: true });

    const peng = k.winged({ body: pengBody, bw: 0.08, bh: 0.24, wing: pengWing, ww: 0.13, wh: 0.31, delay: 0.5 });
    k.hot(peng, 'peng');
    peng.obj.visible = false;

    const P0 = 2.2, PER = 19;
    let splash = -9, flapBoost = -9, hop = -9;
    const helixAt = (t) => {
      const a = t * Math.PI * 3.2, r = 0.04 + 0.12 * t;
      return [0.1 + Math.cos(a) * r, 0.07 + 0.5 * t, -0.14 + Math.sin(a) * r * 0.8, a];
    };
    return {
      hit(key) { if (key === 'kun') splash = k.T; if (key === 'peng') flapBoost = k.T; if (key === 'tiao') hop = k.T; },
      update(T, dt, F) {
        // 浪
        back.hinge.position.x = Math.sin(T * 0.7) * 0.01;
        frontW.hinge.position.x = Math.sin(T * 0.7 + 1.6) * 0.012;
        clouds.forEach((c, i) => { c.obj.position.x += Math.sin(T * 0.2 + i) * 0.0002; });
        const s = T < P0 ? -1 : (T - P0) % PER;
        let fishA = 1, birdA = 0;
        // 鲲
        if (s < 0 || s < 4) {
          const t = s < 0 ? 0 : s / 4;
          kun.obj.position.set(-0.3 + 0.38 * t, 0.012 + Math.sin(T * 2.2) * 0.008, 0.07);
          kun.obj.rotation.z = Math.sin(T * 2.2 + 1) * 0.06;
          const sp = T - splash;
          if (sp > 0 && sp < 0.9) { kun.obj.position.y += Math.sin(sp / 0.9 * Math.PI) * 0.09; kun.obj.rotation.z = Math.cos(sp / 0.9 * Math.PI) * 0.5; }
          wind.reveal = 0;
        } else if (s < 5.6) {
          const t = (s - 4) / 1.6;
          kun.obj.position.set(0.08 + 0.02 * t, 0.012 + Math.sin(t * Math.PI * 0.6) * 0.16, 0.07 - 0.17 * t);
          kun.obj.rotation.z = 0.2 + t * 1.0;
          fishA = 1 - smooth(win(t, 0.4, 0.9));
          birdA = smooth(win(t, 0.45, 1));
          wind.reveal = smooth(win(t, 0.3, 1)) * 0.15;
        } else {
          fishA = 0; birdA = 1;
        }
        // 鹏
        const fb = clamp(1 - (T - flapBoost) / 2);
        if (s >= 4.6 && s < 17.2) {
          peng.obj.visible = true;
          let p, yaw, bank = 0, sc = 1, flapK = 1;
          if (s < 9.5) {
            const t = clamp((s - 5.0) / 4.5);
            const h = helixAt(t);
            p = [h[0], h[1], h[2]];
            yaw = -h[3] - Math.PI / 2;
            bank = 0.5;
            sc = lerp(0.35, 1, smooth(win(s, 4.6, 6.2)));
            wind.reveal = Math.max(0.15, t);
          } else {
            const t = (s - 9.5) / 7.7;
            const a = t * Math.PI * 1.6 + Math.PI * 0.2;
            p = [0.05 + Math.cos(a) * 0.3, 0.57 + Math.sin(t * Math.PI) * 0.05, -0.2 + Math.sin(a) * 0.22];
            yaw = -a - Math.PI;
            bank = 0.35;
            flapK = 0.6;
            wind.reveal = 1 - smooth(win(t, 0, 0.4));
            if (t > 0.85) { sc = lerp(1, 0.35, smooth(win(t, 0.85, 1))); }
          }
          peng.obj.position.set(...p);
          peng.obj.rotation.set(0, yaw, 0);
          peng.obj.rotateZ(-bank);
          peng.obj.scale.setScalar(sc);
          peng.flap(0.15 + Math.sin(T * (2.2 + fb * 4)) * (0.35 + fb * 0.25) * flapK);
          fade(peng, birdA * (s > 16.6 ? 1 - (s - 16.6) / 0.6 : 1));
        } else {
          peng.obj.visible = false;
        }
        if (s >= 16.6) {
          // 回到海里，又是鲲
          fishA = smooth(win(s, 17.2, 18.4));
          kun.obj.position.set(-0.3, 0.012, 0.07); kun.obj.rotation.z = 0;
        }
        fade(kun, fishA);
        // 鸴鸠跳一跳
        const hp = T - hop;
        dove.obj.position.y = 0.135 + (hp > 0 && hp < 1.2 ? Math.abs(Math.sin(hp / 1.2 * Math.PI * 2)) * 0.06 : 0);
        dove.obj.position.x = -0.32 + (hp > 0 && hp < 1.2 ? Math.sin(hp / 1.2 * Math.PI) * 0.03 : 0);
      },
    };
  },
};


// —— 二 · 齐物论：庄周梦蝶，人形与蝶形相互化 ——
// 把一条闭合曲线按弧长重采样成 n 个点
function resample(pts, n) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1], out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = total * i / (n - 1);
    while (j < L.length - 2 && L[j + 1] < d) j++;
    const f = (d - L[j]) / Math.max(1e-9, L[j + 1] - L[j]);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]);
  }
  return out;
}
// 人的剪影（从头顶起，顺时针一圈）
function personOutline() {
  const pts = [];
  for (let k = 0; k <= 24; k++) { const a = Math.PI / 2 - k / 24 * Math.PI * 1.7; pts.push([0.035 + Math.cos(a) * 0.06, 0.885 + Math.sin(a) * 0.065]); }
  const robeFront = [[0.03, 0.81], [0.06, 0.785], [0.085, 0.72], [0.175, 0.62], [0.235, 0.5], [0.2, 0.43], [0.095, 0.445], [0.105, 0.3], [0.16, 0.02], [0.04, 0.0], [-0.08, 0.0], [-0.15, 0.04], [-0.115, 0.3], [-0.105, 0.46], [-0.145, 0.52], [-0.135, 0.66], [-0.1, 0.775], [-0.03, 0.81]];
  pts.push(...robeFront);
  for (let k = 0; k <= 6; k++) { const a = Math.PI * 1.2 + k / 6 * Math.PI * 0.3; pts.push([0.035 + Math.cos(a) * 0.06, 0.885 + Math.sin(a) * 0.065]); }
  pts.push([0.035, 0.95]);
  return pts.map(([x, y]) => [x - 0.03, y - 0.48]);
}
// 蝴蝶曲线（极坐标），从正上方起
function butterflyOutline() {
  const pts = [];
  for (let k = 0; k <= 400; k++) {
    const t = Math.PI / 2 + k / 400 * Math.PI * 2;
    const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
    pts.push([Math.cos(t) * r * 0.105, Math.sin(t) * r * 0.105 - 0.05]);
  }
  return pts;
}

const bfBody = (g) => {
  g.shape([[0, 0], [0.006, 0.03], [0, 0.07], [-0.006, 0.03]], 0.003, { fill: '#3a332c' });
  g.stroke([[0, 0.07], [-0.014, 0.1]], 0.002); g.stroke([[0, 0.07], [0.014, 0.1]], 0.002);
};

const ch2 = {
  ground(g) {
    // 榻下的席纹
    for (let i = 0; i < 9; i++) g.stroke([[-0.32 + i * 0.02, 0.02], [-0.02 + i * 0.02, 0.02 - 0.12]], 0.0018, { alpha: 0.25, smooth: false });
  },
  build(k) {
    // 前景小草
    k.card({ w: 0.86, h: 0.07, z: 0.16, delay: 0.5, draw: (g) => {
      for (let i = 0; i < 46; i++) {
        const x = -0.42 + i * 0.0185, h = 0.02 + Math.abs(Math.sin(i * 2.3)) * 0.045;
        g.stroke([[x, 0], [x + Math.sin(i) * 0.008, h]], 0.0025);
      }
      for (const fx of [-0.3, -0.05, 0.22, 0.36]) { g.circle(fx, 0.058, 0.01, 0.0025, { wash: WASH.verm, washA: 0.45 }); }
    } });
    // 榻
    const couch = k.card({ w: 0.5, h: 0.09, x: -0.12, z: -0.02, delay: 0.1, draw: (g) => {
      g.shape([[-0.24, 0.03], [-0.24, 0.07], [0.24, 0.07], [0.24, 0.03]], 0.004, { smooth: false, wash: WASH.ochre, washA: 0.25 });
      for (const lx of [-0.22, 0.2]) g.shape([[lx, 0], [lx, 0.03], [lx + 0.025, 0.03], [lx + 0.025, 0]], 0.004, { smooth: false });
      g.stroke([[-0.24, 0.05], [0.24, 0.05]], 0.0015, { alpha: 0.5 });
    } });
    const sleeper = k.card({ w: 0.42, h: 0.14, x: -0.12, z: -0.03, y: 0.07, delay: 0.3, draw: (g) => person(g, 0.06, 0.0, 0.36, { pose: 'lie', w: 0.0045, lit: g.lit }) });
    const waker = k.card({ w: 0.2, h: 0.2, x: -0.05, z: -0.03, y: 0.07, delay: 99, draw: (g) => person(g, 0, 0, 0.27, { pose: 'sit', w: 0.0045, lit: 1 }) });
    k.hot(sleeper, 'zhou'); k.hot(waker, 'zhou');
    // 梦：人形与蝶形之间来回变化的一条墨线
    const N = 220;
    const A = resample(personOutline(), N), B = resample(butterflyOutline(), N);
    const S = 0.42, cx = 0.17, cy = 0.22, cz = -0.24;
    const toP = (p) => [cx + p[0] * S, cy + p[1] * S, cz];
    const morph = k.line(A.map(toP), { width: 2.2, delay: 1.0, dur: 1.4 });
    // 梦的来路：从枕边飘起的虚线
    const trail = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30; trail.push([-0.28 + t * 0.36 + Math.sin(t * 7) * 0.02, 0.15 + t * 0.06, -0.04 - t * 0.18]); }
    k.line(trail, { width: 1.3, dashed: true, opacity: 0.6, delay: 0.9, dur: 1.2 });
    const hua = k.sprite({ w: 0.16, h: 0.06, delay: 1.2, draw: (g) => { g.text('物 化', 0, 0.03, 0.04, { font: '"Ma Shan Zheng","Kaiti SC","STKaiti","KaiTi",serif', color: VERM }); }, cut: false });
    hua.obj.position.set(0.17, 0.0, -0.2);
    k.hot(hua, 'hua');
    // 蝴蝶
    const bf = k.winged({ body: bfBody, bw: 0.03, bh: 0.1, wing: (g) => butterflyWing(g, 0.12, { lit: g.lit }), ww: 0.15, wh: 0.14, delay: 1.3 });
    k.hot(bf, 'die');
    let wake = -99, fast = -99, boost = -99;
    const cur = A.map(p => p.slice());
    return {
      hit(key) { if (key === 'zhou') wake = k.T; if (key === 'hua') fast = k.T; if (key === 'die') boost = k.T; },
      update(T, dt) {
        // 醒：躺着的淡去，坐起来的出现
        const wt = T - wake;
        const up = wt > 0 && wt < 4 ? smooth(win(wt, 0, 0.5)) * (1 - smooth(win(wt, 3.3, 4))) : 0;
        waker.delay = -1; waker.pivot.rotation.x = -Math.PI / 2 * (1 - up);
        fade(waker, up); fade(sleeper, 1 - up);
        // 变化
        const sp = T - fast;
        const ph = sp > 0 && sp < 3 ? (T * 0.45) + smooth(win(sp, 0, 3)) * Math.PI * 2 : T * 0.45;
        const m = 0.5 - 0.5 * Math.cos(ph);
        for (let i = 0; i < N; i++) { cur[i][0] = lerp(A[i][0], B[i][0], m); cur[i][1] = lerp(A[i][1], B[i][1], m); }
        morph.set(cur.map(toP));
        morph.mat.color.setRGB(lerp(0.15, 0.69, sp > 0 && sp < 3 ? Math.sin(sp / 3 * Math.PI) : 0), lerp(0.13, 0.26, sp > 0 && sp < 3 ? Math.sin(sp / 3 * Math.PI) : 0), 0.12);
        // 蝴蝶绕着梦境飞
        const b = clamp(1 - (T - boost) / 3);
        const a = T * (0.5 + b * 0.7);
        bf.obj.position.set(cx + Math.sin(a) * 0.22, 0.2 + Math.sin(a * 1.7) * 0.06 + b * 0.08, cz + 0.05 + Math.cos(a * 0.9) * 0.15);
        bf.obj.rotation.set(0.3, -a * 0.9, 0);
        bf.flap(0.2 + Math.abs(Math.sin(T * (7 + b * 5))) * 1.1);
        hua.obj.position.y = 0.0 + Math.sin(T * 1.3) * 0.004;
      },
    };
  },
};

// —— 三 · 养生主：庖丁解牛，刀顺着骨节间的空隙走 ——
const OX = [[-0.24, 0.25], [-0.1, 0.245], [0.06, 0.255], [0.12, 0.272], [0.15, 0.268], [0.19, 0.25], [0.225, 0.24], [0.248, 0.236], [0.268, 0.205], [0.288, 0.165], [0.296, 0.145], [0.284, 0.132], [0.255, 0.14], [0.228, 0.16], [0.205, 0.15], [0.182, 0.125], [0.163, 0.108],
  [0.158, 0.06], [0.152, 0.012], [0.155, 0.0], [0.13, 0.0], [0.13, 0.03], [0.124, 0.07], [0.115, 0.1], [0.06, 0.098], [-0.04, 0.1], [-0.11, 0.108], [-0.13, 0.09], [-0.138, 0.04], [-0.14, 0.0], [-0.166, 0.0], [-0.166, 0.03], [-0.178, 0.065], [-0.205, 0.1], [-0.232, 0.15]];
function drawOx(g, { joints = true } = {}) {
  // 远侧的两条腿
  g.shape([[0.1, 0.1], [0.098, 0.03], [0.102, 0.0], [0.08, 0.0], [0.082, 0.05], [0.085, 0.1]], 0.0035, { wash: WASH.ink, washA: 0.12 });
  g.shape([[-0.17, 0.11], [-0.19, 0.05], [-0.19, 0.0], [-0.212, 0.0], [-0.21, 0.05], [-0.2, 0.11]], 0.0035, { wash: WASH.ink, washA: 0.12 });
  g.shape(OX, 0.0045, { wash: WASH.ochre, washA: 0.12 + 0.2 * g.lit });
  // 角、眼、耳、尾、垂皮
  g.stroke([[0.238, 0.238], [0.25, 0.27], [0.275, 0.285], [0.29, 0.28]], 0.0042);
  g.stroke([[0.222, 0.24], [0.205, 0.272], [0.185, 0.286]], 0.0038);
  g.dot(0.262, 0.205, 0.0045);
  g.shape([[0.218, 0.232], [0.198, 0.222], [0.192, 0.212], [0.214, 0.218]], 0.003);
  g.stroke([[0.283, 0.15], [0.29, 0.148]], 0.003);
  g.stroke([[-0.238, 0.24], [-0.258, 0.17], [-0.255, 0.1]], 0.003);
  g.shape([[-0.255, 0.1], [-0.265, 0.075], [-0.248, 0.078]], 0.0025, { fill: '#3a332c' });
  g.stroke([[0.18, 0.13], [0.17, 0.112], [0.165, 0.1]], 0.0025, { alpha: 0.6 });
  g.stroke([[0.06, 0.25], [0.03, 0.2]], 0.0022, { alpha: 0.5 });
  if (!joints) return;
  // 骨节：虚线标出“间”
  const dash = (pts) => { const P = resample(pts, Math.max(4, Math.round(pts.length * 6))); for (let i = 0; i < P.length - 1; i += 2) g.stroke([P[i], P[i + 1]], 0.0022, { smooth: false, color: g.lit > 0.3 ? VERM : 'rgba(38,34,30,.6)' }); };
  dash([[0.16, 0.26], [0.11, 0.19], [0.125, 0.105]]);          // 肩胛
  dash([[-0.17, 0.245], [-0.13, 0.18], [-0.16, 0.115]]);        // 髋
  dash([[-0.22, 0.225], [0.0, 0.235], [0.19, 0.24]]);           // 脊
  for (let i = 0; i < 4; i++) dash([[0.06 - i * 0.042, 0.225], [0.05 - i * 0.042, 0.12]]);  // 肋
  g.circle(-0.145, 0.165, 0.013, 0.0025, { fill: null });
  g.circle(0.118, 0.15, 0.011, 0.0025, { fill: null });
}

const knife = (g) => {
  g.shape([[-0.035, 0.02], [0.045, 0.028], [0.06, 0.04], [0.04, 0.05], [-0.035, 0.045]], 0.003, { wash: WASH.ink, washA: 0.12 + g.lit * 0.2, smooth: false });
  g.shape([[-0.075, 0.03], [-0.035, 0.026], [-0.035, 0.04], [-0.075, 0.037]], 0.003, { wash: WASH.ochre, washA: 0.5, smooth: false });
  g.stroke([[-0.03, 0.03], [0.04, 0.035]], 0.0015, { alpha: 0.6 });
};

const ch3 = {
  ground(g) {
    g.text('依乎天理', -0.36, 0.42, 0.024, { color: 'rgba(176,67,45,.55)', vertical: true });
  },
  build(k) {
    const S = 1.12, OXX = 0.05;      // 牛放大、右移
    const pieces = [[-0.27, -0.11], [-0.11, 0.1], [0.1, 0.31]];
    const parts = pieces.map(([a, b], i) => k.card({
      w: (b - a) * S + 0.002, h: 0.3 * S, x: ((a + b) / 2) * S + OXX, z: -0.13, delay: 0.15 + i * 0.12, pad: 0.008,
      draw: (g) => { g.c.save(); g.c.beginPath(); g.c.rect(g.X(-(b - a) * S / 2 - 0.001), 0, (b - a) * S * g.k + 2, g.c.canvas.height); g.c.clip(); g.c.translate(-((a + b) / 2) * S * g.k, 0); g.c.translate(g.ox, g.oy); g.c.scale(S, S); g.c.translate(-g.ox, -g.oy); drawOx(g); g.c.restore(); },
    }));
    for (const p of parts) k.hot(p, 'jian');
    // 刀路
    const path = [[0.25, 0.2], [0.19, 0.235], [0.1, 0.235], [0.0, 0.228], [-0.12, 0.228], [-0.2, 0.2], [-0.16, 0.16], [-0.13, 0.12], [-0.02, 0.135], [0.08, 0.13], [0.118, 0.17], [0.15, 0.22], [0.22, 0.215]]
      .map(([x, y]) => [x * S + OXX, y * S, -0.125]);
    const route = k.tube(path, { radius: 0.0035, color: 0xb0432d, emissive: 0x5a1a0c, auto: false, closed: false });
    const kn = k.sprite({ w: 0.15, h: 0.08, delay: 0.9, draw: knife });
    k.hot(kn, 'dao');
    const cook = k.card({ w: 0.22, h: 0.31, x: -0.37, z: 0.06, delay: 0.6, draw: (g) => person(g, 0, 0, 0.3, { pose: 'point', face: 1, w: 0.0045, lit: g.lit, hat: true }) });
    const proud = k.card({ w: 0.22, h: 0.31, x: -0.37, z: 0.06, delay: 99, draw: (g) => person(g, 0, 0, 0.3, { pose: 'arms', face: 1, w: 0.0045, lit: 1, hat: true }) });
    k.hot(cook, 'pao'); k.hot(proud, 'pao');
    // 磨刀石
    const stone = k.card({ w: 0.12, h: 0.05, x: 0.3, z: 0.17, delay: 0.8, draw: (g) => { g.shape([[-0.05, 0], [-0.045, 0.03], [0.05, 0.035], [0.055, 0]], 0.0035, { wash: WASH.ink, washA: 0.15, smooth: false }); g.text('硎', 0, 0.015, 0.018, { color: 'rgba(40,34,30,.6)' }); } });
    let open = -99, shine = -99, proudT = -99;
    const tmp = new (route.curve.getPointAt(0).constructor)();
    return {
      hit(key) { if (key === 'jian') open = k.T; if (key === 'dao') shine = k.T; if (key === 'pao') proudT = k.T; },
      update(T) {
        // 刀沿着刀路走，像跳舞一样有节拍
        const beat = (T * 0.16) % 1;
        const u = clamp(beat * 1.15);
        route.reveal = Math.min(1, u * 1.05) * k.appear(0.9);
        const pt = route.curve.getPointAt(Math.min(0.999, u));
        const ta = route.curve.getTangentAt(Math.min(0.999, u));
        kn.obj.position.set(pt.x, pt.y - 0.03 + Math.sin(T * 9) * 0.004, pt.z + 0.02);
        kn.obj.rotation.z = Math.atan2(ta.y, ta.x);
        const sh = T - shine;
        kn.obj.scale.setScalar(1 + (sh > 0 && sh < 0.8 ? Math.sin(sh / 0.8 * Math.PI) * 0.35 : 0));
        // 解开：三块牛肉轻轻分开再合上
        const ot = T - open;
        const sep = ot > 0 && ot < 4 ? smooth(win(ot, 0, 0.6)) * (1 - smooth(win(ot, 3, 4))) : 0;
        parts.forEach((p, i) => { p.hinge.position.x = ((pieces[i][0] + pieces[i][1]) / 2) * S + OXX + (i - 1) * sep * 0.05; p.hinge.rotation.z = (i - 1) * sep * 0.04; });
        // 庖丁：提刀而立，为之四顾
        const pt2 = T - proudT;
        const pr = pt2 > 0 && pt2 < 3.5 ? smooth(win(pt2, 0, 0.4)) * (1 - smooth(win(pt2, 3, 3.5))) : 0;
        proud.pivot.rotation.x = -Math.PI / 2 * (1 - pr);
        fade(proud, pr); fade(cook, 1 - pr * 0.95);
        stone.hinge.rotation.y = Math.sin(T * 0.5) * 0.05;
      },
    };
  },
};

// —— 四 · 人间世：栎社树，无用之用 ——
const smallOx = (g) => { g.c.save(); g.c.translate(g.ox, g.oy); g.c.scale(0.32, 0.32); g.c.translate(-g.ox, -g.oy); drawOx(g, { joints: false }); g.c.restore(); };
const ch4 = {
  ground(g) {
    g.stroke([[-0.45, -0.05], [0.45, -0.05]], 0.002, { alpha: 0.25 });
  },
  build(k) {
    const big = k.card({ w: 0.56, h: 0.42, x: 0.04, z: -0.3, delay: 0.1, draw: (g) => tree(g, 0, 0, 0.5, { gnarled: true, lit: g.lit, seed: 5 }) });
    k.hot(big, 'shu');
    const oxen = [[-0.12, -0.16], [0.12, -0.14], [0.26, -0.2]].map(([x, z], i) => k.card({ w: 0.2, h: 0.08, x, z, delay: 0.5 + i * 0.1, draw: smallOx }));
    const master = k.card({ w: 0.2, h: 0.27, x: -0.36, z: 0.1, delay: 0.7, draw: (g) => person(g, 0, 0, 0.26, { pose: 'walk', face: 1, w: 0.004, lit: g.lit, beard: true }) });
    const pupil = k.card({ w: 0.17, h: 0.23, x: -0.42, z: 0.04, delay: 0.8, draw: (g) => person(g, 0, 0, 0.22, { pose: 'point', face: -1, w: 0.004 }) });
    k.hot(master, 'jiang');
    // 颜回：心斋
    const yan = k.card({ w: 0.2, h: 0.2, x: 0.33, z: 0.1, delay: 0.9, draw: (g) => person(g, 0, 0, 0.25, { pose: 'sit', face: -1, w: 0.004, lit: g.lit }) });
    k.hot(yan, 'xin');
    const ring = [];
    for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; ring.push([Math.cos(a), Math.sin(a), 0]); }
    const rings = [0, 1, 2].map(() => k.line(ring.map(p => [0.34 + p[0] * 0.04, 0.11 + p[1] * 0.04, 0.11]), { width: 1.4, opacity: 0.5, auto: false }));
    const moon = k.sprite({ w: 0.1, h: 0.1, delay: 99, draw: (g) => { g.circle(0, 0.05, 0.035, 0.003, { wash: WASH.ochre, washA: 0.4 }); g.circle(0.012, 0.058, 0.028, 0.002, { fill: PAPER }); } });
    moon.obj.position.set(-0.3, 0.32, -0.38);
    let dream = -99, calm = -99, pass = -99;
    return {
      hit(key) { if (key === 'shu') dream = k.T; if (key === 'xin') calm = k.T; if (key === 'jiang') pass = k.T; },
      update(T) {
        big.hinge.rotation.z = Math.sin(T * 0.6) * 0.012;
        // 匠石走过，看都不看
        const sp = 0.02 + (T - pass > 0 && T - pass < 2 ? 0.05 : 0);
        const walk = (T * sp) % 0.5;
        master.hinge.position.x = -0.38 + walk;
        master.hinge.position.y = Math.abs(Math.sin(T * 5)) * 0.006;
        pupil.hinge.position.x = -0.44 + walk * 0.9;
        oxen.forEach((o, i) => { o.hinge.rotation.y = Math.sin(T * 0.4 + i) * 0.15; });
        // 栎社见梦：月亮升起
        const dt2 = T - dream;
        const m = dt2 > 0 && dt2 < 6 ? smooth(win(dt2, 0, 1)) * (1 - smooth(win(dt2, 5, 6))) : 0;
        moon.delay = -1;
        fade(moon, m);
        moon.obj.position.y = 0.24 + m * 0.1;
        // 心斋：一圈圈空出去的气
        rings.forEach((r, i) => {
          const c = T - calm;
          const active = c > 0 && c < 6;
          const t = ((T * 0.5 + i / 3) % 1);
          const sc = 1 + t * (active ? 3.5 : 2);
          r.reveal = 1;
          r.obj.scale.setScalar(1);
          r.set(ring.map(p => [0.34 + p[0] * 0.04 * sc, 0.11 + p[1] * 0.04 * sc, 0.11]));
          r.opacity = (1 - t) * (active ? 0.8 : 0.35) * k.appear(1.2);
        });
      },
    };
  },
};

// —— 五 · 德充符：止水为鉴 ——
const ch5 = {
  ground(g) {
    g.shape(ellipsePts(0.05, -0.02, 0.3, 0.13, 50).slice(0, -1), 0.003, { wash: WASH.water, washA: 0.25 });
    for (let i = 0; i < 3; i++) g.stroke(ellipsePts(0.05, -0.02, 0.27 - i * 0.06, 0.11 - i * 0.025, 40, 0.3, 2.6), 0.0018, { alpha: 0.3 });
  },
  build(k) {
    // 松柏
    k.card({ w: 0.26, h: 0.42, x: -0.32, z: -0.34, delay: 0.1, draw: (g) => {
      g.stroke([[0, 0], [0.01, 0.2], [-0.01, 0.4]], 0.007);
      for (let i = 0; i < 5; i++) {
        const y = 0.12 + i * 0.065, wd = 0.12 - i * 0.018;
        const sh = [[-wd, y], [-wd * 0.5, y + 0.035], [0, y + 0.05], [wd * 0.5, y + 0.035], [wd, y], [0, y + 0.012]];
        g.shape(sh, 0.0035, { wash: WASH.green, washA: 0.25 + 0.2 * g.lit });
        for (let j = -3; j <= 3; j++) g.stroke([[j * wd / 4, y + 0.01], [j * wd / 4 * 0.8, y + 0.03]], 0.0018, { alpha: 0.6 });
      }
    } });
    const wang = k.card({ w: 0.18, h: 0.27, x: 0.05, z: -0.2, delay: 0.3, draw: (g) => person(g, 0, 0, 0.25, { pose: 'staff', face: 1, w: 0.0045, lit: g.lit, beard: true }) });
    k.hot(wang, 'wang'); 
    const followers = [[-0.22, -0.12, 1], [-0.12, -0.3, 1], [0.27, -0.28, -1], [0.33, -0.1, -1]].map(([x, z, f], i) =>
      k.card({ w: 0.12, h: 0.18, x, z, delay: 0.5 + i * 0.1, draw: (g) => person(g, 0, 0, 0.17, { pose: i % 2 ? 'bow' : 'stand', face: f, w: 0.0038, lit: g.lit }) }));
    for (const f of followers) k.hot(f, 'de');
    // 水面：倒影 + 涟漪
    const refl = k.sprite({ w: 0.16, h: 0.24, delay: 0.8, draw: (g) => { g.c.save(); g.c.globalAlpha = 0.35; person(g, 0, 0, 0.23, { pose: 'staff', face: 1, w: 0.004, robe: WASH.water }); g.c.restore(); }, cut: false });
    refl.pivot.rotation.x = Math.PI / 2;   // 平躺在水面上，头朝观者
    refl.obj.position.set(0.05, 0.002, -0.19);
    const pond = k.sprite({ w: 0.6, h: 0.26, delay: 0.2, draw: (g) => { g.wash(ellipsePts(0, 0.13, 0.29, 0.12, 40), WASH.water, 0.3 + 0.2 * g.lit); }, cut: false });
    pond.pivot.rotation.x = -Math.PI / 2;
    pond.obj.position.set(0.05, 0.001, 0.11);
    k.hot(pond, 'shui');
    const ring = [];
    for (let i = 0; i <= 56; i++) { const a = i / 56 * Math.PI * 2; ring.push([Math.cos(a), 0, Math.sin(a) * 0.45]); }
    const ripples = [0, 1, 2].map(() => k.line(ring.map(p => [0.05 + p[0] * 0.02, 0.003, -0.02 + p[2] * 0.02]), { width: 1.4, auto: false, opacity: 0.6 }));
    let stir = -99, bowT = -99;
    return {
      hit(key) { if (key === 'shui') stir = k.T; if (key === 'de') bowT = k.T; },
      update(T) {
        const st = T - stir;
        const rough = st > 0 && st < 5 ? 1 - smooth(win(st, 1.5, 5)) : 0;
        ripples.forEach((r, i) => {
          const t = ((st * 0.7 + i / 3) % 1);
          const sc = 1 + t * 12;
          r.reveal = 1;
          r.set(ring.map(p => [0.05 + p[0] * 0.02 * sc, 0.003, -0.02 + p[2] * 0.02 * sc]));
          r.opacity = rough * (1 - t) * 0.7;
        });
        // 水静下来，倒影才清楚
        fade(refl, 1 - rough);
        refl.obj.position.x = 0.05 + Math.sin(T * 8) * 0.01 * rough;
        // 众人向他靠拢、行礼
        const bt = T - bowT;
        const b = bt > 0 && bt < 3 ? Math.sin(bt / 3 * Math.PI) : 0;
        followers.forEach((f, i) => { f.pivot.rotation.x = f.lean * f.rise + b * 0.25; const d = [[-0.22, -0.12], [-0.12, -0.3], [0.27, -0.28], [0.33, -0.1]][i]; f.hinge.position.x = d[0] + (0.05 - d[0]) * 0.15 * (0.5 + 0.5 * Math.sin(T * 0.3 + i)); });
      },
    };
  },
};

// —— 六 · 大宗师：相濡以沫，不如相忘于江湖 ——
const ch6 = {
  ground(g) {
    // 龟裂的泉底
    const r = (i) => Math.sin(i * 12.9898) * 0.5 + 0.5;
    for (let i = 0; i < 18; i++) {
      const x = -0.42 + r(i) * 0.38, y = -0.12 + r(i + 7) * 0.2;
      g.stroke([[x, y], [x + 0.03 * (r(i + 3) - 0.5), y + 0.03], [x + 0.05 * (r(i + 5) - 0.5), y + 0.06]], 0.0018, { alpha: 0.35, smooth: false });
    }
  },
  build(k) {
    k.card({ w: 0.9, h: 0.2, z: -0.4, delay: 0.1, draw: (g) => mountains(g, -0.45, 0.45, 0, 0.2, { peaks: 3, seed: 21, lit: g.lit }) });
    // 江湖
    const lake = k.card({ w: 0.6, h: 0.08, x: 0.2, z: -0.18, delay: 0.3, draw: (g) => {
      const rect = [[-0.3, 0], [-0.3, 0.05], [0.3, 0.05], [0.3, 0]];
      g.paper(rect, { smooth: false }); g.wash(rect, WASH.water, 0.18 + 0.3 * g.lit, { smooth: false });
      waveRows(g, -0.3, 0.3, 0.05, 1, { wl: 0.07, amp: 0.01, gap: -0.02 });
    } });
    k.hot(lake, 'jiang');
    const lakeFish = [0, 1].map(i => { const f = k.sprite({ w: 0.14, h: 0.06, delay: 0.7, draw: (g) => fish(g, 0, 0.03, 0.12, { dir: i ? -1 : 1, w: 0.0035, lit: g.lit }) }); f.obj.position.set(0.2, 0.03, -0.2); return f; });
    // 涸泉中的两条鱼
    const dry = [0, 1].map(i => {
      const f = k.sprite({ w: 0.21, h: 0.09, delay: 0.5 + i * 0.1, draw: (g) => fish(g, 0, 0.045, 0.19, { dir: i ? -1 : 1, w: 0.0035, lit: g.lit }) });
      f.pivot.rotation.x = -Math.PI / 2 + 0.25;
      f.obj.position.set(-0.3 + i * 0.16, 0.005, 0.02);
      k.hot(f, 'yu');
      return f;
    });
    const bubbles = [0, 1, 2, 3].map(i => { const b = k.sprite({ w: 0.02, h: 0.02, delay: 1, pad: 0.004, draw: (g) => g.circle(0, 0.01, 0.006, 0.0018, { fill: 'rgba(247,240,226,.8)' }) }); return b; });
    // 坐忘
    const sage = k.card({ w: 0.22, h: 0.21, x: 0.32, z: 0.1, delay: 0.9, draw: (g) => person(g, 0, 0, 0.26, { pose: 'sit', face: -1, w: 0.004, lit: g.lit }) });
    k.hot(sage, 'zuo');
    let flood = -99, forget = -99, puff = -99;
    return {
      hit(key) { if (key === 'jiang') flood = k.T; if (key === 'zuo') forget = k.T; if (key === 'yu') puff = k.T; },
      update(T) {
        lake.hinge.position.x = 0.2 + Math.sin(T * 0.7) * 0.008;
        const fl = T - flood;
        const free = fl > 0 && fl < 8 ? smooth(win(fl, 0.3, 1.8)) * (1 - smooth(win(fl, 7, 8))) : 0;
        // 涸泉里的鱼：相呴以湿
        dry.forEach((f, i) => {
          f.obj.position.set(lerp(-0.3 + i * 0.16, 0.05 + i * 0.25, free), 0.005 + free * 0.02, lerp(0.02, -0.21, free));
          f.pivot.rotation.x = lerp(-Math.PI / 2 + 0.25, 0, free);
          f.obj.rotation.z = (1 - free) * Math.sin(T * 3 + i * 2) * 0.05;
          fade(f, 1 - free * 0.9);
        });
        bubbles.forEach((b, i) => {
          const t = (T * 0.6 + i / 4) % 1;
          const from = i % 2 ? -0.15 : -0.23;
          b.obj.position.set(lerp(from, -0.19, t), 0.02 + t * 0.07 + (T - puff > 0 && T - puff < 2 ? 0.03 : 0), 0.02);
          fade(b, Math.sin(t * Math.PI) * (1 - free));
        });
        lakeFish.forEach((f, i) => {
          const a = T * 0.5 + i * Math.PI;
          f.obj.position.set(0.2 + Math.cos(a) * 0.22, 0.03 + Math.sin(T * 2 + i) * 0.006, -0.2);
          f.obj.rotation.y = Math.sin(a) > 0 ? Math.PI : 0;
          f.obj.scale.x = 1;
          fade(f, 0.5 + free * 0.5);
        });
        // 坐忘：形体淡去
        const ft = T - forget;
        const fo = ft > 0 && ft < 5 ? Math.sin(ft / 5 * Math.PI) : 0;
        sage.mat.opacity *= 1 - fo * 0.85;
      },
    };
  },
};

// —— 七 · 应帝王：儵与忽为浑沌凿窍，七日而浑沌死 ——
const ch7 = {
  ground(g) {
    g.text('南 海', -0.37, -0.06, 0.022, { color: 'rgba(40,34,30,.45)' });
    g.text('北 海', 0.37, -0.06, 0.022, { color: 'rgba(40,34,30,.45)' });
    g.text('中 央', 0.0, -0.06, 0.022, { color: 'rgba(176,67,45,.6)' });
  },
  build(k) {
    const hd = k.card({ w: 0.3, h: 0.3, x: 0, z: -0.12, delay: 0.2, draw: (g) => {
      // 浑沌：圆圆的一团，没有面目
      const body = ellipsePts(0, 0.15, 0.13, 0.14, 50).slice(0, -1);
      g.shape(body, 0.005, { wash: WASH.ochre, washA: 0.2 + 0.25 * g.lit });
      g.stroke(ellipsePts(0, 0.13, 0.1, 0.1, 30, Math.PI * 1.1, Math.PI * 1.9), 0.003, { alpha: 0.5 });
      g.stroke([[-0.12, 0.08], [-0.17, 0.05], [-0.18, 0.02]], 0.004);
      g.stroke([[0.12, 0.08], [0.17, 0.05], [0.18, 0.02]], 0.004);
      g.stroke([[-0.05, 0.015], [-0.06, 0.0]], 0.004); g.stroke([[0.05, 0.015], [0.06, 0.0]], 0.004);
    } });
    k.hot(hd, 'hundun');
    // 七窍：一天一个
    const holes = [[-0.045, 0.21], [0.045, 0.21], [-0.03, 0.165], [0.03, 0.165], [-0.05, 0.12], [0.05, 0.12], [0, 0.085]].map(([x, y]) => {
      const h = k.sprite({ w: 0.03, h: 0.03, delay: 99, pad: 0.004, parent: hd.pivot, draw: (g) => g.dot(0, 0.015, 0.01) });
      h.obj.position.set(x, y - 0.015, 0.003);
      return h;
    });
    const mk = (x, f) => k.card({ w: 0.2, h: 0.26, x, z: 0.0, delay: 0.5, draw: (g) => person(g, 0, 0, 0.25, { pose: 'point', face: f, w: 0.004, lit: g.lit }) });
    const shu = mk(-0.32, 1), hu = mk(0.32, -1);
    k.hot(shu, 'shuhu'); k.hot(hu, 'shuhu');
    const sun = k.sprite({ w: 0.07, h: 0.07, delay: 0.6, draw: (g) => g.circle(0, 0.035, 0.028, 0.003, { fill: 'rgba(176,67,45,.85)' }) });
    const moonS = k.sprite({ w: 0.07, h: 0.07, delay: 0.6, draw: (g) => { g.circle(0, 0.035, 0.028, 0.003, { wash: WASH.ochre, washA: 0.3 }); } });
    const mirror = k.card({ w: 0.12, h: 0.15, x: 0.37, z: 0.16, delay: 0.8, draw: (g) => {
      g.stroke([[0, 0], [0, 0.06]], 0.004);
      g.shape([[-0.035, 0], [0.035, 0], [0.025, 0.01], [-0.025, 0.01]], 0.003, { smooth: false });
      g.circle(0, 0.1, 0.045, 0.004, { wash: WASH.ochre, washA: 0.35 + 0.3 * g.lit });
      g.circle(0, 0.1, 0.03, 0.002, { fill: null });
    } });
    k.hot(mirror, 'jing');
    const DAY = 2.2, START = 1.6;
    let poke = -99, glint = -99;
    return {
      hit(key) { if (key === 'shuhu') poke = k.T; if (key === 'jing') glint = k.T; },
      update(T) {
        const cyc = T < START ? -1 : (T - START) % (DAY * 9.5);
        const day = cyc < 0 ? -1 : Math.floor(cyc / DAY);   // 0..9
        const inDay = cyc < 0 ? 0 : (cyc % DAY) / DAY;
        // 日升月落
        const a = Math.PI * inDay;
        sun.obj.position.set(-Math.cos(a) * 0.4, 0.1 + Math.sin(a) * 0.25, -0.36);
        moonS.obj.position.set(-Math.cos(a) * 0.4, 0.1 + Math.sin(a) * 0.25, -0.36);
        const isDay = day >= 0 && day < 8 && inDay < 0.5;
        fade(sun, day < 0 ? 0 : (inDay < 0.5 ? Math.sin(inDay * 2 * Math.PI) : 0));
        fade(moonS, day < 0 ? 0 : (inDay >= 0.5 ? Math.sin((inDay - 0.5) * 2 * Math.PI) : 0));
        // 儵与忽每天走近凿一下
        const pk = T - poke;
        const step = day >= 0 && day < 7 ? Math.sin(inDay * Math.PI) : 0;
        const lunge = Math.max(step, pk > 0 && pk < 1 ? Math.sin(pk * Math.PI) : 0);
        shu.hinge.position.x = -0.32 + lunge * 0.1;
        hu.hinge.position.x = 0.32 - lunge * 0.1;
        holes.forEach((h, i) => { h.delay = -1; fade(h, day > i || (day === i && inDay > 0.5) ? (day >= 7 ? 1 : 1) : 0); h.mesh.visible = h.mat.opacity > 0.01 && hd.mat.opacity > 0.05; });
        // 第七日后，浑沌死去；过一会儿重新浑然一体
        const dead = day >= 7 ? smooth(win(cyc, DAY * 7, DAY * 8)) : 0;
        hd.pivot.rotation.x = hd.pivot.rotation.x * (1 - dead) + (-Math.PI / 2) * dead;
        hd.mat.opacity *= 1 - dead * 0.85;
        const gl = T - glint;
        mirror.hinge.rotation.y = gl > 0 && gl < 1.5 ? Math.sin(gl * 8) * 0.3 * (1 - gl / 1.5) : Math.sin(T * 0.6) * 0.08;
      },
    };
  },
};

export const inner = { ch1, ch2, ch3, ch4, ch5, ch6, ch7 };
