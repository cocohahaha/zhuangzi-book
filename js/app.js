// 庄子 · 互动书 —— 主程序
import * as THREE from 'three';
import { createStage } from './stage.js';
import { Book, makeTextures, W, H, T, TB, OV } from './book.js';
import { buildPages, drawBase, drawLive, tocHit, storyHit, PW, PH, PAGE_FONTS_TEXT } from './pages.js';
import { Popup } from './popup.js';
import { SCENES } from './scenes/index.js';
import { FONTS } from './ink.js';
import { clamp, easeInOut, lerp, isTouch, reduceMotion } from './util.js';
import * as sfx from './audio.js';

const STORE = 'zhuangzi-book:v2';
// 截图调试：?dt=0.5 允许更大的帧间隔（软件渲染时动画不至于太慢）
const DTMAX = +(new URLSearchParams(location.search).get('dt') || 0.05);
const $ = (s) => document.querySelector(s);

// —— 字体：网络字体可用就用，加载不到就用系统宋体/楷体 ——
const fontReady = new Set();
async function ensureFonts(text) {
  if (!document.fonts || !text) return false;
  const specs = [`40px "Noto Serif SC"`, `600 40px "Noto Serif SC"`, `40px "Ma Shan Zheng"`];
  const need = specs.filter(s => !document.fonts.check(s, text));
  if (!need.length) return false;
  try {
    await Promise.race([Promise.all(need.map(s => document.fonts.load(s, text))), new Promise(r => setTimeout(r, 2500))]);
  } catch (e) { /* 忽略 */ }
  return true;
}

