// 卷首与卷尾的插图：扉页山水、三束竹简、读毕的蝴蝶
import { WASH, VERM, INK } from '../ink.js';
import { person, mountains, slips, butterflyWing, birdSide } from '../art.js';
import { clamp } from '../util.js';

// 远处小鸟：一片弯翅
const birdWing = (g) => {
  g.shape([[-0.006, 0.0], [-0.012, 0.02], [-0.008, 0.042], [0.004, 0.06], [0.006, 0.04], [0.008, 0.015], [0.006, 0.0]], 0.0025, { wash: WASH.ink, washA: 0.35 });
};

export const front = {
  // 合上的封面上停着一只蝴蝶，开书时飞走
  cover: {
    build(k) {
      const bf = k.winged({ body: (g) => { g.shape([[0, 0], [0.006, 0.03], [0, 0.07], [-0.006, 0.03]], 0.003, { fill: '#3a332c' }); g.stroke([[0, 0.07], [-0.012, 0.095]], 0.002); g.stroke([[0, 0.07], [0.012, 0.095]], 0.002); }, bw: 0.03, bh: 0.1,
        wing: (g) => butterflyWing(g, 0.11, { lit: 0.8 }), ww: 0.14, wh: 0.13, delay: 0.8 });
      bf.obj.rotation.y = 0.7;
      return {
        update(T, dt, F) {
          const away = 1 - F;
          const rest = Math.max(0, Math.sin(T * 0.7)) ** 3;
          bf.obj.position.set(0.62 + away * 0.5, 0.004 + away * 0.6, 0.38 - away * 0.4);
          bf.flap(away > 0 ? 0.3 + Math.abs(Math.sin(T * 14)) * 1.1 : 1.35 - rest * 1.15);
        },
      };
    },
  },

  // 扉页：远山、云、行人、飞鸟
  title: {
    ground(g) {
      // 纸面上印着一条小路
      g.stroke([[-0.42, 0.05], [-0.2, 0.0], [0.05, 0.04], [0.32, -0.02], [0.44, 0.0]], 0.003, { alpha: 0.35 });
    },
    build(k) {
      const sun = k.sprite({ w: 0.08, h: 0.08, draw: (g) => { g.circle(0, 0.04, 0.034, 0.003, { fill: 'rgba(176,67,45,.85)' }); }, delay: 0.1 });
      sun.obj.position.set(0.3, 0.2, -0.5);
      const back = k.card({ w: 0.88, h: 0.3, x: 0, z: -0.46, draw: (g) => mountains(g, -0.44, 0.44, 0, 0.3, { peaks: 4, seed: 4, w: 0.005 }), delay: 0.1 });
      const mid = k.card({ w: 0.66, h: 0.2, x: -0.1, z: -0.28, draw: (g) => mountains(g, -0.33, 0.33, 0, 0.2, { peaks: 3, seed: 9, w: 0.005 }), delay: 0.35 });
      const near = k.card({ w: 0.5, h: 0.12, x: 0.18, z: -0.12, draw: (g) => mountains(g, -0.25, 0.25, 0, 0.12, { peaks: 2, seed: 13, w: 0.005, hatch: false }), delay: 0.6 });
      const walker = k.card({ w: 0.07, h: 0.1, x: -0.25, z: 0.02, draw: (g) => person(g, 0, 0, 0.095, { pose: 'walk', face: 1, w: 0.004 }), delay: 0.9 });
      const clouds = [0, 1, 2].map(i => k.sprite({ w: 0.2, h: 0.08, pad: 0.008, draw: (g) => g.cloud(0, 0.035, 0.085, 0.0035), delay: 1.0 + i * 0.2 }));
      clouds.forEach((c, i) => { c.obj.position.set(-0.3 + i * 0.3, 0.26 + i * 0.05, -0.38 + i * 0.12); });
      const birds = [0, 1].map(i => k.winged({ body: (g) => g.shape([[0, 0.0], [0.005, 0.015], [0, 0.034], [-0.005, 0.015]], 0.0025, { fill: '#3a332c' }), bw: 0.014, bh: 0.036, wing: birdWing, ww: 0.03, wh: 0.062, pad: 0.004, delay: 1.4 }));
      return {
        update(T) {
          clouds.forEach((c, i) => { c.obj.position.x = -0.35 + ((i * 0.33 + T * 0.012) % 0.9); c.obj.position.y = 0.27 + i * 0.04 + Math.sin(T * 0.4 + i) * 0.01; });
          walker.hinge.position.x = -0.32 + ((T * 0.01) % 0.5);
          birds.forEach((b, i) => {
            const a = T * 0.35 + i * 2.4;
            b.obj.position.set(Math.cos(a) * 0.28, 0.38 + i * 0.05 + Math.sin(a * 2) * 0.02, -0.25 + Math.sin(a) * 0.15);
            b.obj.rotation.y = -a;
            b.flap(Math.sin(T * 7 + i) * 0.5);
          });
        },
      };
    },
  },

  // 导读：三十三篇，三束竹简
  parts: {
    ground(g) {
      g.text('内 篇', -0.28, -0.12, 0.028, { color: 'rgba(40,34,30,.45)' });
      g.text('外 篇', 0.0, -0.12, 0.028, { color: 'rgba(40,34,30,.45)' });
      g.text('杂 篇', 0.29, -0.12, 0.028, { color: 'rgba(40,34,30,.45)' });
      g.stroke([[-0.44, 0.08], [0.44, 0.08]], 0.002, { alpha: 0.25 });
    },
    build(k) {
      const mk = (n, x, key, d) => {
        const it = k.card({ w: n * 0.017 + 0.03, h: 0.3, x, z: 0.06, draw: (g) => slips(g, 0, 0.005, n, 0.27, { sw: 0.017, lit: g.lit, w: 0.0035 }), delay: d });
        k.hot(it, key);
        return it;
      };
      const items = { nei: mk(7, -0.28, 'nei', 0.1), wai: mk(15, 0.0, 'wai', 0.35), za: mk(11, 0.29, 'za', 0.6) };
      const hop = { nei: -9, wai: -9, za: -9 };
      // 一支毛笔斜倚
      k.card({ w: 0.05, h: 0.42, x: 0.42, z: -0.3, ry: -0.3, lean: -0.35, draw: (g) => {
        g.shape([[-0.006, 0.08], [-0.006, 0.42], [0.006, 0.42], [0.006, 0.08]], 0.003, { smooth: false, wash: WASH.ochre, washA: 0.4 });
        g.shape([[-0.009, 0.08], [-0.004, 0.02], [0, 0.0], [0.004, 0.02], [0.009, 0.08]], 0.003, { fill: '#3a332c' });
      }, delay: 0.9 });
      return {
        hit(key) { hop[key] = k.T; },
        update(T) {
          for (const [key, it] of Object.entries(items)) {
            const t = T - hop[key];
            const h = t > 0 && t < 0.8 ? Math.sin(t / 0.8 * Math.PI) * 0.06 : 0;
            it.hinge.position.y = h;
            it.hinge.rotation.z = t > 0 && t < 0.8 ? Math.sin(t * 18) * 0.04 * (1 - t / 0.8) : 0;
          }
        },
      };
    },
  },

  // 读毕：一只蝴蝶从书页上飞起
  end: {
    ground(g) {
      for (let i = 0; i < 7; i++) {
        const x = -0.35 + i * 0.11;
        g.stroke([[x, -0.02], [x + 0.01, 0.04 + (i % 3) * 0.01]], 0.002, { alpha: 0.35 });
      }
    },
    build(k) {
      const grass = k.card({ w: 0.8, h: 0.12, x: 0, z: 0.04, draw: (g) => {
        for (let i = 0; i < 40; i++) {
          const x = -0.38 + i * 0.019 + Math.sin(i * 7) * 0.006;
          const h = 0.04 + Math.abs(Math.sin(i * 3.1)) * 0.07;
          g.stroke([[x, 0], [x + Math.sin(i) * 0.01, h * 0.6], [x + Math.sin(i) * 0.025, h]], 0.003);
        }
        g.fill([[-0.4, 0], [0.4, 0], [0.4, 0.01], [-0.4, 0.01]], 'rgba(40,34,30,.5)');
        for (const fx of [-0.2, 0.15, 0.3]) { g.circle(fx, 0.1, 0.012, 0.003, { wash: WASH.verm, washA: 0.5 }); g.line(fx, 0.088, fx, 0.0, 0.0025); }
      }, delay: 0.1 });
      const sleeper = k.card({ w: 0.36, h: 0.1, x: -0.12, z: -0.18, draw: (g) => person(g, 0.05, 0.0, 0.28, { pose: 'lie', face: 1, w: 0.004 }), delay: 0.3 });
      const bf = k.winged({ body: (g) => { g.shape([[0, 0], [0.006, 0.03], [0, 0.07], [-0.006, 0.03]], 0.003, { fill: '#3a332c' }); g.stroke([[0, 0.07], [-0.012, 0.095]], 0.002); g.stroke([[0, 0.07], [0.012, 0.095]], 0.002); }, bw: 0.03, bh: 0.1,
        wing: (g) => butterflyWing(g, 0.12, { lit: g.lit }), ww: 0.15, wh: 0.14, delay: 1.0 });
      k.hot(bf, 'die');
      let boost = -9;
      return {
        hit() { boost = k.T; },
        update(T) {
          const t = Math.max(0, T - 1.2);
          const b = clamp(1 - (T - boost) / 2.5);
          const a = t * (0.55 + b * 0.8);
          bf.obj.position.set(Math.sin(a) * 0.22, 0.12 + Math.min(1, t * 0.4) * 0.16 + Math.sin(a * 2.3) * 0.04 + b * 0.08, -0.22 + Math.cos(a * 0.8) * 0.16);
          bf.obj.rotation.y = -a * 0.7;
          bf.obj.rotation.x = 0.25;
          bf.flap(0.2 + Math.abs(Math.sin(T * (7 + b * 6))) * 1.1);
        },
      };
    },
  },
};
