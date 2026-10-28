// 排版与书页绘制：每一页画在一张 canvas 上，再作为纹理贴到三维书页
import { ABOUT, INTRO1, INTRO2, AFTER, COLOPHON, CHAPTERS, FRONT_SCENES, MARGIN } from './copy.js';
import { FONTS, INK, VERM, Ink } from './ink.js';
import { clamp, easeOut, rng } from './util.js';

export const PW = 1024, PH = 1434;     // 页面像素（宽高比 = 页宽:页高 = 1:1.4）
const FS = 42;                          // 正文字号
const LH = 76;                          // 行距
const COLS = 19, ROWS = 15;
const TOP = 168;
const INNER = 124, OUTER = 98;          // 订口、翻口留白
const OPEN = '「『（《〈“‘([';
const CLOSE = '，。、；：？！」』）》〉”’…)]';
const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一', '三十二', '三十三'];
export const cnNum = (n) => NUM[n] || String(n);

// —— 纸张底色（左右页各一张，订口处略暗） ——
let paperL = null, paperR = null;
function makePaper(side) {
  const c = document.createElement('canvas');
  c.width = PW; c.height = PH;
  const g = c.getContext('2d');
  g.fillStyle = '#f5eedf'; g.fillRect(0, 0, PW, PH);
  const r = rng(side === 'L' ? 5 : 9);
  // 纸纤维
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(120,95,60,${r() * 0.05})` : `rgba(255,255,250,${r() * 0.12})`;
    const x = r() * PW, y = r() * PH;
    g.fillRect(x, y, 1 + r() * 3, 1);
  }
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(140,110,70,${0.03 + r() * 0.04})`; g.lineWidth = 0.8;
    const x = r() * PW, y = r() * PH, a = r() * 6.28, l = 8 + r() * 26;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // 订口阴影
  const gx = side === 'L' ? PW : 0;
  const grd = g.createLinearGradient(gx, 0, side === 'L' ? PW - 150 : 150, 0);
  grd.addColorStop(0, 'rgba(90,65,35,.20)'); grd.addColorStop(0.35, 'rgba(90,65,35,.05)'); grd.addColorStop(1, 'rgba(90,65,35,0)');
  g.fillStyle = grd; g.fillRect(0, 0, PW, PH);
  // 翻口与天地的轻微泛黄
  const e = g.createLinearGradient(side === 'L' ? 0 : PW, 0, side === 'L' ? 60 : PW - 60, 0);
  e.addColorStop(0, 'rgba(170,130,70,.10)'); e.addColorStop(1, 'rgba(170,130,70,0)');
  g.fillStyle = e; g.fillRect(0, 0, PW, PH);
  return c;
}
function paper(side) {
  if (!paperL) { paperL = makePaper('L'); paperR = makePaper('R'); }
  return side === 'L' ? paperL : paperR;
}

// —— 分行：方块字一格一字，标点避头尾，句末标点可悬挂 ——
function layoutPara(chars, cols, indent) {
  const lines = [];
  let i = 0, first = true;
  while (i < chars.length) {
    const ind = first ? indent : 0;
    const cap = cols - ind;
    let n = Math.min(cap, chars.length - i);
    if (i + n < chars.length) {
      // 下一个字是句末标点：悬挂到行外
      if (CLOSE.includes(chars[i + n])) n += 1;
      // 行末是开引号：挪到下一行
      while (n > 1 && OPEN.includes(chars[i + n - 1])) n -= 1;
    }
    lines.push({ start: i, chars: chars.slice(i, i + n), indent: ind });
    i += n; first = false;
  }
  return lines;
}

