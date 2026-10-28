// 核对 js/copy.js：旁批关键词都在正文里，全书没有残留的文言引文，字符都是常用字
import fs from 'node:fs';
import { ABOUT, INTRO1, INTRO2, AFTER, COLOPHON, CHAPTERS, MARGIN, FRONT_SCENES } from '../js/copy.js';
const data = JSON.parse(fs.readFileSync(new URL('../content/zhuangzi.json', import.meta.url)));
const text = (n) => data[n - 1].paragraphs.join('');
let bad = 0;
const fail = (...a) => { console.log(...a); bad++; };

if (data.length !== 33) fail('CHAPTERS', data.length);
data.forEach((c, i) => {
  if (+c.no !== i + 1) fail('NO', c.no);
  if (!c.sub) fail('SUB', c.no);
  if (!CHAPTERS[c.no]) fail('COPY', c.no);
});
// 旁批关键词必须是同一段里的连续短语，同一篇里标签不重复
const seen = new Set();
for (const [n, key, label] of MARGIN) {
  if (!data[n - 1].paragraphs.some(p => p.includes(key))) fail('MARGIN', n, key);
  if (seen.has(n + label)) fail('MARGIN dup', n, label);
  seen.add(n + label);
}
// 图中批注：q、s 都要有
for (const [n, c] of Object.entries(CHAPTERS))
  for (const [k, v] of Object.entries(c.notes)) if (!v.q || !v.s || !v.name) fail('NOTE', n, k);

// 文言残留：原来的引文句和常见文言虚词句式
const CLASSICAL = ['北冥有鱼', '其名为鲲', '怒而飞', '抟扶摇', '子曰', '曰：', '何哉', '不亦', '之谓也', '而已矣'];
const strings = [];
const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
walk([ABOUT, INTRO1, INTRO2, AFTER, COLOPHON, CHAPTERS, FRONT_SCENES]);
data.forEach(c => strings.push(...c.paragraphs, c.sub));
for (const s of strings) for (const w of CLASSICAL) if (s.includes(w)) fail('CLASSICAL', w, s.slice(0, 30));

// 生僻字：落在 Unicode 扩展区的字（常用字用 GB2312 另行核对）
const PUNCT = /[，。、；：？！「」『』（）《》—…·“”‘’\s\d\w%.\-/]/;
const rare = new Set();
for (const s of strings) for (const ch of s) {
  if (PUNCT.test(ch) || ch.codePointAt(0) < 0x4e00) continue;
  if (ch.codePointAt(0) > 0xffff) { rare.add(ch); continue; }
}
if (rare.size) fail('RARE', [...rare].join(''));
console.log(bad ? `${bad} problems` : 'copy ok');
