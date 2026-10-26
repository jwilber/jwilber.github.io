/* Shared helpers: theme toggle, data loading (script-tag JSONP so file:// works), formatting. */
(function () {
  'use strict';
  const A = (window.AGRI = window.AGRI || {});

  // ---------- units (display-only conversion; the data stays °C / USD)
  const EUR_PER_USD = 0.92;
  A.EUR_PER_USD = EUR_PER_USD;
  A.units = { temp: 'F', money: 'USD' };
  try { const saved = localStorage.getItem('agri-units'); if (saved === 'metric') A.units = { temp: 'C', money: 'EUR' }; } catch (e) { /* storage unavailable */ }
  const unitListeners = [];
  A.onUnits = function (fn) { unitListeners.push(fn); };
  function unitsLabel() { return A.units.money === 'USD' ? '°F / USD' : '°C / EUR'; }
  A.initUnits = function () {
    const b = document.getElementById('units-btn');
    if (!b) return;
    b.textContent = unitsLabel(); b.title = 'Switch display units (°F / USD or °C / EUR). Conversion is display-only: °F = °C × 9/5 + 32, EUR = USD × ' + EUR_PER_USD;
    b.addEventListener('click', () => {
      const metric = A.units.money === 'USD';
      A.units = metric ? { temp: 'C', money: 'EUR' } : { temp: 'F', money: 'USD' };
      try { localStorage.setItem('agri-units', metric ? 'metric' : 'us'); } catch (e) { /* ignore */ }
      b.textContent = unitsLabel();
      document.querySelectorAll('[data-rate-note]').forEach(n => { n.textContent = A.rateNote(); });
      if (unitListeners.length) unitListeners.forEach(fn => fn(A.units)); else location.reload();
    });
    document.querySelectorAll('[data-rate-note]').forEach(n => { n.textContent = A.rateNote(); });
  };
  A.initTheme = A.initUnits; // legacy name used by the pages
  A.isDark = function () { return false; };
  A.rateNote = function () { return A.units.money === 'EUR' ? `Money shown in EUR at a fixed ${EUR_PER_USD} EUR per USD (display-only conversion of USD results).` : 'Money shown in USD; the °C / EUR toggle converts for display at a fixed 0.92 EUR per USD.'; };

  // ---------- data
  A.index = function () { return window.AGRI_INDEX; };
  A.scenario = function (id) { return (window.AGRI_INDEX.scenarios || []).find(s => s.id === id); };
  A.runsFor = function (scenarioId) { return window.AGRI_INDEX.runs.filter(r => r.scenario === scenarioId && r.has_trace); };
  A.latestRun = function (agent, scenarioId) {
    return window.AGRI_INDEX.runs.find(r => r.agent === agent && r.scenario === scenarioId && r.latest && r.has_trace)
        || window.AGRI_INDEX.runs.find(r => r.agent === agent && r.scenario === scenarioId && r.has_trace);
  };
  const pending = {};
  A.loadRun = function (entry) {
    window.AGRI_RUNS = window.AGRI_RUNS || {};
    if (!entry) return Promise.reject(new Error('no run'));
    if (window.AGRI_RUNS[entry.key]) return Promise.resolve(window.AGRI_RUNS[entry.key]);
    if (pending[entry.key]) return pending[entry.key];
    pending[entry.key] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = entry.file;
      s.onload = () => { delete pending[entry.key]; window.AGRI_RUNS[entry.key] ? resolve(window.AGRI_RUNS[entry.key]) : reject(new Error('empty run ' + entry.key)); };
      s.onerror = () => { delete pending[entry.key]; reject(new Error('failed to load ' + entry.file)); };
      document.head.appendChild(s);
    });
    return pending[entry.key];
  };

  // ---------- formatting
  A.agentName = function (id) {
    if (!id) return '';
    if (id.startsWith('llm:')) { const parts = id.slice(4).split('_'); return parts[parts.length - 1]; }
    return id.replace(/_/g, ' ');
  };
  A.agentKind = function (id) {
    if (id.startsWith('llm:')) return 'LLM';
    if (id === 'oracle') return 'hindsight oracle';
    if (id === 'do_nothing') return 'floor';
    return 'scripted';
  };
  // money: "$1,234" / "-$1,234" (or "€1,135" when EUR is selected); compact=true gives "$12.9k"; digits for unit prices
  A.usd = function (v, compact, digits) {
    if (v == null || isNaN(v)) return '–';
    const eur = A.units.money === 'EUR'; const sym = eur ? '€' : '$'; v = eur ? v * EUR_PER_USD : v;
    const sign = v < 0 ? '-' : ''; const a = Math.abs(v);
    if (digits != null) return `${sign}${sym}${a.toFixed(digits)}`;
    if (compact && a >= 10000) return `${sign}${sym}${(a / 1000).toFixed(a >= 100000 ? 0 : 1)}k`;
    return `${sign}${sym}${Math.round(a).toLocaleString('en-US')}`;
  };
  A.moneyUnit = function () { return A.units.money; };
  // temperature: data is °C
  A.temp = function (c, digits) { if (c == null || isNaN(c)) return '–'; const f = A.units.temp === 'F'; const v = f ? c * 9 / 5 + 32 : c; return `${v.toFixed(digits == null ? 0 : digits)} °${f ? 'F' : 'C'}`; };
  A.tempValue = function (c) { return A.units.temp === 'F' ? c * 9 / 5 + 32 : c; };
  A.tempUnit = function () { return A.units.temp === 'F' ? '°F' : '°C'; };
  A.eur = A.usd; // legacy alias (everything is USD)
  A.CURRENCY = 'USD';
  A.num = function (v, d) { return v == null || isNaN(v) ? '–' : (+v).toFixed(d == null ? 0 : d); };
  A.fmtTokens = function (n) { if (!n) return '0'; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k'; return String(n); };
  A.addDays = function (iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  A.dayDiff = function (a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  A.MONTHS = MONTHS;
  A.fmtDate = function (iso) { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
  A.esc = function (s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); };
  A.qs = function () { const o = {}; new URLSearchParams(location.search).forEach((v, k) => { o[k] = v; }); return o; };
  A.replayHref = function (scenario, a, b) {
    const p = new URLSearchParams({ scenario, a });
    if (b) p.set('b', b);
    return 'replay.html?' + p.toString();
  };

  A.CROP_LABEL = { maize: 'Maize', wheat: 'Winter wheat', barley: 'Spring barley', potato: 'Potato', sugarbeet: 'Sugar beet', fababean: 'Faba bean', soybean: 'Soybean', rapeseed: 'Rapeseed', sunflower: 'Sunflower' };
  A.cropLabel = function (c) { return A.CROP_LABEL[c] || c; };
  A.SOIL_LABEL = { sand: 'sand', loamy_sand: 'loamy sand', loam: 'loam', clay_loam: 'clay loam', clay: 'clay' };
  A.soilLabel = function (s) { return A.SOIL_LABEL[s] || s; };
})();
