// 各页插图的登记处
import { front } from './front.js';
import { inner } from './inner.js';
import { scenes as outerA } from './outer-a.js';
import { scenes as outerB } from './outer-b.js';
import { scenes as miscA } from './misc-a.js';
import { scenes as miscB } from './misc-b.js';
export const SCENES = { ...front, ...inner, ...outerA, ...outerB, ...miscA, ...miscB };
