/* Steps page: A swimlanes (canvas), B decision DAG (SVG), C fingerprints (SVG), D deviation DAG + cash side plot (SVG). */
(function () {
  'use strict';
  const A = window.AGRI; const S = A.steps; const CL = A.STEP_CLASSES; const CLS = A.STEP;
  A.initUnits(); A.drawLogo(document.getElementById('logo'));
  const IDX = A.index(); const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const txt = (parent, x, y, s, cls, attrs) => { const t = el('text', Object.assign({ x, y, class: cls }, attrs || {}), parent); t.textContent = s; return t; };
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const state = { view: 'D', scenario: null, agents: [], attempt: 'calls', ref: 'standard_practice', runs: [], cards: null, loaded: {} };

  // ------------------------------------------------------------ legend + picker
  $('step-legend').innerHTML = '<span class="muted small">Step classes (fixed vertical order):</span>' + CL.map(c => `<span class="lg" title="${A.esc(c.desc)}"><i class="dot ${c.id === 'REJECTED' ? 'hollow' : ''}" style="background:${c.color}"></i>${c.label}</span>`).join('');
  const selS = $('sel-scenario'), selAtt = $('sel-attempt'), selRef = $('sel-ref');
  const agentSels = Array.from(document.querySelectorAll('.sel-agent'));
  selS.innerHTML = IDX.scenarios.map(s => `<option value="${s.id}">T${s.tier} · ${A.esc(s.title)}</option>`).join('');
  function agentsFor(sid) {
    const seen = new Set(); const out = [];
    for (const r of IDX.runs) if (r.scenario === sid && r.has_trace && !seen.has(r.agent)) { seen.add(r.agent); out.push(r.agent); }
    const order = IDX.leaderboard.order; out.sort((x, y) => (order.indexOf(x) + 1 || 99) - (order.indexOf(y) + 1 || 99));
    return out;
  }
  function fillAgents(sid, keep) {
    const ag = agentsFor(sid);
    const opt = a => `<option value="${A.esc(a)}">${A.esc(A.agentName(a))}${A.attemptsOf(a, sid).some(r => r.has_calls) ? ' ⚙' : ''}</option>`;
    agentSels.forEach((s, i) => { s.innerHTML = (i === 0 ? '' : '<option value="">— none —</option>') + ag.map(opt).join(''); const want = keep && keep[i]; s.value = want && ag.includes(want) ? want : (i === 0 ? (ag.find(a => a.startsWith('llm:')) || ag[0]) : ''); });
  }
  function readPicker() {
    state.scenario = selS.value; state.attempt = selAtt.value; state.ref = selRef.value;
    state.agents = agentSels.map(s => s.value).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    const u = new URL(location.href); u.searchParams.set('scenario', state.scenario); u.searchParams.set('agents', state.agents.join(',')); u.searchParams.set('attempt', state.attempt); u.searchParams.set('ref', state.ref); u.searchParams.set('view', state.view); history.replaceState(null, '', u);
  }

  // ------------------------------------------------------------ data loading
  async function loadSel(agent, scenario, which) {
    const entries = which === 'all' ? A.attemptsOf(agent, scenario) : [A.pickAttempt(agent, scenario, which)].filter(Boolean);
    const runs = await Promise.all(entries.map(A.loadRun));
    return entries.map((e, i) => ({ entry: e, run: runs[i] }));
  }
  function derived(entry, run, card) { const k = entry.key; if (!state.loaded[k]) state.loaded[k] = S.deriveSteps(run, card); return state.loaded[k]; }

  async function refresh() {
    readPicker();
    const card = A.scenario(state.scenario); state.card = card;
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== 'view-' + state.view; });
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === state.view));
    $('ref-label').style.display = state.view === 'D' ? '' : 'none';
    try {
      if (state.view === 'C') await renderFingerprints(card);
      else if (state.view === 'D') await renderDeviation(card);
      else {
        const which = state.attempt === 'all' ? 'calls' : state.attempt;
        const groups = [];
        for (const a of state.agents) { const sel = await loadSel(a, state.scenario, which); if (sel[0]) groups.push({ agent: a, entry: sel[0].entry, run: sel[0].run, D: derived(sel[0].entry, sel[0].run, card) }); }
        if (state.view === 'A') renderSwim(card, groups); else renderDag(card, groups);
      }
    } catch (err) { console.error(err); $('view-' + state.view).insertAdjacentHTML('beforeend', `<p class="neg">Could not render: ${A.esc(err.message)}</p>`); }
  }

  // ------------------------------------------------------------ shared geometry
  function scale(n, hostWidth, padL, padR) {
    const pxPerDay = Math.max(1.4, (hostWidth - padL - padR) / n);
    return { x: d => padL + d * pxPerDay, pxPerDay, width: padL + n * pxPerDay + padR };
  }
  function monthTicks(start, n) { const t = []; for (let i = 0; i < n; i++) { const d = A.addDays(start, i); if (d.slice(8) === '01') t.push({ i, m: +d.slice(5, 7), y: d.slice(0, 4) }); } return t; }
  const cropColor = c => { const k = (A.CROP_COLORS[c] || { leaf: [90, 150, 90] }).leaf; return `rgb(${k.join(',')})`; };
  const cropRGBA = (c, a) => { const k = (A.CROP_COLORS[c] || { leaf: [90, 150, 90] }).leaf; return `rgba(${k.join(',')},${a})`; };
  const attemptTag = e => e.tag ? ` · ${e.tag}` : '';
  const replayHref = (agent, day, other) => A.replayHref(state.scenario, agent, other || (agent === 'standard_practice' ? 'oracle' : 'standard_practice')) + `&day=${day}`;

  // tooltip
  const tip = $('tip');
  function showTip(evt, text) { tip.textContent = text; tip.hidden = false; moveTip(evt); }
  function moveTip(evt) { const x = Math.min(window.innerWidth - 340, evt.clientX + 14), y = Math.min(window.innerHeight - 80, evt.clientY + 14); tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function hideTip() { tip.hidden = true; }
  function stepTip(s, agent) { return `${A.agentName(agent)} · day ${s.day + 1} (${A.fmtDate(A.addDays(state.card.start, s.day))})\n${s.tool}${s.field ? ' · ' + s.field : ''}${s.v != null && s.tool !== 'write_notes' ? ' · ' + s.v : ''}\n${s.label}${s.r && !/soil test/.test(s.label) ? '\n→ ' + s.r : ''}`; }

  // ------------------------------------------------------------ A. swimlanes (canvas)
  function renderSwim(card, groups) {
    const cv = $('swim'); const host = cv.parentElement;
    const n = groups.length ? groups[0].D.n : 1; const padL = 92, padR = 16;
    const sc = scale(n, host.clientWidth || 900, padL, padR);
    const laneH = 18, fieldStripH = 7, rainH = 10, groupGap = 22, headH = 18;
    const nf = card.fields.length;
    const groupH = headH + nf * fieldStripH + 4 + CL.length * laneH + rainH + groupGap;
    const H = 26 + groups.length * groupH; const W = sc.width;
    const dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = A.isDark(); const ink = cssVar('--ink') || '#222', muted = cssVar('--muted') || '#888';
    ctx.clearRect(0, 0, W, H);
    ctx.font = '11px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
    // month axis
    for (const t of monthTicks(card.start, n)) { ctx.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'; ctx.fillRect(sc.x(t.i), 14, 1, H - 14); if (t.m % 2 === 1 || n < 400) { ctx.fillStyle = muted; ctx.fillText(A.MONTHS[t.m - 1] + (t.m === 1 ? ' ' + t.y.slice(2) : ''), sc.x(t.i) + 3, 2); } }
    groups.forEach((g, gi) => {
      const y0 = 26 + gi * groupH;
      ctx.fillStyle = ink; ctx.font = 'bold 12px Silkscreen, monospace'; ctx.fillText(A.agentName(g.agent).toUpperCase(), 4, y0);
      ctx.font = '11px Inter, system-ui, sans-serif'; ctx.fillStyle = muted; ctx.fillText(`${attemptTag(g.entry).replace(' · ', '')} ${A.usd(g.run.profit_usd)} · ${g.D.source === 'transcript' ? 'transcript tool calls' : 'trace + ledger only'}`.trim(), 4 + ctx.measureText(A.agentName(g.agent).toUpperCase()).width * 1.35 + 10, y0 + 1);
      // field bands
      let y = y0 + headH;
      card.fields.forEach((f, fi) => {
        const segs = g.D.segments[f.field_id] || [];
        ctx.fillStyle = muted; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.fillText(f.field_id.slice(0, 11), 4, y - 1);
        for (const s of segs) { ctx.fillStyle = cropRGBA(s.crop, A.STAGE_SHADE[s.stage] || 0.3); ctx.fillRect(sc.x(s.from), y, Math.max(1, sc.x(s.to + 1) - sc.x(s.from)), fieldStripH - 1); }
        y += fieldStripH;
      });
      y += 4;
      // lanes
      const laneY = {};
      CL.forEach((c, ci) => {
        const ly = y + ci * laneH; laneY[c.id] = ly;
        ctx.fillStyle = dark ? (ci % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)') : (ci % 2 ? 'rgba(0,0,0,.025)' : 'rgba(0,0,0,.05)'); ctx.fillRect(padL - 4, ly, W - padL + 4 - padR, laneH);
        ctx.fillStyle = c.color; ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.fillText(c.label, 44, ly + 3);
      });
      // crop bands faint behind lanes (first field)
      // markers
      for (const s of g.D.steps) {
        const ly = laneY[s.cls] + laneH / 2; const x = sc.x(s.day) + sc.pxPerDay / 2; const col = CLS[s.cls].color;
        if (s.cls === 'CONTROL') { ctx.fillStyle = col; ctx.globalAlpha = .7; ctx.fillRect(sc.x(s.day), ly - 4, Math.max(2, (s.width || 1) * g.D.interval * sc.pxPerDay - 1), 8); ctx.globalAlpha = 1; continue; }
        const r = 3 * (s.size || 1) + 1;
        ctx.beginPath(); ctx.arc(x, ly, r, 0, Math.PI * 2);
        if (s.cls === 'REJECTED') { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
        if (s.cls === 'HARVEST' && s.revenue != null) { ctx.fillStyle = ink; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.fillText(A.usd(s.revenue, true), x + 6, ly - 6); }
        if (s.cls === 'SOW' && s.v) { ctx.fillStyle = ink; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.fillText(A.cropLabel(s.v).toLowerCase(), x + 6, ly - 6); }
      }
      // rain ticks
      const ry = y + CL.length * laneH + 1; const rain = g.run.weather.rain;
      ctx.fillStyle = dark ? '#3d94ff' : '#1e7fe0';
      for (let i = 0; i < n; i++) { const r = rain[i] || 0; if (r >= 0.5) ctx.fillRect(sc.x(i), ry + rainH - Math.min(rainH, r / 3), Math.max(1, sc.pxPerDay), Math.min(rainH, r / 3)); }
      ctx.fillStyle = muted; ctx.font = '10px Inter, system-ui, sans-serif'; ctx.fillText('rain', 44, ry);
    });
    if (!groups.length) { ctx.fillStyle = muted; ctx.fillText('Pick at least one agent.', padL, 30); }
  }

  // ------------------------------------------------------------ B. decision DAG (SVG)
  function nodeShape(parent, s, x, y, col, opts) {
    opts = opts || {};
    const g = el('g', { class: 'node' + (opts.ghost ? ' ghost' : ''), 'data-day': s.day }, parent);
    if (s.cls === 'CONTROL') { el('rect', { x: x - 3, y: y - 4, width: Math.max(6, opts.width || 6), height: 8, fill: opts.ghost ? 'none' : col, stroke: col, 'stroke-width': 1.2, opacity: opts.muted ? .55 : 1 }, g); }
    else { const r = 3.2 * (s.size || 1) + 1.3; el('circle', { cx: x, cy: y, r, fill: (s.cls === 'REJECTED' || opts.ghost) ? 'none' : col, stroke: col, 'stroke-width': s.cls === 'REJECTED' ? 1.8 : (opts.ghost ? 1.4 : 1), 'stroke-dasharray': opts.ghost ? '2 2' : null, opacity: opts.muted ? .6 : 1 }, g); }
    return g;
  }
  function renderDag(card, groups) {
    const host = $('dag-host'); host.innerHTML = '';
    if (!groups.length) { host.textContent = 'Pick at least one agent.'; return; }
    const n = groups[0].D.n; const padL = 70, padR = 20; const sc = scale(n, host.parentElement.clientWidth || 900, padL, padR);
    const rowH = 22, headH = 24, gap = 28; const groupH = headH + CL.length * rowH + gap;
    const H = 22 + groups.length * groupH; const svg = el('svg', { width: sc.width, height: H, viewBox: `0 0 ${sc.width} ${H}` }, host);
    for (const t of monthTicks(card.start, n)) { el('line', { x1: sc.x(t.i), x2: sc.x(t.i), y1: 14, y2: H, class: 'guide' }, svg); if (t.m % 2 === 1 || n < 400) txt(svg, sc.x(t.i) + 3, 11, A.MONTHS[t.m - 1] + (t.m === 1 ? ' ' + t.y.slice(2) : ''), 'axis'); }
    // common stop days across groups -> vertical guides
    if (groups.length > 1) {
      const sets = groups.map(g => new Set(g.D.stops.map(s => Math.floor(s.day / g.D.interval))));
      const common = [...sets[0]].filter(b => sets.every(s => s.has(b)));
      for (const b of common) el('line', { x1: sc.x(b * groups[0].D.interval) + 2, x2: sc.x(b * groups[0].D.interval) + 2, y1: 20, y2: H, stroke: cssVar('--accent-2'), opacity: .25 }, svg);
    }
    groups.forEach((g, gi) => {
      const y0 = 22 + gi * groupH; const rowY = ci => y0 + headH + ci * rowH + rowH / 2;
      txt(svg, 4, y0 + 10, A.agentName(g.agent).toUpperCase(), 'grp-title');
      txt(svg, 4, y0 + 10 + 13, `${g.entry.tag || ''} ${A.usd(g.run.profit_usd)} · ${g.D.source === 'transcript' ? 'tool calls' : 'trace only'}`.trim(), 'axis');
      CL.forEach((c, ci) => { el('rect', { x: padL - 6, y: rowY(ci) - rowH / 2, width: sc.width - padL + 6 - padR, height: rowH, fill: ci % 2 ? 'rgba(127,127,127,.05)' : 'rgba(127,127,127,.1)' }, svg); txt(svg, 4, rowY(ci) + 4, c.label, 'lane-label', { fill: c.color, 'font-weight': 600 }); });
      let prev = null; const edges = el('g', {}, svg); const nodes = el('g', {}, svg);
      g.D.stops.forEach((st, si) => {
        const baseX = sc.x(st.day) + 2; const perClsCount = {};
        let prevInStop = null;
        for (const s of st.steps) {
          const k = perClsCount[s.cls] = (perClsCount[s.cls] || 0) + 1;
          const x = baseX + (k - 1) * 5; const y = rowY(CLS[s.cls].pos);
          if (prevInStop) el('line', { x1: prevInStop.x, y1: prevInStop.y, x2: x, y2: y, class: 'edge' }, edges);
          else if (prev) { const path = el('path', { d: `M${prev.x},${prev.y} C${(prev.x + x) / 2},${prev.y} ${(prev.x + x) / 2},${y} ${x},${y}`, class: 'edge' }, edges); if (prev.adv > 1) txt(svg, (prev.x + x) / 2, Math.min(prev.y, y) - 4, `${prev.adv}×`, 'axis', { 'text-anchor': 'middle' }); }
          const node = nodeShape(nodes, s, x, y, CLS[s.cls].color, { width: (s.width || 1) * g.D.interval * sc.pxPerDay });
          const tipText = stepTip(s, g.agent); node.addEventListener('mousemove', e => showTip(e, tipText)); node.addEventListener('mouseleave', hideTip);
          node.addEventListener('click', () => { location.href = replayHref(g.agent, s.day, groups[1] && groups[1].agent !== g.agent ? groups[1].agent : null); });
          if (s.cls === 'HARVEST' && s.revenue != null) txt(svg, x + 6, y - 6, A.usd(s.revenue, true), 'axis', { fill: cssVar('--ink') });
          prevInStop = { x, y };
        }
        if (prevInStop) prev = { x: prevInStop.x, y: prevInStop.y, adv: st.advance };
      });
    });
  }

  // ------------------------------------------------------------ C. fingerprints
  async function renderFingerprints(card) {
    const host = $('fp-host'); host.innerHTML = '';
    const agents = state.agents.length > 1 ? state.agents : agentsFor(state.scenario);
    const which = state.attempt;
    for (const agent of agents) {
      const sel = await loadSel(agent, state.scenario, which === 'all' ? 'all' : which);
      if (!sel.length) continue;
      const Ds = sel.map(x => derived(x.entry, x.run, card));
      const tr = S.transitions(Ds.map(D => D.steps));
      const box = document.createElement('div'); box.className = 'fp px-inset';
      const profit = sel.reduce((a, x) => a + x.run.profit_usd, 0) / sel.length;
      box.innerHTML = `<h3><span title="${A.esc(agent)}">${A.esc(A.agentName(agent))}</span><small>${sel.length > 1 ? `${sel.length} attempts · mean ` : (sel[0].entry.tag || '') + ' · '}${A.usd(profit)}</small></h3>`;
      box.appendChild(fingerprintSvg(tr, Ds.every(D => D.source === 'transcript')));
      box.insertAdjacentHTML('beforeend', `<div class="src-note">${Ds.every(D => D.source === 'transcript') ? 'from transcript tool calls' : Ds.some(D => D.source === 'transcript') ? 'mixed: some attempts trace-only' : 'trace + ledger only (no sense/plan/control)'} · ${Ds.reduce((a, D) => a + D.steps.length, 0)} steps</div>`);
      if (card.tier >= 2) box.appendChild(cropStrip(card, Ds[0]));
      host.appendChild(box);
    }
  }
  const fingerprintSvg = A.fingerprintSvg, cropStrip = A.cropStrip;

  // ------------------------------------------------------------ D. deviation DAG + side plot
  async function pickReference(card, modelAgent) {
    if (state.ref === 'median') return A.pickAttempt(modelAgent, state.scenario, 'median');
    if (state.ref === 'best') { const d = IDX.diagnostics.find(x => x.scenario === state.scenario); const list = A.attemptsOf(d.best_known_agent, state.scenario); return list.slice().sort((a, b) => b.profit_usd - a.profit_usd)[0] || null; }
    return A.pickAttempt(state.ref, state.scenario, 'latest');
  }
  const FIELD_CLS = ['SENSE', 'SOW', 'FEED', 'WATER', 'HARVEST']; const SHARED_CLS = ['SENSE', 'PLAN', 'CONTROL', 'REJECTED'];
  function isFieldStep(s) { return s.field && (s.cls !== 'SENSE' || s.tool === 'soil_test') && s.cls !== 'REJECTED' && s.cls !== 'CONTROL' && s.cls !== 'PLAN'; }

  function computeDeviations(card, M, R, runM, runR) {
    const interval = M.interval; const bin = d => Math.floor(d / interval); const n = M.n;
    const devs = []; const ghosts = []; const badges = new Map(); // step -> {type,label}
    const bothCalls = M.source === 'transcript' && R.source === 'transcript';
    const fieldIds = card.fields.map(f => f.field_id);
    for (const fid of fieldIds) {
      const ms = M.steps.filter(s => isFieldStep(s) && s.field === fid), rs = R.steps.filter(s => isFieldStep(s) && s.field === fid);
      // --- sowing: pair by proximity (<= 120 d)
      const mSow = ms.filter(s => s.cls === 'SOW'), rSow = rs.filter(s => s.cls === 'SOW'); const usedR = new Set();
      for (const s of mSow) {
        let best = null; for (const r of rSow) if (!usedR.has(r) && Math.abs(r.day - s.day) <= 120 && (!best || Math.abs(r.day - s.day) < Math.abs(best.day - s.day))) best = r;
        if (!best) { devs.push({ day: s.day, field: fid, cls: 'SOW', type: 'plus', text: `sowed ${A.cropLabel(s.v || '')} (reference did not)`, step: s }); badges.set(s, { type: 'plus' }); continue; }
        usedR.add(best); s.paired = best;
        if (s.v !== best.v) { // fork until convergence
          const fM = runM.fields[fid], fR = runR.fields[fid]; let from = Math.min(s.day, best.day), to = Math.max(s.day, best.day) + 1;
          while (to < n && !((fM.crop[to] || null) === (fR.crop[to] || null))) to++;
          devs.push({ day: s.day, field: fid, cls: 'SOW', type: 'fork', from, to, text: `crop fork: reference ${A.cropLabel(best.v || '').toLowerCase()} / model ${A.cropLabel(s.v || '').toLowerCase()}`, step: s, ref: best });
          badges.set(s, { type: 'fork', label: `${A.cropLabel(s.v || '').toLowerCase()} vs ${A.cropLabel(best.v || '').toLowerCase()}` });
        } else if (Math.abs(s.day - best.day) >= interval) { const d = s.day - best.day; devs.push({ day: s.day, field: fid, cls: 'SOW', type: 'delta', text: `sown ${Math.abs(d)} d ${d < 0 ? 'earlier' : 'later'} (${A.cropLabel(s.v || '').toLowerCase()})`, step: s, ref: best }); badges.set(s, { type: 'delta', label: `sown ${Math.abs(d)} d ${d < 0 ? 'earlier' : 'later'}` }); }
      }
      for (const r of rSow) if (!usedR.has(r)) { devs.push({ day: r.day, field: fid, cls: 'SOW', type: 'minus', text: `did not sow ${A.cropLabel(r.v || '').toLowerCase()} when the reference did`, ref: r }); ghosts.push({ step: r, field: fid }); }
      // --- harvest timing: pair within 90 d
      const mH = ms.filter(s => s.cls === 'HARVEST'), rH = rs.filter(s => s.cls === 'HARVEST'); const usedH = new Set();
      for (const s of mH) {
        let best = null; for (const r of rH) if (!usedH.has(r) && Math.abs(r.day - s.day) <= 90 && (!best || Math.abs(r.day - s.day) < Math.abs(best.day - s.day))) best = r;
        if (!best) { devs.push({ day: s.day, field: fid, cls: 'HARVEST', type: 'plus', text: `harvested ${s.crop ? A.cropLabel(s.crop).toLowerCase() : ''} → ${A.usd(s.revenue || 0)} (no reference harvest nearby)`, step: s }); badges.set(s, { type: 'plus' }); continue; }
        usedH.add(best);
        const d = s.day - best.day;
        if (s.crop && best.crop && s.crop !== best.crop) continue; // different crops: the fork explains this harvest, not its timing
        if (Math.abs(d) >= interval) { devs.push({ day: s.day, field: fid, cls: 'HARVEST', type: 'delta', text: `harvested ${Math.abs(d)} d ${d < 0 ? 'earlier' : 'later'}${s.early ? ' (before maturity)' : ''}`, step: s, ref: best }); badges.set(s, { type: 'delta', label: `${Math.abs(d)} d ${d < 0 ? 'earlier' : 'later'}` }); }
      }
      for (const r of rH) if (!usedH.has(r)) { devs.push({ day: r.day, field: fid, cls: 'HARVEST', type: 'minus', text: `no harvest when the reference harvested ${r.crop ? A.cropLabel(r.crop).toLowerCase() : ''}`, ref: r }); ghosts.push({ step: r, field: fid }); }
      // --- per-bin comparison for soil tests, feed, water
      for (const cls of ['SENSE', 'FEED', 'WATER']) {
        const mb = {}, rb = {};
        ms.filter(s => s.cls === cls).forEach(s => (mb[bin(s.day)] = mb[bin(s.day)] || []).push(s));
        rs.filter(s => s.cls === cls).forEach(s => (rb[bin(s.day)] = rb[bin(s.day)] || []).push(s));
        const bins = new Set([...Object.keys(mb), ...Object.keys(rb)].map(Number));
        for (const b of bins) {
          const a = mb[b] || [], c = rb[b] || [];
          if (a.length && !c.length) { a.forEach(s => badges.set(s, { type: 'plus' })); devs.push({ day: a[0].day, field: fid, cls, type: 'plus', text: cls === 'SENSE' ? 'soil test the reference did not take' : `${cls === 'FEED' ? 'fertilized ' + Math.round(a.reduce((x, s) => x + (+s.v || 0), 0)) + ' kg N/ha' : 'irrigated ' + Math.round(a.reduce((x, s) => x + (+s.v || 0), 0)) + ' mm'} (reference did not this week)`, step: a[0] }); }
          else if (!a.length && c.length) { ghosts.push({ step: c[0], field: fid }); devs.push({ day: c[0].day, field: fid, cls, type: 'minus', text: cls === 'SENSE' ? 'skipped a soil test the reference took' : `skipped ${cls === 'FEED' ? Math.round(c.reduce((x, s) => x + (+s.v || 0), 0)) + ' kg N/ha' : Math.round(c.reduce((x, s) => x + (+s.v || 0), 0)) + ' mm'} the reference applied`, ref: c[0] }); }
          else if (a.length && c.length && cls !== 'SENSE') {
            const sa = a.reduce((x, s) => x + (+s.v || 0), 0), sb = c.reduce((x, s) => x + (+s.v || 0), 0);
            if (Math.abs(sa - sb) >= 1) { const d = sa - sb; const lab = cls === 'FEED' ? `N ${d > 0 ? '+' : '−'}${Math.round(Math.abs(d))} kg` : `water ${d > 0 ? '+' : '−'}${Math.round(Math.abs(d))} mm`; badges.set(a[0], { type: 'delta', label: lab }); devs.push({ day: a[0].day, field: fid, cls, type: 'delta', text: lab + ' vs reference that week', step: a[0], ref: c[0] }); }
          }
        }
      }
    }
    if (bothCalls) { // plan / control comparison only when both have transcript calls
      for (const cls of ['PLAN', 'CONTROL']) {
        const mb = {}, rb = {};
        M.steps.filter(s => s.cls === cls).forEach(s => (mb[bin(s.day)] = mb[bin(s.day)] || []).push(s));
        R.steps.filter(s => s.cls === cls).forEach(s => (rb[bin(s.day)] = rb[bin(s.day)] || []).push(s));
        for (const b of new Set([...Object.keys(mb), ...Object.keys(rb)].map(Number))) { const a = mb[b] || [], c = rb[b] || []; if (a.length && !c.length) { a.forEach(s => badges.set(s, { type: 'plus' })); devs.push({ day: a[0].day, field: null, cls, type: 'plus', text: `${cls.toLowerCase()} step the reference did not take`, step: a[0] }); } else if (!a.length && c.length) { ghosts.push({ step: c[0], field: null }); devs.push({ day: c[0].day, field: null, cls, type: 'minus', text: `skipped a ${cls.toLowerCase()} step the reference took`, ref: c[0] }); } }
      }
    }
    devs.sort((a, b) => a.day - b.day);
    const diff = new Float64Array(n); for (let i = 0; i < n; i++) diff[i] = M.cash[i] - R.cash[i];
    // --- attribution. Rule: while a crop fork is open on a field, every harvest cash jump on that field and every
    // feed/water/harvest deviation there belongs to the fork. Everything else is attributed sequentially
    // (gap change until the next top-level deviation) on the residual series with the fork jumps removed.
    const residual = Float64Array.from(diff);
    const jumpAt = day => { let best = Math.min(n - 1, day); for (let k = day; k <= Math.min(n - 1, day + 3); k++) if (Math.abs(diff[k] - diff[Math.max(0, k - 1)]) > Math.abs(diff[best] - diff[Math.max(0, best - 1)])) best = k; return best; };
    for (const f of devs.filter(d => d.type === 'fork')) {
      f.children = devs.filter(d => d !== f && d.type !== 'fork' && d.field === f.field && d.day >= f.from && d.day <= f.to && ['FEED', 'WATER', 'HARVEST'].includes(d.cls));
      f.children.forEach(c => { c.parent = f; });
      const hDays = new Set();
      [...M.steps, ...R.steps].filter(st => st.cls === 'HARVEST' && st.field === f.field && st.day >= f.from && st.day <= f.to + 3).forEach(st => hDays.add(jumpAt(st.day)));
      f.harvestJump = 0;
      for (const j of hDays) { const jump = diff[j] - diff[Math.max(0, j - 1)]; f.harvestJump += jump; for (let k = j; k < n; k++) residual[k] -= jump; }
      f.text = `${A.cropLabel(f.step.v || '').toLowerCase()} instead of ${A.cropLabel(f.ref.v || '').toLowerCase()}`;
    }
    const top = devs.filter(d => !d.parent);
    top.forEach((d, i) => { const nextDay = i + 1 < top.length ? top[i + 1].day : n - 1; d.attrib = residual[Math.min(n - 1, nextDay)] - residual[Math.max(0, d.day - 1)]; if (d.type === 'fork') d.attrib += d.harvestJump; });
    devs.filter(d => d.parent).forEach(d => { d.attrib = null; });
    const STRATEGIC = d => d.type === 'fork' || d.cls === 'SOW' || d.cls === 'HARVEST';
    const strategic = devs.filter(d => STRATEGIC(d) && !d.parent).length, tactical = devs.length - strategic;
    return { devs, ghosts, badges, diff, top, strategic, tactical };
  }

  async function renderDeviation(card) {
    const host = $('dev-host'); host.innerHTML = ''; $('dev-summary').innerHTML = '';
    const modelAgent = state.agents[0]; if (!modelAgent) { host.textContent = 'Pick agent 1.'; return; }
    const which = state.attempt === 'all' ? 'calls' : state.attempt;
    const mEntry = A.pickAttempt(modelAgent, state.scenario, which); const rEntry = await pickReference(card, modelAgent);
    if (!mEntry || !rEntry) { host.textContent = 'No run for this choice.'; return; }
    const [runM, runR] = await Promise.all([A.loadRun(mEntry), A.loadRun(rEntry)]);
    const M = derived(mEntry, runM, card), R = derived(rEntry, runR, card);
    const dev = computeDeviations(card, M, R, runM, runR);
    const n = M.n; const padL = 96, padR = 24; const sc = scale(n, host.parentElement.clientWidth || 1000, padL, padR);
    const rowH = 20, blockGap = 14, headH = 16;
    const fieldBlockH = headH + FIELD_CLS.length * rowH; const sharedBlockH = headH + SHARED_CLS.length * rowH;
    const dagH = 22 + card.fields.length * (fieldBlockH + blockGap) + sharedBlockH + 10;
    const cashH = 130, yieldH = 26 * card.fields.length + 16; const sideTop = dagH + 18;
    const H = sideTop + cashH + 26 + yieldH + 10;
    const svg = el('svg', { width: sc.width, height: H, viewBox: `0 0 ${sc.width} ${H}` }, host);
    const ink = cssVar('--ink'), muted = cssVar('--muted'), accent = cssVar('--accent'), danger = cssVar('--danger');
    // month axis
    for (const t of monthTicks(card.start, n)) { el('line', { x1: sc.x(t.i), x2: sc.x(t.i), y1: 14, y2: H - 16, class: 'guide' }, svg); if (t.m % 2 === 1 || n < 400) txt(svg, sc.x(t.i) + 3, 11, A.MONTHS[t.m - 1] + (t.m === 1 ? ' ' + t.y.slice(2) : ''), 'axis'); }
    // fork bands
    const bandsG = el('g', {}, svg); const refG = el('g', {}, svg); const modG = el('g', {}, svg); const labelG = el('g', {}, svg);
    const rowYOf = {}; // field -> cls -> y
    let y = 22;
    const blocks = card.fields.map(f => ({ fid: f.field_id, classes: FIELD_CLS, y: (y += 0), label: `${f.field_id} · ${f.area_ha} ha` })).map((b, i) => { b.y = 22 + i * (fieldBlockH + blockGap); return b; });
    blocks.push({ fid: null, classes: SHARED_CLS, y: 22 + card.fields.length * (fieldBlockH + blockGap), label: 'whole farm' });
    for (const b of blocks) {
      txt(svg, 4, b.y + 10, b.label, 'grp-title');
      rowYOf[b.fid] = {};
      b.classes.forEach((c, ci) => { const ry = b.y + headH + ci * rowH + rowH / 2; rowYOf[b.fid][c] = ry; el('rect', { x: padL - 6, y: ry - rowH / 2, width: sc.width - padL + 6 - padR, height: rowH, fill: ci % 2 ? 'rgba(127,127,127,.05)' : 'rgba(127,127,127,.1)' }, svg); txt(svg, 4, ry + 4, b.fid === null && c === 'SENSE' ? 'Sense (other)' : c === 'SENSE' ? 'Soil test' : CLS[c].label, 'lane-label', { fill: CLS[c].color, 'font-weight': 600 }); });
    }
    const blockFor = s => isFieldStep(s) ? s.field : null;
    const posOf = s => { const b = blockFor(s); const cls = s.cls === 'REJECTED' ? 'REJECTED' : s.cls; const ys = rowYOf[b] && rowYOf[b][cls]; return ys == null ? rowYOf[null][s.cls === 'SENSE' ? 'SENSE' : cls] || rowYOf[null].SENSE : ys; };
    // fork bands
    for (const d of dev.devs) if (d.type === 'fork') { const b = blocks.find(x => x.fid === d.field); el('rect', { x: sc.x(d.from), y: b.y + headH - 2, width: Math.max(2, sc.x(d.to) - sc.x(d.from)), height: FIELD_CLS.length * rowH + 4, fill: cssVar('--accent-2'), opacity: .14 }, bandsG); txt(labelG, Math.max(sc.x(d.from) + 4, 150), b.y + 10, `fork: ref ${A.cropLabel(d.ref.v || '').toLowerCase()} / model ${A.cropLabel(d.step.v || '').toLowerCase()} · until ${A.fmtDate(A.addDays(card.start, Math.min(n - 1, d.to)))}`, 'fork-label'); }
    // reference DAG (grey)
    function drawDag(D, g, agent, muted, offset) {
      let prev = null;
      D.stops.forEach(st => {
        const baseX = sc.x(st.day) + 2 + offset; const cnt = {}; let prevIn = null;
        for (const s of st.steps) {
          const k = cnt[s.cls + (s.field || '')] = (cnt[s.cls + (s.field || '')] || 0) + 1; const x = baseX + (k - 1) * 5; const yy = posOf(s) + (muted ? 4 : -2);
          if (prevIn) el('line', { x1: prevIn.x, y1: prevIn.y, x2: x, y2: yy, class: 'edge' + (muted ? ' ref' : '') }, g);
          else if (prev) el('path', { d: `M${prev.x},${prev.y} C${(prev.x + x) / 2},${prev.y} ${(prev.x + x) / 2},${yy} ${x},${yy}`, class: 'edge' + (muted ? ' ref' : '') }, g);
          const col = muted ? (cssVar('--muted') || '#888') : CLS[s.cls].color;
          const node = nodeShape(g, s, x, yy, col, { muted, width: (s.width || 1) * D.interval * sc.pxPerDay });
          node.dataset.bin = Math.floor(s.day / D.interval);
          const tt = stepTip(s, agent) + (muted ? '\n(reference)' : ''); node.addEventListener('mousemove', e => { showTip(e, tt); cursorAt(s.day); }); node.addEventListener('mouseleave', () => { hideTip(); cursorAt(null); });
          node.addEventListener('click', () => { location.href = replayHref(muted ? rEntry.agent : mEntry.agent, s.day, muted ? mEntry.agent : rEntry.agent); });
          if (!muted) {
            const bd = dev.badges.get(s);
            if (bd) {
              if (bd.type === 'plus' || bd.type === 'fork') { el('circle', { cx: x + 6, cy: yy - 7, r: 5.5, fill: bd.type === 'fork' ? cssVar('--accent-2') : accent, stroke: ink, 'stroke-width': .8 }, g); txt(g, x + 6, yy - 3.8, bd.type === 'fork' ? 'Y' : '+', 'badge', { 'text-anchor': 'middle' }); }
              if (bd.label) txt(labelG, x + 8, yy + 4, (bd.type === 'delta' ? '→ ' : '') + bd.label, 'delta');
            }
            if (s.cls === 'HARVEST' && s.revenue != null && !bd) txt(labelG, x + 7, yy - 5, A.usd(s.revenue, true), 'axis', { fill: ink });
          }
          prevIn = { x, y: yy };
        }
        if (prevIn) prev = prevIn;
      });
    }
    drawDag(R, refG, rEntry.agent, true, 0);
    drawDag(M, modG, mEntry.agent, false, 0);
    // ghosts: reference steps the model skipped
    for (const gh of dev.ghosts) { const s = gh.step; const x = sc.x(s.day) + 2, yy = posOf(s) - 2; const node = nodeShape(modG, s, x, yy, danger, { ghost: true }); el('circle', { cx: x + 6, cy: yy - 7, r: 5.5, fill: danger, stroke: ink, 'stroke-width': .8 }, modG); txt(modG, x + 6, yy - 3.8, '−', 'badge', { 'text-anchor': 'middle' }); const tt = `skipped: ${s.label}${s.field ? ' · ' + s.field : ''} (reference did this on day ${s.day + 1})`; node.addEventListener('mousemove', e => { showTip(e, tt); cursorAt(s.day); }); node.addEventListener('mouseleave', () => { hideTip(); cursorAt(null); }); }
    // deviation guides down into the side plot
    for (const d of dev.devs) el('line', { x1: sc.x(d.day) + 2, x2: sc.x(d.day) + 2, y1: sideTop - 6, y2: sideTop + cashH, class: 'devguide' }, svg);

    // ---- side plot: cash gap
    const diff = dev.diff; let maxAbs = 1; for (let i = 0; i < n; i++) maxAbs = Math.max(maxAbs, Math.abs(diff[i]));
    const zeroY = sideTop + cashH / 2; const yOf = v => zeroY - v / maxAbs * (cashH / 2 - 8);
    txt(svg, 4, sideTop + 4, 'cash gap', 'grp-title'); txt(svg, 4, sideTop + 17, A.agentName(mEntry.agent).slice(0, 15), 'axis'); txt(svg, 4, sideTop + 29, '− ' + A.agentName(rEntry.agent).slice(0, 13), 'axis');
    txt(svg, padL + 3, yOf(maxAbs) + 9, '+' + A.usd(maxAbs, true), 'axis'); txt(svg, padL + 3, yOf(-maxAbs) - 2, '−' + A.usd(maxAbs, true), 'axis'); txt(svg, padL + 3, zeroY - 3, '0', 'axis');
    el('line', { x1: padL, x2: sc.width - padR, y1: zeroY, y2: zeroY, stroke: muted, opacity: .6 }, svg);
    let posPath = `M${sc.x(0)},${zeroY}`, negPath = `M${sc.x(0)},${zeroY}`;
    for (let i = 0; i < n; i++) { const x = sc.x(i); posPath += ` L${x},${yOf(Math.max(0, diff[i]))}`; negPath += ` L${x},${yOf(Math.min(0, diff[i]))}`; }
    posPath += ` L${sc.x(n - 1)},${zeroY} Z`; negPath += ` L${sc.x(n - 1)},${zeroY} Z`;
    el('path', { d: posPath, fill: accent, opacity: .45 }, svg); el('path', { d: negPath, fill: danger, opacity: .45 }, svg);
    let line = ''; for (let i = 0; i < n; i++) line += (i ? ' L' : 'M') + sc.x(i) + ',' + yOf(diff[i]); el('path', { d: line, fill: 'none', stroke: ink, 'stroke-width': 1 }, svg);
    // harvest step labels
    const harvestDays = [...M.steps.filter(s => s.cls === 'HARVEST'), ...R.steps.filter(s => s.cls === 'HARVEST')].map(s => ({ s, isM: M.steps.includes(s) }));
    const seen = new Set(); let lastLabelX = -1e9;
    for (const h of harvestDays.sort((a, b) => a.s.day - b.s.day)) {
      const d0 = h.s.day; let jumpDay = d0; for (let k = d0; k <= Math.min(n - 1, d0 + 3); k++) if (Math.abs(diff[k] - diff[Math.max(0, k - 1)]) > Math.abs(diff[jumpDay] - diff[Math.max(0, jumpDay - 1)])) jumpDay = k;
      if (seen.has(jumpDay)) continue; seen.add(jumpDay);
      const jump = diff[jumpDay] - diff[Math.max(0, jumpDay - 1)]; if (Math.abs(jump) < maxAbs * 0.03) continue;
      const near = (D, d) => D.steps.find(s => s.cls === 'HARVEST' && s.field === h.s.field && Math.abs(s.day - d) <= 2);
      const mHere = near(M, jumpDay), rHere = near(R, jumpDay);
      const other = (h.isM ? R : M).steps.find(s => s.cls === 'HARVEST' && s.field === h.s.field && Math.abs(s.day - d0) <= 60);
      const cropOf = s => s && s.crop ? A.cropLabel(s.crop).toLowerCase() : 'no harvest';
      let what;
      if (mHere && rHere) what = `${cropOf(mHere)} vs ${cropOf(rHere)}`;
      else if (mHere) what = `${cropOf(mHere)} harvest` + (other ? ` (ref ${cropOf(other)} ${Math.abs(other.day - jumpDay)} d ${other.day < jumpDay ? 'earlier' : 'later'})` : ' (ref: none)');
      else what = `ref harvested ${cropOf(rHere || h.s)}` + (other ? ` (model ${cropOf(other)} ${Math.abs(other.day - jumpDay)} d ${other.day < jumpDay ? 'earlier' : 'later'})` : ' (model: none)');
      const label = `${jump >= 0 ? '+' : '−'}${A.usd(Math.abs(jump), true)} ${what}`;
      const x = sc.x(jumpDay); const ly = jump >= 0 ? yOf(diff[jumpDay]) - 6 : yOf(diff[jumpDay]) + 12;
      const lx = Math.max(x, lastLabelX + 4); lastLabelX = lx + label.length * 5.5;
      txt(svg, lx, ly, label, 'harvest-label');
    }
    // ---- yield tracks
    const yTop = sideTop + cashH + 22; txt(svg, 4, yTop - 6, 'yield to date', 'grp-title');
    card.fields.forEach((f, fi) => {
      const ty = yTop + fi * 26; const fM = runM.fields[f.field_id], fR = runR.fields[f.field_id];
      let mx = 1; for (let i = 0; i < n; i++) mx = Math.max(mx, fM.wso[i] || 0, fR.wso[i] || 0);
      txt(svg, 4, ty + 14, f.field_id.slice(0, 12), 'axis');
      el('rect', { x: padL - 6, y: ty, width: sc.width - padL + 6 - padR, height: 22, fill: 'rgba(127,127,127,.07)' }, svg);
      const path = (arr, col, dash) => { let d = ''; let pen = false; for (let i = 0; i < n; i++) { const v = arr[i]; if (v == null) { pen = false; continue; } d += (pen ? ' L' : ' M') + sc.x(i) + ',' + (ty + 21 - v / mx * 20); pen = true; } el('path', { d, fill: 'none', stroke: col, 'stroke-width': 1.3, 'stroke-dasharray': dash || null }, svg); };
      path(fR.wso, muted, '3 2'); path(fM.wso, cropColorForField(fM) || accent);
      txt(svg, sc.width - padR - 2, ty + 9, `${Math.round(mx).toLocaleString('en-US')} kg/ha`, 'axis', { 'text-anchor': 'end' });
    });
    function cropColorForField(f) { for (let i = f.n - 1; i >= 0; i--) if (f.crop[i]) return cropColor(f.crop[i]); return null; }
    // cursor + linking
    const cursor = el('line', { x1: 0, x2: 0, y1: 14, y2: H - 16, class: 'cursor', visibility: 'hidden' }, svg);
    const cursorTxt = txt(svg, 0, sideTop - 8, '', 'axis', { 'text-anchor': 'middle', visibility: 'hidden', fill: ink, 'font-weight': 600 });
    function cursorAt(day) {
      if (day == null) { cursor.setAttribute('visibility', 'hidden'); cursorTxt.setAttribute('visibility', 'hidden'); svg.querySelectorAll('.node.hl').forEach(nd => nd.classList.remove('hl')); return; }
      const x = sc.x(day) + 2; cursor.setAttribute('x1', x); cursor.setAttribute('x2', x); cursor.setAttribute('visibility', 'visible');
      cursorTxt.setAttribute('x', x); cursorTxt.textContent = `${A.fmtDate(A.addDays(card.start, day))} · gap ${diff[day] >= 0 ? '+' : '−'}${A.usd(Math.abs(diff[day]))}`; cursorTxt.setAttribute('visibility', 'visible');
      const b = Math.floor(day / M.interval); svg.querySelectorAll('.node').forEach(nd => nd.classList.toggle('hl', nd.dataset.bin == b));
    }
    const sideHit = el('rect', { x: padL, y: sideTop - 6, width: sc.width - padL - padR, height: cashH + 30 + yieldH, fill: 'transparent' }, svg);
    sideHit.addEventListener('mousemove', e => { const r = svg.getBoundingClientRect(); const day = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - padL) / sc.pxPerDay))); cursorAt(day); });
    sideHit.addEventListener('mouseleave', () => cursorAt(null));

    // ---- summary chips
    const final = diff[n - 1]; const byCls = {}; dev.devs.forEach(d => { byCls[d.cls] = (byCls[d.cls] || 0) + 1; });
    const top3 = dev.top.slice().sort((a, b) => Math.abs(b.attrib) - Math.abs(a.attrib)).slice(0, 3);
    const when = d => A.fmtDate(A.addDays(card.start, d.day)).replace(/ \d{4}$/, '');
    const signed = v => `${v >= 0 ? '+' : '−'}${A.usd(Math.abs(v), true)}`;
    const item = d => d.type === 'fork'
      ? `${when(d)} ${d.field}: <b>${A.esc(d.text)}</b> → ${signed(d.attrib)} (${signed(d.harvestJump)} net at the harvests)${d.children.length ? `<br>${d.children.slice(0, 3).map(c => `&nbsp;&nbsp;· ${when(c)} ${A.esc(c.text)}`).join('<br>')}${d.children.length > 3 ? `<br>&nbsp;&nbsp;· + ${d.children.length - 3} more inside the fork` : ''}` : ''}`
      : `${when(d)}${d.field ? ' ' + d.field : ''}: ${A.esc(d.text)} → ${signed(d.attrib)}`;
    $('dev-summary').innerHTML = `
      <div class="chip-big ${final >= 0 ? 'pos' : 'neg'}"><b>${final >= 0 ? '+' : '−'}${A.usd(Math.abs(final))}</b><small>final cash gap · ${A.esc(A.agentName(mEntry.agent))}${mEntry.tag ? ' ' + mEntry.tag : ''} vs ${A.esc(A.agentName(rEntry.agent))}${rEntry.tag ? ' ' + rEntry.tag : ''}</small></div>
      <div class="chip-big" title="strategic = crop forks, sowing and harvest deviations; tactical = soil tests, fertilizer, irrigation, plan and control (deviations inside an open fork count as tactical)"><b>${dev.strategic} <span class="u">strategic</span> · ${dev.tactical} <span class="u">tactical</span></b><small>deviations · ${CL.map(c => byCls[c.id] ? `${c.label.toLowerCase()} ${byCls[c.id]}` : '').filter(Boolean).join(', ') || 'none'}</small></div>
      <div class="chip-big" title="Sequential attribution: the cash-gap change between one deviation and the next is credited to the first; while a crop fork is open, the harvest jumps and the feed/water deviations on that field are credited to the fork. This is not a counterfactual."><b>largest consequences</b><small>${top3.map(item).join('<br>') || '–'}</small><small class="muted">sequential attribution, not a counterfactual</small></div>
      ${M.source !== 'transcript' ? '<div class="chip-big"><small>this attempt has no transcript tool calls: sense/plan/control steps unknown</small></div>' : ''}`;
  }

  // ------------------------------------------------------------ wiring
  const q = A.qs();
  if (q.scenario && A.scenario(q.scenario)) selS.value = q.scenario;
  if (q.attempt) selAtt.value = q.attempt; if (q.ref) selRef.value = q.ref; if (q.view && 'ABCD'.includes(q.view)) state.view = q.view;
  fillAgents(selS.value, q.agents ? q.agents.split(',') : (q.a ? [q.a, q.b] : null));
  selS.addEventListener('change', () => { fillAgents(selS.value, agentSels.map(s => s.value)); refresh(); });
  [selAtt, selRef, ...agentSels].forEach(s => s.addEventListener('change', refresh));
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { state.view = t.dataset.view; refresh(); }));
  window.addEventListener('resize', () => refresh());
  A.onUnits(() => refresh());
  refresh();
})();