async function boot() {
  const mobile = isTouch() || Math.min(innerWidth, innerHeight) < 600;
  const res = await fetch('content/zhuangzi.json');
  const data = await res.json();
  await ensureFonts('庄子内外杂篇三十三互动读本南华真经逍遥战国周及其后学简体全文关于这本书导读目录' + data.map(c => c.title).join(''));

  const stage = createStage($('#gl'), { mobile });
  const { renderer, scene, camera } = stage;
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = makeTextures(FONTS);
  const book = new Book(tex);
  book.group.position.set(0, 0, 0);
  scene.add(book.group);

  const { pages, chapterPage, tocPage } = buildPages(data);
  for (const p of pages) if (p.scene && SCENES[p.scene]) p.ground = SCENES[p.scene].ground;
  const N = pages.length / 2;           // 纸张数
  const hR = (m) => m <= 0 ? T : Math.max(0, T * (N - (m - 1)) / N);
  const hL = (m) => m <= 1 ? 0 : T * (m - 1) / N;

  // —— 书页纹理缓存 ——
  const cache = new Map();   // index -> {canvas, base, tex, live, used}
  const live = new Map();    // index -> 动态状态（批注、已发现的条目……）
  let clock = 0;
  function liveOf(i) { if (!live.has(i)) live.set(i, { t: 0, t0: 0, found: new Set(), note: null, hover: null, active: false }); return live.get(i); }
  function entry(i) {
    let e = cache.get(i);
    if (!e) {
      const page = pages[i];
      const base = document.createElement('canvas'); base.width = PW; base.height = PH;
      const canvas = document.createElement('canvas'); canvas.width = PW; canvas.height = PH;
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
      t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
      e = { canvas, base, tex: t, used: clock };
      cache.set(i, e);
      paintBase(i, e);
      const txt = PAGE_FONTS_TEXT(page);
      if (txt) ensureFonts(txt).then(changed => { if (changed && cache.get(i) === e) { paintBase(i, e); } });
      evict();
    }
    e.used = clock;
    return e;
  }
  function paintBase(i, e) {
    const g = e.base.getContext('2d');
    drawBase(g, pages[i], { pages });
    composite(i, e);
  }
  function composite(i, e) {
    const g = e.canvas.getContext('2d');
    g.drawImage(e.base, 0, 0);
    const L = live.get(i);
    let busy = false;
    if (L && L.active) busy = drawLive(g, pages[i], L, { pages });
    e.tex.needsUpdate = true;
    return busy;
  }
  function evict() {
    if (cache.size <= 16) return;
    const vis = new Set(visibleIndices());
    const arr = [...cache.entries()].filter(([i]) => !vis.has(i)).sort((a, b) => a[1].used - b[1].used);
    while (cache.size > 12 && arr.length) { const [i, e] = arr.shift(); e.tex.dispose(); cache.delete(i); }
  }
  const pageTex = (i) => (i >= 0 && i < pages.length) ? entry(i).tex : null;

  // —— 状态 ——
  let pos = 0;                 // 0：合上；m≥1：已翻过 m 张（含封面）
  let focus = 'R';             // 单页模式下看哪一边
  let zoom = false;            // 宽屏下双击放大单页
  const narrow = () => camera.aspect < 0.9;
  const single = () => narrow() || zoom;
  const leftIdx = (m) => m >= 2 ? 2 * m - 3 : -1;
  const rightIdx = (m) => (m >= 0 && m <= N) ? 2 * Math.max(0, m - 1) : -1;
  function visibleIndices() { return [leftIdx(pos), rightIdx(pos)].filter(i => i >= 0); }

  // 静止页面
  function applyStatic(m, { rightM = m, leftM = m } = {}) {
    const ri = rightIdx(rightM), li = leftIdx(leftM);
    book.pageR.group.visible = ri >= 0 && rightM >= 0;
    if (ri >= 0) { book.pageR.setMaps(pageTex(ri), null); book.pageR.shape(0, hR(rightM), 0); }
    book.pageL.group.visible = li >= 0;
    if (li >= 0) { book.pageL.setMaps(null, pageTex(li)); book.pageL.shape(1, 0, hL(leftM)); }
    book.setHeights(hR(rightM), hL(leftM));
  }

  // —— 翻页 ——
  let flip = null;      // 当前翻动 {dir, t, from, to, leaf, mode, ...}
  let coverAnim = null; // 封面开合
  let riffle = null;    // 快速翻到远处
  const queue = [];

  function bendFor(t, mode, dir) {
    // 用手拖时页角领先；自动翻时先掀起、过了中线后外缘下垂
    const s = Math.sin(Math.PI * t);
    const b = mode === 'drag' ? 0.95 * s * (1.1 - t) : 0.75 * s * Math.cos(Math.PI * t * 1.05 + 0.15) + 0.18 * s;
    return dir > 0 ? b : -(mode === 'drag' ? 0.95 * s * (0.1 + t) : 0.75 * s * Math.cos(Math.PI * (1 - t) * 1.05 + 0.15) + 0.18 * s);
  }

  function startFlip(dir, mode = 'auto', grabV = 0.75) {
    if (flip || coverAnim || riffle) return false;
    if (dir > 0 && pos >= N + 1) return false;
    if (dir < 0 && pos <= 0) return false;
    if ((dir > 0 && pos === 0) || (dir < 0 && pos === 1)) {
      // 封面
      if (mode === 'drag') return false;
      closePopup();
      coverAnim = { dir, t: 0, from: book.coverOpen, to: dir > 0 ? 1 : 0 };
      sfx.cover();
      if (dir > 0) { pos = 1; applyStatic(1); }
      return true;
    }
    closePopup(mode === 'drag');
    const m = pos;
    const leaf = book.getLeaf();
    let front, back, hFrom, hTo;
    if (dir > 0) {
      front = pageTex(2 * m - 2); back = pageTex(2 * m - 1);
      applyStatic(m, { rightM: m + 1, leftM: m });
      hFrom = hR(m) + 0.0015; hTo = hL(m + 1) + 0.0008;
    } else {
      front = pageTex(2 * m - 4); back = pageTex(2 * m - 3);
      applyStatic(m, { rightM: m, leftM: m - 1 });
      hFrom = hR(m - 1) + 0.0008; hTo = hL(m) + 0.0015;
    }
    leaf.setMaps(front, back);
    flip = { dir, t: dir > 0 ? 0 : 1, start: dir > 0 ? 0 : 1, target: dir > 0 ? 1 : 0, mode, leaf, m, hFrom, hTo, twist: (grabV - 0.5) * 1.2, v: 0, released: mode !== 'drag', played: false };
    shapeFlip();
    if (mode !== 'drag') { sfx.flip(); flip.played = true; }
    return true;
  }

  function shapeFlip() {
    const f = flip;
    const b = bendFor(f.dir > 0 ? f.t : f.t, f.mode, f.dir);
    f.leaf.shape(f.t, f.hFrom, f.hTo, f.dir > 0 ? b : b, f.twist * Math.sin(Math.PI * f.t));
  }

  function endFlip(done) {
    const f = flip;
    book.releaseLeaf(f.leaf);
    flip = null;
    if (done) pos = f.dir > 0 ? f.m + 1 : f.m - 1;
    applyStatic(pos);
    settle();
    if (queue.length) { const d = queue.shift(); go(d); }
  }

  // 一次走一步（前/后）
  function go(dir) {
    if (flip || coverAnim || riffle) { if (queue.length < 2) queue.push(dir); else if (flip && flip.released) flip.speed = 2.2; return; }
    if (single()) {
      // 单页模式：先在左右页之间移动镜头
      if (dir > 0 && focus === 'L' && pos >= 1 && rightIdx(pos) >= 0) { focusRight(); return; }
      if (dir < 0 && focus === 'R' && leftIdx(pos) >= 0) { focus = 'L'; reframe(); onSpreadUI(); return; }
    }
    if (startFlip(dir)) {
      if (single()) focus = dir > 0 ? 'L' : 'R';
      reframe();
    }
  }

  // 单页模式下镜头移到右页：插图从头再立起来一次
  function focusRight() {
    focus = 'R'; reframe(); onSpreadUI();
    if (popup && popup.T > 0.5) { popup.T = -0.25; for (const it of popup.items) it.popped = false; popup.popped = 0; }
  }

  // 快速翻到第 m 张
  function jumpTo(m) {
    m = clamp(Math.round(m), 0, N + 1);
    if (flip || coverAnim || riffle) return;
    if (m === pos) return;
    if (Math.abs(m - pos) === 1 || pos === 0 || m === 0) {
      if (pos === 0 && m > 1) {
        // 先开封面，再翻
        startFlip(1); pendingJump = m; return;
      }
      if (m === 0) { if (pos === 1) go(-1); else { pendingJump = 0; jumpTo(1); } return; }
      go(m > pos ? 1 : -1); return;
    }
    closePopup();
    const dir = m > pos ? 1 : -1;
    const k = Math.min(7, Math.abs(m - pos));
    const generic = pageTex(chapterPage[1] + 2);
    const leaves = [];
    // 第一张显示当前页，最后一张显示目标页，中间几张一闪而过
    for (let i = 0; i < k; i++) {
      const l = book.getLeaf();
      let front = generic, back = generic;
      if (dir > 0) {
        if (i === 0) front = pageTex(rightIdx(pos));
        if (i === k - 1) back = pageTex(leftIdx(m));
      } else {
        if (i === 0) back = pageTex(leftIdx(pos));
        if (i === k - 1) front = pageTex(rightIdx(m));
      }
      l.setMaps(front || generic, back || generic);
      l.group.visible = false;
      leaves.push(l);
    }
    riffle = { dir, from: pos, to: m, k, t: 0, leaves };
    // 目标页先就位
    if (dir > 0) applyStatic(pos, { rightM: m, leftM: pos });
    else applyStatic(pos, { rightM: pos, leftM: m });
    sfx.flip(2.2);
  }
  let pendingJump = null;

  function updateRiffle(dt) {
    const r = riffle;
    r.t += dt;
    const per = 0.42, gap = 0.085;
    let done = true;
    const { dir, from, to } = r;
    r.leaves.forEach((l, i) => {
      const p = clamp((r.t - i * gap) / per);
      if (p < 1) done = false;
      l.group.visible = p > 0 && p < 1;
      const e = easeInOut(p);
      const t = dir > 0 ? e : 1 - e;
      const hA = dir > 0 ? hR(to) + 0.0015 * (r.k - i) : hR(from) + 0.001;
      const hB = dir > 0 ? hL(from) + 0.001 : hL(to) + 0.0015 * (r.k - i);
      l.shape(t, hA, hB, bendFor(t, 'auto', dir), 0.2 * Math.sin(Math.PI * t));
    });
    if (Math.floor(r.t / 0.16) !== Math.floor((r.t - dt) / 0.16) && r.t < r.k * gap) sfx.flip(3);
    if (done) {
      r.leaves.forEach(l => book.releaseLeaf(l));
      riffle = null;
      pos = to;
      applyStatic(pos);
      settle();
    }
  }

  // —— 立体插图 ——
  let popup = null;
  function closePopup(follow = false) {
    if (!popup) return;
    const p = popup;
    popup = null;
    p.close();
    p.follow = follow;
    dying.push(p);
  }
  const dying = [];
  function openPopup() {
    if (pos === 0) {
      popup = new Popup(SCENES.cover, { renderer, aniso });
      popup.root.position.set(0, TB + 0.001, 0);
      popup.T = 0; popup.closeRate = 1.1;
      book.coverHinge.add(popup.root);
      return;
    }
    const ri = rightIdx(pos);
    if (ri < 0 || pos < 1) return;
    const page = pages[ri];
    if (!page.scene || !SCENES[page.scene]) return;
    const L = liveOf(ri);
    popup = new Popup(SCENES[page.scene], {
      renderer, aniso,
      onNote: (key) => {
        L.found.add(key); L.note = { key, t0: L.t }; L.active = true; L.busy = true;
        sfx.brush();
        if (single() && focus !== 'R') { focus = 'R'; reframe(); }
      },
    });
    popup.page = ri;
    popup.root.position.set(W / 2, TB + hR(pos) + 0.0008, 0);
    popup.T = -0.35;
    book.group.add(popup.root);
  }

  // 停在一个对开页上
  function settle() {
    if (pos >= 1) localStorage.setItem(STORE, JSON.stringify({ pos, focus }));
    else localStorage.setItem(STORE, JSON.stringify({ pos: 0 }));
    for (const i of visibleIndices()) {
      const L = liveOf(i);
      const page = pages[i];
      if (page.type === 'text' || page.type === 'toc' || page.type === 'scenepage') {
        L.active = true; L.t = 0; L.busy = true;
        if (page.type === 'text' && !page.lines.some(l => l.marks && l.marks.length)) L.busy = false;
      }
    }
    openPopup();
    if (pendingJump != null) { const m = pendingJump; pendingJump = null; setTimeout(() => jumpTo(m), 60); }
    if (single()) {
      if (leftIdx(pos) < 0) focus = 'R';
      if (rightIdx(pos) < 0) focus = 'L';
    }
    reframe();
    onSpreadUI();
    history.replaceState(null, '', pos >= 1 ? `#p=${(focus === 'L' && leftIdx(pos) >= 0 ? leftIdx(pos) : Math.max(0, rightIdx(pos))) + 1}` : location.pathname + location.search);
  }

  // —— 镜头 ——
  function reframe(snap = false) {
    const el = narrow() ? 1.12 : 1.0;
    if (pos === 0 && !coverAnim) {
      stage.frame((W + OV) / 2, 0.02, W + 0.32, H + 0.34, { el: 1.05, snap, pad: narrow() ? 1.04 : 1.12 });
    } else if (single()) {
      const x = focus === 'L' ? -W / 2 : W / 2;
      stage.frame(x * 0.98, 0, W + (narrow() ? 0.1 : 0.16), H + 0.1, { el, snap, pad: 1.02 });
    } else {
      stage.frame(0, 0.0, 2 * W + 0.3, H + 0.24, { el, snap, pad: 1.04 });
    }
  }

  // —— 界面 ——
  const label = $('#label'), sub = $('#sub');
  function chapterAt(i) {
    for (let k = i; k >= 0; k--) if (pages[k].ch) return pages[k].ch;
    return null;
  }
  function onSpreadUI() {
    let t = '封面', s = '';
    if (pos >= 1) {
      const i = focus === 'L' && single() ? leftIdx(pos) : (rightIdx(pos) >= 0 ? rightIdx(pos) : leftIdx(pos));
      const page = pages[i] || pages[leftIdx(pos)];
      const ch = page && page.type !== 'after' && page.type !== 'colophon' && page.scene !== 'end' ? chapterAt(page.index) : null;
      if (ch) { t = ch.title; s = ch.part; }
      else if (page && page.type === 'toc') t = '目录';
      else if (page && (page.type === 'intro1' || page.type === 'intro2' || page.scene === 'parts')) t = '导读';
      else if (page && page.index < 3) t = '扉页';
      else t = '读后';
      s = (s ? s + ' · ' : '') + `第 ${i + 1} 页 / ${pages.length}`;
    }
    label.textContent = t; sub.textContent = s;
    $('#prev').disabled = pos === 0;
    $('#next').disabled = pos >= N + 1;
    $('#hint').classList.toggle('show', pos === 0);
  }
  $('#prev').addEventListener('click', () => { sfx.unlock(); go(-1); });
  $('#next').addEventListener('click', () => { sfx.unlock(); go(1); });
  $('#toc').addEventListener('click', () => { sfx.unlock(); jumpTo(Math.floor(tocPage / 2) + 2); });
  const muteBtn = $('#mute');
  const setMuteUI = () => { muteBtn.classList.toggle('off', sfx.isMuted()); muteBtn.setAttribute('aria-label', sfx.isMuted() ? '打开声音' : '静音'); };
  muteBtn.addEventListener('click', () => { sfx.unlock(); sfx.setMuted(!sfx.isMuted()); setMuteUI(); });
  setMuteUI();
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); sfx.unlock(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); sfx.unlock(); go(-1); }
    else if (e.key === 'Home') jumpTo(0);
    else if (e.key === 'End') jumpTo(N + 1);
  });

  // —— 指针：拖动翻页、点击插图、目录 ——
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function setRay(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function pageHit() {
    const objs = [];
    if (book.pageR.group.visible) objs.push(book.pageR.front);
    if (book.pageL.group.visible) objs.push(book.pageL.back);
    const h = ray.intersectObjects(objs, false)[0];
    if (!h) return null;
    const side = h.object === book.pageR.front ? 'R' : 'L';
    return { side, uv: h.uv, index: side === 'R' ? rightIdx(pos) : leftIdx(pos), point: h.point };
  }
  function coverHit() { return ray.intersectObject(book.cover, false)[0] || ray.intersectObject(book.blockR, false)[0]; }
  // 书页宽度在屏幕上有多少像素
  function pagePixels() {
    const a = new THREE.Vector3(0, TB, 0).applyMatrix4(book.group.matrixWorld).project(camera);
    const b = new THREE.Vector3(W, TB, 0).applyMatrix4(book.group.matrixWorld).project(camera);
    return Math.max(80, Math.abs(b.x - a.x) * innerWidth / 2);
  }

  let drag = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    setRay(e);
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, moved: false, flipping: false, hit: null };
    if (popup) { const k = popup.pick(ray); if (k) { drag.hot = k; return; } }
    const ph = pageHit();
    drag.hit = ph;
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* */ }
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) { hover(e); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 10) {
      drag.moved = true;
      if (drag.hot) drag.hot = null;
      // 横向拖动才翻页
      if (Math.abs(dx) > Math.abs(dy) * 0.8 && !flip && !coverAnim && !riffle) {
        const dir = dx < 0 ? 1 : -1;
        if (single() && dir > 0 && focus === 'L' && rightIdx(pos) >= 0 && pos >= 1) { focusRight(); drag.done = true; return; }
        if (single() && dir < 0 && focus === 'R' && leftIdx(pos) >= 0) { focus = 'L'; reframe(); onSpreadUI(); drag.done = true; return; }
        if (pos === 0 || (dir < 0 && pos === 1)) { go(dir); drag.done = true; return; }
        const grabV = drag.hit ? 1 - drag.hit.uv.y : 0.75;
        if (startFlip(dir, 'drag', grabV)) { drag.flipping = true; drag.dir = dir; drag.px = pagePixels(); }
      }
    }
    if (drag.flipping && flip) {
      const p = clamp(-dx * drag.dir / (drag.px * 1.7));
      const now = performance.now();
      const nt = drag.dir > 0 ? p : 1 - p;
      flip.v = (nt - flip.t) / Math.max(1, now - (drag.lt || now - 16)) * 1000;
      drag.lt = now;
      flip.t = nt;
      shapeFlip();
      if (!flip.played && p > 0.06) { sfx.flip(1.2); flip.played = true; }
    }
  });
  const up = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.flipping && flip) {
      const prog = d.dir > 0 ? flip.t : 1 - flip.t;
      const vel = flip.v * d.dir;
      const complete = prog > 0.4 || vel > 1.2;
      flip.target = complete ? (d.dir > 0 ? 1 : 0) : (d.dir > 0 ? 0 : 1);
      flip.released = true; flip.mode = 'auto'; flip.cancel = !complete;
      flip.rel = { t0: flip.t, k: 0 };
      if (complete && single()) focus = d.dir > 0 ? 'L' : 'R';
      return;
    }
    if (d.moved || d.done) return;
    // 点击
    if (d.hot && popup) { popup.hit(d.hot); return; }
    setRay(e);
    if (pos === 0) { if (coverHit()) go(1); return; }
    const ph = pageHit();
    if (!ph) return;
    const page = pages[ph.index];
    if (page && page.type === 'toc') {
      const no = tocHit(page, ph.uv.x, ph.uv.y);
      if (no) { sfx.tap(660, 0.2, 0.12); jumpTo(Math.floor(chapterPage[no] / 2) + 2); return; }
    }
    if (page && page.type === 'opener') {
      const pi = storyHit(page, ph.uv.x, ph.uv.y);
      if (pi != null) { sfx.tap(660, 0.2, 0.12); const m = pi % 2 === 0 ? pi / 2 + 1 : (pi + 3) / 2; focus = pi % 2 === 0 ? 'R' : 'L'; jumpTo(m); return; }
    }
    // 点页面外侧三分之一：翻页
    const u = ph.uv.x;
    if (ph.side === 'R' && u > 0.72) go(1);
    else if (ph.side === 'L' && u < 0.28) go(-1);
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('dblclick', (e) => {
    if (narrow() || pos === 0) return;
    setRay(e);
    const ph = pageHit();
    zoom = !zoom;
    if (ph) focus = ph.side;
    reframe(); onSpreadUI();
  });

  let hoverKey = null, tocHover = null;
  function hover(e) {
    if (isTouch()) return;
    setRay(e);
    stage.cam.wantPar.set((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
    let k = popup ? popup.pick(ray) : null;
    let cursor = k ? 'pointer' : '';
    if (k !== hoverKey) { hoverKey = k; popup && popup.setHover(k); }
    let th = null;
    if (!k && pos === 0) {
      const c = coverHit();
      coverTease = c ? 1 : 0;
      if (c) cursor = 'pointer';
    } else coverTease = 0;
    if (!k && pos >= 1) {
      const ph = pageHit();
      if (ph) {
        const page = pages[ph.index];
        if (page.type === 'toc') { th = tocHit(page, ph.uv.x, ph.uv.y); if (th) { cursor = 'pointer'; th = { i: ph.index, no: th }; } }
        if (page.type === 'opener' && storyHit(page, ph.uv.x, ph.uv.y) != null) cursor = 'pointer';
        if (!th && ((ph.side === 'R' && ph.uv.x > 0.72) || (ph.side === 'L' && ph.uv.x < 0.28))) cursor = 'grab';
      }
    }
    if ((th && th.no) !== (tocHover && tocHover.no)) {
      if (tocHover) { const L = liveOf(tocHover.i); L.hover = null; L.busy = true; }
      if (th) { const L = liveOf(th.i); L.hover = th.no; L.busy = true; L.active = true; }
      tocHover = th;
    }
    el.style.cursor = cursor;
  }
  let coverTease = 0, teaseV = 0;

  // —— 恢复阅读位置 ——
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (_) { /* */ }
  const hm = location.hash.match(/p=(\d+)/);
  if (hm) {
    const i = clamp(+hm[1] - 1, 0, pages.length - 1);
    pos = i % 2 === 0 ? i / 2 + 1 : (i + 3) / 2;
    focus = i % 2 === 0 ? 'R' : 'L';
  } else if (saved && saved.pos >= 1) { pos = clamp(saved.pos, 1, N + 1); focus = saved.focus || 'R'; }
  book.setCover(pos >= 1 ? 1 : 0);
  applyStatic(pos);
  reframe(true);
  settle();
  onSpreadUI();

  addEventListener('resize', () => { stage.resize(); reframe(); onSpreadUI(); });

  // —— 渲染循环 ——
  const timer = new THREE.Clock();
  $('#loading').classList.add('done');
  document.body.classList.add('ready');
  const reduce = reduceMotion();

  function frame() {
    const dt = Math.min(DTMAX, timer.getDelta());
    clock += dt;

    // 封面
    if (coverAnim) {
      coverAnim.t += dt / (reduce ? 0.3 : 1.25);
      const e = easeInOut(coverAnim.t);
      book.setCover(lerp(coverAnim.from, coverAnim.to, e));
      if (coverAnim.t >= 1) {
        const dir = coverAnim.dir;
        coverAnim = null;
        pos = dir > 0 ? 1 : 0;
        applyStatic(pos);
        settle();
      } else if (coverAnim.t > 0.15) reframe();
    } else if (pos === 0) {
      teaseV = lerp(teaseV, coverTease ? 0.07 : 0.012 * (1 + Math.sin(clock * 1.6)) * 0.5, 1 - Math.exp(-6 * dt));
      book.setCover(teaseV);
    }

    // 翻页
    if (flip && flip.released) {
      const sp = (flip.speed || 1) * (reduce ? 3 : 1);
      if (!flip.rel) flip.rel = { t0: flip.t, k: 0 };
      flip.rel.k = Math.min(1, flip.rel.k + dt * sp / (flip.cancel ? 0.45 : (flip.mode === 'auto' && flip.rel.t0 === flip.start ? 0.95 : 0.6)));
      const e = flip.rel.t0 === flip.start ? easeInOut(flip.rel.k) : 1 - Math.pow(1 - flip.rel.k, 2.4);
      flip.t = lerp(flip.rel.t0, flip.target, e);
      shapeFlip();
      if (flip.rel.k >= 1) endFlip(!flip.cancel);
    }
    if (riffle) updateRiffle(dt);

    // 插图
    if (popup) popup.update(dt);
    for (let i = dying.length - 1; i >= 0; i--) {
      const p = dying[i];
      if (p.follow && flip) p.F = Math.min(p.F, clamp(1 - Math.abs(flip.t - flip.start) * 6));
      p.update(dt);
      if (p.F <= 0) { p.dispose(); dying.splice(i, 1); }
    }

    // 页面动态层
    for (const i of visibleIndices()) {
      const L = live.get(i);
      if (!L || !L.active) continue;
      L.t += dt;
      if (L.busy) { const e = cache.get(i); if (e) L.busy = composite(i, e); }
    }

    book.updateRibbon(clock);
    stage.updateCamera(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 调试/截图用
  window.__book = { stage, book, go, jumpTo, get pos() { return pos; }, get flip() { return flip && { t: flip.t, mode: flip.mode, released: flip.released, h: [flip.hFrom, flip.hTo], vis: flip.leaf.group.visible, parent: !!flip.leaf.group.parent }; }, get drag() { return drag; }, N, pages, chapterPage, hit: (k) => popup && popup.hit(k), setZoom: (z, f) => { zoom = z; if (f) focus = f; reframe(true); onSpreadUI(); } };
}

boot().catch((e) => {
  console.error(e);
  const l = document.querySelector('#loading');
  l.textContent = '书没能打开：' + (e && e.message ? e.message : e);
});
