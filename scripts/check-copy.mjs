// 核对 js/copy.js 里引用的原文是否真的出现在正文中
import fs from 'node:fs';
import { CHAPTERS, MARGIN, AFTER, INTRO2, FRONT_SCENES } from '../js/copy.js';
const data = JSON.parse(fs.readFileSync(new URL('../content/zhuangzi.json', import.meta.url)));
const text = (n) => data[n - 1].paragraphs.join('');
const all = data.map(c => c.paragraphs.join('')).join('');
let bad = 0;
for (const [n, c] of Object.entries(CHAPTERS)) {
  if (!text(+n).includes(c.line)) { console.log('LINE', n, c.line); bad++; }
  for (const [k, v] of Object.entries(c.notes)) if (!text(+n).includes(v.q)) { console.log('NOTE', n, k, v.q); bad++; }
}
for (const [n, key] of MARGIN) if (!text(n).includes(key)) { console.log('MARGIN', n, key); bad++; }
for (const q of [...AFTER.paras.join('').matchAll(/「(.+?)」/g)].map(m => m[1]).concat([...INTRO2.tail.matchAll(/「(.+?)」/g)].map(m => m[1]), FRONT_SCENES.end.notes.die.q))
  if (!all.includes(q.replace(/。$/, ''))) { console.log('QUOTE', q); bad++; }
console.log(bad ? `${bad} problems` : 'all quotes found');
