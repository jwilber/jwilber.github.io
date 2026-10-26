/* Step classes and derivation of decision steps from an exported run (client side, no extra data).
 * Sources, in order of preference: run.calls (verified transcript tool calls, dated), else trace actions
 * + ledger entries (field actions, soil tests, harvests, rejected calls). */
(function () {
  'use strict';
  const A = (window.AGRI = window.AGRI || {});

  // fixed vertical order and colours (consistent with the replay icons)
  const CLASSES = [
    { id: 'SENSE', label: 'Sense', color: '#7a3dd6', tools: ['soil_test', 'get_forecast', 'get_observation', 'get_history'], desc: 'soil_test, get_forecast, get_observation, get_history' },
    { id: 'PLAN', label: 'Plan', color: '#5b7fa6', tools: ['write_notes'], desc: 'write_notes' },
    { id: 'SOW', label: 'Sow', color: '#2d7a2d', tools: ['plant'], desc: 'plant' },
    { id: 'FEED', label: 'Feed', color: '#b07f10', tools: ['fertilize'], desc: 'fertilize (size = kg N/ha)' },
    { id: 'WATER', label: 'Water', color: '#1e7fe0', tools: ['irrigate'], desc: 'irrigate (size = mm)' },
    { id: 'HARVEST', label: 'Harvest', color: '#c0392b', tools: ['harvest'], desc: 'harvest (label = revenue)' },
    { id: 'CONTROL', label: 'Control', color: '#8a8070', tools: ['advance'], desc: 'advance (width = periods skipped)' },
    { id: 'REJECTED', label: 'Rejected', color: '#e0392b', tools: [], desc: 'any errored call (hollow)' },
  ];
  const CLS = Object.fromEntries(CLASSES.map((c, i) => [c.id, Object.assign({ pos: i }, c)]));
  const CODE_TOOL = { T: 'soil_test', F: 'get_forecast', O: 'get_observation', H: 'get_history', N: 'write_notes', P: 'plant', Z: 'fertilize', W: 'irrigate', V: 'harvest', A: 'advance', I: 'get_scenario_info' };
  const TOOL_CLASS = {}; CLASSES.forEach(c => c.tools.forEach(t => { TOOL_CLASS[t] = c.id; }));
  TOOL_CLASS.get_scenario_info = 'SENSE';
  A.STEP_CLASSES = CLASSES; A.STEP = CLS;

  const money = v => A.usd(v);
  function parseHarvest(note) { const m = /^(?:episode end: )?(\w+) (\d+) kg\/ha/.exec(note || ''); return m ? { crop: m[1], kg: +m[2] } : null; }

  /* ---------- crop / stage segments per field, for background bands and crop strips */
  function stageOf(crop, dvs) {
    if (!crop) return null;
    if (dvs == null || dvs >= 1.95) return 'mature';
    if (dvs < 0) return 'sown';
    if (dvs < 0.95) return 'vegetative';
    if (dvs < 1.45) return 'flowering';
    return 'filling';
  }
  A.STAGE_SHADE = { sown: 0.18, vegetative: 0.35, flowering: 0.6, filling: 0.5, mature: 0.75, stubble: 0.15 };
  function cropSegments(f) {
    const segs = []; let cur = null; let gone = -1;
    for (let i = 0; i < f.n; i++) {
      const crop = f.crop[i]; let st = stageOf(crop, f.dvs[i]);
      if (!crop) { if (i > 0 && f.crop[i - 1]) gone = i; if (gone >= 0 && i - gone < 60) { st = 'stubble'; } }
      const key = (crop || (st === 'stubble' ? f.crop[gone - 1] + '*' : '')) + '|' + (st || '');
      if (!cur || cur.key !== key) { cur = { key, crop: crop || (st === 'stubble' ? f.crop[gone - 1] : null), stage: st, from: i, to: i }; segs.push(cur); }
      cur.to = i;
    }
    return segs.filter(s => s.stage);
  }
  // seasons: one entry per sowing on a field -> crop grown (for the crop-sequence strip)
  function cropSequence(run) {
    const out = {};
    for (const [fid, f] of Object.entries(run.fields)) {
      const seq = [];
      for (let i = 0; i < f.n; i++) if (f.crop[i] && (i === 0 || !f.crop[i - 1])) { let j = i; while (j + 1 < f.n && f.crop[j + 1]) j++; seq.push({ crop: f.crop[i], from: i, to: j, year: +A.addDays(f.start, i).slice(0, 4) }); }
      out[fid] = seq;
    }
    return out;
  }

  /* ---------- cash per day from the ledger */
  function cashSeries(run, card) {
    const n = run.weather.rain.length; const start = run.weather.start;
    const arr = new Float64Array(n); let c = card.cash.initial; let k = 0;
    const led = run.ledger.map(e => ({ d: A.dayDiff(start, e.date), usd: e.usd })).sort((a, b) => a.d - b.d);
    for (let i = 0; i < n; i++) { while (k < led.length && led[k].d <= i) { c += led[k].usd; k++; } arr[i] = c; }
    return arr;
  }

  /* ---------- steps */
  function deriveSteps(run, card) {
    const start = run.weather.start, n = run.weather.rain.length;
    const interval = card.decision_interval_days || 7;
    const dayOf = d => A.dayDiff(start, d);
    const steps = [];
    const fieldCard = fid => card.fields.find(f => f.field_id === fid) || {};
    let source;
    if (run.calls && run.calls.length) {
      source = 'transcript';
      run.calls.forEach((c, k) => {
        const tool = CODE_TOOL[c.t] || c.t;
        if (tool === 'get_scenario_info') return;
        const cls = c.e ? 'REJECTED' : (TOOL_CLASS[tool] || 'SENSE');
        const s = { k, day: Math.max(0, Math.min(n - 1, c.d)), stop: c.s, cls, baseCls: TOOL_CLASS[tool] || 'SENSE', tool, field: c.f || null, v: c.v, err: !!c.e, r: c.r || null, size: 1 };
        if (tool === 'fertilize') { s.size = Math.max(0.5, Math.min(2, (+c.v || 0) / 80)); s.label = `${Math.round(+c.v || 0)} kg N/ha`; }
        else if (tool === 'irrigate') { s.size = Math.max(0.5, Math.min(2, (+c.v || 0) / 30)); s.label = `${Math.round(+c.v || 0)} mm`; }
        else if (tool === 'plant') s.label = `${A.cropLabel(c.v || '')}`;
        else if (tool === 'advance') { s.width = +c.v || 1; s.label = `advance ${c.v || 1}×${interval} d`; }
        else if (tool === 'get_forecast') s.label = `forecast ${c.v || 7} d`;
        else if (tool === 'write_notes') s.label = `notes (${c.v || 0} chars)`;
        else if (tool === 'soil_test') s.label = c.r ? `soil test: ${c.r}` : 'soil test';
        else if (tool === 'harvest') s.label = 'harvest';
        else s.label = tool.replace(/_/g, ' ');
        if (s.err) s.label = `${tool} rejected: ${c.r || ''}`;
        steps.push(s);
      });
      // harvest revenue labels from the ledger (booked the day the queued harvest runs)
      const harvests = run.ledger.filter(e => e.kind === 'harvest' && !/^episode end/.test(e.note)).map(e => ({ d: dayOf(e.date), e }));
      for (const s of steps.filter(x => x.tool === 'harvest' && !x.err)) {
        const h = harvests.find(h => h.d >= s.day && h.d <= s.day + 8 && h.e.field === s.field && !h.used);
        if (h) { h.used = true; const p = parseHarvest(h.e.note); s.revenue = h.e.usd; s.crop = p && p.crop; s.kg = p && p.kg; s.label = `harvest ${p ? A.cropLabel(p.crop).toLowerCase() + ' ' + p.kg.toLocaleString('en-US') + ' kg/ha' : ''} → ${money(h.e.usd)}`; s.early = /before maturity/.test(h.e.note); }
      }
    } else {
      source = 'trace';
      let k = 0;
      for (const e of run.ledger) {
        const d = Math.max(0, Math.min(n - 1, dayOf(e.date)));
        const f = run.fields[e.field];
        let m;
        if (e.kind === 'planting') { const cropM = /plant (\w+)/.exec(e.note); steps.push({ k: k++, day: d, cls: 'SOW', baseCls: 'SOW', tool: 'plant', field: e.field, v: cropM && cropM[1], label: A.cropLabel(cropM ? cropM[1] : ''), size: 1 }); }
        else if (e.kind === 'fertilizer' && (m = /([\d.]+) kg/.exec(e.note))) steps.push({ k: k++, day: d, cls: 'FEED', baseCls: 'FEED', tool: 'fertilize', field: e.field, v: +m[1], label: `${Math.round(+m[1])} kg N/ha`, size: Math.max(0.5, Math.min(2, +m[1] / 80)) });
        else if (e.kind === 'irrigation' && (m = /([\d.]+) mm/.exec(e.note))) steps.push({ k: k++, day: d, cls: 'WATER', baseCls: 'WATER', tool: 'irrigate', field: e.field, v: +m[1], label: `${Math.round(+m[1])} mm`, size: Math.max(0.5, Math.min(2, +m[1] / 30)) });
        else if (e.kind === 'soil_test') steps.push({ k: k++, day: d, cls: 'SENSE', baseCls: 'SENSE', tool: 'soil_test', field: e.field, r: f ? `N ${Math.round(f.navail[d] ?? 0)} kg/ha, moisture ${f.sm[d] != null ? f.sm[d].toFixed(2) : '–'}` : null, label: f ? `soil test: N ${Math.round(f.navail[d] ?? 0)} kg/ha, moisture ${f.sm[d] != null ? f.sm[d].toFixed(2) : '–'}` : 'soil test', size: 1 });
        else if (e.kind === 'harvest' && !/^episode end/.test(e.note)) { const p = parseHarvest(e.note); steps.push({ k: k++, day: Math.max(0, d - 1), cls: 'HARVEST', baseCls: 'HARVEST', tool: 'harvest', field: e.field, revenue: e.usd, crop: p && p.crop, kg: p && p.kg, early: /before maturity/.test(e.note), label: `harvest ${p ? A.cropLabel(p.crop).toLowerCase() + ' ' + p.kg.toLocaleString('en-US') + ' kg/ha' : ''} → ${money(e.usd)}`, size: 1 }); }
        else if (e.kind === 'rejected') { const tool = (e.note.split(':')[0] || 'call').trim(); steps.push({ k: k++, day: d, cls: 'REJECTED', baseCls: TOOL_CLASS[tool] || 'SENSE', tool, field: e.field, err: true, r: e.note, label: `${e.note}`.slice(0, 120), size: 1 }); }
      }
      steps.sort((a, b) => a.day - b.day || a.k - b.k);
      steps.forEach((s, i) => { s.k = i; s.stop = Math.floor(s.day / interval) + 1; });
    }
    // stops: group steps; a stop's advance = sum of advance periods (transcript) or 1 (inferred)
    const stopsMap = new Map();
    for (const s of steps) { if (!stopsMap.has(s.stop)) stopsMap.set(s.stop, { idx: s.stop, day: s.day, steps: [], advance: 0 }); const st = stopsMap.get(s.stop); st.steps.push(s); st.day = Math.min(st.day, s.day); if (s.tool === 'advance' && !s.err) st.advance += s.width || 1; }
    const stops = Array.from(stopsMap.values()).sort((a, b) => a.idx - b.idx);
    stops.forEach(st => { if (!st.advance) { st.advance = 1; st.advanceInferred = true; } st.steps.sort((a, b) => a.k - b.k); });
    const counts = {}; CLASSES.forEach(c => { counts[c.id] = 0; }); steps.forEach(s => { counts[s.cls]++; });
    return { steps, stops, source, counts, n, start, interval, segments: Object.fromEntries(Object.entries(run.fields).map(([fid, f]) => [fid, cropSegments(f)])), crops: cropSequence(run), cash: cashSeries(run, card) };
  }

  /* ---------- transition matrix between consecutive steps (for fingerprints) */
  function transitions(stepLists) {
    const m = {}; const counts = {};
    CLASSES.forEach(a => { counts[a.id] = 0; CLASSES.forEach(b => { m[a.id + '>' + b.id] = 0; }); });
    for (const steps of stepLists) {
      for (let i = 0; i < steps.length; i++) { counts[steps[i].cls]++; if (i > 0) m[steps[i - 1].cls + '>' + steps[i].cls]++; }
    }
    return { m, counts };
  }


  /* ---------- shared SVG renderers: fingerprint ring + crop sequence strip */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const txt = (parent, x, y, s, cls, attrs) => { const t = el('text', Object.assign({ x, y, class: cls }, attrs || {}), parent); t.textContent = s; return t; };
  const CL = CLASSES;
  const cropColor = c => { const k = (A.CROP_COLORS[c] || { leaf: [90, 150, 90] }).leaf; return `rgb(${k.join(',')})`; };
  A.fingerprintSvg = function (tr, full) {
    const W = 220, H = 200, cx = 110, cy = 100, R = 70;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    const pos = CL.map((c, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / CL.length; return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
    const maxC = Math.max(1, ...Object.values(tr.counts)); let maxE = 1; for (const k in tr.m) { const [a, b] = k.split('>'); if (a !== b) maxE = Math.max(maxE, tr.m[k]); }
    for (const k in tr.m) {
      const v = tr.m[k]; if (!v) continue; const [a, b] = k.split('>'); const i = CLS[a].pos, j = CLS[b].pos;
      if (i === j) continue;
      const p = pos[i], q = pos[j]; const w = 0.6 + 6 * Math.sqrt(v / maxE);
      // curve bent to one side so A->B and B->A are distinguishable
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2; const dx = q.x - p.x, dy = q.y - p.y; const L = Math.hypot(dx, dy) || 1; const off = 14;
      const c1x = mx - dy / L * off, c1y = my + dx / L * off;
      el('path', { d: `M${p.x},${p.y} Q${c1x},${c1y} ${q.x},${q.y}`, fill: 'none', stroke: CLS[a].color, 'stroke-width': w.toFixed(1), opacity: .6, 'stroke-linecap': 'round' }, svg);
      // arrow head near the target
      const t = 0.85; const ax = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * c1x + t * t * q.x, ay = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * c1y + t * t * q.y;
      el('circle', { cx: ax, cy: ay, r: Math.min(3, 1 + w / 3), fill: CLS[a].color, opacity: .8 }, svg);
    }
    CL.forEach((c, i) => {
      const cnt = tr.counts[c.id]; const r = 4 + 11 * Math.sqrt(cnt / maxC); const p = pos[i];
      const self = tr.m[c.id + '>' + c.id] || 0;
      if (self) el('circle', { cx: p.x, cy: p.y, r: r + 3, fill: 'none', stroke: c.color, 'stroke-width': Math.min(4, 1 + 3 * self / maxE), opacity: .6 }, svg);
      const g = el('g', {}, svg);
      el('circle', { cx: p.x, cy: p.y, r, fill: c.id === 'REJECTED' ? 'none' : c.color, stroke: c.color, 'stroke-width': 1.5, opacity: cnt ? 1 : .25 }, g);
      const lx = cx + (R + 22) * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / CL.length), ly = cy + (R + 22) * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / CL.length);
      txt(svg, lx, ly + 4, `${c.label}${cnt ? ' ' + cnt : ''}`, 'axis', { 'text-anchor': 'middle', fill: c.color, 'font-weight': 600, opacity: (!full && ['SENSE', 'PLAN', 'CONTROL'].includes(c.id) && !cnt) ? .4 : 1 });
      const title = el('title', {}, g); title.textContent = `${c.label}: ${cnt} calls${self ? `, ${self} repeated in a row` : ''}`;
    });
    return svg;
  }
  A.cropStrip = function (card, D) {
    const wrap = document.createElement('div'); wrap.className = 'cropstrip';
    const years = []; for (let y = +card.start.slice(0, 4); y <= +card.end.slice(0, 4); y++) years.push(y);
    for (const f of card.fields) {
      const row = document.createElement('div'); row.className = 'frow'; row.innerHTML = `<span class="fn" title="${A.esc(f.field_id)}">${A.esc(f.field_id)}</span>`;
      const seq = D.crops[f.field_id] || [];
      for (const y of years) {
        const inYear = seq.filter(s => { const sy = +A.addDays(D.start, s.from).slice(0, 4), ey = +A.addDays(D.start, s.to).slice(0, 4); return sy <= y && ey >= y && (sy === y || s.from === 0 || ey === y && sy < y && false) ; });
        const blk = document.createElement('span');
        const own = seq.filter(s => +A.addDays(D.start, s.from).slice(0, 4) === y);
        if (own.length) { blk.className = 'blk'; blk.style.background = cropColor(own[0].crop); blk.textContent = own.map(s => A.cropLabel(s.crop)).join('+'); blk.title = own.map(s => `${A.cropLabel(s.crop)} sown ${A.fmtDate(A.addDays(D.start, s.from))}`).join('; '); }
        else { blk.className = 'blk empty'; blk.textContent = y; }
        row.appendChild(blk);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }


  A.steps = { deriveSteps, transitions, cropSegments, cropSequence, cashSeries, stageOf, CODE_TOOL, TOOL_CLASS };

  /* ---------- run selection helpers for attempts */
  A.attemptsOf = function (agent, scenario) {
    return A.index().runs.filter(r => r.agent === agent && r.scenario === scenario && r.has_trace).sort((a, b) => (a.tag || '').localeCompare(b.tag || ''));
  };
  A.pickAttempt = function (agent, scenario, which) { // which: 'latest' | 'median' | 'calls' | tag
    const list = A.attemptsOf(agent, scenario); if (!list.length) return null;
    if (which === 'median') { const s = list.slice().sort((a, b) => a.profit_usd - b.profit_usd); return s[Math.floor((s.length - 1) / 2)]; }
    if (which === 'calls') return list.find(r => r.has_calls) || list.find(r => r.latest) || list[0];
    if (which && which !== 'latest' && which !== 'all') return list.find(r => r.tag === which) || list[0];
    return list.find(r => r.latest) || list[list.length - 1];
  };
})();
