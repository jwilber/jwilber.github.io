/* Per-model page: header stats, per-scenario SP chart, fingerprint, crop mix, input profile, attempts table, best/worst notes. */
(function () {
  'use strict';
  const A = window.AGRI; const S = A.steps;
  A.initUnits(); A.drawLogo(document.getElementById('logo'));
  const IDX = A.index(); const LB = IDX.leaderboard; const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const txt = (parent, x, y, s, cls, attrs) => { const t = el('text', Object.assign({ x, y, class: cls }, attrs || {}), parent); t.textContent = s; return t; };
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const q = A.qs(); const agent = q.agent && LB.agents[q.agent] ? q.agent : LB.order[0];
  const a = LB.agents[agent]; const rank = LB.order.indexOf(agent) + 1;
  document.title = `CropBench · ${A.agentName(agent)}`;
  document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach(m => m.setAttribute('content', document.title));
  const fmt2 = v => v == null ? '–' : v.toFixed(2);
  const pm = (v, sd, f) => v == null ? '–' : `${f(v)}${sd != null ? ` ± ${f(sd)}` : ''}`;
  const n = Math.max(1, a.n_scenarios);
  const prev = LB.order[rank - 2], next = LB.order[rank];
  const providerId = agent.startsWith('llm:') ? agent.slice(4).replace(/_/g, '/') : agent;

  // floor / standard-practice profits per scenario for per-attempt SP scores
  const floorOf = sid => (LB.agents.do_nothing && LB.agents.do_nothing.rows[sid] || {}).profit;
  const spOf = sid => (LB.agents.standard_practice && LB.agents.standard_practice.rows[sid] || {}).profit;
  const spScore = (sid, profit) => { const fl = floorOf(sid), sp = spOf(sid); if (fl == null || sp == null || sp - fl <= 1e-6) return null; return Math.max(-2, Math.min(5, (profit - fl) / (sp - fl))); };

  $('head').innerHTML = `
    <div>
      <div><span class="tier-tag">#${rank} of ${LB.order.length}</span> <span class="mono muted small">${A.esc(providerId)}</span>${a.is_baseline ? '<span class="badge">baseline</span>' : ''}</div>
      <h1 style="margin:.2em 0">${A.esc(A.agentName(agent))}</h1>
      <div class="stats">
        <div><b>${pm(a.sp_score, a.sp_score_sd, fmt2)}</b><span>SP score ± sd</span></div>
        <div><b>${pm(a.profit_per_ha_season, a.profit_per_ha_season_sd, A.usd)}</b><span>profit / ha-season ± sd</span></div>
        <div><b>${a.attempts}</b><span>attempts over ${a.n_scenarios} scenarios</span></div>
        <div><b>${A.fmtTokens(a.cost.input_tokens / n)} / ${A.fmtTokens(a.cost.output_tokens / n)}</b><span>tokens in / out per episode</span></div>
        <div><b>${Math.round(a.cost.tool_calls / n)}</b><span>tool calls per episode</span></div>
        <div><b>${A.usd(a.total_profit)}</b><span>total profit</span></div>
      </div>
    </div>
    <div class="model-nav">
      ${prev ? `<a class="btn" href="model.html?agent=${encodeURIComponent(prev)}">◀ ${A.esc(A.agentName(prev))}</a>` : ''}
      ${next ? `<a class="btn" href="model.html?agent=${encodeURIComponent(next)}">${A.esc(A.agentName(next))} ▶</a>` : ''}
    </div>`;

  // ------------------------------------------------------------ per-scenario chart
  (function chart() {
    const host = $('scn-chart'); const tiers = [1, 2, 3].map(t => IDX.scenarios.filter(s => s.tier === t)).filter(g => g.length);
    const attempts = IDX.runs.filter(r => r.agent === agent && r.has_trace);
    const W = Math.max(700, host.clientWidth || 800), H = 240, padL = 40, padB = 56, top = 18; const plotH = H - padB - top;
    const total = IDX.scenarios.length + tiers.length - 1; const slot = (W - padL - 10) / total;
    const vals = []; attempts.forEach(r => { const v = spScore(r.scenario, r.profit_usd); if (v != null) vals.push(v); }); IDX.scenarios.forEach(s => { const r = a.rows[s.id]; if (r && r.sp_score != null) vals.push(r.sp_score); });
    const vmax = Math.max(1.5, ...vals), vmin = Math.min(0, ...vals);
    const y = v => top + (vmax - v) / (vmax - vmin) * plotH;
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, host);
    for (const v of [0, 1, 2, 3, 4, 5]) if (v >= vmin && v <= vmax) { el('line', { x1: padL, x2: W - 6, y1: y(v), y2: y(v), stroke: v === 1 ? cssVar('--accent-2') : cssVar('--muted'), opacity: v === 1 ? .9 : .25, 'stroke-width': v === 1 ? 1.5 : 1, 'stroke-dasharray': v === 1 ? '4 3' : null }, svg); txt(svg, padL - 6, y(v) + 4, String(v), 'axis', { 'text-anchor': 'end' }); }
    txt(svg, W - 8, y(1) - 4, 'standard practice = 1.0', 'axis', { 'text-anchor': 'end', fill: cssVar('--accent-2') });
    let i = 0;
    tiers.forEach((g, gi) => {
      const x0 = padL + i * slot; txt(svg, x0 + (g.length * slot) / 2, H - 6, `Tier ${gi + 1}`, 'grp-title', { 'text-anchor': 'middle' });
      g.forEach(s => {
        const r = a.rows[s.id]; const x = padL + i * slot + 4, bw = slot - 8;
        if (r && r.sp_score != null) {
          const v = r.sp_score; const col = v >= 1 ? cssVar('--accent') : v >= 0 ? cssVar('--accent-2') : cssVar('--danger');
          const rect = el('rect', { x, y: Math.min(y(v), y(0)), width: bw, height: Math.abs(y(v) - y(0)), fill: col, opacity: .75, class: 'bar-rect' }, svg);
          const t = el('title', {}, rect); t.textContent = `${s.title}\nSP ${v.toFixed(2)} · ${A.usd(r.profit)} mean (${r.n} attempts)\nclick: replay`;
          rect.addEventListener('click', () => { location.href = A.replayHref(s.id, agent, agent === 'standard_practice' ? 'oracle' : 'standard_practice'); });
          attempts.filter(r2 => r2.scenario === s.id).forEach((r2, k, arr) => { const v2 = spScore(s.id, r2.profit_usd); if (v2 == null) return; const c = el('circle', { cx: x + bw / 2 + (k - (arr.length - 1) / 2) * 5, cy: y(v2), r: 3, fill: cssVar('--ink'), stroke: cssVar('--panel'), 'stroke-width': 1 }, svg); const tt = el('title', {}, c); tt.textContent = `${r2.tag || 'run'}: SP ${v2.toFixed(2)} · ${A.usd(r2.profit_usd)}`; c.style.cursor = 'pointer'; c.addEventListener('click', () => { location.href = A.replayHref(s.id, agent, 'standard_practice'); }); });
        }
        txt(svg, x + bw / 2, H - padB + 12, s.id.replace(/^t\d_/, '').replace(/_/g, ' ').slice(0, 14), 'axis', { 'text-anchor': 'end', transform: `rotate(-35 ${x + bw / 2} ${H - padB + 12})` });
        i++;
      });
      i++; // gap between tiers
    });
  })();

  // ------------------------------------------------------------ attempts table + derived profiles (loads all runs of this agent)
  const attempts = IDX.runs.filter(r => r.agent === agent && r.has_trace).sort((x, y) => x.scenario.localeCompare(y.scenario) || (x.tag || '').localeCompare(y.tag || ''));
  $('attempts-note').textContent = `${attempts.length} runs · profit and SP per attempt · links to the replay and to the steps view`;
  const tb = $('attempts');
  // profit bar: one shared scale across all rows, visible zero line (some profits are negative), bar left, number right
  const pMin = Math.min(0, ...attempts.map(r => r.profit_usd)), pMax = Math.max(1, ...attempts.map(r => r.profit_usd));
  const pct = v => Math.round(Math.max(0, Math.min(1, (v - pMin) / (pMax - pMin))) * 100); const zero = pct(0);
  const pbar = v => { const l = v >= 0 ? zero : pct(v), w = Math.max(1, Math.abs(pct(v) - zero)); return `<span class="pbar"><span class="track"><i class="${v < 0 ? 'neg' : ''}" style="left:${l}%;width:${w}%"></i><b style="left:${zero}%"></b></span><span class="v ${v < 0 ? 'neg' : ''}">${A.usd(v)}</span></span>`; };
  const sortState = { key: 'scenario', dir: 1 };
  const cmp = { scenario: (a, b) => a.scenario.localeCompare(b.scenario) || (a.tag || '').localeCompare(b.tag || ''), attempt: (a, b) => (a.tag || '').localeCompare(b.tag || '') || a.scenario.localeCompare(b.scenario), profit: (a, b) => a.profit_usd - b.profit_usd, sp: (a, b) => (spScore(a.scenario, a.profit_usd) || 0) - (spScore(b.scenario, b.profit_usd) || 0) };
  function renderAttempts() {
    const rows = attempts.slice().sort((a, b) => sortState.dir * cmp[sortState.key](a, b));
    tb.querySelector('thead').innerHTML = `<tr><th class="sortable ${sortState.key === 'scenario' ? (sortState.dir > 0 ? 'asc' : 'desc') : ''}" data-key="scenario">scenario</th><th class="sortable ${sortState.key === 'attempt' ? (sortState.dir > 0 ? 'asc' : 'desc') : ''}" data-key="attempt">attempt</th><th class="sortable ${sortState.key === 'profit' ? (sortState.dir > 0 ? 'asc' : 'desc') : ''}" data-key="profit" style="text-align:left">profit (${A.moneyUnit()})</th><th class="sortable num ${sortState.key === 'sp' ? (sortState.dir > 0 ? 'asc' : 'desc') : ''}" data-key="sp">SP</th><th class="num">tool calls</th><th class="num">tokens in / out</th><th>steps source</th><th>links</th></tr>`;
    tb.querySelector('tbody').innerHTML = rows.map(r => { const sp = spScore(r.scenario, r.profit_usd); return `<tr><td><span class="tier-tag">T${r.tier}</span> <span class="mono">${r.scenario}</span></td><td>${r.tag || '–'}</td><td style="text-align:left">${pbar(r.profit_usd)}</td><td class="num">${sp == null ? '–' : sp.toFixed(2)}</td><td class="num">${r.tool_calls}</td><td class="num">${A.fmtTokens(r.usage.input_tokens || 0)} / ${A.fmtTokens(r.usage.output_tokens || 0)}</td><td>${r.has_calls ? 'tool calls' : 'trace'}</td><td><a href="${A.replayHref(r.scenario, agent, 'standard_practice')}">replay</a> · <a href="steps.html?scenario=${r.scenario}&agents=${encodeURIComponent(agent)},standard_practice&attempt=${r.tag || 'latest'}&view=D">steps</a></td></tr>`; }).join('');
    tb.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', () => { const k = th.dataset.key; if (sortState.key === k) sortState.dir *= -1; else { sortState.key = k; sortState.dir = k === 'profit' || k === 'sp' ? -1 : 1; } renderAttempts(); }));
  }
  renderAttempts();

  Promise.all(attempts.map(A.loadRun)).then(runs => {
    const Ds = runs.map((run, i) => S.deriveSteps(run, A.scenario(attempts[i].scenario)));
    // fingerprint over all attempts
    const tr = S.transitions(Ds.map(D => D.steps)); $('fp').appendChild(A.fingerprintSvg(tr, Ds.every(D => D.source === 'transcript')));
    $('fp').insertAdjacentHTML('beforeend', `<div class="src-note">${Ds.filter(D => D.source === 'transcript').length} of ${Ds.length} attempts with transcript tool calls; the rest contribute field actions, soil tests and harvests only.</div>`);
    // crop mix (tier 2/3)
    const mix = {}; let fsTotal = 0;
    Ds.forEach((D, i) => { if (attempts[i].tier < 2) return; for (const seq of Object.values(D.crops)) for (const s of seq) { mix[s.crop] = (mix[s.crop] || 0) + 1; fsTotal++; } });
    const mixEl = $('cropmix');
    if (fsTotal) { mixEl.innerHTML = `<div class="cropmix">${Object.entries(mix).sort((x, y) => y[1] - x[1]).map(([c, k]) => `<span style="flex:${k};background:${cropColor(c)}" title="${A.cropLabel(c)}: ${k} field-seasons (${Math.round(k / fsTotal * 100)} %)">${A.cropLabel(c)} ${Math.round(k / fsTotal * 100)}%</span>`).join('')}</div><div class="small muted" style="margin-top:4px">${fsTotal} field-seasons sown across ${Ds.filter((D, i) => attempts[i].tier >= 2).length} tier 2/3 attempts</div>`; }
    else mixEl.innerHTML = '<span class="muted small">no tier 2/3 runs</span>';
    // input profile
    let fieldSeasons = 0, N = 0, mm = 0, tests = 0, harvests = 0, early = 0, rejected = 0, episodes = runs.length;
    Ds.forEach((D, i) => { const card = A.scenario(attempts[i].scenario); fieldSeasons += card.ha_seasons / card.total_area_ha * card.fields.length; for (const s of D.steps) { if (s.cls === 'FEED') N += +s.v || 0; else if (s.cls === 'WATER') mm += +s.v || 0; else if (s.tool === 'soil_test' && !s.err) tests++; else if (s.cls === 'HARVEST') { harvests++; if (s.early) early++; } } rejected += runs[i].rejected_actions || 0; });
    $('kpis').innerHTML = [
      [`${Math.round(N / Math.max(1, fieldSeasons))} kg`, 'N per field-season'], [`${Math.round(mm / Math.max(1, fieldSeasons))} mm`, 'irrigation per field-season'],
      [(tests / episodes).toFixed(1), 'soil tests per episode'], [`${harvests ? Math.round(early / harvests * 100) : 0} %`, 'harvests before maturity'],
      [String(rejected), 'rejected actions (all runs)'], [(runs.reduce((x, r) => x + (r.decision_stops || 0), 0) / episodes).toFixed(0), 'decision stops per episode'],
    ].map(([v, l]) => `<div class="kpi px-inset"><b>${v}</b><span>${l}</span></div>`).join('');
    // best / worst by SP
    const scored = attempts.map((r, i) => ({ r, i, sp: spScore(r.scenario, r.profit_usd) })).filter(x => x.sp != null).sort((x, y) => y.sp - x.sp);
    const note = (x, label) => {
      if (!x) return `<h4>${label}</h4><span class="muted">–</span>`;
      const run = runs[x.i], D = Ds[x.i], card = A.scenario(x.r.scenario);
      const hs = D.steps.filter(s => s.cls === 'HARVEST' && s.revenue != null).sort((p, q2) => q2.revenue - p.revenue);
      const bits = [];
      if (hs[0]) bits.push(`largest harvest ${A.cropLabel(hs[0].crop || '').toLowerCase()} ${hs[0].kg ? hs[0].kg.toLocaleString('en-US') + ' kg/ha' : ''} → ${A.usd(hs[0].revenue)}${hs[0].early ? ' (before maturity)' : ''}`);
      if (!hs.length) bits.push('never harvested');
      if (run.rejected_actions) bits.push(`${run.rejected_actions} rejected action${run.rejected_actions > 1 ? 's' : ''}`);
      const sown = Object.values(D.crops).reduce((s2, seq) => s2 + seq.length, 0); bits.push(`${sown} sowing${sown === 1 ? '' : 's'}, ${D.counts.FEED} fertilizer and ${D.counts.WATER} irrigation calls`);
      const stressDays = Object.values(run.fields).reduce((s2, f) => s2 + f.stress.filter(v => v != null && v < 0.7).length, 0); if (stressDays) bits.push(`${stressDays} field-days of water stress`);
      return `<h4>${label}</h4><div><b>${A.esc(card.title)}</b> · ${x.r.tag || 'run'} · SP ${x.sp.toFixed(2)} · ${A.usd(x.r.profit_usd)}</div><div class="small" style="margin-top:4px">${bits.join(' · ')}</div><div class="small" style="margin-top:6px"><a class="btn" href="${A.replayHref(x.r.scenario, agent, 'standard_practice')}&day=120">▶ replay</a> <a class="btn" href="steps.html?scenario=${x.r.scenario}&agents=${encodeURIComponent(agent)},standard_practice&attempt=${x.r.tag || 'latest'}&view=D">deviation DAG</a></div>`;
    };
    $('best').innerHTML = note(scored[0], 'Best run'); $('worst').innerHTML = note(scored[scored.length - 1], 'Worst run');
  }).catch(err => { $('fp').textContent = 'Could not load runs: ' + err.message; });
  function cropColor(c) { const k = (A.CROP_COLORS[c] || { leaf: [90, 150, 90] }).leaf; return `rgb(${k.join(',')})`; }
})();
