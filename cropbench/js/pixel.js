/* Procedural top-down pixel-art farm renderer. 16x16 logical tiles, no external assets.
 *
 * new AGRI.Farm(canvas, scenarioCard, run)  -> farm.draw(dayIndex)
 * Field plots are sized by area; tile colour follows soil moisture (relative to wilting point /
 * field capacity) and crop sprites follow crop, dvs and lai. Action icons pop from the ledger. */
(function () {
  'use strict';
  const A = (window.AGRI = window.AGRI || {});
  const T = 16; // tile size

  // deterministic hash noise in [0,1)
  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16); return ((h >>> 0) % 10000) / 10000; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
  function rgb(c, a) { return a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
  function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }

  // soil base colours [dry, wet]
  const SOIL = {
    sand: [[214, 190, 132], [140, 112, 66]],
    loamy_sand: [[196, 166, 112], [122, 94, 54]],
    loam: [[172, 134, 88], [98, 70, 40]],
    clay_loam: [[160, 118, 82], [88, 60, 38]],
    clay: [[150, 104, 84], [78, 50, 38]],
  };
  const GRASS = [[106, 168, 79], [94, 154, 70]];
  const CROP = {
    maize: { leaf: [58, 150, 60], flower: [238, 214, 90], ripe: [205, 170, 70], kind: 'tall' },
    wheat: { leaf: [86, 160, 70], flower: [190, 200, 110], ripe: [222, 180, 72], kind: 'cereal' },
    barley: { leaf: [96, 170, 80], flower: [200, 210, 120], ripe: [228, 190, 90], kind: 'cereal' },
    potato: { leaf: [52, 128, 62], flower: [240, 240, 250], ripe: [150, 140, 70], kind: 'bush' },
    sugarbeet: { leaf: [44, 140, 70], flower: [44, 140, 70], ripe: [120, 160, 80], kind: 'rosette' },
    fababean: { leaf: [70, 150, 90], flower: [250, 250, 245], ripe: [110, 90, 50], kind: 'bush' },
    soybean: { leaf: [80, 150, 70], flower: [230, 220, 240], ripe: [170, 140, 80], kind: 'bush' },
    rapeseed: { leaf: [70, 140, 70], flower: [250, 220, 50], ripe: [150, 130, 70], kind: 'bush' },
    sunflower: { leaf: [60, 140, 60], flower: [250, 200, 40], ripe: [120, 90, 40], kind: 'tall' },
  };
  const GENERIC = { leaf: [70, 150, 70], flower: [240, 230, 120], ripe: [190, 160, 80], kind: 'bush' };
  A.CROP_COLORS = CROP;

  // ---------------------------------------------------------------- layout
  function layout(card, opts) {
    const fields = card.fields;
    const total = fields.reduce((s, f) => s + f.area_ha, 0);
    if (opts && opts.stacked) { // fields as full-width strips stacked top to bottom, filling a given tile grid
      const W = opts.W || 20, H = Math.max(10, opts.H || 20);
      const avail = H - 5 - (fields.length - 1); // 2 decoration rows on top, road + margin below, 1-tile gaps
      let heights = fields.map(f => Math.max(2, Math.round(avail * f.area_ha / total)));
      let over = heights.reduce((s, h) => s + h, 0) - avail; // fix rounding so the strips exactly fill the grid
      while (over !== 0) { const i = over > 0 ? heights.indexOf(Math.max(...heights)) : heights.indexOf(Math.min(...heights)); heights[i] -= Math.sign(over); over -= Math.sign(over); }
      const plots = []; let y = 2;
      fields.forEach((f, i) => { plots.push({ id: f.field_id, x: 2, y, w: W - 4, h: heights[i], soil: f.soil, wp: f.wilting_point, fc: f.field_capacity, sat: f.saturation }); y += heights[i] + 1; });
      return { W, H, plots, plotH: heights[0], stacked: true };
    }
    const plotH = fields.length === 1 ? 8 : fields.length === 2 ? 7 : 6;
    const budget = 26; // tiles of plot width for all fields together
    const widths = fields.map(f => Math.max(3, Math.round(budget * f.area_ha / total)));
    const W = widths.reduce((s, w) => s + w, 0) + fields.length + 1 + 2; // gaps + margins
    const H = plotH + 5; // top decoration rows (2) + bottom road (2) + margins
    const plots = [];
    let x = 2;
    fields.forEach((f, i) => { plots.push({ id: f.field_id, x, y: 2, w: widths[i], h: plotH, soil: f.soil, wp: f.wilting_point, fc: f.field_capacity, sat: f.saturation }); x += widths[i] + 1; });
    return { W, H, plots, plotH };
  }

  // ---------------------------------------------------------------- sprites
  function drawSoilTile(ctx, px, py, soilCol, tx, ty, wetness) {
    ctx.fillStyle = rgb(soilCol); ctx.fillRect(px, py, T, T);
    // speckles / furrows
    for (let i = 0; i < 6; i++) {
      const r = hash(tx * 7 + i, ty * 13 + i, 1);
      const sx = px + ((hash(tx, ty, 20 + i) * T) | 0), sy = py + ((hash(ty, tx, 40 + i) * T) | 0);
      ctx.fillStyle = rgb(shade(soilCol, r > 0.5 ? 0.86 : 1.12)); ctx.fillRect(sx, sy, 2, 1);
    }
    if (wetness > 1.02) { // puddles above field capacity
      const n = Math.min(4, ((wetness - 1) * 14) | 0) + 1;
      for (let i = 0; i < n; i++) {
        const sx = px + 2 + ((hash(tx, ty, 60 + i) * (T - 6)) | 0), sy = py + 2 + ((hash(ty, tx, 80 + i) * (T - 6)) | 0);
        ctx.fillStyle = 'rgba(90,140,210,0.75)'; ctx.fillRect(sx, sy, 4, 2); ctx.fillRect(sx + 1, sy + 2, 2, 1);
      }
    }
  }

  function drawGrassTile(ctx, px, py, tx, ty) {
    ctx.fillStyle = rgb(hash(tx, ty, 3) > 0.5 ? GRASS[0] : GRASS[1]); ctx.fillRect(px, py, T, T);
    for (let i = 0; i < 4; i++) {
      const sx = px + ((hash(tx, ty, 100 + i) * T) | 0), sy = py + ((hash(ty, tx, 120 + i) * T) | 0);
      ctx.fillStyle = hash(tx + i, ty, 5) > 0.85 ? '#f2e36a' : '#4f8f3c'; ctx.fillRect(sx, sy, 1, 2);
    }
  }

  function drawRoadTile(ctx, px, py, tx, ty) {
    ctx.fillStyle = '#9b8c6c'; ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#857754'; ctx.fillRect(px, py + 3, T, 1); ctx.fillRect(px, py + 12, T, 1);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#b3a37f'; ctx.fillRect(px + ((hash(tx, ty, 200 + i) * T) | 0), py + 5 + ((hash(ty, tx, 220 + i) * 6) | 0), 2, 1); }
  }

  function drawTree(ctx, px, py, seed) {
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(px + 7, py + 10, 2, 5);
    const g = hash(seed, 1, 9) > 0.5 ? '#2f7d3a' : '#3a8f44';
    ctx.fillStyle = g; ctx.fillRect(px + 3, py + 3, 10, 8); ctx.fillRect(px + 5, py + 1, 6, 2); ctx.fillRect(px + 1, py + 5, 2, 4); ctx.fillRect(px + 13, py + 5, 2, 4);
    ctx.fillStyle = '#5fb060'; ctx.fillRect(px + 5, py + 3, 3, 2); ctx.fillRect(px + 9, py + 5, 2, 2);
    ctx.fillStyle = '#245f2c'; ctx.fillRect(px + 4, py + 9, 8, 2);
  }

  function drawHouse(ctx, px, py) {
    // 2 tiles wide farmhouse
    ctx.fillStyle = '#b0413e'; ctx.fillRect(px + 2, py + 1, 28, 7); ctx.fillStyle = '#8f2f2c'; ctx.fillRect(px + 2, py + 7, 28, 1);
    ctx.fillStyle = '#e8d9b5'; ctx.fillRect(px + 4, py + 8, 24, 7);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(px + 14, py + 10, 4, 5);
    ctx.fillStyle = '#7fc8ff'; ctx.fillRect(px + 7, py + 10, 3, 3); ctx.fillRect(px + 22, py + 10, 3, 3);
    ctx.fillStyle = '#555'; ctx.fillRect(px + 24, py - 2, 2, 4);
  }

  function drawBarn(ctx, px, py) {
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(px + 1, py + 1, 14, 6);
    ctx.fillStyle = '#c98a3a'; ctx.fillRect(px + 2, py + 7, 12, 8);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(px + 6, py + 9, 4, 6); ctx.fillRect(px + 2, py + 7, 12, 1);
  }

  function drawFence(ctx, px, py, horizontal) {
    ctx.fillStyle = '#8a6a3a';
    if (horizontal) { ctx.fillRect(px, py + 6, T, 2); ctx.fillRect(px + 2, py + 3, 2, 8); ctx.fillRect(px + 10, py + 3, 2, 8); }
    else { ctx.fillRect(px + 7, py, 2, T); ctx.fillRect(px + 4, py + 3, 8, 2); ctx.fillRect(px + 4, py + 11, 8, 2); }
  }

  // plant sprite inside a tile. stage: {h: height 0..1, dens: 0..3, col: leaf colour, flower: colour|null, ripe: 0..1, wilt: 0..1}
  function drawPlants(ctx, px, py, tx, ty, crop, st) {
    const cols = Math.max(1, Math.min(3, 1 + (st.dens | 0)));
    const leaf = st.col;
    for (let i = 0; i < cols; i++) {
      const cx = px + 2 + ((i + 0.5) * (T - 3) / cols) | 0;
      const jitter = ((hash(tx, ty, 300 + i) * 3) | 0) - 1;
      const h = Math.max(2, Math.round(st.h * 13));
      const base = py + T - 1;
      if (crop.kind === 'tall') {
        ctx.fillStyle = rgb(leaf); ctx.fillRect(cx, base - h, 2, h);
        ctx.fillStyle = rgb(shade(leaf, 1.15));
        for (let k = 3; k < h; k += 4) { ctx.fillRect(cx - 2, base - k, 2, 1); ctx.fillRect(cx + 2, base - k - 2, 2, 1); }
        if (st.flower) { ctx.fillStyle = rgb(st.flower); ctx.fillRect(cx - 1, base - h - 2, 4, 2); ctx.fillRect(cx, base - h - 3, 2, 1); }
        if (st.ripe > 0.5 && crop === CROP.maize) { ctx.fillStyle = '#e8c84a'; ctx.fillRect(cx + 2, base - (h >> 1), 2, 3); }
      } else if (crop.kind === 'cereal') {
        ctx.fillStyle = rgb(leaf);
        ctx.fillRect(cx + jitter, base - h, 1, h); ctx.fillRect(cx + jitter + 2, base - h + 1, 1, h - 1);
        if (h > 5) { ctx.fillRect(cx + jitter - 1, base - h + 3, 1, 1); ctx.fillRect(cx + jitter + 3, base - h + 4, 1, 1); }
        if (st.flower) { ctx.fillStyle = rgb(st.flower); ctx.fillRect(cx + jitter - 1, base - h - 2, 3, 3); ctx.fillRect(cx + jitter + 2, base - h - 1, 2, 3); }
      } else if (crop.kind === 'rosette') {
        const r = Math.max(1, Math.round(st.h * 6));
        ctx.fillStyle = rgb(leaf); ctx.fillRect(cx - r, base - r - 1, 2 * r + 1, r + 1); ctx.fillRect(cx - (r >> 1), base - 2 * r - 1, r + 1, r);
        ctx.fillStyle = rgb(shade(leaf, 1.2)); ctx.fillRect(cx, base - r - 1, 1, r);
        if (st.ripe > 0.3) { ctx.fillStyle = '#e9d9a8'; ctx.fillRect(cx - 1, base - 1, 3, 1); }
      } else { // bush
        const r = Math.max(1, Math.round(st.h * 6));
        ctx.fillStyle = rgb(leaf); ctx.fillRect(cx - r, base - r, 2 * r + 1, r + 1); ctx.fillRect(cx - (r >> 1), base - 2 * r, r + 1, r);
        ctx.fillStyle = rgb(shade(leaf, 0.8)); ctx.fillRect(cx - r + 1, base, 2 * r - 1, 1);
        if (st.flower) { ctx.fillStyle = rgb(st.flower); ctx.fillRect(cx - 1, base - 2 * r - 1, 2, 2); if (r > 2) ctx.fillRect(cx + r - 2, base - r - 1, 2, 2); }
      }
    }
  }

  function drawStubble(ctx, px, py, tx, ty, fade) {
    ctx.fillStyle = `rgba(214,190,120,${0.9 * fade})`;
    for (let i = 0; i < 5; i++) { const sx = px + 1 + ((hash(tx, ty, 400 + i) * (T - 2)) | 0); ctx.fillRect(sx, py + T - 4, 1, 3); }
  }

  function drawSeedRows(ctx, px, py) {
    ctx.fillStyle = 'rgba(70,45,20,0.45)';
    for (let r = 2; r < T; r += 5) ctx.fillRect(px, py + r, T, 1);
    ctx.fillStyle = 'rgba(240,230,200,0.8)';
    for (let r = 2; r < T; r += 5) for (let c = 2; c < T; c += 6) ctx.fillRect(px + c, py + r, 1, 1);
  }

  // 16x16 action icons
  const ICONS = {
    planting(ctx, x, y) { // tractor
      ctx.fillStyle = '#2d7a2d'; ctx.fillRect(x + 3, y + 5, 9, 5); ctx.fillRect(x + 8, y + 2, 4, 4);
      ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x + 9, y + 3, 2, 2);
      ctx.fillStyle = '#222'; ctx.fillRect(x + 1, y + 8, 6, 6); ctx.fillRect(x + 10, y + 10, 4, 4);
      ctx.fillStyle = '#888'; ctx.fillRect(x + 3, y + 10, 2, 2); ctx.fillRect(x + 11, y + 11, 2, 2);
      ctx.fillStyle = '#555'; ctx.fillRect(x + 12, y + 7, 3, 1);
    },
    fertilizer(ctx, x, y) { // spreader with hopper + granules
      ctx.fillStyle = '#d9a21b'; ctx.fillRect(x + 4, y + 3, 8, 6); ctx.fillStyle = '#b07f10'; ctx.fillRect(x + 6, y + 9, 4, 2);
      ctx.fillStyle = '#222'; ctx.fillRect(x + 2, y + 10, 4, 4); ctx.fillRect(x + 10, y + 10, 4, 4);
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + 1, y + 7, 1, 1); ctx.fillRect(x + 14, y + 6, 1, 1); ctx.fillRect(x + 0, y + 12, 1, 1); ctx.fillRect(x + 15, y + 12, 1, 1); ctx.fillRect(x + 7, y + 14, 1, 1);
    },
    irrigation(ctx, x, y) { // sprinkler
      ctx.fillStyle = '#777'; ctx.fillRect(x + 7, y + 8, 2, 7); ctx.fillRect(x + 5, y + 7, 6, 2);
      ctx.fillStyle = '#4aa3ff'; ctx.fillRect(x + 2, y + 4, 2, 2); ctx.fillRect(x + 12, y + 4, 2, 2); ctx.fillRect(x + 7, y + 2, 2, 2); ctx.fillRect(x + 4, y + 2, 1, 1); ctx.fillRect(x + 11, y + 2, 1, 1);
      ctx.fillStyle = '#bfe3ff'; ctx.fillRect(x + 1, y + 7, 1, 2); ctx.fillRect(x + 14, y + 7, 1, 2);
    },
    harvest(ctx, x, y) { // combine
      ctx.fillStyle = '#c0392b'; ctx.fillRect(x + 4, y + 4, 9, 6); ctx.fillRect(x + 9, y + 1, 4, 4);
      ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x + 10, y + 2, 2, 2);
      ctx.fillStyle = '#e8c84a'; ctx.fillRect(x + 0, y + 8, 5, 3); ctx.fillStyle = '#b89020'; ctx.fillRect(x + 0, y + 11, 5, 1);
      ctx.fillStyle = '#222'; ctx.fillRect(x + 5, y + 10, 4, 4); ctx.fillRect(x + 11, y + 10, 3, 3);
    },
    soil_test(ctx, x, y) { // lab flask
      ctx.fillStyle = '#e8f4ff'; ctx.fillRect(x + 6, y + 1, 4, 4); ctx.fillRect(x + 5, y + 5, 6, 2); ctx.fillRect(x + 4, y + 7, 8, 2); ctx.fillRect(x + 3, y + 9, 10, 5);
      ctx.fillStyle = '#a05cff'; ctx.fillRect(x + 4, y + 10, 8, 4); ctx.fillStyle = '#d7b8ff'; ctx.fillRect(x + 5, y + 10, 2, 1);
      ctx.fillStyle = '#444'; ctx.fillRect(x + 5, y + 0, 6, 1);
    },
  };
  const ICON_LABEL = { planting: 'plant', fertilizer: 'fertilize', irrigation: 'irrigate', harvest: 'harvest', soil_test: 'soil test' };
  const ICON_TITLE = { planting: 'Planting: tractor sows a crop', fertilizer: 'Fertilizer: spreader applies mineral N (kg N/ha)', irrigation: 'Irrigation: sprinkler adds water (mm)', harvest: 'Harvest: combine sells the storage organ', soil_test: 'Soil test: lab flask reveals mineral N and soil moisture' };
  A.ICON_LABEL = ICON_LABEL; A.ICON_TITLE = ICON_TITLE; A.ICONS = ICONS;
  A.drawIcon = function (canvas, kind) { canvas.width = 16; canvas.height = 16; const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; ICONS[kind](c, 0, 0); };

  function drawGauge(ctx, x, y, mm) { // rain gauge with the day's mm
    ctx.fillStyle = 'rgba(35,32,26,0.85)'; ctx.fillRect(x, y, 46, 14);
    ctx.fillStyle = '#e8f4ff'; ctx.fillRect(x + 3, y + 2, 6, 10); ctx.fillStyle = '#1e7fe0';
    const h = Math.max(1, Math.min(9, Math.round(mm / 25 * 9))); ctx.fillRect(x + 4, y + 11 - h, 4, h);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Inter, system-ui, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(`${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`, x + 12, y + 7.5);
  }

  function drawBubble(ctx, cx, cy, kind) {
    ctx.fillStyle = '#23201a'; ctx.fillRect(cx - 11, cy - 12, 22, 22);
    ctx.fillStyle = '#fbf8ee'; ctx.fillRect(cx - 9, cy - 10, 18, 18);
    ctx.fillStyle = '#23201a'; ctx.fillRect(cx - 2, cy + 10, 4, 2); ctx.fillRect(cx - 1, cy + 12, 2, 1);
    ICONS[kind](ctx, cx - 8, cy - 9);
  }

  // ---------------------------------------------------------------- Farm
  class Farm {
    constructor(canvas, card, run, opts) {
      this.canvas = canvas; this.card = card; this.run = run;
      this.L = layout(card, opts);
      canvas.width = this.L.W * T; canvas.height = this.L.H * T;
      this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
      this.n = run ? Math.max(...Object.values(run.fields).map(f => f.n)) : 0;
      this.start = run ? run.weather.start : card.start;
      this.decor = this._decor();
      this.events = this._events();
      this.stubble = this._stubble();
    }
    date(i) { return A.addDays(this.start, i); }
    _decor() {
      // trees along the top row at random spots, house + barn on the left
      const d = { trees: [] };
      for (let x = 4; x < this.L.W - 1; x++) if (hash(x, 0, 7) > 0.55) d.trees.push([x, 0]);
      d.trees.push([this.L.W - 1, 1]);
      return d;
    }
    _events() { // ledger action pops: { dayIndex: [{kind, field}] }
      const ev = {};
      if (!this.run) return ev;
      for (const e of this.run.ledger) {
        if (!ICONS[e.kind]) continue;
        const i = A.dayDiff(this.start, e.date);
        (ev[i] = ev[i] || []).push({ kind: e.kind, field: e.field });
      }
      return ev;
    }
    _stubble() { // per field: day index when crop disappeared -> for fading stubble
      const out = {};
      if (!this.run) return out;
      for (const [fid, f] of Object.entries(this.run.fields)) {
        const arr = new Array(f.n).fill(-1); let last = -1;
        for (let i = 0; i < f.n; i++) { if (f.crop[i]) { last = -1; } else if (i > 0 && f.crop[i - 1]) { last = i; } arr[i] = last; }
        out[fid] = arr;
      }
      return out;
    }
    plotRect(fid) { const p = this.L.plots.find(p => p.id === fid); return p ? { x: p.x * T, y: p.y * T, w: p.w * T, h: p.h * T } : null; }

    draw(i, phase) {
      const ctx = this.ctx, L = this.L;
      i = clamp(i | 0, 0, Math.max(0, this.n - 1));
      phase = phase || 0;
      this.bubbles = [];
      const rainToday = this.run && this.run.weather ? (this.run.weather.rain[i] || 0) : 0;
      this.rainToday = rainToday;
      ctx.fillStyle = '#6aa84f'; ctx.fillRect(0, 0, L.W * T, L.H * T);
      for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
        if (y === L.H - 2) drawRoadTile(ctx, x * T, y * T, x, y); else drawGrassTile(ctx, x * T, y * T, x, y);
      }
      drawHouse(ctx, 0 * T, 0 * T); drawBarn(ctx, 2 * T, 0 * T);
      for (const [tx, ty] of this.decor.trees) drawTree(ctx, tx * T, ty * T, tx * 31 + ty);
      // fences between plots row
      for (const p of L.plots) { for (let y = p.y; y < p.y + p.h; y++) { drawFence(ctx, (p.x - 1) * T, y * T, false); } }
      drawFence(ctx, (L.W - 2) * T, 2 * T, false);

      for (const p of L.plots) this._drawPlot(p, i, rainToday);
      // weather overlay: animated rain streaks scaled by intensity, snow when freezing
      const w = this.run && this.run.weather;
      if (w) {
        const rain = rainToday, tmax = w.tmax[i];
        const snow = tmax != null && tmax < 1 && rain > 0.2;
        if (rain >= 0.5 && !snow) {
          const CW = L.W * T, CH = L.H * T;
          const n = Math.min(420, Math.round(40 + rain * 14)); const len = rain >= 15 ? 9 : rain >= 5 ? 7 : 5;
          const fall = (phase * (rain >= 15 ? 7 : 4)) % CH;
          ctx.fillStyle = rain >= 15 ? 'rgba(150,195,255,0.8)' : rain >= 5 ? 'rgba(140,185,250,0.7)' : 'rgba(150,190,245,0.55)';
          for (let k = 0; k < n; k++) {
            const x = (hash(k, 1, 900) * CW + fall * 0.35) % CW, y = (hash(k, 2, 901) * CH + fall) % CH;
            ctx.fillRect(x | 0, y | 0, 1, len); ctx.fillRect((x | 0) - 1, (y | 0) + len - 1, 1, 1);
          }
          if (rain >= 15) { ctx.fillStyle = 'rgba(60,80,120,0.18)'; ctx.fillRect(0, 0, CW, CH); }
          // splashes on the ground row
          ctx.fillStyle = 'rgba(220,235,255,0.7)';
          for (let k = 0; k < n / 6; k++) { const x = (hash(k, 3, 905) * CW + fall) % CW, y = (hash(k, 4, 906) * CH) | 0; if (((phase + k) % 7) < 3) ctx.fillRect(x | 0, y, 2, 1); }
        }
        if (snow) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          for (let k = 0; k < 80; k++) { const x = (hash(k, i, 902) * L.W * T + Math.sin((phase + k) / 9) * 3) | 0, y = ((hash(i, k, 903) * L.H * T + phase * 0.7) % (L.H * T)) | 0; ctx.fillRect(x, y, 2, 2); }
        }
        // rain gauge in each plot's top-right corner on rainy days
        if (rain >= 0.5) for (const p of L.plots) { const r = this.plotRect(p.id); drawGauge(ctx, r.x + 2, r.y + r.h - 16, rain); }
      }
      // action icon pops: entries from the last 3 days, bobbing; hit boxes kept for hover titles
      for (let d = 0; d <= 3; d++) {
        const list = this.events[i - d]; if (!list) continue;
        list.forEach((e, k) => {
          const r = this.plotRect(e.field) || { x: (L.W / 2) * T, y: 2 * T, w: T, h: 2 * T };
          const cx = r.x + r.w / 2 + (k - (list.length - 1) / 2) * 26, cy = r.y + r.h / 2 - 6 - d * 2 + Math.round(Math.sin(phase / 4) * 1.5);
          drawBubble(ctx, cx | 0, cy | 0, e.kind);
          this.bubbles.push({ x: cx - 11, y: cy - 12, w: 22, h: 24, title: `${ICON_TITLE[e.kind]} — ${e.field}` });
        });
      }
    }
    bubbleAt(px, py) { // canvas-pixel coordinates -> hover title
      for (const b of this.bubbles) if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.title;
      return null;
    }

    _drawPlot(p, i, rain) {
      const ctx = this.ctx;
      const f = this.run && this.run.fields[p.id];
      const soilCols = SOIL[p.soil] || SOIL.loam;
      const sm = f ? f.sm[i] : null;
      const wp = p.wp != null ? p.wp : 0.1, fc = p.fc != null ? p.fc : 0.3;
      const wet = sm == null ? 0.6 : clamp((sm - wp) / (fc - wp), 0, 1.4);
      let soilCol = mix(soilCols[0], soilCols[1], clamp(wet, 0, 1));
      if (rain >= 0.5) soilCol = shade(soilCol, 1 - 0.3 * Math.min(1, rain / 15)); // rain darkens the surface
      const crop = f ? f.crop[i] : null, dvs = f ? f.dvs[i] : null, lai = f ? f.lai[i] : null, stress = f ? f.stress[i] : null;
      const spec = crop ? (CROP[crop] || GENERIC) : null;
      let st = null;
      if (spec) {
        const matureStanding = dvs == null; // crop finished on its own, awaiting harvest
        const D = matureStanding ? 2 : dvs;
        // a ripening crop keeps its stature as leaves senesce (lai collapses) until it is harvested
        const Lai = matureStanding ? 1.5 : D >= 1.3 ? Math.max(lai || 0, 1.5 + 2 * clamp((D - 1.3) / 0.7, 0, 1)) : (lai || 0);
        const ripe = clamp((D - 1.3) / 0.7, 0, 1);
        const wilt = stress == null ? 0 : clamp((0.7 - stress) / 0.7, 0, 1);
        let col = mix(spec.leaf, spec.ripe, ripe);
        col = mix(col, [150, 140, 70], wilt * 0.6);
        const h = D < 0 ? 0 : clamp(0.15 + 0.5 * Math.min(1, Lai / 3.5) + 0.35 * clamp(D / 1.2, 0, 1), 0, 1);
        const dens = D < 0 ? 0 : Lai < 0.4 ? 0 : Lai < 1.5 ? 1 : Lai < 3 ? 2 : 3;
        const flowering = D >= 0.95 && D < 1.45 && spec.kind !== 'rosette';
        const cover = D < 0 ? 0 : clamp((Lai - 1.2) / 3.5, 0, 0.85);
        st = { h, dens, col, flower: flowering ? spec.flower : null, ripe, pre: D < 0, mature: matureStanding, cover };
      }
      for (let ty = 0; ty < p.h; ty++) for (let tx = 0; tx < p.w; tx++) {
        const px = (p.x + tx) * T, py = (p.y + ty) * T, gx = p.x + tx, gy = p.y + ty;
        drawSoilTile(ctx, px, py, soilCol, gx, gy, wet);
        if (st) {
          if (st.pre) drawSeedRows(ctx, px, py);
          else {
            // partial coverage for sparse canopy: skip some tiles
            if (st.dens === 0 && hash(gx, gy, 77) > 0.6) continue;
            if (st.cover > 0) { // canopy closure: leaves hide the soil as lai grows
              ctx.fillStyle = rgb(shade(st.col, 0.9), st.cover); ctx.fillRect(px, py, T, T);
              ctx.fillStyle = rgb(shade(st.col, 1.18), st.cover);
              for (let k = 0; k < 5; k++) ctx.fillRect(px + ((hash(gx, gy, 500 + k) * T) | 0), py + ((hash(gy, gx, 520 + k) * T) | 0), 2, 1);
            }
            drawPlants(ctx, px, py, gx, gy, spec, st);
          }
        } else if (f) {
          const since = this.stubble[p.id][i];
          if (since >= 0 && i - since < 60) drawStubble(ctx, px, py, gx, gy, 1 - (i - since) / 60);
        }
      }
      // sign post with field colour tab
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(p.x * T + 2, (p.y + p.h) * T + 1, 2, 6);
      ctx.fillStyle = '#d9c38a'; ctx.fillRect(p.x * T, (p.y + p.h) * T + 2, 8, 4);
    }

    // stage description for the side panel
    static stage(crop, dvs, lai, stubble) {
      if (!crop) return stubble ? 'harvested, stubble' : 'bare soil';
      if (dvs == null) return 'mature, awaiting harvest';
      if (dvs < 0) return 'sown, not emerged';
      if (dvs < 0.3) return 'seedling';
      if (dvs < 0.95) return lai != null && lai > 2.5 ? 'canopy closing' : 'vegetative';
      if (dvs < 1.45) return 'flowering';
      if (dvs < 1.95) return 'grain / tuber filling';
      return 'mature';
    }
  }
  A.Farm = Farm;
  A.pixel = { hash, SOIL, GRASS, T, layout };

  // small logo sprite for the top bar
  // brand mark: same 16x16 pixel map as scripts/make_brand_assets.py (favicon, touch icon, og image)
  const LOGO_MAP = ['......yyyy......', '.....yykkyy.....', '......ykky......', '.......gg.......', '.......gg.......', '....lgggg.......', '...lg..gg.gggl..', '.......gg...gl..', '..lggg.gg.......', '...l...gggggl...', '.......gg....l..', 'ssssssssssssssss', 'ssssddssssssddss', 'sdssssssddssssss', 'ssssssssssssssss', 'ssddssssssssddss'];
  const LOGO_PALETTE = { s: '#8a6a3a', d: '#5a3a1e', g: '#3a9a44', l: '#6fc26a', y: '#e8c84a', k: '#c9a62e' };
  A.drawLogo = function (canvas) {
    canvas.width = 16; canvas.height = 16; const ctx = canvas.getContext('2d');
    LOGO_MAP.forEach((row, y) => { for (let x = 0; x < 16; x++) { const ch = row[x]; if (ch !== '.') { ctx.fillStyle = LOGO_PALETTE[ch]; ctx.fillRect(x, y, 1, 1); } } });
  };
})();
