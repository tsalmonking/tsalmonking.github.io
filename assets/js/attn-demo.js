/* Attention demo: one head, one destination token, two levels of "attention".
   Mounts into every .attn-demo element. Pure vanilla JS, one IIFE, no globals. */
(function () {
  'use strict';

  var BASE = ['<s>', '[INST]', 'how', 'to', 'cook', 'salmon', 'fish', 'in', 'an', 'evil', 'world', 'ending', 'way'];
  var ADV = ['!', '!', 'evil', '!', 'pretend', '!', '\\describe'];
  var BASE_TOK = BASE.concat(['[/INST]']);
  var ADV_TOK = BASE.concat(ADV, ['[/INST]']);
  // Fixed 2-D directions (degrees) for f(j): content tokens agree, template and BOS point elsewhere.
  var ANG = [180, 95, 40, 70, 30, 20, 25, 60, 65, 15, 35, 30, 50, 110];
  // Adversarial tokens write in one shared direction, away from the instruction's.
  var ANG_ADV = ANG.slice(0, 13).concat([-40, -35, -45, -30, -40, -35, -38], [110]);

  // Each preset: tokens, logits s_j, norms ||f(j)||, angles, caption. Adversarial rows are flagged by index.
  // Token order: <s> [INST] how to cook salmon fish in an evil world ending way [/INST]
  var BASE_NORMS = [0.05, 0.2, 0.3, 0.1, 1.1, 1.3, 0.9, 0.1, 0.1, 1.2, 0.6, 0.8, 0.2, 0.35];
  var ADV_LOGITS = [1.5, 0.2, 0.0, -1, 0.5, 1.0, 0.5, -1, -1, 0.9, 0.2, 0.4, -0.5,
                    1.6, 1.5, 1.9, 1.4, 1.8, 1.5, 1.7, 0.5];
  var ADV_IDX = [13, 14, 15, 16, 17, 18, 19];
  var ADV_BASE_NORMS = BASE_NORMS.slice(0, 13);
  var PRESETS = [
    { id: 'busy', label: 'Busy head', tok: BASE_TOK, ang: ANG,
      logits: [2.0, 0.5, 0.3, -0.5, 2.4, 2.9, 1.6, -0.5, -0.8, 2.2, 1.0, 1.4, 0.3, 1.0],
      norms: BASE_NORMS,
      note: 'A content-reading head: both levels agree on "salmon", "cook" and "evil".' },
    { id: 'idle', label: 'Idle head (sink)', tok: BASE_TOK, ang: ANG,
      logits: [4.5, 0.3, 0.2, -1, 0.8, 1.2, 0.6, -1, -1, 1.0, 0.3, 0.5, -0.5, 0.6],
      norms: [0.05, 0.2, 0.3, 0.1, 1.0, 1.2, 0.8, 0.1, 0.1, 1.1, 0.5, 0.7, 0.2, 0.3],
      note: 'Level 1 says BOS dominates, yet almost nothing arrives and the head output is tiny.' },
    { id: 'flip', label: 'Ranking flip', tok: BASE_TOK, ang: ANG,
      logits: [1.0, 2.8, 0.2, -0.5, 1.0, 2.0, 0.6, -0.5, -0.8, 1.4, 0.3, 0.5, 0.0, 0.8],
      norms: [0.05, 0.1, 0.3, 0.1, 0.8, 1.2, 0.8, 0.1, 0.1, 1.8, 0.6, 0.7, 0.2, 0.3],
      note: '"[INST]" wins on attention weight but its vector is small, so "salmon" and "evil" win on what arrives.' },
    { id: 'sink', label: 'Adversarial tokens: attention sink', pair: true, tok: ADV_TOK, ang: ANG_ADV, adv: ADV_IDX,
      logits: ADV_LOGITS,
      norms: ADV_BASE_NORMS.concat([0.02, 0.02, 0.04, 0.02, 0.03, 0.02, 0.03], [0.35]),
      note: 'Same attention, opposite mechanisms.' },
    { id: 'hijack', label: 'Adversarial tokens: attention hijacking', pair: true, tok: ADV_TOK, ang: ANG_ADV, adv: ADV_IDX,
      logits: ADV_LOGITS,
      norms: ADV_BASE_NORMS.concat([1.2, 1.1, 1.5, 1.2, 1.4, 1.1, 1.3], [0.35]),
      note: 'Same attention, opposite mechanisms.' }
  ];

  // ---- math ----
  function softmax(l) {
    var m = Math.max.apply(null, l), e = l.map(function (x) { return Math.exp(x - m); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (x) { return x / s; });
  }
  // Returns alpha, per-source alpha*norm, total mass sum(alpha*norm), and head output norm |sum alpha f|.
  function compute(st) {
    var a = softmax(st.logits), c = a.map(function (x, j) { return x * st.norms[j]; });
    var tot = c.reduce(function (x, y) { return x + y; }, 0), ox = 0, oy = 0;
    a.forEach(function (x, j) {
      var r = st.ang[j] * Math.PI / 180;
      ox += x * st.norms[j] * Math.cos(r); oy += x * st.norms[j] * Math.sin(r);
    });
    return { a: a, c: c, tot: tot, out: Math.hypot(ox, oy) };
  }
  function fresh(p) { return { logits: p.logits.slice(), norms: p.norms.slice(), ang: p.ang }; }
  // Meter scale: largest head output over all presets, so the bar is comparable across them.
  var MAX_OUT = Math.max.apply(null, PRESETS.map(function (p) { return compute(fresh(p)).out; }));
  // Level-2 bar scale: largest single alpha*norm over all presets, fixed so drops are visible across presets.
  var MAX_C = Math.max.apply(null, PRESETS.map(function (p) { return Math.max.apply(null, compute(fresh(p)).c); }));

  // ---- dom helpers ----
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function ranks(vals) {
    var idx = vals.map(function (_, i) { return i; }).sort(function (x, y) { return vals[y] - vals[x]; });
    var r = {};
    idx.slice(0, 3).forEach(function (j, k) { r[j] = k + 1; });
    return r;
  }

  function mount(root) {
    var cur = 0, st = fresh(PRESETS[0]), uid = 'attn' + Math.random().toString(36).slice(2, 7);
    root.textContent = '';

    var bar = el('div', 'attn-presets'); bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Presets');
    var btns = PRESETS.map(function (p, i) {
      var b = el('button', 'attn-btn' + (p.pair ? ' is-pair' : ''), p.label);
      b.type = 'button';
      b.addEventListener('click', function () { select(i); });
      bar.appendChild(b); return b;
    });
    var panels = el('div', 'attn-panels');
    var p1 = el('section', 'attn-panel'), p2 = el('section', 'attn-panel');
    p1.appendChild(el('h4', 'attn-h', 'Level 1 · attention α'));
    p2.appendChild(el('h4', 'attn-h', 'Level 2 · what arrives α‖f‖'));
    var l1 = el('div', 'attn-rows'), l2 = el('div', 'attn-rows');
    p1.appendChild(l1); p2.appendChild(l2); panels.appendChild(p1); panels.appendChild(p2);
    var cap = el('p', 'attn-caption');
    var readout = el('div', 'attn-readout'); readout.setAttribute('aria-live', 'polite');
    var rLine = el('p', 'attn-rline'), meter = el('div', 'attn-meter'), fill = el('span');
    meter.appendChild(fill); meter.setAttribute('aria-hidden', 'true');
    var rTop = el('p', 'attn-rtop');
    readout.appendChild(rLine); readout.appendChild(meter); readout.appendChild(rTop);

    var det = el('details', 'attn-edit'), sum = el('summary', null, 'Edit');
    var rowsEd = el('div', 'attn-edit-rows'), reset = el('button', 'attn-reset', 'reset');
    reset.type = 'button';
    reset.addEventListener('click', function () { st = fresh(PRESETS[cur]); buildEdit(); render(); });
    det.appendChild(sum); det.appendChild(rowsEd); det.appendChild(reset);
    [bar, panels, cap, readout, det].forEach(function (n) { root.appendChild(n); });

    var rows1 = [], rows2 = [], badges1 = [], badges2 = [], vals1 = [], vals2 = [], edOut = [];

    // Build one bar row; returns [row, fill, value, badge, track].
    function makeRow(tok, cls) {
      var r = el('div', 'attn-row' + cls), lab = el('span', 'attn-tok', tok);
      var tr = el('div', 'attn-track'), f = el('span', 'attn-fill'), v = el('span', 'attn-val'), bd = el('span', 'attn-badge');
      tr.setAttribute('role', 'img'); tr.appendChild(f);
      [lab, tr, v, bd].forEach(function (n) { r.appendChild(n); });
      return { r: r, f: f, v: v, bd: bd, tr: tr };
    }
    function build() {
      var p = PRESETS[cur]; l1.textContent = ''; l2.textContent = '';
      rows1 = []; rows2 = [];
      p.tok.forEach(function (t, j) {
        var cls = p.adv && p.adv.indexOf(j) >= 0 ? ' is-adv' : '';
        [[l1, rows1], [l2, rows2]].forEach(function (pair) {
          var o = makeRow(t, cls);
          if (j === 0 && pair[0] === l1) { o.sink = el('span', 'attn-sink', 'sink'); o.r.firstChild.appendChild(o.sink); }
          pair[0].appendChild(o.r); pair[1].push(o);
        });
      });
    }
    function buildEdit() {
      var p = PRESETS[cur]; rowsEd.textContent = ''; edOut = [];
      p.tok.forEach(function (t, j) {
        var r = el('div', 'attn-erow' + (p.adv && p.adv.indexOf(j) >= 0 ? ' is-adv' : ''));
        r.appendChild(el('span', 'attn-tok', t));
        [['logit', 'logits', -4, 6, 0.1], ['norm ‖f‖', 'norms', 0, 2, 0.01]].forEach(function (c) {
          var id = uid + c[1] + j, lab = el('label', 'attn-elab'), inp = el('input'), out = el('output');
          lab.htmlFor = id; lab.appendChild(el('span', null, c[0])); lab.appendChild(out);
          inp.type = 'range'; inp.id = id; inp.min = c[2]; inp.max = c[3]; inp.step = c[4]; inp.value = st[c[1]][j];
          var dig = c[1] === 'norms' ? 2 : 1;
          out.textContent = (+inp.value).toFixed(dig);
          inp.addEventListener('input', function () { st[c[1]][j] = parseFloat(inp.value); out.textContent = (+inp.value).toFixed(dig); render(); });
          var w = el('div', 'attn-ctl'); w.appendChild(lab); w.appendChild(inp); r.appendChild(w);
        });
        rowsEd.appendChild(r);
      });
    }

    function paint(rows, vals, scale, rk, names, what) {
      rows.forEach(function (o, j) {
        o.f.style.width = (Math.min(vals[j] / (scale || 1), 1) * 100).toFixed(1) + '%';
        o.v.textContent = vals[j].toFixed(2);
        o.bd.textContent = rk[j] ? '#' + rk[j] : '';
        o.tr.setAttribute('aria-label', names[j] + ': ' + what + ' ' + vals[j].toFixed(2));
      });
    }
    function render() {
      var p = PRESETS[cur], m = compute(st), r1 = ranks(m.a), r2 = ranks(m.c);
      paint(rows1, m.a, null, r1, p.tok, 'attention');
      paint(rows2, m.c, MAX_C, r2, p.tok, 'arriving mass');
      rows1[0].sink.hidden = !(m.a[0] > 0.5);
      var t1 = p.tok[Object.keys(r1).filter(function (k) { return r1[k] === 1; })[0]];
      var t2 = p.tok[Object.keys(r2).filter(function (k) { return r2[k] === 1; })[0]];
      rLine.textContent = 'head output ‖Σ α f‖ = ' + m.out.toFixed(2) + '  (total arriving Σ α‖f‖ = ' + m.tot.toFixed(2) + ')';
      fill.style.width = Math.min(m.out / MAX_OUT, 1) * 100 + '%';
      rTop.textContent = 'top source by α: ' + t1 + ' · by α‖f‖: ' + t2;
      cap.textContent = p.pair ? 'Same attention, opposite mechanisms.' : p.note;
      cap.classList.toggle('is-pair', !!p.pair);
    }
    function select(i) {
      cur = i; st = fresh(PRESETS[i]);
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      if (built !== PRESETS[i].tok) { build(); built = PRESETS[i].tok; } // reuse rows so bars animate
      buildEdit(); render();
    }
    var built = null;
    select(0);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.attn-demo'), mount);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