// —— 构建整本书的页面序列 ——
export function buildPages(data) {
  const pages = [];
  const chapterPage = {};
  const push = (p) => { p.index = pages.length; p.side = pages.length % 2 === 0 ? 'R' : 'L'; pages.push(p); return p; };
  const toLeft = (ch) => { if (pages.length % 2 === 0) push({ type: 'coda', ch }); };

  push({ type: 'title', scene: 'title' });
  push({ type: 'about' });
  push({ type: 'scenepage', scene: 'parts', meta: FRONT_SCENES.parts, head: '导读' });
  push({ type: 'intro1' });
  push({ type: 'intro2' });
  const toc = [push({ type: 'toc', part: 0 }), push({ type: 'toc', part: 1 })];

  let lastPart = '';
  for (const ch of data) {
    const no = +ch.no;
    toLeft(pages.length ? data[no - 2] : null);
    const meta = CHAPTERS[no];
    chapterPage[no] = pages.length;
    const count = ch.paragraphs.join('').length;
    const opener = push({ type: 'opener', ch, no, meta, count, firstOfPart: ch.part !== lastPart, stories: [] });
    lastPart = ch.part;
    push({ type: 'scenepage', ch, no, scene: 'ch' + no, meta, head: ch.title });
    // 正文分行
    const all = [];
    const triggers = MARGIN.filter(m => m[0] === no);
    const used = new Set();
    ch.paragraphs.forEach((para, pi) => {
      const chars = Array.from(para);
      const lines = layoutPara(chars, COLS, 2);
      // 旁批：段内第一次出现的位置
      const marks = [];
      for (const [, key, label] of triggers) {
        if (used.has(label)) continue;
        const idx = para.indexOf(key);
        if (idx < 0) continue;
        used.add(label);
        const ci = Array.from(para.slice(0, idx)).length;
        marks.push({ ci, len: Array.from(key).length, label });
      }
      lines.forEach((ln, li) => {
        ln.para = pi; ln.paraStart = li === 0;
        ln.marks = marks.filter(m => m.ci >= ln.start && m.ci < ln.start + ln.chars.length)
          .map(m => ({ ...m, col: m.ci - ln.start }));
        all.push(ln);
      });
    });
    for (let i = 0; i < all.length; i += ROWS) {
      const tp = push({ type: 'text', ch, no, lines: all.slice(i, i + ROWS), last: i + ROWS >= all.length });
      for (const ln of tp.lines) for (const m of ln.marks) opener.stories.push({ label: m.label, page: tp.index });
    }
  }
  toLeft(data[data.length - 1]);
  push({ type: 'after' });
  push({ type: 'scenepage', scene: 'end', meta: FRONT_SCENES.end, head: '读毕' });
  push({ type: 'colophon' });
  if (pages.length % 2) push({ type: 'blank' });

  // 目录条目需要知道每篇所在页
  const entries = data.map(c => ({ no: +c.no, title: c.title, part: c.part, page: chapterPage[+c.no] }));
  toc[0].entries = entries.filter(e => e.no <= 15);
  toc[1].entries = entries.filter(e => e.no > 15);
  return { pages, chapterPage, tocPage: toc[0].index };
}

// —— 绘制 ——
function setFont(g, size, family = FONTS.serif, weight = '') { g.font = `${weight} ${size}px ${family}`.trim(); }
const textX = (side) => side === 'R' ? INNER : OUTER;
const gridW = COLS * FS;

function wrapText(g, text, maxW, size) {
  // 按字宽折行（中文逐字），用于导读等非网格段落
  const out = []; let line = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const w = g.measureText(line + ch).width;
    if (w > maxW && line && !CLOSE.includes(ch)) {
      // 避免开引号落在行末
      if (OPEN.includes(line[line.length - 1])) { out.push(line.slice(0, -1)); line = line.slice(-1) + ch; }
      else { out.push(line); line = ch; }
    } else line += ch;
  }
  if (line) out.push(line);
  return out;
}

function paragraphs(g, paras, x, y, w, { size = 36, lh = 1.9, indent = true, color = INK, family = FONTS.serif, gap = 0.5 } = {}) {
  setFont(g, size, family);
  g.fillStyle = color; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  for (const p of paras) {
    const lines = wrapText(g, (indent ? '　　' : '') + p, w, size);
    for (const ln of lines) { g.fillText(ln, x, y); y += size * lh; }
    y += size * gap;
  }
  return y;
}

function runningHead(g, page, label) {
  const side = page.side;
  g.save();
  setFont(g, 24); g.fillStyle = 'rgba(60,50,40,.62)'; g.textBaseline = 'middle';
  g.textAlign = side === 'R' ? 'right' : 'left';
  const x = side === 'R' ? PW - OUTER : OUTER;
  g.fillText(label, x, 92);
  g.strokeStyle = 'rgba(60,50,40,.25)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(textX(side), 114); g.lineTo(textX(side) + gridW, 114); g.stroke();
  // 页码
  g.textAlign = side === 'R' ? 'right' : 'left';
  setFont(g, 24);
  g.fillText(String(page.index + 1), side === 'R' ? PW - OUTER : OUTER, PH - 78);
  g.restore();
}

