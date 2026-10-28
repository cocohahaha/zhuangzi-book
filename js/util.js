// 通用小工具
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => clamp(t) ** 2;
// 带一点回弹，像纸板弹起
export const easeBack = (t) => { t = clamp(t); const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// 帧率无关的阻尼
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
// 0→1→0 的窗口
export const win = (t, a, b) => clamp((t - a) / (b - a));
export const pulse = (t, a, b) => Math.sin(Math.PI * win(t, a, b));

// 可复现的伪随机
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const isTouch = () => matchMedia('(pointer: coarse)').matches;
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
