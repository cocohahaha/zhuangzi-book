// 舞台：橡木桌、皮革书写垫、灯光与相机
import * as THREE from 'three';
import { rng, damp } from './util.js';

export function createStage(canvas, { mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 2 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfb48e);
  scene.fog = new THREE.Fog(0xcfb48e, 9, 18);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);

  // —— 灯光：天光、主光（投影）、侧补光 ——
  const hemi = new THREE.HemisphereLight(0xfff5e8, 0x8a6a4c, 1.2);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe7c9, 2.3);
  key.position.set(-2.6, 5.2, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  const sc = key.shadow.camera;
  sc.left = -2.0; sc.right = 2.0; sc.top = 1.7; sc.bottom = -1.7; sc.near = 1; sc.far = 12;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const spill = new THREE.DirectionalLight(0xe4ecff, 0.35);
  spill.position.set(3, 2.2, 3.5);
  scene.add(spill);
  const warm = new THREE.PointLight(0xffc68a, 0.6, 6, 1.6);
  warm.position.set(1.8, 1.4, -1.2);
  scene.add(warm);

  // 窗外竹影：投在桌角的淡淡光斑（桌面上用一层乘法贴图模拟）
  const desk = makeDesk();
  scene.add(desk);
  const mat = makeMat();
  scene.add(mat);
  const leaves = makeLeafShadow();
  scene.add(leaves);

  // —— 相机：平滑地在目标视角之间移动 ——
  const cam = {
    target: new THREE.Vector3(0, 0, 0), want: new THREE.Vector3(),
    dist: 4, wantDist: 4, el: 0.98, wantEl: 0.98, az: 0, wantAz: 0,
    par: new THREE.Vector2(), wantPar: new THREE.Vector2(),
  };
  // 让一块区域（宽 w，深 d，中心 c）充满画面
  function frame(cx, cz, w, d, { el = 0.98, pad = 1.08, bottomUI = 70, snap = false } = {}) {
    const aspect = camera.aspect;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const tv = Math.tan(fov / 2);
    const avail = Math.max(0.5, 1 - bottomUI / Math.max(300, window.innerHeight));
    const dv = (d * Math.sin(el) / 2) / (tv * avail) + d * Math.cos(el) / 2;
    const dh = (w / 2) / (tv * aspect) + d * Math.cos(el) * 0.2;
    const dist = Math.max(dv, dh) * pad;
    // 底部有按钮栏，让书往上挪一点
    const shift = (1 - avail) * dist * tv * 0.9;
    cam.want.set(cx, 0, cz + shift * 0.9);
    cam.wantDist = dist; cam.wantEl = el;
    if (snap) { cam.target.copy(cam.want); cam.dist = dist; cam.el = el; }
  }
  function updateCamera(dt) {
    const k = 3.2;
    cam.target.x = damp(cam.target.x, cam.want.x, k, dt);
    cam.target.y = damp(cam.target.y, cam.want.y, k, dt);
    cam.target.z = damp(cam.target.z, cam.want.z, k, dt);
    cam.dist = damp(cam.dist, cam.wantDist, k, dt);
    cam.el = damp(cam.el, cam.wantEl, k, dt);
    cam.par.x = damp(cam.par.x, cam.wantPar.x, 2, dt);
    cam.par.y = damp(cam.par.y, cam.wantPar.y, 2, dt);
    const el = cam.el + cam.par.y * 0.025;
    const az = cam.par.x * 0.035;
    camera.position.set(
      cam.target.x + Math.sin(az) * Math.cos(el) * cam.dist,
      cam.target.y + Math.sin(el) * cam.dist,
      cam.target.z + Math.cos(az) * Math.cos(el) * cam.dist,
    );
    camera.lookAt(cam.target);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  return { renderer, scene, camera, cam, frame, updateCamera, resize, lights: { key, hemi, spill } };
}

function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// 浅色橡木：沿长边的年轮纹 + 细小的木刺
function makeDesk() {
  const r = rng(7);
  const t = tex(2048, 1024, (g, w, h) => {
    g.fillStyle = '#c9a274'; g.fillRect(0, 0, w, h);
    // 木板分缝
    const planks = 4;
    for (let p = 0; p < planks; p++) {
      const y0 = p * h / planks, ph = h / planks;
      const tone = 0.9 + r() * 0.18;
      g.fillStyle = `rgba(${150 * tone | 0},${110 * tone | 0},${70 * tone | 0},.18)`;
      g.fillRect(0, y0, w, ph);
      for (let i = 0; i < 90; i++) {
        const yy = y0 + r() * ph;
        const amp = 2 + r() * 10, fr = 0.002 + r() * 0.004, ph0 = r() * 10;
        g.strokeStyle = `rgba(110,72,38,${0.05 + r() * 0.12})`;
        g.lineWidth = 0.6 + r() * 2.2;
        g.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const y = yy + Math.sin(x * fr + ph0) * amp + Math.sin(x * fr * 3.1 + ph0 * 2) * amp * 0.3;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      // 木射线（橡木特有的小斑）
      for (let i = 0; i < 260; i++) {
        g.fillStyle = `rgba(235,205,160,${r() * 0.18})`;
        g.fillRect(r() * w, y0 + r() * ph, 6 + r() * 26, 1 + r() * 2);
      }
      g.fillStyle = 'rgba(70,45,25,.35)'; g.fillRect(0, y0, w, 2);
    }
  }, [1.5, 1.5]);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshStandardMaterial({ map: t, roughness: 0.62, metalness: 0 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.012;
  m.receiveShadow = true;
  return m;
}

// 皮革书写垫：圆角、压边缝线
function makeMat() {
  const W = 3.6, D = 2.35, R = 0.12;
  const s = new THREE.Shape();
  s.moveTo(-W / 2 + R, -D / 2);
  s.lineTo(W / 2 - R, -D / 2); s.quadraticCurveTo(W / 2, -D / 2, W / 2, -D / 2 + R);
  s.lineTo(W / 2, D / 2 - R); s.quadraticCurveTo(W / 2, D / 2, W / 2 - R, D / 2);
  s.lineTo(-W / 2 + R, D / 2); s.quadraticCurveTo(-W / 2, D / 2, -W / 2, D / 2 - R);
  s.lineTo(-W / 2, -D / 2 + R); s.quadraticCurveTo(-W / 2, -D / 2, -W / 2 + R, -D / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  // 顶面 UV 用世界坐标
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, (pos.getZ(i) + D / 2) / D);
  const r = rng(3);
  const t = tex(1800, 1176, (c, w, h) => {
    c.fillStyle = '#9a7556'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      c.fillStyle = r() < 0.5 ? `rgba(40,22,10,${r() * 0.08})` : `rgba(255,220,180,${r() * 0.05})`;
      c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    const grd = c.createRadialGradient(w * 0.45, h * 0.45, h * 0.2, w / 2, h / 2, w * 0.7);
    grd.addColorStop(0, 'rgba(255,230,200,.06)'); grd.addColorStop(1, 'rgba(30,15,5,.25)');
    c.fillStyle = grd; c.fillRect(0, 0, w, h);
    // 缝线
    c.setLineDash([10, 8]); c.lineWidth = 2.4; c.strokeStyle = 'rgba(232,206,160,.55)';
    const m = 26;
    c.beginPath(); c.roundRect(m, m, w - 2 * m, h - 2 * m, 36); c.stroke();
    c.setLineDash([]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(30,15,5,.35)';
    c.beginPath(); c.roundRect(m - 8, m - 8, w - 2 * m + 16, h - 2 * m + 16, 42); c.stroke();
  });
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, roughness: 0.78, metalness: 0 }));
  mesh.position.set(0.05, -0.0105, 0.1);
  mesh.receiveShadow = true;
  return mesh;
}

// 竹叶的影子：乘法混合的贴图，落在桌角
function makeLeafShadow() {
  const r = rng(11);
  const t = tex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(10px)';
    g.fillStyle = 'rgba(120,95,70,0.55)';
    for (let k = 0; k < 4; k++) {
      // 竹枝
      const bx = 200 + k * 190 + r() * 60, by = -40;
      g.strokeStyle = 'rgba(120,95,70,.4)'; g.lineWidth = 9;
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + 120, h * 0.5, bx + 60 + r() * 120, h + 40); g.stroke();
      for (let i = 0; i < 11; i++) {
        const y = 60 + r() * (h - 120), x = bx + 40 + (y / h) * 100 + (r() - 0.5) * 60;
        const ang = (r() - 0.5) * 2.2 + (r() < 0.5 ? 0.6 : -0.6) + Math.PI / 2;
        const len = 110 + r() * 90, wid = 16 + r() * 8;
        g.save(); g.translate(x, y); g.rotate(ang);
        g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(len * 0.45, -wid, len, 0);
        g.quadraticCurveTo(len * 0.45, wid, 0, 0);
        g.fill(); g.restore();
      }
    }
    g.filter = 'none';
    // 边缘渐隐
    const grd = g.createRadialGradient(w * 0.7, h * 0.3, 50, w * 0.6, h * 0.4, w * 0.75);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.MultiplyBlending, premultipliedAlpha: true, depthWrite: false, toneMapped: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = 0.5;
  m.position.set(2.2, 0.0002, -1.4);
  m.renderOrder = 2;
  return m;
}
