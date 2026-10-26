/* Replay page: one or two synced farms, weather timeline, per-field state panels with a change log. */
(function () {
  'use strict';
  const A = window.AGRI;
  A.initUnits();
  A.drawLogo(document.getElementById('logo'));

  const IDX = A.index();
  const $ = id => document.getElementById(id);
  const selS = $('sel-scenario'), selA = $('sel-a'), selB = $('sel-b');
  const state = { scenario: null, a: null, b: null, day: 0, n: 0, playing: false, speed: 12, panels: [], runs: [], acc: 0, phase: 0, timer: null, anim: null };
  const ACTION_KINDS = ['planting', 'fertilizer', 'irrigation', 'harvest', 'soil_test'];

  // ------------------------------------------------------------ selectors
  function fillScenarios() {
    selS.innerHTML = IDX.scenarios.map(s => `<option value="${s.id}">T${s.tier} · ${A.esc(s.title)}</option>`).join('');
  }
  function agentsFor(sid) {
    const seen = new Set(); const out = [];
    for (const r of IDX.runs) if (r.scenario === sid && r.has_trace && !seen.has(r.agent)) { seen.add(r.agent); out.push(r.agent); }
    const order = IDX.leaderboard.order;
    out.sort((x, y) => (order.indexOf(x) + 1 || 99) - (order.indexOf(y) + 1 || 99));
    return out;
  }
  function fillAgents(sid, keepA, keepB) {
    const ag = agentsFor(sid);
    const opt = a => { const r = A.latestRun(a, sid); return `<option value="${A.esc(a)}">${A.esc(A.agentName(a))} · ${A.usd(r.profit_usd)}${r.has_reasoning ? ' · 💭' : ''}</option>`; };
    selA.innerHTML = ag.map(opt).join('');
    selB.innerHTML = '<option value="">— none —</option>' + ag.map(opt).join('');
    const llm = ag.find(a => a.startsWith('llm:'));
    selA.value = ag.includes(keepA) ? keepA : (llm || ag[0]);
    selB.value = ag.includes(keepB) && keepB !== selA.value ? keepB : (selA.value !== 'standard_practice' && ag.includes('standard_practice') ? 'standard_practice' : (ag.includes('oracle') && selA.value !== 'oracle' ? 'oracle' : ''));
  }

  // ------------------------------------------------------------ weather words
  function rainClass(mm) { return mm == null || mm < 0.5 ? 'none' : mm < 5 ? 'light' : mm < 15 ? 'moderate' : 'heavy'; }
  function heatWord(t) { return t == null ? '' : t < 5 ? 'cold' : t < 12 ? 'cool' : t < 20 ? 'mild' : t < 27 ? 'warm' : 'hot'; }
  function weatherText(w, i) {
    const rain = w.rain[i] || 0, t = w.tmax[i];
    const rc = rainClass(rain), heat = heatWord(t);
    const tTxt = t == null ? '' : A.temp(t);
    let head;
    if (rc === 'none') head = `Dry, ${heat} · ${tTxt} · no rain`;
    else if (t != null && t < 1) head = `Snow ${rain.toFixed(1)} mm · ${tTxt}`;
    else head = `${rc[0].toUpperCase() + rc.slice(1)} rain ${rain < 10 ? rain.toFixed(1) : Math.round(rain)} mm · ${tTxt}`;
    let sum = 0, wet = 0; for (let k = Math.max(0, i - 6); k <= i; k++) { sum += w.rain[k] || 0; if ((w.rain[k] || 0) >= 0.5) wet++; }
    return { head, week: `last 7 days: ${Math.round(sum)} mm rain on ${wet} day${wet === 1 ? '' : 's'}`, cls: rc };
  }

  // ------------------------------------------------------------ per-run derived data: stages, season totals, events
  function stageName(f, i, stubbleSince) {
    const crop = f.crop[i], dvs = f.dvs[i];
    if (!crop) return (stubbleSince >= 0 && i - stubbleSince < 60) ? 'harvested, stubble' : 'bare soil';
    if (dvs == null || dvs >= 1.95) return 'mature, awaiting harvest';
    if (dvs < 0) return 'sown, not emerged';
    if (dvs < 0.95) return 'vegetative';
    if (dvs < 1.45) return 'flowering';
    return 'grain / tuber filling';
  }
  function parseHarvest(note) { // "potato 17885 kg/ha x 0.55 USD x 10 ha; stood 1 days ..."
    const m = /^(?:episode end: )?(\w+) (\d+) kg\/ha/.exec(note || '');
    return m ? { crop: m[1], kg: +m[2] } : null;
  }
  function derive(run, card, farm) {
    const start = farm.start, n = farm.n;
    const dayOf = d => A.dayDiff(start, d);
    const events = []; // {day, field, kind, text, cls}
    const push = (day, field, kind, text, cls) => { if (day >= 0 && day < n) events.push({ day, field, kind, text, cls: cls || kind }); };
    const per = {};
    for (const [fid, f] of Object.entries(run.fields)) {
      const spec = card.fields.find(x => x.field_id === fid) || {};
      const wp = spec.wilting_point ?? 0.1, fc = spec.field_capacity ?? 0.3;
      const seasonN = new Array(f.n).fill(0), seasonIrr = new Array(f.n).fill(0), variety = new Array(f.n).fill(null), stage = new Array(f.n), stubble = new Array(f.n).fill(-1);
      let sN = 0, sI = 0, varName = null, lastCropGone = -1, prevStage = null, below40 = false, aboveFC = false, stressed = false, nZero = false, lastWetLog = -99;
      const nav0 = k => f.navail[k] == null ? 0 : f.navail[k];
      for (let i = 0; i < f.n; i++) {
        const crop = f.crop[i];
        if (!crop) { if (i > 0 && f.crop[i - 1]) { lastCropGone = i; varName = null; } }
        stubble[i] = lastCropGone;
        for (const a of f.actions[i] || []) {
          let m;
          if ((m = /^planted (\w+)\/(\S+)/.exec(a))) { varName = m[2]; sN = 0; sI = 0; push(i, fid, 'planting', `Planted ${A.cropLabel(m[1]).toLowerCase()} (${m[2]})`); }
          else if ((m = /^fertilized ([\d.]+) kg N\/ha(.*)/.exec(a))) { sN += +m[1]; push(i, fid, 'fertilizer', `Fertilized ${Math.round(+m[1])} kg N/ha${m[2] && /lost/.test(m[2]) ? ' (part lost: soil above field capacity)' : ''}`); }
          else if ((m = /^irrigated ([\d.]+) mm/.exec(a))) { sI += +m[1]; push(i, fid, 'irrigation', `Irrigated ${Math.round(+m[1])} mm`); }
        }
        seasonN[i] = sN; seasonIrr[i] = sI; variety[i] = crop ? varName : null;
        const st = stageName(f, i, lastCropGone); stage[i] = st;
        if (prevStage !== null && st !== prevStage && st !== 'bare soil' && st !== 'harvested, stubble' && st !== 'sown, not emerged') {
          const label = crop ? A.cropLabel(crop).toLowerCase() : 'field'; // sowing itself is logged as the planting action
          push(i, fid, 'stage', st === 'vegetative' ? `${label} emerged` : st === 'mature, awaiting harvest' ? `${label} is mature: harvest it` : `${label} reached ${st}`);
        }
        prevStage = st;
        // soil water thresholds (available water between wilting point and field capacity)
        const sm = f.sm[i];
        if (sm != null) {
          const aw = (sm - wp) / (fc - wp);
          if (!below40 && aw < 0.4 && crop) { below40 = true; push(i, fid, 'soil', `soil fell below 40 % available water (${Math.round(aw * 100)} %)`); }
          else if (below40 && aw >= 0.55) { below40 = false; push(i, fid, 'soil', `soil water recovered (${Math.round(aw * 100)} % available)`); }
          // hysteresis + 14-day debounce so wet spells log once, not on every flicker around field capacity
          if (!aboveFC && sm > fc + 0.01) { aboveFC = true; if (i - lastWetLog > 14) { push(i, fid, 'soil', `soil above field capacity: leaching risk${(nav0(i) >= 5) ? ` (${Math.round(nav0(i))} kg N/ha exposed)` : ''}`); } lastWetLog = i; }
          else if (aboveFC && sm < fc - 0.01) { aboveFC = false; if (crop) push(i, fid, 'soil', 'soil drained back below field capacity'); }
        }
        const str = f.stress[i];
        if (crop && str != null && f.dvs[i] != null && f.dvs[i] >= 0) {
          if (!stressed && str < 0.7) { stressed = true; push(i, fid, 'stress', `water stress began (transpiration ${Math.round(str * 100)} % of potential)`); }
          else if (stressed && str >= 0.9) { stressed = false; push(i, fid, 'stress', 'water stress relieved'); }
        } else if (!crop) stressed = false;
        const nav = f.navail[i];
        if (crop && nav != null) {
          if (!nZero && nav < 1 && (i === 0 || (f.navail[i - 1] || 0) >= 1)) { nZero = true; push(i, fid, 'nitrogen', 'mineral N exhausted (0 kg/ha)'); }
          else if (nZero && nav >= 5) nZero = false;
        } else nZero = false;
      }
      per[fid] = { seasonN, seasonIrr, variety, stage, stubble, wp, fc, sat: spec.saturation, area: spec.area_ha };
    }
    // ledger-driven events: harvests, soil tests, leaching, rejected, residual N
    for (const e of run.ledger) {
      const d = dayOf(e.date); const f = run.fields[e.field];
      if (e.kind === 'harvest') {
        const h = parseHarvest(e.note);
        push(d, e.field, 'harvest', h ? `Harvested ${A.cropLabel(h.crop).toLowerCase()} ${h.kg.toLocaleString('en-US')} kg/ha → ${e.usd >= 0 ? '+' : ''}${A.usd(e.usd)}${/before maturity/.test(e.note) ? ' (before maturity)' : ''}${/rotation penalty/.test(e.note) ? ' · rotation penalty' : ''}` : `Harvest → ${A.usd(e.usd)}`);
      } else if (e.kind === 'soil_test' && f) {
        const j = Math.min(f.n - 1, Math.max(0, d)); // the test reads the state of that day
        push(d, e.field, 'soil_test', `Soil test: N ${Math.round(f.navail[j] ?? 0)} kg/ha, moisture ${f.sm[j] != null ? f.sm[j].toFixed(2) : '–'}`);
      } else if (e.kind === 'leaching_penalty') push(d, e.field, 'penalty', `Leaching penalty ${A.usd(e.usd)} (${e.note})`);
      else if (e.kind === 'residual_n_penalty') push(d, e.field, 'penalty', `Residual N penalty ${A.usd(e.usd)} (${e.note})`);
      else if (e.kind === 'rejected') push(d, e.field, 'rejected', `Rejected action: ${e.note}`);
    }
    for (const p of card.price_shocks || []) {
      push(dayOf(p.announce), null, 'news', `News: ${p.headline}`);
      push(dayOf(p.effective), null, 'news', `Price change: ${p.crop === '__nitrogen__' ? 'nitrogen' : A.cropLabel(p.crop).toLowerCase()} ×${p.factor}`);
    }
    push(0, null, 'episode', `Episode starts with ${A.usd(card.cash.initial)} cash${card.cash.credit_limit ? ` and ${A.usd(card.cash.credit_limit)} credit` : ''}`);
    push(n - 1, null, 'episode', `Episode over · profit ${A.usd(run.profit_usd)} (${A.usd(run.profit_usd / (card.ha_seasons || 1))} per ha-season)`);
    const prio = { episode: 0, news: 1, planting: 2, fertilizer: 3, irrigation: 4, harvest: 5, soil_test: 6, stage: 7, stress: 8, soil: 9, nitrogen: 10, penalty: 11, rejected: 12 };
    events.sort((a, b) => a.day - b.day || (prio[a.kind] ?? 20) - (prio[b.kind] ?? 20));
    return { per, events };
  }

  // ------------------------------------------------------------ loading
  async function load() {
    state.scenario = selS.value; state.a = selA.value; state.b = selB.value || null;
    const card = A.scenario(state.scenario);
    const url = new URL(location.href); url.searchParams.set('scenario', state.scenario); url.searchParams.set('a', state.a);
    if (state.b) url.searchParams.set('b', state.b); else url.searchParams.delete('b');
    history.replaceState(null, '', url);
    const sl = $('steps-link'); if (sl) sl.href = `steps.html?scenario=${encodeURIComponent(state.scenario)}&agents=${encodeURIComponent([state.a, state.b].filter(Boolean).join(','))}&view=D`;
    $('title').textContent = card.title;
    $('subtitle').textContent = `${card.description} ${A.fmtDate(card.start)} → ${A.fmtDate(card.end)} · ${card.fields.length} field${card.fields.length > 1 ? 's' : ''} · ${card.location}`;
    const entries = [A.latestRun(state.a, state.scenario), state.b ? A.latestRun(state.b, state.scenario) : null].filter(Boolean);
    const runs = await Promise.all(entries.map(A.loadRun));
    state.runs = runs;
    state.n = Math.max(...runs.map(r => r.weather.rain.length));
    state.day = Math.min(state.day, state.n - 1);
    buildRunPanels(card, runs);
    $('scrub').max = state.n - 1;
    drawWeather(card, runs[0]);
    render();
  }

  function scoreOf(run) { const ag = IDX.leaderboard.agents[run.agent]; const row = ag && ag.rows[run.scenario]; return row ? row.sp_score : null; }

  function buildRunPanels(card, runs) {
    const wrap = $('runs'); wrap.innerHTML = ''; wrap.classList.toggle('two', runs.length === 2);
    state.panels = [];
    runs.forEach(run => {
      const el = document.createElement('div'); el.className = 'run px';
      const score = scoreOf(run); const perHa = run.profit_usd / (card.ha_seasons || 1);
      el.innerHTML = `
        <div class="head">
          <div class="line1"><span class="name" title="${A.esc(run.agent)} (${A.esc(A.agentName(run.agent))})">${A.esc(A.agentName(run.agent))}</span><span class="agent-kind">${A.agentKind(run.agent)}</span></div>
          <div class="line2"><span class="cash" data-cash title="cash (running ledger)">—</span><span class="profit" title="final profit ${A.usd(run.profit_usd)} · ${A.usd(perHa)} per ha-season${score != null ? ` · SP ${score.toFixed(2)}` : ''}">final ${A.usd(run.profit_usd)} · ${A.usd(perHa)}/ha-season${score != null ? ` · SP ${score.toFixed(2)}` : ''}</span></div>
        </div>
        <div class="farm"><canvas aria-label="Pixel farm for ${A.esc(run.agent)}"></canvas><div class="labels"></div><div class="chips-layer" data-chips></div></div>
        <canvas class="swim" data-swim aria-label="Decision steps of ${A.esc(run.agent)} over the episode"></canvas>
        <div class="sec fields" data-fields></div>
        <div class="sec log-wrap"><h4>Change log <span class="muted" data-logcount></span></h4><ol class="log px-inset" data-log></ol></div>
        <div class="sec extras">
          ${run.thoughts ? '<div><h4>Agent reasoning</h4><div class="thought px-inset" data-thought></div></div>' : (run.agent.startsWith('llm:') ? '<div class="small muted">This model returned tool calls without visible reasoning text.</div>' : '')}
          <details class="ledger-details"><summary>Ledger (${run.ledger.length} entries)</summary><div class="ledger px-inset" data-ledger><table><tbody></tbody></table></div></details>
        </div>`;
      wrap.appendChild(el);
      const canvas = el.querySelector('canvas');
      const farm = new A.Farm(canvas, card, run);
      const D = derive(run, card, farm);
      // hover titles for action icons on the canvas
      canvas.addEventListener('mousemove', ev => {
        const r = canvas.getBoundingClientRect(); const px = (ev.clientX - r.left) / r.width * canvas.width, py = (ev.clientY - r.top) / r.height * canvas.height;
        const t = farm.bubbleAt(px, py); canvas.title = t || ''; canvas.style.cursor = t ? 'help' : 'default';
      });
      // field labels positioned over plots
      const labels = el.querySelector('.labels');
      farm.L.plots.forEach(p => {
        const s = document.createElement('span');
        s.textContent = `${p.id} · ${card.fields.find(f => f.field_id === p.id).area_ha} ha ${A.soilLabel(p.soil)}`;
        s.style.left = ((p.x + p.w / 2) / farm.L.W * 100) + '%'; s.style.top = ((p.y + p.h) / farm.L.H * 100) + '%';
        labels.appendChild(s);
      });
      // state panels
      el.querySelector('[data-fields]').innerHTML = Object.keys(run.fields).map(fid => `
        <div class="field-card px-inset" data-field="${A.esc(fid)}">
          <div class="fhead"><b>${A.esc(fid)}</b> <span class="muted small">${card.fields.find(f => f.field_id === fid).area_ha} ha ${A.soilLabel(card.fields.find(f => f.field_id === fid).soil)}</span><span class="stage-pill" data-stage></span></div>
          <div class="crop-line" data-crop></div>
          <dl class="grid" data-grid></dl>
          <div class="soil-bar-wrap"><span class="small muted">soil water</span><div class="soil-bar" data-soil title="root-zone moisture between wilting point (left) and field capacity (tick); beyond the tick the soil is above field capacity, up to saturation"><i data-soilfill></i><em data-sat></em></div><span class="small" data-soilval></span></div>
        </div>`).join('');
      // change log rows, newest first
      const log = el.querySelector('[data-log]');
      const evs = D.events.slice().reverse();
      log.innerHTML = evs.map(e => `<li class="ev ${e.cls}" data-day="${e.day}"><span class="when">Day ${e.day + 1} · ${A.fmtDate(A.addDays(farm.start, e.day)).replace(/ \d{4}$/, '')}</span><span class="fld">${e.field ? A.esc(e.field) : ''}</span><span class="txt">${A.esc(e.text)}</span></li>`).join('');
      const logRows = Array.from(log.children).map((li, k) => ({ li, day: evs[k].day }));
      // ledger rows
      const ledgerBody = el.querySelector('[data-ledger] tbody');
      ledgerBody.innerHTML = run.ledger.map(e => `<tr data-d="${A.dayDiff(farm.start, e.date)}"><td>${A.esc(e.date)}</td><td><span class="kind">${A.esc(e.kind.replace(/_/g, ' '))}</span>${e.field ? ' · ' + A.esc(e.field) : ''}<br><span class="muted">${A.esc(e.note)}</span></td><td class="eur ${e.usd > 0 ? 'pos' : e.usd < 0 ? 'neg' : ''}">${e.usd > 0 ? '+' : ''}${A.usd(e.usd)}</td></tr>`).join('');
      const init = card.cash.initial; let c = init; const cum = run.ledger.map(e => (c += e.usd));
      const ledgerDays = run.ledger.map(e => A.dayDiff(farm.start, e.date));
      state.panels.push({ el, run, farm, D, cum, init, ledgerDays, ledgerRows: Array.from(ledgerBody.children), logRows, lastLedgerIdx: -2, lastLogDay: -2, lastChipKey: '' });
    });
  }

  // ------------------------------------------------------------ rendering
  function meter(v, color, title) { return `<span class="meter" title="${title || ''}"><i style="width:${Math.round(Math.max(0, Math.min(1, v)) * 100)}%;background:${color}"></i></span>`; }
  function render() {
    const i = state.day;
    $('scrub').value = i;
    const w0 = state.runs[0].weather;
    const date = A.addDays(w0.start, i);
    $('date').textContent = `${A.fmtDate(date)} · day ${i + 1}/${state.n}`;
    const wx = weatherText(w0, i);
    const wxEl = $('wx-text'); wxEl.className = 'wx ' + wx.cls; wxEl.innerHTML = `<b>${A.esc(wx.head)}</b> <span class="muted">· ${A.esc(wx.week)}</span>`;
    state.panels.forEach(p => {
      p.farm.draw(i, state.phase);
      // cash from ledger
      let k = -1; while (k + 1 < p.ledgerDays.length && p.ledgerDays[k + 1] <= i) k++;
      const cash = k >= 0 ? p.cum[k] : p.init;
      const cashEl = p.el.querySelector('[data-cash]'); cashEl.textContent = A.usd(cash); cashEl.classList.toggle('neg', cash < 0);
      if (k !== p.lastLedgerIdx) {
        p.ledgerRows.forEach((r, j) => { r.classList.toggle('now', j === k); r.style.display = j <= k ? '' : 'none'; });
        p.lastLedgerIdx = k;
      }
      // fields
      for (const [fid, f] of Object.entries(p.run.fields)) {
        const row = p.el.querySelector(`[data-field="${CSS.escape(fid)}"]`);
        const d = p.D.per[fid];
        const crop = f.crop[i], dvs = f.dvs[i], lai = f.lai[i], wso = f.wso[i], sm = f.sm[i], nav = f.navail[i], str = f.stress[i];
        const st = d.stage[i];
        const pill = row.querySelector('[data-stage]'); pill.textContent = st; pill.dataset.kind = st.split(/[ ,]/)[0];
        row.querySelector('[data-crop]').innerHTML = crop ? `<b>${A.esc(A.cropLabel(crop))}</b> <span class="muted">${A.esc(d.variety[i] || '')}</span>` : `<span class="muted">no crop</span>`;
        const stressTxt = str == null || dvs == null || dvs < 0 ? '–' : str.toFixed(2);
        row.querySelector('[data-grid]').innerHTML =
          `<dt>dvs</dt><dd>${crop && dvs != null ? dvs.toFixed(2) : (crop ? '2.00' : '–')}</dd>` +
          `<dt>canopy LAI</dt><dd>${crop && lai != null ? lai.toFixed(1) : '–'}</dd>` +
          `<dt>storage organ</dt><dd>${crop && wso != null ? Math.round(wso).toLocaleString('en-US') + ' kg/ha' : '–'}</dd>` +
          `<dt>mineral N</dt><dd class="${nav != null && nav < 1 && crop ? 'warn' : ''}">${nav == null ? '–' : Math.round(nav) + ' kg/ha'}</dd>` +
          `<dt>water stress</dt><dd class="${str != null && str < 0.7 && crop ? 'warn' : ''}">${stressTxt}${crop && str != null && dvs != null && dvs >= 0 ? ' ' + meter(str, str < 0.7 ? 'var(--danger)' : 'var(--accent)', '1.0 = no stress') : ''}</dd>` +
          `<dt>season N</dt><dd>${Math.round(d.seasonN[i])} kg/ha</dd>` +
          `<dt>season irrigation</dt><dd>${Math.round(d.seasonIrr[i])} mm</dd>`;
        // soil bar: wp..fc, saturation tick beyond
        const span = (d.sat || d.fc * 1.3) - d.wp;
        const frac = sm == null ? 0 : Math.max(0, Math.min(1, (sm - d.wp) / span));
        const fcPos = (d.fc - d.wp) / span;
        const fill = row.querySelector('[data-soilfill]'); fill.style.width = (frac * 100) + '%';
        fill.className = sm != null && sm > d.fc ? 'wet' : sm != null && (sm - d.wp) / (d.fc - d.wp) < 0.4 ? 'dry' : '';
        row.querySelector('[data-sat]').style.left = (fcPos * 100) + '%';
        row.querySelector('[data-soilval]').textContent = sm == null ? '–' : `${sm.toFixed(2)} · ${Math.round(Math.max(0, (sm - d.wp) / (d.fc - d.wp)) * 100)} % available`;
      }
      // change log: show events up to today, newest first; recent ones highlighted
      if (p.lastLogDay !== i) {
        let shown = 0;
        for (const r of p.logRows) { const vis = r.day <= i; r.li.style.display = vis ? '' : 'none'; if (vis) shown++; r.li.classList.toggle('fresh', vis && i - r.day <= 4); }
        p.el.querySelector('[data-logcount]').textContent = `(${shown})`;
        p.el.querySelector('[data-log]').scrollTop = 0;
        p.lastLogDay = i;
      }
      // event chips over the field for actions in the last 10 days
      const chips = p.D.events.filter(e => ACTION_KINDS.includes(e.kind) && e.day <= i && i - e.day <= 10);
      const key = chips.map(e => e.day + e.text).join('|') + (chips.some(e => i - e.day === 8) ? '*' : '');
      if (key !== p.lastChipKey) {
        p.lastChipKey = key;
        const layer = p.el.querySelector('[data-chips]'); layer.innerHTML = '';
        const byField = {};
        for (const e of chips) (byField[e.field] = byField[e.field] || []).push(e);
        for (const [fid, list] of Object.entries(byField)) {
          const plot = p.farm.L.plots.find(q => q.id === fid); if (!plot) continue;
          const col = document.createElement('div'); col.className = 'chip-col';
          col.style.left = ((plot.x + plot.w / 2) / p.farm.L.W * 100) + '%'; col.style.top = ((plot.y + 0.3) / p.farm.L.H * 100) + '%';
          list.slice(-3).forEach(e => { const c = document.createElement('span'); c.className = `evchip ${e.kind}`; c.title = `${A.ICON_TITLE[e.kind]} · day ${e.day + 1}`; c.textContent = e.text; if (i - e.day > 7) c.classList.add('fading'); col.appendChild(c); });
          layer.appendChild(col);
        }
      }
      // reasoning
      if (p.run.thoughts) {
        let t = null; for (const th of p.run.thoughts) { if (A.dayDiff(p.farm.start, th.date) <= i) t = th; else break; }
        const box = p.el.querySelector('[data-thought]');
        if (!t) { box.className = 'thought px-inset empty'; box.textContent = 'No reasoning yet.'; }
        else if (box.dataset.key !== t.stop + '/' + t.round) {
          box.dataset.key = t.stop + '/' + t.round; box.className = 'thought px-inset';
          box.innerHTML = `<div class="when"><span>${A.fmtDate(t.date)} · stop ${t.stop}</span>${t.tools.map(x => `<span class="tool">${A.esc(x)}</span>`).join('')}</div>${A.esc(t.text)}`;
          box.scrollTop = 0;
        }
      }
    });
    drawPlayhead();
  }

  // rain animation while paused: redraw canvases only (cheap) on rainy days
  function animLoop() {
    state.phase += 1;
    const rainy = state.runs.length && (state.runs[0].weather.rain[state.day] || 0) >= 0.2;
    if (rainy && !state.playing && !document.hidden) state.panels.forEach(p => p.farm.draw(state.day, state.phase));
    state.anim = setTimeout(animLoop, 80);
  }

  // ------------------------------------------------------------ weather strip
  const wc = $('weather'); const wstatic = document.createElement('canvas'); let wready = false; let wgeom = null;
  function drawWeather(card, run) {
    const w = run.weather; const n = w.rain.length;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = wc.clientWidth || 800, cssH = 80;
    wc.width = cssW * dpr; wc.height = cssH * dpr; wstatic.width = wc.width; wstatic.height = wc.height;
    const ctx = wstatic.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = A.isDark();
    ctx.fillStyle = dark ? '#1d2127' : '#f6f1df'; ctx.fillRect(0, 0, cssW, cssH);
    const padL = 34, padR = 34, padB = 14, top = 14, plotH = cssH - padB - top, plotW = cssW - padL - padR;
    const x = i => padL + i / n * plotW, bw = Math.max(2, plotW / n);
    wgeom = { padL, plotW, top, plotH, cssW, cssH };
    const ink = dark ? '#b8b2a0' : '#5a5243', faint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
    // month ticks
    for (let i = 0; i < n; i++) { const d = A.addDays(w.start, i); if (d.slice(8) === '01') { ctx.fillStyle = faint; ctx.fillRect(x(i), top, 1, plotH); const m = +d.slice(5, 7); if (m % 2 === 1 || n < 400) { ctx.fillStyle = ink; ctx.fillText(A.MONTHS[m - 1] + (m === 1 ? ' ' + d.slice(2, 4) : ''), x(i) + 3, cssH - padB + 4); } } }
    // rain axis (left, mm)
    const maxR = Math.max(10, Math.ceil(Math.max(...w.rain.filter(v => v != null)) / 5) * 5);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of [0, maxR / 2, maxR]) { const y = top + plotH - v / maxR * plotH; ctx.fillStyle = faint; ctx.fillRect(padL, y, plotW, 1); ctx.fillStyle = ink; ctx.fillText(`${v}`, padL - 5, y); }
    ctx.save(); ctx.translate(9, top + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = '#1e7fe0'; ctx.fillText('rain mm', 0, 0); ctx.restore();
    ctx.save(); ctx.translate(cssW - 6, top + plotH / 2); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,110,40,0.9)'; ctx.fillText(A.tempUnit(), 0, 0); ctx.restore();
    // temperature axis (right, °C): secondary
    const ts = w.tmax.filter(v => v != null); const tmin = Math.min(-5, ...ts), tmaxv = Math.max(30, ...ts);
    const ty = t => top + plotH - (t - tmin) / (tmaxv - tmin) * plotH;
    ctx.textAlign = 'left'; ctx.fillStyle = dark ? 'rgba(240,160,90,0.8)' : 'rgba(200,110,40,0.9)';
    for (const v of [0, 15, 30]) ctx.fillText(`${Math.round(A.tempValue(v))}°`, padL + plotW + 5, ty(v));
    ctx.fillStyle = 'rgba(224,120,42,0.25)'; ctx.fillRect(padL, ty(0), plotW, 1);
    // rain bars: saturated blue
    ctx.fillStyle = dark ? '#3d94ff' : '#1e7fe0';
    for (let i = 0; i < n; i++) { const r = w.rain[i] || 0; if (r > 0) { const h = Math.max(1, r / maxR * plotH); ctx.fillRect(x(i), top + plotH - h, bw, h); } }
    // temperature line (thin, muted)
    ctx.strokeStyle = dark ? 'rgba(240,160,90,0.75)' : 'rgba(210,110,40,0.75)'; ctx.lineWidth = 1; ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) { const t = w.tmax[i]; if (t == null) continue; const y = ty(t); if (!started) { ctx.moveTo(x(i), y); started = true; } else ctx.lineTo(x(i) + bw / 2, y); }
    ctx.stroke();
    // action markers from loaded runs (A upper row, B lower)
    state.runs.forEach((r, k) => {
      for (const e of r.ledger) {
        const i = A.dayDiff(w.start, e.date); if (i < 0 || i >= n) continue;
        if (e.kind === 'harvest') { ctx.fillStyle = '#e3b341'; ctx.fillRect(x(i) - 1, 1 + k * 6, 3, 5); }
        else if (ACTION_KINDS.includes(e.kind)) { ctx.fillStyle = { planting: '#2d7a2d', fertilizer: '#d9a21b', irrigation: '#4aa3ff', soil_test: '#a05cff' }[e.kind]; ctx.fillRect(x(i), 2 + k * 6, 2, 3); }
      }
    });
    wready = true;
    drawSwim(card);
    drawPlayhead();
  }

  // ---- compact swimlane of decision steps, one per run panel, drawn directly under the pixel farm; follows the scrub cursor
  const SW = { padL: 50, padR: 8, laneH: 8, bandH: 4, headH: 0, gap: 3 };
  function drawSwim(card) {
    const CL = A.STEP_CLASSES; const n = state.n; const dpr = Math.min(2, window.devicePixelRatio || 1);
    state.panels.forEach(p => {
      const cv = p.el.querySelector('[data-swim]'); if (!cv) return;
      if (!p.S) p.S = A.steps.deriveSteps(p.run, card);
      const nf = card.fields.length;
      const cssW = cv.clientWidth || p.el.clientWidth || 600; const cssH = 4 + nf * SW.bandH + SW.gap + CL.length * SW.laneH + 4;
      cv.width = cssW * dpr; cv.height = cssH * dpr; cv.style.height = cssH + 'px';
      const st = p.swStatic || (p.swStatic = document.createElement('canvas')); st.width = cv.width; st.height = cv.height;
      const ctx = st.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#f6f1df'; ctx.fillRect(0, 0, cssW, cssH);
      const plotW = cssW - SW.padL - SW.padR; const x = i => SW.padL + i / n * plotW, pxd = plotW / n;
      p.swGeom = { padL: SW.padL, plotW, cssW, cssH };
      for (let i = 0; i < n; i++) { const d = A.addDays(p.run.weather.start, i); if (d.slice(8) === '01') { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(x(i), 0, 1, cssH); } }
      ctx.font = '8px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
      let y = 4;
      card.fields.forEach(f => {
        for (const sg of (p.S.segments[f.field_id] || [])) { const k = (A.CROP_COLORS[sg.crop] || { leaf: [90, 150, 90] }).leaf; ctx.fillStyle = `rgba(${k.join(',')},${A.STAGE_SHADE[sg.stage] || 0.3})`; ctx.fillRect(x(sg.from), y, Math.max(1, x(sg.to + 1) - x(sg.from)), SW.bandH - 1); }
        ctx.fillStyle = '#8a8070'; ctx.fillText(f.field_id.slice(0, 9), 2, y - 1);
        y += SW.bandH;
      });
      y += SW.gap;
      const laneY = {};
      CL.forEach((c, ci) => { const ly = y + ci * SW.laneH; laneY[c.id] = ly; ctx.fillStyle = ci % 2 ? 'rgba(0,0,0,.025)' : 'rgba(0,0,0,.05)'; ctx.fillRect(SW.padL - 2, ly, plotW + 4, SW.laneH); ctx.fillStyle = c.color; ctx.fillText(c.label, 2, ly); });
      for (const s of p.S.steps) {
        const ly = laneY[s.cls] + SW.laneH / 2; const col = A.STEP[s.cls].color; const cx = x(s.day) + pxd / 2;
        if (s.cls === 'CONTROL') { ctx.fillStyle = col; ctx.globalAlpha = .7; ctx.fillRect(x(s.day), ly - 2, Math.max(2, (s.width || 1) * p.S.interval * pxd - 1), 4); ctx.globalAlpha = 1; continue; }
        const r = 1.6 * (s.size || 1) + 0.6; ctx.beginPath(); ctx.arc(cx, ly, r, 0, Math.PI * 2);
        if (s.cls === 'REJECTED') { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
      }
      ctx.fillStyle = '#8a8070'; ctx.textAlign = 'right'; ctx.fillText(p.S.source === 'transcript' ? 'tool calls' : 'trace only', cssW - 2, 0); ctx.textAlign = 'left';
      if (!cv.dataset.bound) {
        cv.dataset.bound = '1';
        const seek = e => { const r = cv.getBoundingClientRect(); const f = Math.max(0, Math.min(1, ((e.clientX - r.left) - SW.padL) / p.swGeom.plotW)); setDay(Math.round(f * (state.n - 1))); };
        cv.addEventListener('pointerdown', e => { dragging = true; cv.setPointerCapture(e.pointerId); seek(e); });
        cv.addEventListener('pointermove', e => { if (dragging) seek(e); });
        cv.addEventListener('pointerup', () => { dragging = false; });
      }
      p.swReady = true;
    });
  }
  function drawSwimCursor() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    state.panels.forEach(p => {
      if (!p.swReady) return;
      const cv = p.el.querySelector('[data-swim]'); const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(p.swStatic, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const px = p.swGeom.padL + state.day / state.n * p.swGeom.plotW;
      ctx.fillStyle = '#23201a'; ctx.fillRect(px - 0.5, 0, 2, p.swGeom.cssH);
    });
  }
  function drawPlayhead() {
    if (!wready) return;
    const ctx = wc.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(wstatic, 0, 0);
    const dpr = Math.min(2, window.devicePixelRatio || 1); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = wgeom; const px = g.padL + state.day / state.n * g.plotW;
    const dark = A.isDark();
    ctx.fillStyle = dark ? '#ffffff' : '#23201a'; ctx.fillRect(px - 1, g.top - 4, 3, g.plotH + 6);
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 2, g.top, Math.max(1, g.plotW / state.n), g.plotH);
    // date label
    const rain = state.runs[0].weather.rain[state.day] || 0;
    const label = A.fmtDate(A.addDays(state.runs[0].weather.start, state.day)) + (rain >= 0.5 ? ` · ${Math.round(rain * 10) / 10} mm` : '');
    ctx.font = 'bold 10px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const tw = ctx.measureText(label).width + 8; let lx = px + 6; if (lx + tw > g.cssW - 4) lx = px - 6 - tw;
    ctx.fillStyle = dark ? '#e8e4d6' : '#23201a'; ctx.fillRect(lx, 1, tw, 13);
    ctx.fillStyle = dark ? '#15181c' : '#fbf8ee'; ctx.fillText(label, lx + 4, 2);
    drawSwimCursor();
  }
  function seekFromPointer(ev) {
    const r = (ev.currentTarget || wc).getBoundingClientRect(); const g = wgeom || { padL: 0, plotW: r.width };
    const f = Math.max(0, Math.min(1, ((ev.clientX - r.left) - g.padL) / g.plotW));
    setDay(Math.round(f * (state.n - 1)));
  }
  let dragging = false;
  wc.addEventListener('pointerdown', e => { dragging = true; wc.setPointerCapture(e.pointerId); seekFromPointer(e); });
  wc.addEventListener('pointermove', e => { if (dragging) seekFromPointer(e); });
  wc.addEventListener('pointerup', () => { dragging = false; });
  wc.addEventListener('pointercancel', () => { dragging = false; });

  // ------------------------------------------------------------ legend
  (function legend() {
    const el = $('legend-icons'); if (!el) return;
    el.innerHTML = ACTION_KINDS.map(k => `<span class="lg" title="${A.esc(A.ICON_TITLE[k])}"><canvas width="16" height="16" data-kind="${k}"></canvas>${A.ICON_LABEL[k]}</span>`).join('') +
      `<span class="lg" title="Rain gauge: the day's rainfall in mm"><canvas width="16" height="16" data-kind="gauge"></canvas>rain gauge</span>`;
    el.querySelectorAll('canvas').forEach(c => { if (c.dataset.kind === 'gauge') { const x = c.getContext('2d'); x.fillStyle = '#e8f4ff'; x.fillRect(5, 2, 6, 12); x.fillStyle = '#1e7fe0'; x.fillRect(6, 7, 4, 6); } else A.drawIcon(c, c.dataset.kind); });
  })();

  // ------------------------------------------------------------ transport
  function setDay(d) { state.day = Math.max(0, Math.min(state.n - 1, d)); render(); }
  $('scrub').addEventListener('input', e => setDay(+e.target.value));
  $('btn-start').addEventListener('click', () => setDay(0));
  $('btn-back').addEventListener('click', () => setDay(state.day - 7));
  $('btn-fwd').addEventListener('click', () => setDay(state.day + 7));
  $('btn-play').addEventListener('click', togglePlay);
  document.querySelectorAll('.spd').forEach(b => b.addEventListener('click', () => { state.speed = +b.dataset.spd; document.querySelectorAll('.spd').forEach(x => x.classList.toggle('active', x === b)); }));
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowRight') setDay(state.day + (e.shiftKey ? 7 : 1));
    else if (e.key === 'ArrowLeft') setDay(state.day - (e.shiftKey ? 7 : 1));
    else if (e.key === 'Home') setDay(0);
    else if (e.key === 'End') setDay(state.n - 1);
  });
  function togglePlay() {
    state.playing = !state.playing; $('btn-play').textContent = state.playing ? '❚❚' : '▶';
    if (state.playing) { if (state.day >= state.n - 1) state.day = 0; state.last = performance.now(); state.acc = 0; clearTimeout(state.timer); state.timer = setTimeout(tick, 30); }
    else clearTimeout(state.timer);
  }
  // timer-driven (not requestAnimationFrame) so playback keeps time when the tab throttles frames
  function tick() {
    if (!state.playing) return;
    const now = performance.now(); const dt = Math.min(0.5, (now - state.last) / 1000); state.last = now;
    state.acc += dt * state.speed; // speed = days per second
    state.phase += 1;
    if (state.acc >= 1) { const step = Math.floor(state.acc); state.acc -= step; const nd = state.day + step; if (nd >= state.n - 1) { state.day = state.n - 1; render(); togglePlay(); return; } setDay(nd); }
    state.timer = setTimeout(tick, 30);
  }

  // ------------------------------------------------------------ init
  fillScenarios();
  const q = A.qs();
  if (q.scenario && A.scenario(q.scenario)) selS.value = q.scenario;
  fillAgents(selS.value, q.a, q.b);
  selS.addEventListener('change', () => { fillAgents(selS.value, selA.value, selB.value); state.day = 0; load(); });
  selA.addEventListener('change', () => { if (selB.value === selA.value) selB.value = ''; load(); });
  selB.addEventListener('change', () => { if (selB.value === selA.value) { selB.value = ''; } load(); });
  window.addEventListener('resize', () => { if (state.runs.length) drawWeather(A.scenario(state.scenario), state.runs[0]); });
  A.onUnits(() => { if (state.runs.length) { buildRunPanels(A.scenario(state.scenario), state.runs); drawWeather(A.scenario(state.scenario), state.runs[0]); render(); } });
  load().then(() => { if (q.day) setDay(+q.day); else setDay(Math.min(state.n - 1, 100)); animLoop(); }).catch(err => { $('runs').innerHTML = `<div class="px" style="padding:14px">Could not load run data: ${A.esc(err.message)}</div>`; });
})();
