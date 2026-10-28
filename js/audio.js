// 用 WebAudio 现场合成的纸声：翻页、纸板弹起、落笔、木鱼般的轻敲
let ctx = null, master = null, noiseBuf = null;
let muted = localStorage.getItem('zhuangzi-book:mute') === '1';

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.55;
  master.connect(ctx.destination);
  const len = ctx.sampleRate * 1.2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) { b = 0.86 * b + 0.14 * (Math.random() * 2 - 1); d[i] = b * 2.2; }
  return ctx;
}

// 只在用户第一次点按后创建（浏览器的自动播放限制）
export function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }
export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  localStorage.setItem('zhuangzi-book:mute', m ? '1' : '0');
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05);
}

function noise(t0, dur, { f0 = 1800, f1 = 900, q = 0.8, peak = 0.5, attack = 0.02, type = 'bandpass', rate = 1 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = rate;
  const flt = ctx.createBiquadFilter();
  flt.type = type; flt.Q.value = q;
  flt.frequency.setValueAtTime(f0, t0);
  flt.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt).connect(g).connect(master);
  src.start(t0, Math.random() * 0.5, dur + 0.05);
}

// 翻页：先是纸张掀起的沙沙，再是落下的轻拍
export function flip(speed = 1) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const d = 0.42 / speed;
  noise(t, d, { f0: 2600, f1: 1200, q: 0.6, peak: 0.22, attack: d * 0.4 });
  noise(t + d * 0.15, d * 0.8, { f0: 5200, f1: 3000, q: 1.2, peak: 0.06, attack: d * 0.3 });
  noise(t + d * 0.92, 0.12, { f0: 700, f1: 300, q: 0.7, peak: 0.25, attack: 0.006, type: 'lowpass' });
}

// 封面：更沉的一声
export function cover() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  noise(t, 0.5, { f0: 1500, f1: 600, q: 0.5, peak: 0.15, attack: 0.2 });
  noise(t + 0.55, 0.22, { f0: 380, f1: 120, q: 0.6, peak: 0.5, attack: 0.008, type: 'lowpass' });
}

// 纸片立起
export function pop(i = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + i * 0.0;
  noise(t, 0.09, { f0: 3200 + Math.random() * 800, f1: 1600, q: 2, peak: 0.08, attack: 0.004 });
}

// 落笔批注
export function brush() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  noise(t, 0.6, { f0: 4200, f1: 2400, q: 0.9, peak: 0.035, attack: 0.08, rate: 0.7 });
}

// 轻敲（目录、按钮、鼓盆）
export function tap(freq = 520, dur = 0.25, vol = 0.18) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq * 1.6, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}
