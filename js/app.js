/*
 * UI controller: form binding, state, rendering of results, libraries,
 * the unit converter, sharing and the about dialog.
 * State values are internal units (mm, bar, °C).
 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const t = (text, params) => I18N.t(text, params);
  const U = Units;

  const DEFAULTS = {
    type: 'piston', motion: 'static', pdir: 'internal', shape: 'circle',
    source: 'auto', medium: 'liquid', backups: 0,
    series: 'ISO3601', size: '25.8 × 3.55', ring: null,
    material: 'NBR', hardness: 70,
    A: 32, B1: 0, C: 0, B: 0, A1: 0, D: 0,
    Lc: 80, Wc: 50, Rc: 15, depth: 0, E: 0,
    Do: 0, Lo: 120, Wo: 80, Ro: 20, h: 0, gap: 0,
    G: 0, r: 0,
    tolD: 0.025, tolH: 0.03, tolG: 0.05, ecc: false,
    pressure: 50, tMin: -20, tMax: 80, swell: 0,
  };
  let state = JSON.parse(JSON.stringify(DEFAULTS));
  let lastRes = null;
  let guideSrc = null; // groove library source chosen in its card (null = follow the design)

  const sizeByCode = (series, code) => Data.SIZES.find((s) => s.series === series && s.code === code);
  const round3 = (v) => Math.round(v * 1000) / 1000;
  const roundTo = (v, step) => Math.round(v / step) * step;

  // ---------- Formatting ----------
  const fL = (v) => U.format('length', v);
  const fP = (v) => U.format('pressure', v, { digits: U.system === 'IMP' ? 0 : 1 });
  const fT = (v) => U.format('temp', v, { digits: 0 });
  const fPct = (v, d = 1) => (isFinite(v) ? I18N.pct(U.fmtNumber(100 * v, d)) : '—');
  Calc.setFormatters({ length: fL, pressure: fP, temp: fT });

  /** Localise plain numeric parameters ("12.3") produced by the calculation. */
  function localParams(p) {
    const out = {};
    for (const k in p) {
      const v = p[k];
      if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)) {
        const d = (v.split('.')[1] || '').length;
        out[k] = Number(v).toLocaleString(I18N.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
      } else out[k] = v;
    }
    return out;
  }

  // ---------- O-ring selection ----------
  function seriesSizes(series) { return Data.SIZES.filter((s) => s.series === series); }

  function sizeLabel(s) {
    const unit = U.label('length');
    if (U.system === 'IMP' && s.inch) return `${s.code} · ${s.inch.id.toFixed(3)} × ${s.inch.cs.toFixed(3)} in`;
    const id = U.fmtNumber(U.toDisplay('length', s.id), U.system === 'IMP' ? 3 : 2);
    const cs = U.fmtNumber(U.toDisplay('length', s.cs), U.system === 'IMP' ? 3 : 2);
    return s.series === 'AS568' ? `${s.code} · ${id} × ${cs} ${unit}` : `${id} × ${cs} ${unit}`;
  }

  function fillCsFilter() {
    const sel = $('#cs-filter');
    const keep = sel.value;
    sel.textContent = '';
    sel.appendChild(new Option(t('All cross-sections'), ''));
    if (state.series === 'custom') return;
    const css = [...new Set(seriesSizes(state.series).map((s) => s.cs))].sort((a, b) => a - b);
    for (const cs of css) {
      const s = seriesSizes(state.series).find((z) => z.cs === cs);
      const label = U.system === 'IMP' && s.inch ? `${s.inch.cs.toFixed(3)} in` : `${U.fmtNumber(U.toDisplay('length', cs), 3)} ${U.label('length')}`;
      sel.appendChild(new Option(label, String(cs)));
    }
    sel.value = css.map(String).includes(keep) ? keep : '';
  }

  function fillSizes() {
    const sel = $('#size');
    sel.textContent = '';
    if (state.series === 'custom') return;
    const csF = parseFloat($('#cs-filter').value);
    let list = seriesSizes(state.series);
    if (isFinite(csF)) list = list.filter((s) => s.cs === csF);
    const cur = sizeByCode(state.series, state.size);
    if (cur && !list.includes(cur)) list = [cur].concat(list);
    for (const s of list) sel.appendChild(new Option(sizeLabel(s), s.code));
    sel.value = state.size;
  }

  function selectSize(series, code, keepGroove) {
    const s = sizeByCode(series, code);
    if (!s) return;
    const prevCs = state.ring && state.ring.cs;
    state.series = series;
    state.size = code;
    state.ring = { id: s.id, idTol: s.idTol, cs: s.cs, csTol: s.csTol };
    // a new ring: re-seat the hardware if it no longer fits, and follow a new cross-section with the groove
    if (prevCs !== undefined && !keepGroove) fitHardwareToRing(Math.abs(prevCs - s.cs) > 1e-9);
  }

  // ---------- Hardware seeding ----------
  /**
   * After a change of seal type or outline: if the current hardware is far off
   * for the selected O-ring, size the primary dimension from the ring (scaling
   * rectangles, keeping their proportions) and apply the recommended groove.
   */
  function fitHardwareToRing(forceGroove) {
    ensureHardware(forceGroove === true);
    const res = Calc.calc(state);
    const L0 = Data.LIMITS;
    const far = !res.valid || res.fill.max >= 1 || res.squeeze.min <= 0
      || res.stretch.max > (state.type === 'face' ? L0.stretchFaceMax : L0.stretchMax) / 100
      || res.circ.max > L0.circCompressionMax / 100 || res.loose > 0.005
      || (state.type === 'piston' && res.stretch.min < 0);
    if (!far) return;
    const r = state.ring;
    const L = Calc.guideline(r.cs, Calc.kindOf(state), { source: state.source, backups: state.backups, medium: state.medium, csTol: r.csTol }).Lmid;
    const scaleTo = (keys, perim, minR) => {
      // scale the rounded rectangle until its (offset) perimeter matches the target;
      // the corner radius is kept at the recommended minimum, then length and width are trimmed
      const run = (ks) => {
        for (let i = 0; i < 40; i++) {
          const p = perim();
          if (!(p > 0)) break;
          const f = Math.max(0.5, Math.min(2, targetP / p));
          for (const k of ks) state[k] = state[k] * f;
          if (Math.abs(f - 1) < 1e-7) break;
        }
      };
      run(keys);
      const rk = keys[2];
      if (state[rk] < minR) {
        state[rk] = Math.ceil(minR * 2) / 2;
        state[keys[0]] = Math.max(state[keys[0]], 2 * state[rk] + 1);
        state[keys[1]] = Math.max(state[keys[1]], 2 * state[rk] + 1);
        run(keys.slice(0, 2));
      }
      for (const k of keys) state[k] = roundTo(state[k], 0.05);
    };
    const minR = Data.LIMITS.cornerRadiusFactor * r.cs;
    let targetP;
    if (state.shape === 'circle') {
      if (state.type === 'piston') state.A = roundTo(r.id * 1.02 + 2 * L, 0.05);
      if (state.type === 'rod') state.B = roundTo((r.id + r.idTol) * 1.01, 0.05);
      if (state.type === 'face') state.Do = 0;
    } else if (state.type === 'face') {
      targetP = Math.PI * (r.id + 2 * r.cs);
      const G = Calc.guideline(r.cs, 'face', { source: state.source, medium: state.medium, csTol: r.csTol }).Gmid;
      if (state.pdir === 'external') {
        targetP = Math.PI * r.id * 1.01;
        scaleTo(['Lo', 'Wo', 'Ro'], () => Calc.rrPerimeter(state.Lo - 2 * G, state.Wo - 2 * G, Math.max(0, state.Ro - G)), minR + G / 2);
      } else {
        targetP = Math.PI * (r.id + 2 * r.cs);
        scaleTo(['Lo', 'Wo', 'Ro'], () => Calc.rrPerimeter(state.Lo, state.Wo, state.Ro), minR + G / 2);
      }
    } else if (state.type === 'piston') {
      targetP = Math.PI * r.id * 1.02;
      scaleTo(['Lc', 'Wc', 'Rc'], () => Calc.rrPerimeter(state.Lc - 2 * L, state.Wc - 2 * L, Math.max(0, state.Rc - L)), minR + L / 2);
    } else {
      targetP = Math.PI * (r.id + r.idTol) * 1.01;
      scaleTo(['Lc', 'Wc', 'Rc'], () => Calc.rrPerimeter(state.Lc, state.Wc, state.Rc), Math.max(0, minR - L / 2));
    }
    ensureHardware(true);
  }

  /** Make sure the primary dimension for the active seal type exists, then size the groove if empty. */
  function ensureHardware(force) {
    const r = state.ring;
    const od = r.id + 2 * r.cs;
    if (state.type === 'piston' && state.shape === 'circle' && !(state.A > 0)) state.A = roundTo(od + 0.5, 0.5);
    if (state.type === 'rod' && state.shape === 'circle' && !(state.B > 0)) state.B = roundTo(r.id * 1.02, 0.1);
    if (state.type === 'face' && state.shape === 'circle' && !(state.Do > 0)) state.Do = round3(od);
    const needs = force
      || !(state.G > 0)
      || (state.type === 'piston' && state.shape === 'circle' && !(state.B1 > 0 && state.C > 0))
      || (state.type === 'rod' && state.shape === 'circle' && !(state.A1 > 0 && state.D > 0))
      || (state.type !== 'face' && state.shape === 'rect' && !(state.depth > 0))
      || (state.type === 'face' && !(state.h > 0));
    if (needs) Object.assign(state, Calc.recommend(state));
  }

  // ---------- Form binding ----------
  function readInput(el) {
    const q = el.dataset.q;
    if (el.type === 'checkbox') return el.checked;
    if (q === 'int') return parseInt(el.value, 10);
    if (el.tagName === 'SELECT' && !q) return el.value;
    const v = parseFloat(el.value);
    if (!isFinite(v)) return NaN;
    if (q === 'num') return v;
    return U.fromDisplay(q, v);
  }

  function writeInputs() {
    for (const el of $$('[data-key]')) {
      const v = state[el.dataset.key];
      if (el.type === 'checkbox') { el.checked = !!v; continue; }
      if (el.tagName === 'SELECT') { el.value = String(v); continue; }
      if (document.activeElement === el) continue;
      el.value = fmtInput(el.dataset.q, v);
    }
    const custom = state.series === 'custom';
    for (const el of $$('[data-ring]')) {
      el.disabled = !custom;
      if (document.activeElement !== el) el.value = fmtInput('length', state.ring[el.dataset.ring]);
    }
    $('#series').value = state.series;
  }

  function fmtInput(q, v) {
    if (v === undefined || v === null || !isFinite(v)) return '';
    if (q === 'int' || q === 'num') return String(v);
    const d = U.toDisplay(q, v);
    const digits = q === 'length' ? U.lengthDigits() : q === 'temp' ? 1 : 2;
    return String(Number(d.toFixed(digits)));
  }

  function bindForm() {
    $('#form').addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.key) {
        const v = readInput(el);
        if (el.dataset.q && el.type !== 'checkbox' && el.tagName !== 'SELECT' && !isFinite(v)) { el.classList.add('bad'); return; }
        el.classList.remove('bad');
        state[el.dataset.key] = v;
        schedule();
      } else if (el.dataset.ring) {
        const v = readInput(el);
        if (!isFinite(v)) { el.classList.add('bad'); return; }
        el.classList.remove('bad');
        state.ring[el.dataset.ring] = v;
        schedule();
      }
    });
    $('#form').addEventListener('change', (e) => {
      const el = e.target;
      if (el.id === 'series') {
        const v = el.value;
        if (v === 'custom') { state.series = 'custom'; state.size = ''; }
        else {
          const cs = state.ring.cs;
          const list = seriesSizes(v);
          // keep a similar size when switching standards
          let best = list[0];
          for (const s of list) if (Math.abs(s.cs - cs) + Math.abs(s.id - state.ring.id) * 0.1 < Math.abs(best.cs - cs) + Math.abs(best.id - state.ring.id) * 0.1) best = s;
          selectSize(v, best.code);
        }
        fillCsFilter(); fillSizes(); render();
      } else if (el.id === 'cs-filter') {
        const cs = parseFloat(el.value);
        if (isFinite(cs) && cs !== state.ring.cs) {
          // jump to the size of that cross-section closest to the current ID
          const list = seriesSizes(state.series).filter((z) => z.cs === cs);
          const best = list.reduce((a, b) => (Math.abs(b.id - state.ring.id) < Math.abs(a.id - state.ring.id) ? b : a));
          selectSize(state.series, best.code);
        }
        fillSizes();
        render();
      } else if (el.id === 'size') {
        selectSize(state.series, el.value);
        render();
      } else if (el.tagName === 'SELECT' && el.dataset.key) {
        state[el.dataset.key] = readInput(el);
        render();
      } else if (el.type === 'checkbox' && el.dataset.key) {
        state[el.dataset.key] = el.checked;
        render();
      } else if (el.dataset.key || el.dataset.ring) {
        writeInputs();
      }
    });

    const seg = (id, key, after) => {
      $(id).addEventListener('click', (e) => {
        const b = e.target.closest('button[role="radio"]');
        if (!b) return;
        state[key] = b.dataset[key];
        if (after) after();
        render();
      });
    };
    $('#type-picker').addEventListener('click', (e) => {
      const b = e.target.closest('button[role="radio"]');
      if (!b) return;
      state.type = b.dataset.type;
      fitHardwareToRing(true); // each seal type keeps its own dimensions; size its groove for the current ring and motion
      render();
    });
    // static and dynamic glands differ in depth: re-apply the guideline
    seg('#motion', 'motion', () => { fitHardwareToRing(true); toast(t('Groove set to the guideline values')); });
    seg('#pdir', 'pdir', () => fitHardwareToRing(true));
    seg('#shape', 'shape', () => fitHardwareToRing(true));

    $('#apply-rec').addEventListener('click', () => {
      ensureHardware(true);
      render();
      toast(t('Groove set to the guideline values'));
    });
    $('#suggest').addEventListener('click', () => {
      const series = state.series === 'custom' ? 'AS568' : state.series;
      const pref = parseFloat($('#cs-filter').value);
      const best = Calc.suggest(state, seriesSizes(series), isFinite(pref) ? pref : null);
      if (!best) { toast(t('No suitable standard O-ring found')); return; }
      selectSize(series, best.size.code, true);
      Object.assign(state, best.patch);
      fillCsFilter(); fillSizes();
      render();
      toast(t('Selected {size}', { size: sizeLabel(best.size) }));
    });
  }

  // ---------- Rendering ----------
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    // animation frames pause in hidden tabs; the timer keeps results current there too
    const run = () => { if (!pending) return; pending = false; render(); };
    requestAnimationFrame(run);
    setTimeout(run, 80);
  }

  function setSeg(id, attr, value) {
    for (const b of $$(id + ' button[role="radio"]')) b.setAttribute('aria-checked', String(b.dataset[attr] === value));
  }

  function visibility() {
    const radial = state.type !== 'face';
    const tokens = new Set([
      radial ? 'radial' : 'face',
      state.series !== 'custom' ? 'standard' : 'custom',
      `${state.type}-${state.shape}`,
      radial && state.shape === 'rect' ? 'radial-rect' : '',
      !radial ? `face-${state.shape}` : '',
    ]);
    for (const el of $$('[data-show]')) {
      const show = el.dataset.show.split(/\s+/).some((k) => tokens.has(k));
      el.hidden = !show;
    }
    $('#contour-label').textContent = t(state.type === 'rod' ? 'Rod length' : 'Bore length');
    $('#contour-label-w').textContent = t(state.type === 'rod' ? 'Rod width' : 'Bore width');
  }

  function render() {
    setSeg('#type-picker', 'type', state.type);
    setSeg('#motion', 'motion', state.motion);
    setSeg('#pdir', 'pdir', state.pdir);
    setSeg('#shape', 'shape', state.shape);
    setSeg('#units', 'units', U.system);
    if (state.type === 'face') state.motion = 'static';
    visibility();
    writeInputs();
    for (const el of $$('label .u[data-unit]')) el.textContent = '(' + U.label(el.dataset.unit) + ')';

    const res = Calc.calc(state);
    lastRes = res;
    renderHero(res);
    renderIssues(res);
    renderDrawings(res);
    renderMetrics(res);
    renderRec(res);
    renderGuideLib(res);
    renderHints(res);
    if ($('#lib-sizes').open) renderSizeLib();
    if ($('#lib-mat').open) renderMatLib();
  }

  function renderHero(res) {
    const hv = $('#hero-value'), sub = $('#hero-sub'), side = $('#hero-side'), chip = $('#status-chip');
    side.textContent = '';
    if (!res.valid) {
      hv.textContent = '—'; hv.className = 'hero-value'; sub.textContent = '';
      chip.className = 'status-chip error'; chip.textContent = t('Check inputs');
      return;
    }
    const sq = res.squeeze;
    hv.textContent = fPct(sq.nom);
    hv.className = 'hero-value ' + res.status;
    sub.textContent = t('Worst case {min} … {max} · guideline {lo}–{hi} %', {
      min: fPct(sq.min), max: fPct(sq.max), lo: Data.LIMITS.squeeze[res.kind][0], hi: Data.LIMITS.squeeze[res.kind][1],
    });
    const items = [
      [t('Gland fill'), fPct(res.fill.nom, 0)],
      [t(state.type === 'face' ? 'Seat fit' : 'ID stretch'), state.type === 'face' ? faceFit(res) : fPct(res.stretch.nom)],
      [t(state.type === 'face' ? 'Flange gap' : 'Radial clearance'), fL(res.gapR)],
    ];
    for (const [k, v] of items) {
      const d = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      d.append(dt, dd); side.appendChild(d);
    }
    chip.className = 'status-chip ' + res.status;
    chip.textContent = t(res.status === 'ok' ? 'OK' : res.status === 'warn' ? 'Check' : 'Problem');
  }

  /** Face seals: describe how the ring seats on the primary groove wall. */
  function faceFit(res) {
    const tiny = 0.0005;
    if (res.stretch.nom > tiny) return t('stretched {v}', { v: fPct(res.stretch.nom) });
    if (res.circ.nom > tiny) return t('compressed {v}', { v: fPct(res.circ.nom) });
    if (res.loose > tiny) return t('loose {v}', { v: fPct(res.loose) });
    return fPct(0, 0);
  }

  function renderIssues(res) {
    const box = $('#issues');
    box.textContent = '';
    const order = { error: 0, warn: 1, info: 2 };
    const list = res.issues.slice().sort((a, b) => order[a.level] - order[b.level]);
    box.hidden = !list.length;
    const tags = { error: 'Error', warn: 'Warning', info: 'Note' };
    for (const i of list) {
      const d = document.createElement('div');
      d.className = 'issue ' + i.level;
      const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = t(tags[i.level]);
      const tx = document.createElement('span'); tx.textContent = t(i.text, localParams(i.params));
      d.append(tag, tx);
      box.appendChild(d);
    }
  }

  function renderDrawings(res) {
    const s = state;
    if (!res.valid) { $('#section').textContent = ''; $('#plan').textContent = ''; return; }
    const names = {
      piston: ['Piston', 'Bore', 'axis ↓'],
      rod: ['Housing', 'Rod', 'axis ↑'],
      face: ['Flange', 'Cover', ''],
    }[s.type];
    const pressureFrom = s.type === 'face' ? (s.pdir === 'external' ? 'right' : 'left') : 'left';
    const csEff = res.csE.nom;
    const area = Math.PI / 4 * s.ring.cs * s.ring.cs * (res.stretch.nom > 0 ? 1 / (1 + res.stretch.nom) : 1 + res.circ.nom);
    Drawing.section($('#section'), {
      type: s.type, G: s.G, L: res.L.nom, gap: s.type === 'face' ? (s.gap || 0) : Math.max(0, res.gapR), r: s.r,
      cs: s.ring.cs, csEff, area, pressureFrom, axisAbove: s.type === 'rod',
      labels: {
        title: t('Gland cross-section'), pressure: t('pressure'),
        groovePart: t(names[0]), matingPart: t(names[1]), axis: names[2] ? t(names[2]) : '',
      },
      fmt: fL,
    });

    // plan view
    let outer, inner, offset;
    // installed ring width in the groove (area-conserving), used for the stroke width
    const w = res.L.nom > 0 && csEff > res.L.nom ? Math.min(s.G, Math.PI / 4 * s.ring.cs * s.ring.cs / res.L.nom) : csEff;
    if (s.type === 'face') {
      const g = res.geom;
      if (s.shape === 'rect') { outer = g.outer; inner = g.inner; }
      else { outer = { D: g.outerD }; inner = { D: g.innerD }; }
      offset = s.pdir === 'external' ? s.G - w / 2 : w / 2;
    } else if (s.shape === 'rect') {
      // radial: the ring centreline lies half a gland depth from either wall
      outer = res.geom.outer; inner = res.geom.seat; offset = res.L.nom / 2;
    } else if (s.type === 'piston') {
      outer = { D: s.A }; inner = { D: s.B1 }; offset = res.L.nom / 2;
    } else {
      outer = { D: s.A1 }; inner = { D: s.B }; offset = res.L.nom / 2;
    }
    Drawing.plan($('#plan'), {
      outer, inner, ring: { offset, width: w },
      labels: { title: t('Groove outline'), outer: s.type === 'face' ? t('groove') : s.type === 'piston' ? t('bore') : t('groove') },
      fmt: fL,
    });
  }

  function metric(k, v, sub, level) { return { k, v, sub, level }; }

  function renderMetrics(res) {
    const box = $('#metrics');
    box.textContent = '';
    if (!res.valid) return;
    const s = state, L = Data.LIMITS;
    const band = L.squeeze[res.kind];
    const lvl = (v, lo, hi) => (v < lo / 100 || v > hi / 100 ? 'warn' : '');
    const items = [
      metric(t('Compression min. / max.'), `${fPct(res.squeeze.min)} / ${fPct(res.squeeze.max)}`, t('guideline {lo}–{hi} %', { lo: band[0], hi: band[1] }), res.squeeze.min < band[0] / 100 || res.squeeze.max > band[1] / 100 ? 'warn' : ''),
      metric(t('Squeeze (nominal)'), fL(res.squeezeAbs.nom), t('min. {v}', { v: fL(res.squeezeAbs.min) }), res.squeezeAbs.min < L.minSqueezeMm ? 'warn' : ''),
      metric(t('Compression at T min / T max'), `${fPct(res.squeezeCold)} / ${fPct(res.squeezeHot)}`, t('worst case, incl. swell')),
      metric(t('Gland fill nominal'), fPct(res.fill.nom, 0), t('recommended 60–85 %, optimum 75 %'), lvl(res.fill.nom, L.fillMin, L.fill.max)),
      metric(t('Gland fill worst case / hot'), `${fPct(res.fill.max, 0)} / ${fPct(res.fill.hot, 0)}`, t('at T max with swell'), res.fill.hot >= 1 ? 'error' : res.fill.max > L.fill.worstMax / 100 ? 'warn' : ''),
      metric(t('Gland depth L'), fL(res.L.nom), `${fL(res.L.min)} … ${fL(res.L.max)}`),
      metric(t('Groove width G'), fL(s.G), `± ${fL(s.tolG)}`),
      metric(t('Effective cross-section'), fL(res.csE.nom), t('after stretch (Parker fig. 3-3)')),
    ];
    if (s.type === 'face') {
      items.push(metric(t('Seat fit on primary wall'), faceFit(res), t(s.pdir === 'external' ? 'ring ID vs. groove inner wall' : 'ring OD vs. groove outer wall')));
      const g = res.geom;
      if (s.shape === 'rect') {
        items.push(metric(t('Groove inner outline'), `${fL(g.inner.L)} × ${fL(g.inner.W)}`, 'R ' + fL(g.inner.R)));
        items.push(metric(t('Centreline corner radius'), fL(g.centreRadius), t('min. {v}', { v: fL(L.cornerRadiusFactor * s.ring.cs) }), g.centreRadius < L.cornerRadiusFactor * s.ring.cs ? 'warn' : ''));
      } else {
        items.push(metric(t('Groove inner Ø'), fL(g.innerD), t('outer Ø {v}', { v: fL(g.outerD) })));
      }
      items.push(metric(t('Groove perimeter (centreline)'), fL(g.length), t('O-ring centreline {v}', { v: fL(Math.PI * (s.ring.id + s.ring.cs)) })));
    } else {
      items.push(metric(t('ID stretch'), fPct(res.stretch.nom), `${fPct(res.stretch.min)} … ${fPct(res.stretch.max)}`, res.stretch.max > L.stretchMax / 100 ? 'warn' : ''));
      if (res.circ.max > 0) items.push(metric(t('Circumferential compression'), fPct(res.circ.nom), t('max. {v}', { v: fPct(res.circ.max) }), res.circ.max > L.circCompressionMax / 100 ? 'warn' : ''));
      items.push(metric(t('Diametral clearance'), fL(2 * res.gapR), res.Emax !== undefined ? t('max. {v}', { v: fL(res.Emax) }) : '', res.Emax !== undefined && 2 * res.gapRMax > res.Emax ? 'warn' : ''));
      items.push(metric(t('Groove depth (radial)'), fL(res.L.nom - res.gapR), t('gland depth minus radial clearance')));
      if (s.shape === 'circle') {
        const gd = s.type === 'piston' ? s.B1 : s.A1;
        items.push(metric(t('Groove Ø'), fL(gd), s.type === 'piston' ? t('on the piston') : t('in the housing')));
      }
    }
    items.push(metric(t('O-ring OD'), fL(res.ringOD), `ID ${fL(s.ring.id)} · CS ${fL(s.ring.cs)}`));
    items.push(metric(t('O-ring / gland volume'), `${U.format('volume', res.ringVolume)}`, t('gland {v}', { v: U.format('volume', res.glandVolume) })));
    for (const m of items) {
      const d = document.createElement('div');
      d.className = 'metric' + (m.level ? ' ' + m.level : '');
      const k = document.createElement('div'); k.className = 'k'; k.textContent = m.k;
      const v = document.createElement('div'); v.className = 'v'; v.textContent = m.v;
      d.append(k, v);
      if (m.sub) { const sb = document.createElement('div'); sb.className = 's'; sb.textContent = m.sub; d.appendChild(sb); }
      box.appendChild(d);
    }
  }

  function table(head, rows, opts = {}) {
    const tb = document.createElement('table');
    tb.className = 'data';
    const th = document.createElement('thead');
    const tr = document.createElement('tr');
    head.forEach((h, i) => { const c = document.createElement('th'); c.textContent = h; if (i === 0 || (opts.left && opts.left.includes(i))) c.className = 'left'; tr.appendChild(c); });
    th.appendChild(tr); tb.appendChild(th);
    const body = document.createElement('tbody');
    for (const r of rows) {
      const row = document.createElement('tr');
      if (r.hl) row.className = 'hl';
      if (r.onclick) { row.classList.add('click'); row.addEventListener('click', r.onclick); }
      r.cells.forEach((v, i) => {
        const c = document.createElement('td');
        c.textContent = v;
        if (opts.wrap && opts.wrap.includes(i)) c.className = 'wrap';
        else if (i === 0 || (opts.left && opts.left.includes(i))) c.className = 'left';
        row.appendChild(c);
      });
      body.appendChild(row);
    }
    tb.appendChild(body);
    return tb;
  }

  const range = (a, b) => (Math.abs(a - b) < 1e-9 ? fL(a) : `${fL(a)} … ${fL(b)}`);
  const sourceName = (src) => (src === 'parker' ? 'Parker ORD 5700' : 'ERIKS');

  function renderRec(res) {
    const g = res.guide, s = state;
    $('#rec-source').textContent = sourceName(g.source) + (g.exact ? '' : ' · ' + t('interpolated'));
    const box = $('#rec-table');
    box.textContent = '';
    if (!res.valid) return;
    const ok = (v, lo, hi) => (v >= lo - 1e-6 && v <= hi + 1e-6 ? '✓' : '!');
    const rows = [
      { cells: [t('Gland depth L'), range(g.L[0], g.L[1]), fL(res.L.nom), ok(res.L.nom, g.L[0], g.L[1])] },
      { cells: [t('Groove width G') + (s.type === 'face' ? ` (${t(s.medium === 'gas' ? 'gas / vacuum' : 'liquids')})` : s.backups ? ` (${t('{n} back-up', { n: s.backups })})` : ''), range(g.G[0], g.G[1]), fL(s.G), ok(s.G, g.G[0], g.G[1])] },
      { cells: [t('Groove bottom radius'), range(g.R[0], g.R[1]), fL(s.r), ok(s.r, g.R[0] * 0.999, g.R[1])] },
      { cells: [t('Compression'), `${U.fmtNumber(g.sq[0], 0)}–${U.fmtNumber(g.sq[1], 0)} %`, `${fPct(res.squeeze.min)} … ${fPct(res.squeeze.max)}`, ok(res.squeeze.nom * 100, g.sq[0], g.sq[1])] },
    ];
    if (g.E !== undefined && s.type !== 'face') {
      const Emax = res.Emax;
      rows.push({ cells: [t('Diametral clearance (max.)'), fL(Emax) + (res.mat.lowStrength ? ' *' : ''), fL(2 * res.gapRMax), 2 * res.gapRMax <= Emax + 1e-6 ? '✓' : '!'] });
    }
    // hardware implied by the guideline for the primary dimension
    if (s.type === 'piston' && s.shape === 'circle') rows.push({ cells: [t('Groove Ø (for this bore)'), range(s.A - 2 * g.L[1], s.A - 2 * g.L[0]), fL(s.B1), ok(s.B1, s.A - 2 * g.L[1], s.A - 2 * g.L[0])] });
    if (s.type === 'rod' && s.shape === 'circle') rows.push({ cells: [t('Groove Ø (for this rod)'), range(s.B + 2 * g.L[0], s.B + 2 * g.L[1]), fL(s.A1), ok(s.A1, s.B + 2 * g.L[0], s.B + 2 * g.L[1])] });
    if (s.type === 'face') rows.push({ cells: [t('Groove depth (with flange gap {v})', { v: fL(s.gap || 0) }), range(g.L[0] - (s.gap || 0), g.L[1] - (s.gap || 0)), fL(s.h), ok(s.h + (s.gap || 0), g.L[0], g.L[1])] });
    box.appendChild(table([t('Parameter'), t('Guideline'), t('Your design'), ''], rows));
    if (res.mat.lowStrength) {
      const p = document.createElement('p'); p.className = 'card-note'; p.style.marginTop = '8px';
      p.textContent = '* ' + t('Clearance halved for silicone / fluorosilicone.');
      box.appendChild(p);
    }
  }

  function renderGuideLib(res) {
    const kind = res.kind;
    const src = guideSrc || res.guide.source;
    const box = $('#guide-table');
    box.textContent = '';
    const sel = document.createElement('div');
    sel.className = 'lib-tools';
    const ss = document.createElement('select');
    ss.setAttribute('aria-label', t('Design guideline'));
    for (const [v, n] of [['parker', 'Parker ORD 5700 (inch tables)'], ['eriks', 'ERIKS (metric tables)']]) ss.appendChild(new Option(t(n), v));
    ss.value = src;
    ss.addEventListener('change', () => { guideSrc = ss.value; render(); });
    sel.appendChild(ss);
    box.appendChild(sel);
    const kindName = { staticRadial: 'Static radial (piston / rod)', face: 'Face seal (axial)', dynamic: 'Dynamic reciprocating (piston / rod)' }[kind];
    $('#guide-note').textContent = t('{kind} · values in {unit}. The highlighted row matches the selected O-ring cross-section.', { kind: t(kindName), unit: U.label('length') });
    const cs = state.ring.cs;
    let head, rows;
    if (src === 'parker') {
      const tab = Data.PARKER_IN[kind];
      const conv = (inch) => inch * Data.IN;
      if (kind === 'face') {
        head = [t('Cross-section'), t('Gland depth L'), t('Compression'), t('Width (liquids)'), t('Width (gas / vacuum)'), t('Bottom radius')];
        rows = tab.map((r) => ({ hl: Math.abs(conv(r.cs) - cs) < 0.03, cells: [fL(conv(r.cs)), range(conv(r.L[0]), conv(r.L[1])), `${r.sq[0]}–${r.sq[1]} %`, range(conv(r.Gl[0]), conv(r.Gl[1])), range(conv(r.Gv[0]), conv(r.Gv[1])), range(conv(r.R[0]), conv(r.R[1]))] }));
      } else {
        head = [t('Cross-section'), t('Gland depth L'), t('Compression'), t('Diametral clearance'), t('Width, no back-up'), t('Width, 1 back-up'), t('Width, 2 back-ups'), t('Bottom radius')];
        rows = tab.map((r) => ({ hl: Math.abs(conv(r.cs) - cs) < 0.03, cells: [fL(conv(r.cs)), range(conv(r.L[0]), conv(r.L[1])), `${r.sq[0]}–${r.sq[1]} %`, range(conv(r.E[0]), conv(r.E[1])), range(conv(r.G[0][0]), conv(r.G[0][1])), range(conv(r.G[1][0]), conv(r.G[1][1])), range(conv(r.G[2][0]), conv(r.G[2][1])), range(conv(r.R[0]), conv(r.R[1]))] }));
        if (kind === 'dynamic') {
          for (const r of Data.PARKER_IN.dynamicMetricMm) rows.push({ hl: Math.abs(r[0] - cs) < 0.03, cells: [fL(r[0]) + ' (ISO)', fL(r[1]), '', '', fL(r[2]), '', '', range(r[3], r[4])] });
        }
      }
    } else {
      const tab = Data.ERIKS_MM[kind];
      if (kind === 'face') {
        head = [t('Cross-section'), '±', t('Gland depth L'), t('Width (liquids)'), t('Width (gas / vacuum)'), t('Bottom radius')];
        rows = tab.map((r) => ({ hl: Math.abs(r[0] - cs) < 0.03, cells: [fL(r[0]), fL(r[1]), range(r[2], r[2] + r[3]), range(r[4], r[4] + 0.13), range(r[5], r[5] + 0.13), fL(r[6])] }));
      } else {
        head = [t('Cross-section'), '±', t('Gland depth L'), t('Diametral clearance'), t('Groove width G'), t('Bottom radius'), t('Max. eccentricity')];
        rows = tab.map((r) => ({ hl: Math.abs(r[0] - cs) < 0.03, cells: [fL(r[0]), fL(r[1]), range(r[2], r[2] + r[3]), fL(r[4]), range(r[5], r[5] + 0.13), fL(r[6]), fL(r[7])] }));
      }
    }
    box.appendChild(table(head, rows));
    if (src === 'eriks' && kind !== 'face') {
      const b = Data.ERIKS_MM.backup;
      const h3 = document.createElement('p'); h3.className = 'card-note'; h3.style.margin = '12px 0 6px';
      h3.textContent = t('Groove width with standard spiral PTFE back-up rings (ERIKS Table 3.D-2):');
      box.appendChild(h3);
      box.appendChild(table([t('Cross-section'), t('Back-up thickness'), t('Gland depth L'), t('Width, 1 back-up'), t('Width, 2 back-ups')],
        b.map((r) => ({ hl: Math.abs(r[0] - cs) < 0.03, cells: [fL(r[0]), fL(r[1]), fL(r[2]), fL(r[3]), fL(r[4])] }))));
    }
  }

  function renderSizeLib() {
    const series = $('#lib-series').value;
    const q = $('#lib-search').value.trim().toLowerCase().replace(',', '.');
    let list = seriesSizes(series);
    if (q) {
      list = list.filter((s) => {
        const txt = [s.code, s.id, s.cs, s.inch ? s.inch.id : '', s.inch ? s.inch.cs : '', U.toDisplay('length', s.id).toFixed(3), U.toDisplay('length', s.cs).toFixed(3)].join(' ').toLowerCase();
        return q.split(/\s+/).every((w) => txt.includes(w));
      });
    }
    const box = $('#size-table');
    box.textContent = '';
    const imp = U.system === 'IMP';
    const head = [t('Size'), 'ID', 'ID ±', 'CS', 'CS ±', 'OD'];
    const rows = list.map((s) => {
      const v = imp && s.inch ? [s.inch.id.toFixed(3), s.inch.idTol.toFixed(3), s.inch.cs.toFixed(3), s.inch.csTol.toFixed(3), (s.inch.id + 2 * s.inch.cs).toFixed(3)]
        : [s.id, s.idTol, s.cs, s.csTol, s.id + 2 * s.cs].map((x) => U.fmtNumber(U.toDisplay('length', x), imp ? 4 : 2));
      return {
        hl: state.series === s.series && state.size === s.code,
        cells: [s.code].concat(v),
        onclick: () => { selectSize(s.series, s.code); fillCsFilter(); fillSizes(); render(); toast(t('Selected {size}', { size: sizeLabel(s) })); },
      };
    });
    box.appendChild(table(head.map((h, i) => (i ? `${h} (${U.label('length')})` : h)), rows));
  }

  function renderMatLib() {
    const box = $('#mat-table');
    box.textContent = '';
    const rows = Data.MATERIALS.map((m) => ({
      hl: m.id === state.material,
      cells: [t(m.name), `${fT(m.tMin)} … ${fT(m.tMax)}`, `${m.hardness[0]}–${m.hardness[1]} ShA`, (m.approx ? '≈ ' : '') + (m.cte * 1e6).toFixed(0), t(m.good), t(m.bad)],
      onclick: () => { state.material = m.id; render(); },
    }));
    box.appendChild(table([t('Material'), t('Temperature range'), t('Hardness'), 'α (10⁻⁶/K)', t('Good for'), t('Avoid')], rows, { wrap: [4, 5] }));
  }

  function renderHints(res) {
    const s = state;
    const typeHints = {
      piston: 'Groove in the piston (inner part). The O-ring is stretched onto the groove bottom and seals against the bore.',
      rod: 'Groove in the housing bore. The O-ring seals against the rod or shaft.',
      face: s.pdir === 'external'
        ? 'Groove in a flat face, pressure from outside: the O-ring ID should seat on the groove inner wall.'
        : 'Groove in a flat face, pressure from inside: the O-ring OD should seat on the groove outer wall.',
    };
    let th = t(typeHints[s.type]);
    if (s.type !== 'face' && s.shape === 'rect') th += ' ' + t('Rounded-rectangle radial gland: the contour is the bore (piston) or the rod / plug (rod); the groove is offset from it by the gland depth.');
    if (s.type === 'face' && s.shape === 'rect') th += ' ' + t('Rounded rectangle: enter the outer groove wall; the inner wall is offset by the groove width.');
    $('#type-hint').textContent = th;

    const r = s.ring;
    const z = sizeByCode(s.series, s.size);
    let rh = t('OD {od} · centreline length {cl}', { od: fL(r.id + 2 * r.cs), cl: fL(Math.PI * (r.id + r.cs)) });
    if (z && z.inch) rh += ' · ' + t('actual {a} × {b} in', { a: z.inch.id.toFixed(3), b: z.inch.cs.toFixed(3) });
    if (s.series !== 'custom') rh += ' · ' + t(Data.SERIES[s.series].note);
    $('#ring-hint').textContent = rh;

    const m = res.mat;
    $('#mat-hint').textContent = t('{m}: typically {lo} … {hi}. Good for: {good}. Avoid: {bad}.', { m: t(m.name), lo: fT(m.tMin), hi: fT(m.tMax), good: t(m.good), bad: t(m.bad) });

    let hw = '';
    if (s.type === 'piston' && s.shape === 'circle') hw = t('Gland depth L = (bore − groove Ø) / 2 = {L}. Radial clearance = (bore − piston Ø) / 2 = {c}.', { L: fL(res.L.nom), c: fL(res.gapR) });
    else if (s.type === 'rod' && s.shape === 'circle') hw = t('Gland depth L = (groove Ø − rod Ø) / 2 = {L}. Radial clearance = (housing bore − rod Ø) / 2 = {c}.', { L: fL(res.L.nom), c: fL(res.gapR) });
    else if (s.type === 'face') hw = t('Gland depth L = groove depth + flange gap = {L}.', { L: fL(res.L.nom) });
    $('#hw-hint').textContent = hw;
  }

  // ---------- Toolbar, dialogs ----------
  function bindToolbar() {
    const langSel = $('#lang');
    for (const [k, v] of Object.entries(I18N.LANGS)) langSel.appendChild(new Option(v.name, k));
    langSel.value = I18N.lang;
    langSel.addEventListener('change', () => { I18N.setLang(langSel.value); fillMaterials(); fillCsFilter(); fillSizes(); render(); renderConverter(); });

    $('#units').addEventListener('click', (e) => {
      const b = e.target.closest('button[role="radio"]');
      if (!b) return;
      U.setSystem(b.dataset.units);
      try { localStorage.setItem('oring.units', U.system); } catch (err) { /* storage unavailable */ }
      fillCsFilter(); fillSizes(); render();
    });

    $('#share').addEventListener('click', async () => {
      const url = location.href.split('#')[0] + '#d=' + encodeState();
      history.replaceState(null, '', url);
      try { await navigator.clipboard.writeText(url); toast(t('Link copied to clipboard')); }
      catch (err) { toast(t('Link updated in the address bar')); }
    });
    $('#print').addEventListener('click', () => window.print());

    // About dialog: toolbar button, footer link and #about deep link.
    const about = $('#about');
    const openAbout = (e) => { if (e) e.preventDefault(); if (!about.open) about.showModal(); };
    $('#about-open').addEventListener('click', openAbout);
    $('#about-link').addEventListener('click', openAbout);
    about.addEventListener('click', (e) => { if (e.target === about) about.close(); }); // backdrop click
    about.addEventListener('close', () => { if (location.hash === '#about') history.replaceState(null, '', location.pathname + location.search); });
    window.addEventListener('hashchange', () => { if (location.hash === '#about') openAbout(); });
    if (location.hash === '#about') openAbout();

    const conv = $('#converter');
    $('#converter-open').addEventListener('click', () => { renderConverter(); if (!conv.open) conv.showModal(); });
    conv.addEventListener('click', (e) => { if (e.target === conv) conv.close(); });
    $('#conv-family').addEventListener('click', (e) => {
      const b = e.target.closest('button[role="radio"]');
      if (!b) return;
      convFamily = b.dataset.family;
      renderConverter();
    });

    $('#theme').addEventListener('click', () => {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('oring.theme', next); } catch (e) { /* storage unavailable */ }
    });

    for (const id of ['#lib-sizes', '#lib-mat']) $(id).addEventListener('toggle', () => render());
    $('#lib-series').addEventListener('change', renderSizeLib);
    $('#lib-search').addEventListener('input', renderSizeLib);
  }

  // ---------- Unit converter ----------
  let convFamily = 'length';
  const convValues = { length: ['mm', 1], pressure: ['bar', 1], temp: ['°C', 20], force: ['N', 100], area: ['mm²', 100], volume: ['mm³', 1000] };

  function renderConverter() {
    setSeg('#conv-family', 'family', convFamily);
    const box = $('#conv-fields');
    box.textContent = '';
    const fam = U.FAMILIES[convFamily];
    const [srcUnit, srcVal] = convValues[convFamily];
    for (const [unit] of fam.units) {
      const lab = document.createElement('label');
      lab.textContent = unit;
      const inp = document.createElement('input');
      inp.type = 'number'; inp.step = 'any'; inp.dataset.cunit = unit;
      const v = U.convert(convFamily, srcVal, srcUnit, unit);
      inp.value = String(Number(v.toPrecision(7)));
      inp.addEventListener('input', () => {
        const x = parseFloat(inp.value);
        if (!isFinite(x)) return;
        convValues[convFamily] = [unit, x];
        for (const other of box.querySelectorAll('input')) {
          if (other === inp) continue;
          other.value = String(Number(U.convert(convFamily, x, unit, other.dataset.cunit).toPrecision(7)));
        }
        convFraction();
      });
      lab.appendChild(inp);
      box.appendChild(lab);
    }
    convFraction();
  }
  function convFraction() {
    const out = $('#conv-frac');
    if (convFamily !== 'length') { out.textContent = ''; return; }
    const [u, v] = convValues.length;
    const inch = U.convert('length', v, u, 'in');
    out.textContent = t('Nearest fraction: {f} in', { f: U.inchFraction(inch) });
  }

  // ---------- State sharing ----------
  function encodeState() {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeState(str) {
    try {
      const b = str.replace(/-/g, '+').replace(/_/g, '/');
      const obj = JSON.parse(decodeURIComponent(escape(atob(b))));
      if (obj && typeof obj === 'object' && obj.ring) return obj;
    } catch (e) { /* ignore malformed links */ }
    return null;
  }

  let toastTimer;
  function toast(msg) {
    const box = $('#toast');
    box.textContent = msg;
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, 2200);
  }

  function fillMaterials() {
    const sel = $('#material');
    sel.textContent = '';
    for (const m of Data.MATERIALS) sel.appendChild(new Option(t(m.name), m.id));
    sel.value = state.material;
  }

  // ---------- Init ----------
  function init() {
    I18N.init();
    try { const u = localStorage.getItem('oring.units'); if (u) U.setSystem(u); } catch (e) { /* storage unavailable */ }
    const m = location.hash.match(/#d=([\w-]+)/);
    const loaded = m && decodeState(m[1]);
    if (loaded) state = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), loaded);
    else {
      selectSize(state.series, state.size);
      ensureHardware(true);
    }
    if (!state.ring) selectSize('AS568', '-214');
    fillMaterials();
    fillCsFilter();
    fillSizes();
    bindForm();
    bindToolbar();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