export const PAGE_FONTS_TEXT = (p) => {
  // 返回该页会用到的文字，用于按需加载网络字体
  if (p.type === 'text') return p.lines.map(l => l.chars.join('')).join('') + p.ch.title;
  if (p.type === 'opener') return p.ch.title + p.meta.intro + p.meta.line + p.ch.part + '内外杂篇第一二三四五六七八九十本约字读完分钟名句白话导读';
  return '';
};

// 每页的静态底层
export function drawBase(g, page, book) {
  g.drawImage(paper(page.side), 0, 0);
  const f = DRAW[page.type];
  if (f) f(g, page, book);
}

// 每页的动态层（批注写字、目录浮现……），t 为该页出现后的秒数
export function drawLive(g, page, live, book) {
  const f = LIVE[page.type];
  if (f) return f(g, page, live, book);
  return false;
}

const DRAW = {
  blank() {},
  coda(g, page) {
    // 篇末留白：一个小小的结束记号
    const ch = page.ch;
    if (!ch) return;
    g.save();
    g.fillStyle = 'rgba(60,50,40,.55)'; setFont(g, 28); g.textAlign = 'center';
    g.fillText(`${ch.title} · 终`, PW / 2, PH * 0.48);
    g.strokeStyle = 'rgba(176,67,45,.6)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(PW / 2 - 40, PH * 0.48 + 34); g.lineTo(PW / 2 + 40, PH * 0.48 + 34); g.stroke();
    g.restore();
  },

  title(g, page) {
    // 扉页：插图在上，书名在下
    g.save();
    g.textAlign = 'center'; g.fillStyle = INK;
    setFont(g, 150, FONTS.brush);
    g.fillText('庄 子', PW / 2, PH - 360);
    setFont(g, 30); g.fillStyle = 'rgba(40,34,30,.75)';
    g.fillText('三十三篇 · 简体全文 · 互动读本', PW / 2, PH - 270);
    setFont(g, 24); g.fillStyle = 'rgba(40,34,30,.5)';
    g.fillText('战国 · 庄周及其后学', PW / 2, PH - 220);
    const ink = new Ink(g, PW, PW / 2, PH * 0.5);
    ink.seal(0.17, -0.215, 0.05, '逍遥');
    g.restore();
  },

  about(g, page) {
    runningHead(g, page, '庄子');
    const x = textX('L'), w = gridW;
    g.fillStyle = INK; setFont(g, 52, FONTS.serif, '600'); g.textAlign = 'left';
    g.fillText(ABOUT.title, x, 238);
    let y = paragraphs(g, ABOUT.paras, x, 330, w, { size: 34, lh: 1.85 });
    g.strokeStyle = 'rgba(60,50,40,.3)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y + 6); g.lineTo(x + 120, y + 6); g.stroke();
    paragraphs(g, [ABOUT.source], x, y + 70, w, { size: 26, lh: 1.8, indent: false, color: 'rgba(40,34,30,.65)' });
  },

  intro1(g, page) {
    runningHead(g, page, '导读');
    const x = textX('L');
    g.fillStyle = VERM; setFont(g, 26); g.textAlign = 'left'; g.fillText('导读 一', x, 210);
    g.fillStyle = INK; setFont(g, 50, FONTS.serif, '600'); g.fillText('庄子其人其书', x, 280);
    paragraphs(g, INTRO1.paras, x, 380, gridW, { size: 35, lh: 1.9 });
  },

  intro2(g, page) {
    runningHead(g, page, '导读');
    const x = textX('R');
    g.fillStyle = VERM; setFont(g, 26); g.textAlign = 'left'; g.fillText('导读 二', x, 210);
    g.fillStyle = INK; setFont(g, 50, FONTS.serif, '600'); g.fillText('几个关键词', x, 280);
    let y = 370;
    for (const [k, v] of INTRO2.items) {
      g.fillStyle = VERM; setFont(g, 38, FONTS.brush); g.fillText(k, x, y + 4);
      y = paragraphs(g, [v], x + 0, y + 58, gridW, { size: 31, lh: 1.75, indent: false, gap: 0.2 });
      y += 14;
    }
    g.strokeStyle = 'rgba(60,50,40,.3)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 120, y); g.stroke();
    paragraphs(g, [INTRO2.tail], x, y + 60, gridW, { size: 31, lh: 1.8, indent: false, color: 'rgba(40,34,30,.8)', family: FONTS.serif });
  },

  toc(g, page) {
    runningHead(g, page, '目录');
    const x = textX(page.side);
    if (page.part === 0) {
      g.fillStyle = INK; setFont(g, 56, FONTS.serif, '600'); g.textAlign = 'left';
      g.fillText('目　录', x, 236);
    }
    page.rows = [];
    let y = page.part === 0 ? 330 : 214;
    let lastPart = '';
    for (const e of page.entries) {
      if (e.part !== lastPart) {
        if (lastPart) y += 18;
        g.fillStyle = VERM; setFont(g, 28); g.textAlign = 'left';
        g.fillText(e.part, x, y);
        g.strokeStyle = 'rgba(176,67,45,.35)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x + 76, y - 9); g.lineTo(x + gridW, y - 9); g.stroke();
        y += 58; lastPart = e.part;
      }
      page.rows.push({ e, y });
      y += 54;
    }
  },

  opener(g, page) {
    const { ch, meta, no } = page;
    runningHead(g, page, '庄子 · ' + ch.part);
    const x = textX('L');
    g.textAlign = 'left';
    g.fillStyle = VERM; setFont(g, 28);
    g.fillText(`${ch.part} · 第${cnNum(no)}`, x, 222);
    g.fillStyle = INK; setFont(g, 96, FONTS.serif, '600');
    const title = [...ch.title].join(' ');
    g.fillText(title, x - 4, 340);
    g.strokeStyle = 'rgba(40,34,30,.5)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, 392); g.lineTo(x + 70, 392); g.stroke();
    g.fillStyle = 'rgba(40,34,30,.55)'; setFont(g, 25);
    g.fillText('白话导读', x, 452);
    let y = paragraphs(g, [meta.intro], x, 516, gridW, { size: 34, lh: 1.9, indent: false });
    // 名句
    y += 30;
    g.fillStyle = 'rgba(40,34,30,.55)'; setFont(g, 25); g.fillText('名句', x, y);
    setFont(g, 40, FONTS.brush);
    const lines = wrapText(g, '「' + meta.line + '」', gridW - 40, 40);
    g.fillStyle = 'rgba(176,67,45,.07)';
    g.fillRect(x - 6, y + 24, gridW + 12, lines.length * 64 + 40);
    g.fillStyle = VERM; g.fillRect(x - 6, y + 24, 4, lines.length * 64 + 40);
    g.fillStyle = INK; setFont(g, 40, FONTS.brush);
    lines.forEach((l, i) => g.fillText(l, x + 22, y + 88 + i * 64));
    y += lines.length * 64 + 120;
    // 本篇故事：可点，直达那一页
    page.storyRects = [];
    if (page.stories.length) {
      g.fillStyle = 'rgba(40,34,30,.55)'; setFont(g, 25); g.fillText('本篇故事', x, y);
      y += 52;
      let xx = x;
      setFont(g, 27);
      for (const st of page.stories) {
        const w = g.measureText(st.label).width + 34;
        if (xx + w > x + gridW) { xx = x; y += 56; }
        if (y > PH - 170) break;
        g.strokeStyle = 'rgba(176,67,45,.45)'; g.lineWidth = 1.4;
        g.beginPath(); g.roundRect(xx, y - 32, w, 44, 22); g.stroke();
        g.fillStyle = 'rgba(40,34,30,.85)'; g.fillText(st.label, xx + 17, y);
        page.storyRects.push({ x: xx, y: y - 32, w, h: 44, page: st.page });
        xx += w + 12;
      }
    }
    // 篇幅
    const mins = Math.max(1, Math.round(page.count / 400));
    g.fillStyle = 'rgba(40,34,30,.5)'; setFont(g, 24);
    g.fillText(`原文约 ${page.count.toLocaleString()} 字 · 慢读约 ${mins} 分钟`, x, PH - 120);
  },

  scenepage(g, page) {
    runningHead(g, page, page.ch ? `${page.ch.title} · 图` : page.head);
    // 地面墨迹由插图模块提供
    if (page.ground) {
      const ink = new Ink(g, PW, PW / 2, PH / 2, 3);
      page.ground(ink);
    }
    const x = textX('R');
    const meta = page.meta;
    const cy = PH * 0.735;
    g.strokeStyle = 'rgba(40,34,30,.25)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, cy - 50); g.lineTo(x + gridW, cy - 50); g.stroke();
    g.textAlign = 'left';
    g.fillStyle = VERM; setFont(g, 26);
    g.fillText('图', x, cy);
    g.fillStyle = INK; setFont(g, 32);
    g.fillText(meta.caption, x + 46, cy);
  },

  text(g, page) {
    runningHead(g, page, page.ch.title);
    const x0 = textX(page.side);
    setFont(g, FS); g.fillStyle = INK; g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    page.lines.forEach((ln, r) => {
      const y = TOP + 44 + r * LH;
      ln.chars.forEach((c, k) => {
        const col = ln.indent + k;
        g.fillText(c, x0 + col * FS + FS / 2, y);
      });
    });
    if (page.last) {
      const y = TOP + 44 + page.lines.length * LH + 30;
      if (y < PH - 160) {
        g.fillStyle = 'rgba(176,67,45,.7)'; setFont(g, 26); g.textAlign = 'center';
        g.fillText('— ' + page.ch.title + ' 终 —', x0 + gridW / 2, y + 20);
      }
    }
  },

  after(g, page) {
    runningHead(g, page, '庄子');
    const x = textX('L');
    g.fillStyle = INK; setFont(g, 52, FONTS.serif, '600'); g.textAlign = 'left';
    g.fillText(AFTER.title, x, 250);
    paragraphs(g, AFTER.paras, x, 360, gridW, { size: 34, lh: 1.9 });
  },

  colophon(g, page) {
    const x = textX('L');
    let y = PH * 0.52;
    g.textAlign = 'left';
    g.strokeStyle = 'rgba(40,34,30,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y - 60); g.lineTo(x + gridW, y - 60); g.stroke();
    for (const [k, v] of COLOPHON) {
      g.fillStyle = 'rgba(40,34,30,.55)'; setFont(g, 24); g.fillText(k, x, y);
      g.fillStyle = INK;
      y = paragraphs(g, [v], x + 90, y, gridW - 90, { size: 24, lh: 1.7, indent: false, gap: 0.3 });
      y += 8;
    }
    const ink = new Ink(g, PW, x, y + 60);
    ink.seal(0.03, 0, 0.05, '庄子');
  },
};

