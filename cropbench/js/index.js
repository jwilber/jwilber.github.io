/* Landing page: leaderboard tables, headroom diagnostics, scenario cards with oracle thumbnails, hero animation. */
(function () {
  'use strict';
  const A = window.AGRI;
  A.initUnits();
  A.drawLogo(document.getElementById('logo'));
  const IDX = A.index();
  const LB = IDX.leaderboard;
  const SC = Object.fromEntries(IDX.scenarios.map(s => [s.id, s]));
  document.getElementById('formula').textContent = `Profit per hectare-season: ${IDX.formula.headline}. ${IDX.formula.sp}.`;
  document.getElementById('generated').textContent = (IDX.generated || '').replace('T', ' ');
  const ranked = LB.order.filter(a => !LB.agents[a].is_baseline).concat(LB.order.filter(a => LB.agents[a].is_baseline));
  const modelHref = a => `model.html?agent=${encodeURIComponent(a)}`;
  const money = v => v == null ? '<span class="muted">–</span>' : `<span class="${v < 0 ? 'neg' : ''}">${A.usd(v)}</span>`;

  // ------------------------------------------------------------ main leaderboard
  // Every bar in a column shares one origin and one scale: the bar lives in a fixed-width cell element and the
  // number sits right-aligned beside it, so values line up by decimal and the ± error bars share a baseline.
  function barCell(v, sd, min, max, fmt, mark, title) {
    if (v == null) return '<td class="num"><span class="barcell"><span class="bar"></span><span class="val muted">–</span></span></td>';
    const lo = Math.min(0, min), hi = Math.max(max, mark || 0);
    const pct = x => Math.round(Math.max(0, Math.min(1, (x - lo) / (hi - lo))) * 100);
    const zero = pct(0);
    const cls = v < 0 ? 'neg' : (mark != null && v > mark * 1.001) ? 'over' : '';
    const left = v >= 0 ? zero : pct(v), width = Math.max(1, Math.abs(pct(v) - zero));
    const err = sd != null ? `<u class="err" style="left:${pct(v - sd)}%;width:${Math.max(1, pct(v + sd) - pct(v - sd))}%"></u>` : '';
    const markEl = mark != null ? `<em style="left:${pct(mark)}%"></em>` : '';
    const zeroEl = lo < 0 ? `<b class="zero" style="left:${zero}%"></b>` : '';
    return `<td class="num"><span class="barcell" title="${title || ''}"><span class="bar"><i class="${cls}" style="left:${left}%;width:${width}%"></i>${zeroEl}${markEl}${err}</span><span class="val">${fmt(v)}${sd != null ? ` <small class="muted">± ${fmt(sd)}</small>` : ''}</span></span></td>`;
  }
  function renderMain() {
    const main = document.getElementById('lb-main');
    const sp = LB.order.map(a => LB.agents[a].sp_score).filter(v => v != null), pha = LB.order.map(a => LB.agents[a].profit_per_ha_season).filter(v => v != null);
    const spMin = Math.min(...sp, 0), spMax = Math.max(...LB.order.map(a => (LB.agents[a].sp_score || 0) + (LB.agents[a].sp_score_sd || 0)), 1.2);
    const phaMin = Math.min(...pha, 0), phaMax = Math.max(...LB.order.map(a => (LB.agents[a].profit_per_ha_season || 0) + (LB.agents[a].profit_per_ha_season_sd || 0)), 1);
    const tierVals = [1, 2, 3].map(t => LB.order.map(a => LB.agents[a].tiers[String(t)]).filter(v => v != null));
    const tierMin = Math.min(0, ...tierVals.flat()), tierMax = Math.max(1.2, ...tierVals.flat());
    main.querySelector('thead').innerHTML = `<tr><th class="rank-col">#</th><th class="agent-col">agent</th><th class="num" title="mean profit per hectare-season ± sd across attempt indices">profit / ha-season (${A.moneyUnit()})</th><th class="num" title="standard-practice-normalised score ± sd across attempt indices">SP score</th><th class="num">tier 1</th><th class="num">tier 2</th><th class="num">tier 3</th><th class="num">total profit</th><th class="num">scenarios</th><th class="num">attempts</th><th class="num">tool calls / ep</th><th class="num">tokens in / out per ep</th></tr>`;
    main.querySelector('tbody').innerHTML = LB.order.map((agent, i) => {
      const a = LB.agents[agent]; const n = Math.max(1, a.n_scenarios);
      const sdNote = a.k > 1 ? `± sd over ${a.k} attempt indices` : 'single attempt';
      return `<tr class="${a.is_baseline ? 'baseline' : 'me'}"><td class="rank-col"><span class="rank">${i + 1}</span></td>
        <td class="agent-col"><a class="agent-name" href="${modelHref(agent)}" title="${A.esc(agent)} · model page">${A.esc(A.agentName(agent))}</a>${a.is_baseline ? '<span class="badge">baseline</span>' : `<span class="agent-kind">${A.agentKind(agent)}</span>`}</td>
        ${barCell(a.profit_per_ha_season, a.profit_per_ha_season_sd, phaMin, phaMax, v => A.usd(v), null, `${A.usd(a.profit_per_ha_season)} per ha-season, ${sdNote}`)}
        ${barCell(a.sp_score, a.sp_score_sd, spMin, spMax, v => v.toFixed(2), 1, `SP ${a.sp_score == null ? '–' : a.sp_score.toFixed(2)}, ${sdNote}; tick = standard practice`)}
        ${[1, 2, 3].map(t => barCell(a.tiers[String(t)], null, tierMin, tierMax, v => v.toFixed(2), 1, `tier ${t} SP score`)).join('')}
        <td class="num">${money(a.total_profit)}</td><td class="num">${a.n_scenarios}</td><td class="num">${a.attempts}</td>
        <td class="num">${Math.round(a.cost.tool_calls / n)}</td><td class="num">${A.fmtTokens(a.cost.input_tokens / n)} / ${A.fmtTokens(a.cost.output_tokens / n)}</td></tr>`;
    }).join('');
  }

  // ------------------------------------------------------------ per-scenario table: agents as rows, scenarios as columns, shaded per column
  // Shade = dense rank within the scenario column, with standard practice as the neutral midpoint: agents above it
  // step green from pale (just above) to darkest (rank 1), agents below step red down to the darkest for the worst
  // ranked model. do_nothing is excluded from the scale and drawn fixed dark red. Ranks, not values, so every column
  // has the same visual contrast; ties share a shade.
  const ALPHA_MAX = 0.62, ALPHA_MIN = 0.14;
  function heatStyle(side, step, steps) { // side: 1 green, -1 red, 0 neutral; step 0 = strongest
    if (!side) return '';
    const alpha = steps <= 1 ? ALPHA_MAX : ALPHA_MAX - step * (ALPHA_MAX - ALPHA_MIN) / (steps - 1);
    return `background: rgba(${side > 0 ? '47,143,58' : '217,72,52'},${alpha.toFixed(2)});`;
  }
  function columnShades(sid) {
    const spRow = LB.agents.standard_practice && LB.agents.standard_practice.rows[sid]; const mid = spRow && spRow.sp_score != null ? spRow.sp_score : 1;
    const vals = ranked.filter(a => a !== 'do_nothing').map(a => ({ a, v: (LB.agents[a].rows[sid] || {}).sp_score })).filter(x => x.v != null);
    const above = [...new Set(vals.filter(x => x.v > mid + 1e-9).map(x => x.v))].sort((p, q) => q - p); // dense ranks: ties share
    const below = [...new Set(vals.filter(x => x.v < mid - 1e-9).map(x => x.v))].sort((p, q) => p - q);
    const style = {};
    for (const x of vals) {
      if (x.v > mid + 1e-9) style[x.a] = heatStyle(1, above.indexOf(x.v), above.length);
      else if (x.v < mid - 1e-9) style[x.a] = heatStyle(-1, below.indexOf(x.v), below.length);
      else style[x.a] = '';
    }
    style.do_nothing = `background: rgba(217,72,52,${ALPHA_MAX});`;
    return style;
  }
  function renderScenarios() {
    const scn = document.getElementById('lb-scn');
    scn.classList.add('heatmap', 'transposed');
    const tiers = [1, 2, 3].map(t => ({ t, scns: IDX.scenarios.filter(s => s.tier === t) })).filter(g => g.scns.length);
    const abbrev = id => id.replace(/^t\d_/, '').replace(/_/g, ' ');
    const colStats = {};
    for (const s of IDX.scenarios) {
      const vals = ranked.map(a => ({ a, v: (LB.agents[a].rows[s.id] || {}).sp_score })).filter(x => x.v != null).sort((x, y) => y.v - x.v);
      colStats[s.id] = { rank: Object.fromEntries(vals.map((x, i) => [x.a, i + 1])), n: vals.length, shade: columnShades(s.id) };
    }
    scn.querySelector('thead').innerHTML =
      `<tr><th rowspan="2">agent</th>${tiers.map(g => `<th colspan="${g.scns.length}" class="tier-head">Tier ${g.t}</th>`).join('')}</tr>` +
      `<tr>${tiers.map(g => g.scns.map(s => `<th class="scn-head" title="${A.esc(s.title)} · ${s.ha_seasons} ha-seasons"><a href="#card-${s.id}">${A.esc(abbrev(s.id))}</a></th>`).join('')).join('')}</tr>`;
    scn.querySelector('tbody').innerHTML = ranked.map(agent => {
      const a = LB.agents[agent];
      const cells = tiers.map(g => g.scns.map(s => {
        const r = a.rows[s.id]; const cs = colStats[s.id];
        if (!r) return '<td class="none">–</td>';
        const other = agent === 'standard_practice' ? 'oracle' : 'standard_practice';
        const title = `${A.esc(A.agentName(agent))} · ${A.esc(s.title)}\nrank ${cs.rank[agent] || '–'} of ${cs.n} on this scenario\n${A.usd(r.profit)} mean of ${r.n} attempt${r.n > 1 ? 's' : ''}${r.n > 1 ? ` (min ${A.usd(r.min)}, max ${A.usd(r.max)}, sd ${A.usd(r.std || 0)})` : ''}\n${A.usd(r.per_ha_season)} per ha-season · SP ${r.sp_score == null ? '–' : r.sp_score.toFixed(2)}${r.sp_score_sd != null && r.n > 1 ? ` ± ${r.sp_score_sd.toFixed(2)}` : ''}`;
        return `<td class="heat" style="${cs.shade[agent] || ''}" title="${title}"><a class="cell-link" href="${A.replayHref(s.id, agent, other)}">${A.usd(r.profit, true)}${r.sp_score != null ? ` <small>(${r.sp_score.toFixed(2)})</small>` : ''}</a>${r.n > 1 ? `<br><small class="muted">± ${A.usd(r.std || 0, true)}${r.sp_score_sd != null ? ` / ${r.sp_score_sd.toFixed(2)}` : ''}</small>` : ''}</td>`;
      }).join('')).join('');
      return `<tr class="${a.is_baseline ? 'baseline' : ''}"><td><a class="agent-name" href="${modelHref(agent)}" title="${A.esc(agent)}">${A.esc(A.agentName(agent))}</a>${a.is_baseline ? '<span class="badge">baseline</span>' : ''}</td>${cells}</tr>`;
    }).join('');
  }

  // ------------------------------------------------------------ diagnostics: headroom
  function renderDiag() {
    const diag = document.getElementById('lb-diag');
    diag.querySelector('thead').innerHTML = '<tr><th>scenario</th><th>tier</th><th class="num">do nothing</th><th class="num">standard practice</th><th class="num">oracle (evals)</th><th class="num">best known</th><th>by</th><th class="num">best / ha-season</th></tr>';
    diag.querySelector('tbody').innerHTML = IDX.diagnostics.map(d => {
      const by = d.best_known_agent;
      const link = by && A.latestRun(by, d.scenario) ? `<a class="cell-link" href="${A.replayHref(d.scenario, by, by === 'standard_practice' ? 'oracle' : 'standard_practice')}">${A.esc(A.agentName(by))}</a>` : (by ? A.esc(A.agentName(by)) : '–');
      const orc = A.latestRun('oracle', d.scenario);
      const orcCell = d.oracle == null ? '–' : (orc ? `<a class="cell-link" href="${A.replayHref(d.scenario, 'oracle', 'standard_practice')}">${A.usd(d.oracle)}</a>` : A.usd(d.oracle)) + ` <small class="muted">(${d.oracle_evals || '–'})</small>`;
      return `<tr><td><a href="#card-${d.scenario}" class="mono">${d.scenario}</a></td><td>${d.tier}</td><td class="num">${money(d.floor)}</td><td class="num">${money(d.standard_practice)}</td><td class="num">${orcCell}</td><td class="num headline">${money(d.best_known)}</td><td>${link}</td><td class="num">${d.best_known == null ? '–' : A.usd(d.best_known / d.ha_seasons)}</td></tr>`;
    }).join('');
  }

  // ------------------------------------------------------------ scenario cards
  function swatch(crop) { const c = (A.CROP_COLORS[crop] || { leaf: [70, 150, 70] }).leaf; return `rgb(${c.join(',')})`; }
  function renderCards() {
    const cards = document.getElementById('cards');
    cards.innerHTML = IDX.scenarios.map(s => {
      const crops = Object.entries(s.crops).map(([c, v]) => `<span class="chip" title="${A.esc(v.variety)} · planting ${A.usd(v.planting_cost_per_ha)}/ha · window ${v.window.join('–')}"><i class="sw" style="background:${swatch(c)}"></i>${A.esc(A.cropLabel(c))} <b>${A.usd(v.price_per_kg, false, 2)}/kg</b></span>`).join('');
      const fields = s.fields.map(f => `<span class="chip">${A.esc(f.field_id)} · ${f.area_ha} ha ${A.esc(A.soilLabel(f.soil))} <span class="muted">(wp ${f.wilting_point} / fc ${f.field_capacity})</span></span>`).join('');
      const shocks = s.price_shocks.map(p => `<li><b>${A.esc(p.announce)}</b>: ${A.esc(p.headline)}</li>`).join('');
      const agents = A.runsFor(s.id).filter(r => r.latest).map(r => r.agent);
      const order = LB.order; agents.sort((x, y) => (order.indexOf(x) + 1 || 99) - (order.indexOf(y) + 1 || 99));
      const llm = agents.find(a => a.startsWith('llm:'));
      const sp = LB.agents.standard_practice && LB.agents.standard_practice.rows[s.id];
      return `<article class="card px" id="card-${s.id}">
        <canvas class="thumb" data-scn="${s.id}" aria-label="Oracle farm thumbnail for ${A.esc(s.title)}"></canvas>
        <div class="body">
          <div><span class="tier-tag">Tier ${s.tier}</span> <span class="mono muted small">${s.id}</span></div>
          <h3>${A.esc(s.title)}</h3>
          <div class="desc">${A.esc(s.description)}</div>
          <dl class="kv">
            <dt>episode</dt><dd>${A.fmtDate(s.start)} → ${A.fmtDate(s.end)} · ${s.seasons} season${s.seasons > 1 ? 's' : ''} · decisions every ${s.decision_interval_days} d</dd>
            <dt>scale</dt><dd>${s.total_area_ha} ha · ${s.ha_seasons} ha-seasons${sp ? ` · standard practice ${A.usd(sp.per_ha_season)}/ha-season` : ''}</dd>
            <dt>cash</dt><dd>${A.usd(s.cash.initial)} start${s.cash.credit_limit ? `, credit ${A.usd(s.cash.credit_limit)}` : ''}</dd>
            <dt>costs</dt><dd>N ${A.usd(s.costs.nitrogen_per_kg, false, 2)}/kg · water ${A.usd(s.costs.irrigation_per_mm_per_ha, false, 2)}/mm/ha · soil test ${A.usd(s.costs.soil_test)}</dd>
            <dt>forecast</dt><dd>${s.forecast_horizon} days${s.forecast_skill < 1 ? `, skill ${s.forecast_skill}` : ''}</dd>
          </dl>
          <div class="chips">${fields}</div>
          <div class="chips">${crops}</div>
          ${shocks ? `<ul class="rules small" style="margin:0;padding-left:18px">${shocks}</ul>` : ''}
          <details><summary>Rules (${s.rules.length})</summary><ul class="rules">${s.rules.map(r => `<li>${A.esc(r)}</li>`).join('')}</ul>${s.cultivar_note ? `<p class="small muted">${A.esc(s.cultivar_note)}</p>` : ''}</details>
          <div class="foot">
            <a class="btn" href="${A.replayHref(s.id, 'standard_practice', 'oracle')}">▶ standard vs oracle</a>
            ${llm ? `<a class="btn" href="${A.replayHref(s.id, llm, 'standard_practice')}">▶ ${A.esc(A.agentName(llm))}</a>` : ''}
            <span class="muted small">${agents.length} runs</span>
          </div>
        </div>
      </article>`;
    }).join('');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); renderThumb(e.target); } }), { rootMargin: '300px' });
      document.querySelectorAll('canvas.thumb').forEach(c => io.observe(c));
    } else document.querySelectorAll('canvas.thumb').forEach(renderThumb);
  }
  // thumbnails: oracle farm at the day of peak total LAI, loaded lazily
  function peakDay(run) {
    let best = 0, bestV = -1; const n = run.weather.rain.length;
    for (let i = 0; i < n; i++) { let v = 0; for (const f of Object.values(run.fields)) v += (f.lai[i] || 0) + (f.dvs[i] != null && f.dvs[i] >= 1 ? 0.5 : 0); if (v > bestV) { bestV = v; best = i; } }
    return best;
  }
  function renderThumb(canvas) {
    const sid = canvas.dataset.scn; const entry = A.latestRun('oracle', sid) || A.runsFor(sid)[0];
    if (!entry) return;
    A.loadRun(entry).then(run => { const farm = new A.Farm(canvas, SC[sid], run); farm.draw(peakDay(run)); canvas.style.aspectRatio = `${farm.L.W} / ${farm.L.H}`; }).catch(() => {});
  }

  function renderAll() { renderMain(); renderScenarios(); renderDiag(); renderCards(); }
  renderAll();
  A.onUnits(renderAll);

  // ------------------------------------------------------------ hero: auto-playing replay of the best-known tier-3 run
  // Desktop: fields stacked as full-width strips filling the card at an integer pixel scale; phone: short landscape scene.
  (function hero() {
    const t3 = IDX.scenarios.filter(s => s.tier === 3);
    const sid = (t3[0] || IDX.scenarios[0]).id;
    const d = IDX.diagnostics.find(x => x.scenario === sid);
    const agent = (d && d.best_known_agent && A.latestRun(d.best_known_agent, sid)) ? d.best_known_agent : 'standard_practice';
    const entry = A.latestRun(agent, sid); if (!entry) return;
    document.getElementById('hero-link').href = A.replayHref(sid, agent, agent === 'standard_practice' ? 'oracle' : 'standard_practice');
    A.loadRun(entry).then(run => {
      const canvas = document.getElementById('hero-farm'); const wrap = canvas.parentElement; const card = SC[sid];
      const cap = document.getElementById('hero-caption'); const n = run.weather.rain.length; let day = 0; let farm = null;
      const T = A.pixel.T;
      const textCard = document.querySelector('.hero > .px'); const animCard = wrap.closest('.px');
      // run after layout: requestAnimationFrame when available, with a timer fallback for panes that never paint
      const afterLayout = fn => { let done = false; const go = () => { if (!done) { done = true; fn(); } }; if (window.requestAnimationFrame) requestAnimationFrame(go); setTimeout(go, 60); };
      let lastKey = '';
      function build() {
        const tr = textCard.getBoundingClientRect(), ar = animCard.getBoundingClientRect();
        const sideBySide = Math.abs(tr.top - ar.top) < 4 && ar.left > tr.left + 10; // same breakpoint as the grid: two columns means stacked scene
        const wr = wrap.getBoundingClientRect(); const cs = getComputedStyle(wrap);
        const availW = Math.floor(wr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) - 6; // 3 px canvas border each side
        const availH = Math.floor(wr.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) - 6;
        if (!sideBySide) {
          if (lastKey !== 'phone') { lastKey = 'phone'; farm = new A.Farm(canvas, card, run); canvas.style.width = '100%'; canvas.style.height = 'auto'; farm.draw(day); }
          return;
        }
        if (availW < 100 || availH < 100) return;
        const scale = Math.max(1, Math.floor(availW / (20 * T))); // integer pixel scale, down to 1 so the scene spans the card
        const W = Math.max(14, Math.floor(availW / (T * scale))), H = Math.max(12, Math.floor(availH / (T * scale)));
        const key = `${W}x${H}@${scale}`; if (key === lastKey) return; lastKey = key;
        farm = new A.Farm(canvas, card, run, { stacked: true, W, H });
        canvas.style.width = (W * T * scale) + 'px'; canvas.style.height = (H * T * scale) + 'px';
        farm.draw(day);
      }
      afterLayout(build);
      let pending = null;
      const onResize = () => { clearTimeout(pending); pending = setTimeout(() => afterLayout(build), 100); };
      window.addEventListener('resize', onResize);
      if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(wrap);
      function tick() {
        if (document.hidden || !farm) return;
        day = (day + 1) % n; farm.draw(day); cap.textContent = `${card.title} · ${A.agentName(agent)} · ${A.fmtDate(A.addDays(farm.start, day))}`;
      }
      setInterval(tick, 70);
    }).catch(() => {});
  })();
})();
