/* 庄子 · 互动书 —— 排版、翻页与导航（无依赖） */
(function () {
  'use strict';

  var DATA_URL = 'content/zhuangzi.json';
  var STORE_KEY = 'zhuangzi-book:pos';
  var DUR = 640;
  var EASE = 'cubic-bezier(.55,.08,.3,1)';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var root = document.documentElement;
  var book = document.getElementById('book');
  var stage = document.getElementById('stage');
  var halfL = document.getElementById('half-left');
  var halfR = document.getElementById('half-right');
  var measure = document.getElementById('measure');
  var mBody = measure.querySelector('.page-body');
  var loadingEl = document.getElementById('loading');
  var btnPrev = document.getElementById('btn-prev');
  var btnNext = document.getElementById('btn-next');
  var btnToc = document.getElementById('btn-toc');
  var indicator = document.getElementById('indicator');

  var chapters = [];
  var L = null;          // 当前版式
  var pages = [];        // {type, html, a, ch, opener}
  var chapterStart = {}; // 篇号 -> 页序
  var tocIndex = 0;
  var spread = 0;
  var busy = false;
  var queued = 0;

  var OPEN = '「『（《〈“‘';
  var CLOSE = '，。、；：？！」』）》〉”’…';
  var PART_ORDER = ['内篇', '外篇', '杂篇'];

  var INTRO = [
    '《庄子》是战国时期庄周及其后学的文章汇编，今本三十三篇，分内篇、外篇、杂篇。一般认为内七篇最能代表庄子本人的思想，外篇、杂篇多出自后学的引申发挥。全书多用寓言，想象奇绝，既是哲学，也是文学。',
    '开篇《逍遥游》写鲲化为鹏，抟扶摇而上九万里；又说御风而行的列子仍「有所待」。真正的逍遥，是「至人无己，神人无功，圣人无名」，无所倚赖。《齐物论》进一步追问：是非、彼此、大小、寿夭，都是从某一角度看出的分别。若能「天地与我并生，而万物与我为一」，争辩便可以放下。',
    '《养生主》借庖丁解牛，讲顺着事物的纹理行事，「依乎天理」「以无厚入有间」，便能游刃有余。庄子说的「无为」，不是什么都不做，而是不强作妄为，让人与万物各得其性；《应帝王》中浑沌被凿七窍而死，便是对妄为的提醒。',
    '心境如何修养？《人间世》提出「心斋」：不用耳听而用心听，再进而「听之以气」，使心虚静，「唯道集虚」。《大宗师》讲「坐忘」：忘仁义，忘礼乐，乃至「堕枝体，黜聪明」，与大道相通。',
    '《齐物论》结尾，庄周梦为蝴蝶，醒来不知是庄周梦见蝴蝶，还是蝴蝶梦见庄周，这便是「物化」：生死形态的变化，不过是万物流转的一环。至于语言，《外物》说「言者所以在意，得意而忘言」，文字如捕鱼的荃，得鱼便可忘荃。',
    '读《庄子》，不必急于求解。像听老友讲故事那样慢慢读，心也就宽了。'
  ];

  var ORN = '<svg class="orn" viewBox="0 0 130 12" aria-hidden="true"><path d="M2 6c8-6 16-6 24 0s16 6 24 0 16-6 24 0 16 6 24 0 16-6 24 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="65" cy="6" r="1.6" fill="currentColor"/></svg>';

  var BUTTERFLY =
    '<svg viewBox="0 0 160 120" aria-hidden="true"><g fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M80 52C68 24 40 14 26 24c-12 9-6 30 14 36 13 4 28 0 38-4z"/>' +
    '<path d="M82 52c12-28 40-38 54-28 12 9 6 30-14 36-13 4-28 0-38-4z"/>' +
    '<path d="M78 58c-16 2-34 14-32 28 2 11 16 10 24 1 6-7 8-18 9-27z"/>' +
    '<path d="M84 58c16 2 34 14 32 28-2 11-16 10-24 1-6-7-8-18-9-27z"/>' +
    '<path d="M81 46v34" fill="none" stroke-width="3"/>' +
    '<path d="M80 47c-3-9-8-15-14-18M82 47c3-9 8-15 14-18" fill="none"/>' +
    '</g></svg>';

  var COVER_ART =
    '<svg viewBox="0 0 220 150" aria-hidden="true">' +
    '<path d="M6 140c30-6 48-22 62-44s34-34 58-30" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="2 6" stroke-linecap="round" opacity=".7"/>' +
    '<g transform="translate(112 10) rotate(14) scale(.62)">' + BUTTERFLY.replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>' +
    '</svg>';

  /* ---------- 工具 ---------- */

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cn(n) {
    var d = '〇一二三四五六七八九';
    if (n <= 10) return n === 10 ? '十' : d[n];
    if (n < 20) return '十' + d[n - 10];
    var t = Math.floor(n / 10), u = n % 10;
    return d[t] + '十' + (u ? d[u] : '');
  }

  function storeGet() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
  }
  function storeSet(v) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* 隐私模式等 */ }
  }

  function hashPage() {
    var m = /(?:^|[#&])p=(\d+)/.exec(location.hash);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ---------- 版式 ---------- */

  function computeLayout() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var two = vw >= 760 && vw / vh >= 1.05;
    var pw, ph, fs;
    if (two) {
      var aH = vh - 130, aW = vw - 120;
      ph = Math.min(aH, 900);
      pw = ph * 0.71;
      if (pw * 2 > aW) { pw = aW / 2; ph = pw / 0.71; }
      fs = clamp(Math.round(pw / 29), 15, 19);
    } else {
      var sW = vw - 40, sH = vh - 112;
      pw = Math.min(sW, 560);
      ph = Math.min(sH, pw * 1.75);
      fs = clamp(Math.round(pw / 20.5), 16, 18);
    }
    pw = Math.floor(pw);
    ph = Math.floor(ph);
    var lh = Math.round(fs * 1.9);
    var padX = two ? pw * 0.12 : Math.max(22, pw * 0.085);
    var bw = Math.floor((pw - 2 * padX) / fs) * fs;
    var padY = Math.round(Math.max(40, ph * 0.085));
    var bh = Math.max(lh * 4, Math.floor((ph - 2 * padY) / lh) * lh);
    var pt = Math.round((ph - bh) / 2);
    var pin = two ? Math.round((pw - bw) * 0.54) : Math.round((pw - bw) / 2);
    return {
      two: two, pw: pw, ph: ph, fs: fs, lh: lh, bw: bw, bh: bh, pt: pt, pin: pin,
      key: [two ? 2 : 1, pw, ph, fs].join('x')
    };
  }

  function applyLayout(l) {
    var s = root.style;
    s.setProperty('--pw', l.pw + 'px');
    s.setProperty('--ph', l.ph + 'px');
    s.setProperty('--fs', l.fs + 'px');
    s.setProperty('--lh', l.lh + 'px');
    s.setProperty('--bw', l.bw + 'px');
    s.setProperty('--bh', l.bh + 'px');
    s.setProperty('--pt', l.pt + 'px');
    s.setProperty('--pin', l.pin + 'px');
    s.setProperty('--persp', (l.two ? 2600 : 1700) + 'px');
    root.classList.toggle('two', l.two);
    root.classList.toggle('one', !l.two);
  }

  /* ---------- 排版 ---------- */

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.firstElementChild;
  }

  // 把一组块排进若干页。块：{kind:'p'|'atom', text|html, a, kwn}
  function flow(blocks, type, ch) {
    var out = [];
    var count = 0;
    mBody.innerHTML = '';
    var limit = mBody.getBoundingClientRect().top + L.bh + 0.5;
    var range = document.createRange();

    function flush() {
      if (!count) return;
      var first = mBody.firstElementChild;
      out.push({
        type: type,
        html: mBody.innerHTML,
        a: parseFloat(first.getAttribute('data-a')),
        ch: ch,
        opener: first.classList.contains('ch-head')
      });
      mBody.innerHTML = '';
      count = 0;
    }

    // 换页；若页尾是“须与下文同页”的标题，带到下一页
    function breakPage() {
      var carry = null, last = mBody.lastElementChild;
      if (last && last.hasAttribute('data-kwn') && count > 1) {
        carry = last;
        mBody.removeChild(last);
        count--;
      }
      flush();
      if (carry) { mBody.appendChild(carry); count++; }
    }

    function fits(node) { return node.getBoundingClientRect().bottom <= limit; }

    function charBottom(tn, i) {
      range.setStart(tn, i);
      range.setEnd(tn, i + 1);
      var rects = range.getClientRects();
      return rects.length ? rects[0].bottom : range.getBoundingClientRect().bottom;
    }

    blocks.forEach(function (b) {
      if (b.kind === 'atom') {
        var node = el(b.html);
        node.setAttribute('data-a', b.a);
        if (b.kwn) node.setAttribute('data-kwn', '');
        mBody.appendChild(node);
        if (!fits(node) && count > 0) {
          mBody.removeChild(node);
          breakPage();
          mBody.appendChild(node);
        }
        count++;
        return;
      }

      var text = b.text, off = 0, guard = 0;
      while (off < text.length && guard++ < 10000) {
        var p = document.createElement('p');
        if (off > 0) p.className = 'cont';
        p.setAttribute('data-a', b.a + off);
        var rest = text.slice(off);
        p.textContent = rest;
        mBody.appendChild(p);
        if (fits(p)) { count++; return; }

        // 二分查找第一个越过页底的字（只读取几何，不触发重排）
        var tn = p.firstChild, lo = 0, hi = rest.length - 1, ans = rest.length;
        while (lo <= hi) {
          var mid = (lo + hi) >> 1;
          if (charBottom(tn, mid) > limit) { ans = mid; hi = mid - 1; } else lo = mid + 1;
        }
        var n = ans;
        // 不拆开代理对，标点不落在页首，开引号不留在页尾
        if (n > 0 && n < rest.length && /[\uDC00-\uDFFF]/.test(rest[n])) n--;
        while (n > 0 && n < rest.length && CLOSE.indexOf(rest[n]) >= 0) n--;
        while (n > 0 && OPEN.indexOf(rest[n - 1]) >= 0) n--;
        if (n > 0 && /[\uD800-\uDBFF]/.test(rest[n - 1])) n--;

        if (n <= 0) {
          mBody.removeChild(p);
          if (count > 0) { breakPage(); continue; }
          n = Math.max(1, ans); // 极端情况：整页放不下一行
          mBody.appendChild(p);
        }
        p.textContent = rest.slice(0, n);
        p.classList.add('split');
        count++;
        flush();
        off += n;
      }
    });
    flush();
    range.detach && range.detach();
    return out;
  }

  function paginate() {
    var list = [];
    list.push({ type: 'cover', a: 0 });
    if (L.two) list.push({ type: 'endpaper', a: 0.5 });
    list.push({ type: 'title', a: 1 });

    // 导读
    var ib = [{ kind: 'atom', a: 2e6, html: '<div class="fm-head">导读' + ORN + '</div>' }];
    INTRO.forEach(function (t, i) { ib.push({ kind: 'p', text: t, a: 2e6 + (i + 1) * 1e4 }); });
    flow(ib, 'intro', 0).forEach(function (p) { list.push(p); });

    // 目录
    var tb = [{ kind: 'atom', a: 3e6, html: '<div class="fm-head">目录' + ORN + '</div>' }];
    var k = 1;
    PART_ORDER.forEach(function (part) {
      tb.push({ kind: 'atom', a: 3e6 + k++, kwn: true, html: '<div class="toc-part">' + part + '</div>' });
      chapters.forEach(function (c) {
        if (c.part !== part) return;
        tb.push({
          kind: 'atom', a: 3e6 + k++,
          html: '<a class="toc-item" href="#" data-jump="' + c.no + '">' +
            '<span class="toc-no">第' + cn(c.no) + '</span><span class="toc-t">' + esc(c.title) + '</span>' +
            '<span class="toc-dots"></span><span class="toc-pg" data-pg="' + c.no + '"></span></a>'
        });
      });
    });
    tocIndex = list.length;
    flow(tb, 'toc', 0).forEach(function (p) { list.push(p); });

    // 正文
    chapterStart = {};
    chapters.forEach(function (c) {
      var base = c.no * 1e7;
      var bl = [{
        kind: 'atom', a: base,
        html: '<div class="ch-head"><div class="ch-part">' + esc(c.part) + ' · 第' + cn(c.no) + '</div>' +
          '<div class="ch-title">' + esc(c.title) + '</div>' + ORN + '</div>'
      }];
      c.paragraphs.forEach(function (t, i) { bl.push({ kind: 'p', text: t, a: base + (i + 1) * 1e4 }); });
      chapterStart[c.no] = list.length;
      flow(bl, 'text', c.no).forEach(function (p) { list.push(p); });
    });

    // 封底：双页时须落在左页
    if (L.two) {
      if (list.length % 2 === 1) list.push({ type: 'blank', a: list[list.length - 1].a + 0.5 });
      list.push({ type: 'endpaper', a: 9e8 });
    }
    list.push({ type: 'backcover', a: 9e8 + 1 });

    // 回填目录页码
    list.forEach(function (p) {
      if (p.type !== 'toc') return;
      p.html = p.html
        .replace(/data-pg="(\d+)"><\/span>/g, function (m, no) {
          return 'data-pg="' + no + '">' + (chapterStart[no] + 1) + '</span>';
        })
        .replace(/href="#" data-jump="(\d+)"/g, function (m, no) {
          return 'href="#p=' + (chapterStart[no] + 1) + '" data-jump="' + no + '"';
        });
    });

    pages = list;
  }

  function indexForAnchor(a) {
    var idx = 0;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].a <= a) idx = i; else break;
    }
    return idx;
  }

  /* ---------- 渲染 ---------- */

  var COVER_HTML =
    '<div class="cover-frame"></div>' +
    '<div class="cover-foot">内篇 外篇 杂篇</div>' +
    '<div class="cover-slip"><span class="cover-title">《庄子》</span><span class="cover-author">庄周</span></div>' +
    '<div class="seal">南华</div>' +
    '<div class="cover-art">' + COVER_ART + '</div>';

  var TITLE_HTML =
    '<div class="tp">' +
    '<div class="tp-top"><div class="tp-title">庄子</div><div class="tp-author">〔战国〕庄周　著</div>' + ORN + '</div>' +
    '<div class="tp-note"><h2>出版说明</h2>' +
    '<p>正文录自维基文库《莊子》，属公有领域。</p>' +
    '<p>经 OpenCC 转为简体中文，标点从底本。</p>' +
    '<p>全书三十三篇：内篇七、外篇十五、杂篇十一。</p>' +
    '</div>' +
    '<div class="tp-foot">互动阅读本</div>' +
    '</div>';

  function chapterOf(no) {
    for (var i = 0; i < chapters.length; i++) if (chapters[i].no === no) return chapters[i];
    return null;
  }

  function pageInner(p, i, side) {
    switch (p.type) {
      case 'cover': return COVER_HTML;
      case 'backcover': return '<div class="back-art">' + BUTTERFLY + '</div>';
      case 'endpaper':
      case 'blank': return '';
      case 'title': return TITLE_HTML;
    }
    var head = '';
    if (p.type === 'text' && !p.opener) {
      var c = chapterOf(p.ch);
      var label = (L.two && side === 'left') ? '庄　子' : (c ? c.part + ' · ' + c.title : '');
      head = '<div class="run-head">' + esc(label) + '</div>';
    }
    return head + '<div class="page-body">' + p.html + '</div><div class="folio">' + (i + 1) + '</div>';
  }

  function pageEl(i, side) {
    var p = pages[i];
    var d = document.createElement('div');
    if (!p) {
      d.className = 'page page--verso side-' + side;
      d.innerHTML = '<div class="shade"></div>';
      return d;
    }
    d.className = 'page page--' + p.type + ' side-' + side;
    d.innerHTML = pageInner(p, i, side) + '<div class="shade"></div>';
    return d;
  }

  function setHalf(half, i, side) {
    while (half.firstChild) half.removeChild(half.firstChild);
    var p = i == null ? null : pages[i];
    if (!p) {
      half.classList.add('empty');
      half.removeAttribute('data-kind');
      return;
    }
    half.classList.remove('empty');
    half.setAttribute('data-kind', p.type);
    half.appendChild(pageEl(i, side));
  }

  function slotsFor(s) { return L.two ? [2 * s - 1, 2 * s] : [null, s]; }
  function spreadOf(i) { return L.two ? Math.floor((i + 1) / 2) : i; }
  function maxSpread() { return spreadOf(pages.length - 1); }

  function primaryOf(s) {
    var sl = slotsFor(s);
    if (sl[0] != null && pages[sl[0]]) return sl[0];
    return Math.min(sl[1], pages.length - 1);
  }

  function shiftFor(s) {
    if (!L.two) return 0;
    var sl = slotsFor(s);
    if (!pages[sl[0]]) return -L.pw / 2;
    if (!pages[sl[1]]) return L.pw / 2;
    return 0;
  }

  function setShift(s) {
    book.style.setProperty('--shift', shiftFor(s) + 'px');
    var sl = slotsFor(s);
    var closed = !L.two
      ? (pages[s] && (pages[s].type === 'cover' || pages[s].type === 'backcover'))
      : (!pages[sl[0]] || !pages[sl[1]]);
    book.classList.toggle('closed', !!closed);
  }

  function updateStacks(s) {
    var n = pages.length;
    var sl = slotsFor(s);
    var max = L.two ? 12 : 8;
    var done = clamp((sl[1] + 0.5) / n, 0, 1);
    var l = L.two ? Math.max(2, Math.round(max * done)) : 0;
    var r = Math.max(2, Math.round(max * (1 - done)));
    book.style.setProperty('--thL', l + 'px');
    book.style.setProperty('--thR', r + 'px');
  }

  var LABELS = { cover: '封面', endpaper: '环衬', title: '扉页', intro: '导读', toc: '目录', blank: '', backcover: '封底' };

  function updateUI() {
    var sl = slotsFor(spread);
    var shown = sl.filter(function (i) { return i != null && pages[i]; });
    var p = pages[shown[shown.length - 1]] || pages[0];
    var label = p.type === 'text' ? chapterOf(p.ch).title : (LABELS[p.type] || '');
    if (p.type === 'blank' || p.type === 'endpaper') {
      var other = pages[shown[0]];
      if (other && other.type === 'text') label = chapterOf(other.ch).title;
    }
    var nums = shown.map(function (i) { return i + 1; }).join('–');
    indicator.textContent = (label ? label + ' · ' : '') + nums + ' / ' + pages.length;
    btnPrev.disabled = spread <= 0;
    btnNext.disabled = spread >= maxSpread();
  }

  function persist() {
    var i = primaryOf(spread);
    storeSet({ p: i, a: pages[i].a });
    var h = '#p=' + (i + 1);
    if (location.hash !== h) {
      try { history.replaceState(null, '', h); } catch (e) { /* file:// 等 */ }
    }
  }

  function render() {
    var sl = slotsFor(spread);
    if (L.two) setHalf(halfL, sl[0], 'left');
    setHalf(halfR, sl[1], 'right');
    setShift(spread);
    updateStacks(spread);
    updateUI();
    persist();
  }

  /* ---------- 翻页 ---------- */

  function face(cls) {
    var f = document.createElement('div');
    f.className = 'face ' + cls;
    return f;
  }

  function shadeFrames(from, to, front) {
    var fr = [];
    for (var k = 0; k <= 8; k++) {
      var t = k / 8;
      var ang = Math.abs(from + (to - from) * t);
      var v = front ? Math.min(1, ang / 90) : Math.min(1, (180 - ang) / 90);
      fr.push({ opacity: (v * 0.9).toFixed(3), offset: t });
    }
    return fr;
  }

  function go(dir) {
    if (!pages.length) return;
    if (busy) { queued = clamp(queued + dir, -4, 4); return; }
    var target = spread + dir;
    if (target < 0 || target > maxSpread()) return;

    if (reduceMotion) { spread = target; render(); return; }

    busy = true;
    var dur = queued ? DUR * 0.7 : DUR;
    var leaf = document.createElement('div');
    var front = face('face--front');
    var back = face('face--back');
    var from, to, revealed = null, covered = null, deferred = null;
    var fadeBack = 0; // 单页：背面淡出(1)/淡入(-1)
    var cur = slotsFor(spread), nxt = slotsFor(target);

    if (L.two) {
      if (dir > 0) {
        if (pages[nxt[1]]) setHalf(halfR, nxt[1], 'right'); else deferred = function () {};
        leaf.className = 'leaf leaf--right';
        front.appendChild(pageEl(cur[1], 'right'));
        back.appendChild(pageEl(nxt[0], 'left'));
        from = 0; to = -180;
        revealed = halfR; covered = halfL;
      } else {
        if (pages[nxt[0]]) setHalf(halfL, nxt[0], 'left'); else deferred = function () {};
        leaf.className = 'leaf leaf--left';
        front.appendChild(pageEl(cur[0], 'left'));
        back.appendChild(pageEl(nxt[1], 'right'));
        from = 0; to = 180;
        revealed = halfL; covered = halfR;
      }
    } else {
      leaf.className = 'leaf leaf--right';
      back.appendChild(pageEl(-1, 'left'));
      if (dir > 0) {
        setHalf(halfR, target, 'right');
        front.appendChild(pageEl(spread, 'right'));
        from = 0; to = -180; fadeBack = 1;
        revealed = halfR;
      } else {
        front.appendChild(pageEl(target, 'right'));
        from = -180; to = 0; fadeBack = -1;
        covered = halfR;
      }
    }

    var fs1 = document.createElement('div'); fs1.className = 'fshade'; front.appendChild(fs1);
    var fs2 = document.createElement('div'); fs2.className = 'fshade'; back.appendChild(fs2);
    leaf.appendChild(front);
    leaf.appendChild(back);
    leaf.style.transform = 'rotateY(' + from + 'deg)';
    book.appendChild(leaf);

    setShift(target);
    if (!deferred) updateStacks(target);

    var opts = { duration: dur, easing: EASE, fill: 'forwards' };
    var anims = [];
    anims.push(leaf.animate([{ transform: 'rotateY(' + from + 'deg)' }, { transform: 'rotateY(' + to + 'deg)' }], opts));
    anims.push(fs1.animate(shadeFrames(from, to, true), opts));
    anims.push(fs2.animate(shadeFrames(from, to, false), opts));
    if (fadeBack === 1) anims.push(back.animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], opts));
    if (fadeBack === -1) anims.push(back.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1 }], opts));

    var rs = revealed && revealed.querySelector('.page > .shade');
    if (rs) anims.push(rs.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.25 }, { opacity: 0.2, offset: 0.65 }, { opacity: 0 }], opts));
    var cs = covered && covered.querySelector('.page > .shade');
    if (cs) anims.push(cs.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0.38, offset: 0.92 }, { opacity: 0.3 }], opts));

    var done = false;
    function commit() {
      if (done) return;
      done = true;
      spread = target;
      render();
      if (leaf.parentNode) leaf.parentNode.removeChild(leaf);
      busy = false;
      if (queued) {
        var q = queued > 0 ? 1 : -1;
        queued -= q;
        go(q);
      }
    }
    Promise.all(anims.map(function (a) { return a.finished; })).then(commit, commit);
    setTimeout(commit, dur + 400); // 后台标签页等动画被挂起时的保险
  }

  function jumpTo(i) {
    if (!pages.length) return;
    i = clamp(i, 0, pages.length - 1);
    var s = spreadOf(i);
    queued = 0;
    if (busy) return;
    if (s === spread) return;
    spread = s;
    render();
    if (!reduceMotion) {
      [halfL, halfR].forEach(function (h) {
        var pg = h.firstElementChild;
        if (pg) pg.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      });
    }
  }

  /* ---------- 输入 ---------- */

  var down = null;

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
  });

  stage.addEventListener('pointercancel', function () { down = null; });

  stage.addEventListener('pointerup', function (e) {
    if (!down || down.id !== e.pointerId) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y, dt = Date.now() - down.t;
    down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 900) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) return;
    if (e.target.closest && e.target.closest('a, button')) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && String(sel).length) return;

    var rect = book.getBoundingClientRect();
    if (e.clientX < rect.left - 20 || e.clientX > rect.right + 20 ||
        e.clientY < rect.top - 20 || e.clientY > rect.bottom + 20) return;
    var h = e.target.closest && e.target.closest('.half');
    if (L.two && h) { go(h === halfL ? -1 : 1); return; }
    var hr = halfR.getBoundingClientRect();
    go(e.clientX < hr.left + hr.width / 2 ? -1 : 1);
  });

  book.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    var no = parseInt(a.getAttribute('data-jump'), 10);
    if (chapterStart[no] != null) jumpTo(chapterStart[no]);
  });

  btnPrev.addEventListener('click', function () { go(-1); });
  btnNext.addEventListener('click', function () { go(1); });
  btnToc.addEventListener('click', function () { jumpTo(tocIndex); });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': go(1); break;
      case 'ArrowLeft': case 'PageUp': go(-1); break;
      case 'Home': jumpTo(0); break;
      case 'End': jumpTo(pages.length - 1); break;
      default: return;
    }
    e.preventDefault();
  });

  window.addEventListener('hashchange', function () {
    var p = hashPage();
    if (p == null || !pages.length) return;
    if (spreadOf(clamp(p - 1, 0, pages.length - 1)) !== spread) jumpTo(p - 1);
  });

  /* ---------- 重排 ---------- */

  function relayout(anchor) {
    var nl = computeLayout();
    if (L && nl.key === L.key && pages.length) return;
    L = nl;
    applyLayout(L);
    paginate();
    spread = spreadOf(indexForAnchor(anchor));
    book.classList.add('no-anim');
    render();
    void book.offsetWidth;
    book.classList.remove('no-anim');
  }

  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (busy) { onResize(); return; }
      var a = pages.length ? pages[primaryOf(spread)].a : 0;
      relayout(a);
    }, 220);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  /* ---------- 启动 ---------- */

  function fontsReady() {
    if (!document.fonts || !document.fonts.ready) return Promise.resolve();
    // 先加载正文用到的字重，最多等 2.5 秒
    var loads = [];
    try {
      loads.push(document.fonts.load('400 18px "Noto Serif SC"', '庄子逍遥游'));
      loads.push(document.fonts.load('600 18px "Noto Serif SC"', '庄子目录'));
    } catch (e) { /* 忽略 */ }
    return Promise.race([
      Promise.all(loads).then(function () { return document.fonts.ready; }),
      new Promise(function (r) { setTimeout(r, 2500); })
    ]).catch(function () {});
  }

  function start(data) {
    chapters = data;
    L = computeLayout();
    applyLayout(L);
    paginate();

    var hp = hashPage();
    var saved = storeGet();
    var idx = 0;
    if (hp != null) idx = clamp(hp - 1, 0, pages.length - 1);
    else if (saved && typeof saved.a === 'number') idx = indexForAnchor(saved.a);
    spread = spreadOf(idx);

    book.classList.add('no-anim');
    render();
    void book.offsetWidth;
    book.classList.remove('no-anim');
    book.classList.remove('is-loading');
    loadingEl.classList.add('hidden');
  }

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      return fontsReady().then(function () { start(data); });
    })
    .catch(function (err) {
      loadingEl.textContent = '书页未能载入（' + (err && err.message ? err.message : err) + '）。请通过 HTTP 服务打开本页。';
      loadingEl.style.letterSpacing = '.08em';
    });
})();