// —— 动态层 ——
function inkReveal(g, draw, x, y, w, h, p) {
  // 从左到右“写出来”
  if (p <= 0) return;
  g.save();
  g.beginPath(); g.rect(x, y, w * clamp(p), h); g.clip();
  draw();
  g.restore();
}

const LIVE = {
  toc(g, page, live) {
    const t = live.t;
    const x = textX(page.side);
    let busy = false;
    page.rows.forEach(({ e, y }, i) => {
      const a = clamp((t - 0.15 - i * 0.05) / 0.35);
      if (a < 1) busy = true;
      if (a <= 0) return;
      g.save();
      g.globalAlpha = easeOut(a);
      const hover = live.hover === e.no;
      g.fillStyle = hover ? VERM : INK; setFont(g, 36); g.textAlign = 'left';
      g.fillText(e.title, x + 86 + (1 - a) * 12, y);
      g.fillStyle = 'rgba(40,34,30,.5)'; setFont(g, 22);
      g.fillText(cnNum(e.no), x, y - 4);
      // 点线与页码
      g.fillStyle = 'rgba(40,34,30,.35)';
      setFont(g, 36);
      const tw = g.measureText(e.title).width;
      for (let d = x + 86 + tw + 20; d < x + gridW - 70; d += 14) g.fillRect(d, y - 8, 2, 2);
      g.fillStyle = hover ? VERM : 'rgba(40,34,30,.7)'; setFont(g, 24); g.textAlign = 'right';
      g.fillText(String(e.page + 1), x + gridW, y);
      if (hover) { g.fillStyle = VERM; g.beginPath(); g.arc(x - 22, y - 12, 5, 0, 7); g.fill(); }
      g.restore();
    });
    return busy;
  },

  text(g, page, live) {
    // 页边旁批：先在原文下划一道朱笔，再在页边写出名目
    const t = live.t;
    let busy = false, k = 0;
    const x0 = textX(page.side);
    page.lines.forEach((ln, r) => {
      for (const m of ln.marks || []) {
        const t0 = 0.5 + k * 0.6; k++;
        const p1 = clamp((t - t0) / 0.5), p2 = clamp((t - t0 - 0.35) / 0.8);
        if (p2 < 1) busy = true;
        const y = TOP + 44 + r * LH;
        const col = ln.indent + m.col;
        const len = Math.min(m.len, ln.chars.length - m.col);
        const xa = x0 + col * FS, xb = xa + len * FS;
        if (p1 > 0) {
          g.save();
          g.strokeStyle = 'rgba(176,67,45,.85)'; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath();
          const xe = xa + (xb - xa) * easeOut(p1);
          for (let xx = xa; xx <= xe; xx += 6) {
            const yy = y + 12 + Math.sin(xx * 0.09 + r) * 1.6;
            xx === xa ? g.moveTo(xx, yy) : g.lineTo(xx, yy);
          }
          g.stroke();
          g.restore();
        }
        if (p2 > 0) {
          // 竖写在翻口一侧的页边
          const mx = page.side === 'R' ? PW - OUTER / 2 - 2 : OUTER / 2 + 2;
          const chars = [...m.label];
          const fs = chars.length > 4 ? 26 : 30;
          const top = Math.max(150, Math.min(PH - 140 - chars.length * fs * 1.06, y - FS - 4));
          g.save();
          g.beginPath(); g.rect(0, top - 30, PW, (chars.length * fs * 1.06 + 30) * clamp(p2 * 1.1)); g.clip();
          g.fillStyle = VERM; setFont(g, fs, FONTS.brush); g.textAlign = 'center'; g.textBaseline = 'top';
          chars.forEach((c, i) => g.fillText(c, mx, top + i * fs * 1.06));
          g.restore();
        }
      }
    });
    return busy;
  },

  scenepage(g, page, live) {
    // 图下：可点的条目 + 最近一次的批注（手写）
    const meta = page.meta;
    const keys = Object.keys(meta.notes || {});
    const x = textX('R');
    const cy = PH * 0.735;
    let busy = false;
    if (keys.length) {
      g.save();
      setFont(g, 26); g.fillStyle = 'rgba(40,34,30,.6)'; g.textAlign = 'left';
      const lead = meta.hint || '点一点图中的';
      g.fillText(lead + '：', x, cy + 58);
      let xx = x + g.measureText(lead + '：').width + 6;
      for (const k of keys) {
        const n = meta.notes[k];
        const found = live.found && live.found.has(k);
        setFont(g, 26);
        const w = g.measureText(n.name).width;
        g.fillStyle = found ? VERM : 'rgba(40,34,30,.8)';
        g.fillText(n.name, xx + 26, cy + 58);
        g.strokeStyle = found ? VERM : 'rgba(40,34,30,.45)'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(xx + 10, cy + 49, 8, 0, 7); g.stroke();
        if (found) { g.fillStyle = VERM; g.beginPath(); g.arc(xx + 10, cy + 49, 4.5, 0, 7); g.fill(); }
        xx += w + 52;
      }
      g.restore();
    }
    const note = live.note;
    if (note) {
      const n = meta.notes[note.key];
      const p = (live.t - note.t0) / 1.6;
      if (p < 1.2) busy = true;
      const top = cy + 96;
      g.save();
      g.globalAlpha = 1;
      // 手写的批注
      setFont(g, 34, FONTS.brush);
      const qLines = wrapText(g, '「' + n.q + '」', gridW - 10, 34);
      setFont(g, 28, FONTS.serif);
      const sLines = wrapText(g, n.s, gridW - 10, 28);
      const total = qLines.length + sLines.length;
      let i = 0;
      const lineP = (j) => clamp(p * total * 1.15 - j);
      setFont(g, 34, FONTS.brush);
      qLines.forEach((l, j) => {
        inkReveal(g, () => { g.fillStyle = INK; g.fillText(l, x, top + 34 + j * 50); }, x - 4, top + j * 50, gridW + 20, 52, lineP(i++));
      });
      setFont(g, 28, FONTS.serif);
      sLines.forEach((l, j) => {
        const yy = top + 34 + qLines.length * 50 + 12 + j * 44;
        inkReveal(g, () => { g.fillStyle = 'rgba(40,34,30,.78)'; g.fillText(l, x, yy); }, x - 4, yy - 34, gridW + 20, 46, lineP(i++));
      });
      g.restore();
    }
    return busy;
  },
};

// 导读页上的「本篇故事」：返回页序
export function storyHit(page, u, v) {
  if (!page.storyRects) return null;
  const px = u * PW, py = (1 - v) * PH;
  for (const r of page.storyRects) if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return r.page;
  return null;
}

// 目录点击：返回篇号
export function tocHit(page, u, v) {
  if (!page.rows) return null;
  const px = u * PW, py = (1 - v) * PH;
  const x = textX(page.side);
  if (px < x - 30 || px > x + gridW + 10) return null;
  for (const { e, y } of page.rows) if (py > y - 42 && py < y + 14) return e.no;
  return null;
}
