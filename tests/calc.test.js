// Checks for the gland calculations, data tables, unit conversion and translations.
// Run: node tests/calc.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const D = require('../js/data.js');
const C = require('../js/calc.js');
const U = require('../js/units.js');
const I = require('../js/i18n.js');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
const keys = new Set(I.keys());
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what || ''} expected ${b} ± ${tol}, got ${a}`);
const IN = 25.4;
const size = (series, code) => D.SIZES.find((s) => s.series === series && s.code === code);
const base = {
  motion: 'static', pdir: 'internal', shape: 'circle', source: 'auto', medium: 'liquid', backups: 0,
  material: 'NBR', hardness: 70, r: 0, tolD: 0, tolH: 0, tolG: 0, ecc: false,
  pressure: 10, tMin: 20, tMax: 20, swell: 0, gap: 0,
};
const design = (o) => Object.assign({}, base, o);

console.log('Data');
check('AS568 has all 349 dash numbers -001 … -475', () => {
  const as = D.SIZES.filter((s) => s.series === 'AS568');
  assert.strictEqual(as.length, 349);
  const z = size('AS568', '-210');
  near(z.inch.id, 0.734, 1e-9); near(z.inch.cs, 0.139, 1e-9); near(z.id, 18.644, 0.001);
});
check('AS568 IDs increase within each cross-section series', () => {
  const as = D.SIZES.filter((s) => s.series === 'AS568');
  for (let i = 1; i < as.length; i++) if (as[i].cs === as[i - 1].cs) assert.ok(as[i].id > as[i - 1].id, as[i].code);
});
check('ISO 3601-1 series G cross-sections and tolerances', () => {
  const iso = D.SIZES.filter((s) => s.series === 'ISO3601');
  assert.ok(iso.length > 250);
  for (const s of iso) assert.ok([1.8, 2.65, 3.55, 5.3, 7].includes(s.cs), s.code);
  assert.ok(size('ISO3601', '100 × 5.30'));
});
check('guideline tables are monotonic in cross-section', () => {
  for (const k of ['staticRadial', 'face', 'dynamic']) {
    const p = D.PARKER_IN[k];
    for (let i = 1; i < p.length; i++) assert.ok(p[i].L[0] > p[i - 1].L[0], k);
    const e = D.ERIKS_MM[k];
    for (let i = 1; i < e.length; i++) assert.ok(e[i][0] > e[i - 1][0] && e[i][2] >= e[i - 1][2], k + ' row ' + i);
  }
});
check('materials have temperature ranges and expansion coefficients', () => {
  for (const m of D.MATERIALS) assert.ok(m.tMin < m.tMax && m.cte > 5e-5 && m.cte < 5e-4, m.id);
});

console.log('Geometry & stretch');
check('rounded rectangle perimeter: square → circle limit and sharp corners', () => {
  near(C.rrPerimeter(10, 10, 5), Math.PI * 10, 1e-9);
  near(C.rrPerimeter(20, 10, 0), 60, 1e-9);
});
check('Parker fig. 3-3: 5 % stretch reduces the cross-section ≈ 3.4 %', () => {
  near(C.csReduction(0.05) * 100, 3.44, 0.05);
  assert.strictEqual(C.csReduction(0), 0);
});

console.log('Guidelines');
check('Parker static radial .139 in: L .111–.113, G .187–.192', () => {
  const g = C.guideline(0.139 * IN, 'staticRadial', { source: 'parker' });
  assert.ok(g.exact);
  near(g.L[0], 0.111 * IN, 1e-6); near(g.L[1], 0.113 * IN, 1e-6); near(g.G[0], 0.187 * IN, 1e-6);
});
check('Parker back-up rings widen the groove', () => {
  const g0 = C.guideline(0.210 * IN, 'staticRadial', { source: 'parker' });
  const g2 = C.guideline(0.210 * IN, 'staticRadial', { source: 'parker', backups: 2 });
  near(g2.G[0], 0.410 * IN, 1e-6); assert.ok(g2.G[0] > g0.G[0]);
});
check('ERIKS metric face seal 3.55: L 2.67, G liquids 4.60 / gas 4.05', () => {
  const g = C.guideline(3.55, 'face', { source: 'eriks' });
  near(g.L[0], 2.67, 1e-9); near(g.G[0], 4.60, 1e-9);
  near(C.guideline(3.55, 'face', { source: 'eriks', medium: 'gas' }).G[0], 4.05, 1e-9);
});
check('auto source: Parker for AS568 sections, ERIKS for metric', () => {
  assert.strictEqual(C.guideline(3.53, 'staticRadial', {}).source, 'parker');
  assert.strictEqual(C.guideline(3.0, 'staticRadial', {}).source, 'eriks');
});
check('interpolated guideline lies between neighbouring rows', () => {
  const g = C.guideline(3.3, 'staticRadial', { source: 'eriks' });
  assert.ok(!g.exact && g.L[0] > 2.52 && g.L[0] < 2.82);
});

console.log('Gland calculation');
check('face seal, no tolerances: compression = 1 − L/CS', () => {
  const ring = { id: 50, idTol: 0, cs: 3.55, csTol: 0 };
  const r = C.calc(design({ type: 'face', ring, Do: 57.1, h: 2.7, G: 4.7 }));
  assert.ok(r.valid);
  near(r.squeeze.nom, 1 - 2.7 / 3.55, 1e-9);
  near(r.fill.nom, Math.PI / 4 * 3.55 * 3.55 / (2.7 * 4.7), 1e-9);
});
check('Parker -210 piston gland: nominal squeeze in Parker range, stretch ≈ 6 %', () => {
  const z = size('AS568', '-210');
  const r = C.calc(design({ type: 'piston', ring: z, A: 1.000 * IN, B1: 0.778 * IN, C: 0.997 * IN, G: 0.190 * IN }));
  near(r.stretch.nom, 0.778 / 0.734 - 1, 1e-4);
  assert.ok(r.squeeze.nom > 0.13 && r.squeeze.nom < 0.23, 'squeeze ' + r.squeeze.nom);
  assert.ok(r.issues.some((i) => /exceeds 5 %/.test(i.text)), 'stretch warning expected');
});
check('tolerances widen the compression band', () => {
  const ring = { id: 50, idTol: 0.4, cs: 3.55, csTol: 0.1 };
  const r = C.calc(design({ type: 'face', ring, Do: 57.1, h: 2.7, G: 4.7, tolH: 0.03 }));
  assert.ok(r.squeeze.min < r.squeeze.nom && r.squeeze.nom < r.squeeze.max);
  assert.ok(r.fill.min < r.fill.nom && r.fill.nom < r.fill.max);
});
check('overfilled groove is an error', () => {
  const ring = { id: 50, idTol: 0, cs: 3.55, csTol: 0 };
  const r = C.calc(design({ type: 'face', ring, Do: 57.1, h: 2.7, G: 3.6 }));
  assert.strictEqual(r.status, 'error');
});
check('deep gland without squeeze is an error', () => {
  const ring = { id: 50, idTol: 0, cs: 3.55, csTol: 0 };
  const r = C.calc(design({ type: 'face', ring, Do: 57.1, h: 3.8, G: 4.7 }));
  assert.ok(r.squeeze.min < 0 && r.status === 'error');
});
check('heat and swell raise the gland fill', () => {
  const ring = { id: 50, idTol: 0, cs: 3.55, csTol: 0 };
  const r = C.calc(design({ type: 'face', ring, Do: 57.1, h: 2.7, G: 4.7, tMax: 150, swell: 10 }));
  assert.ok(r.fill.hot > r.fill.max * 1.1);
});
check('face seal external pressure: stretch onto the inner wall', () => {
  const ring = { id: 50, idTol: 0, cs: 3.55, csTol: 0 };
  const r = C.calc(design({ type: 'face', pdir: 'external', ring, Do: 51 + 2 * 4.7, h: 2.7, G: 4.7 }));
  near(r.stretch.nom, 51 / 50 - 1, 1e-9);
});
check('rounded-rectangle face groove: perimeter fit and corner check', () => {
  const ring = { id: 100, idTol: 0, cs: 3.55, csTol: 0 };
  const P = Math.PI * (ring.id + 2 * ring.cs);
  const Lo = 120, R = 2; // tight corners
  const Wo = (P + (8 - 2 * Math.PI) * R) / 2 - Lo; // outer wall perimeter = ring OD perimeter
  const r = C.calc(design({ type: 'face', shape: 'rect', ring, Lo, Wo, Ro: R, h: 2.7, G: 4.7 }));
  near(r.circ.nom, 0, 1e-9); near(r.stretch.nom, 0, 1e-9);
  assert.ok(r.issues.some((i) => /Corner radius/.test(i.text)));
});
check('rod gland: ring stretched over the rod', () => {
  const z = size('AS568', '-210');
  const r = C.calc(design({ type: 'rod', ring: z, B: 0.750 * IN, A1: 0.972 * IN, D: 0.753 * IN, G: 0.190 * IN }));
  near(r.stretch.nom, 0.750 / 0.734 - 1, 1e-4);
  assert.ok(r.squeeze.nom > 0.15 && r.squeeze.nom < 0.24);
});
check('silicone halves the allowed clearance', () => {
  const z = size('AS568', '-210');
  const d = { type: 'piston', ring: z, A: 25.4, B1: 19.76, C: 25.3, G: 4.8 };
  const nbr = C.calc(design(d)), vmq = C.calc(design(Object.assign({ material: 'VMQ' }, d)));
  near(vmq.Emax, nbr.Emax / 2, 1e-12);
});
check('recommend() then calc() gives no errors for every AS568 and ISO size (static piston)', () => {
  for (const z of D.SIZES.filter((x) => x.series !== 'BOSS')) {
    const s = design({ type: 'piston', ring: z, A: z.id + 2 * z.cs, tolD: 0.02, tolG: 0.05 });
    Object.assign(s, C.recommend(s));
    s.B1 = z.id * 1.02; s.A = s.B1 + 2 * C.guideline(z.cs, 'staticRadial', { csTol: z.csTol }).Lmid; s.C = s.A - 0.05;
    const r = C.calc(s);
    assert.ok(!r.issues.some((i) => i.level === 'error'), `${z.series} ${z.code}: ${r.issues.filter((i) => i.level === 'error').map((i) => i.text).join(' | ')}`);
  }
});
check('suggest() picks an O-ring that seats well', () => {
  const as = D.SIZES.filter((s) => s.series === 'AS568');
  const s = design({ type: 'piston', A: 50, B1: 0, C: 0, G: 0, ring: as[0], tolD: 0.02, tolG: 0.05 });
  const best = C.suggest(s, as);
  const r = C.calc(Object.assign({}, s, { ring: best.size }, best.patch));
  assert.ok(r.stretch.nom > 0 && r.stretch.nom < 0.05, 'stretch ' + r.stretch.nom);
  assert.strictEqual(r.status === 'error', false);
  const sf = design({ type: 'face', Do: 60, h: 0, G: 0, ring: as[0] });
  const bf = C.suggest(sf, as);
  assert.ok(!('Do' in bf.patch), 'face suggestion keeps the groove OD');
});

console.log('Dovetail, boss seals & presets');
check('dovetail: Parker .139 table, gland area includes the undercut', () => {
  const g = C.guideline(0.139 * IN, 'dovetail', { source: 'parker' });
  near(g.G[0], 0.113 * IN, 1e-6); assert.strictEqual(g.angle, 24);
  const ring = { id: 100, idTol: 0, cs: 3.53, csTol: 0 };
  const h = 2.84, G = 2.92, a = 24;
  const r = C.calc(design({ type: 'dovetail', ring, Dm: 103.53, h, G, angle: a }));
  near(r.fill.nom, Math.PI / 4 * 3.53 * 3.53 / (h * G + h * h * Math.tan(a * Math.PI / 180)), 1e-9);
  near(r.stretch.nom, 0, 1e-9);
  assert.ok(!r.issues.some((i) => /not retained/.test(i.text)));
});
check('dovetail: opening wider than the cross-section is flagged', () => {
  const ring = { id: 100, idTol: 0, cs: 3.53, csTol: 0 };
  const r = C.calc(design({ type: 'dovetail', ring, Dm: 103.53, h: 2.84, G: 3.6, angle: 24 }));
  assert.ok(r.issues.some((i) => /not retained/.test(i.text)));
});
check('dovetail: ERIKS metric table 5.33 mm', () => {
  const g = C.guideline(5.33, 'dovetail', { source: 'eriks' });
  near(g.Lmid, 4.40, 1e-9); near(g.Gmid, 4.80, 1e-9); assert.strictEqual(g.angle, 24);
});
check('boss seal -906: 13 sizes, stretch on the MS33656 undercut', () => {
  assert.strictEqual(D.SIZES.filter((z) => z.series === 'BOSS').length, 13);
  const z = size('BOSS', '-906');
  const s = design({ type: 'boss', ring: z, size: '-906', material: 'NBR', hardness: 90 });
  Object.assign(s, C.recommend(s));
  near(s.F, 0.481 * IN, 0.001);
  const r = C.calc(s);
  near(r.stretch.nom, 0.481 / 0.468 - 1, 2e-3);
  assert.notStrictEqual(r.status, 'error');
});
check('every application example loads as a passing design', () => {
  const P = require('../js/presets.js');
  const DEF = { Lc: 80, Wc: 50, Rc: 15, Lo: 120, Wo: 80, Ro: 20, Lm: 150, Wm: 100, Rm: 25, angle: 24, tolD: 0.025, tolH: 0.03, tolG: 0.05, medium: 'liquid', pdir: 'internal', motion: 'static', source: 'auto' };
  for (const p of P) {
    const z = size(p.state.series, p.state.size);
    assert.ok(z, p.id + ': size ' + p.state.size);
    const s = Object.assign(design(DEF), p.state, { ring: z });
    if (s.type === 'piston' && !s.A) throw new Error(p.id + ' needs a bore');
    Object.assign(s, C.recommend(s));
    const r = C.calc(s);
    assert.strictEqual(r.status, 'ok', `${p.id}: ${r.issues.filter((i) => i.level !== 'info').map((i) => i.text).join(' | ')}`);
    assert.ok(keys.has(p.name) && keys.has(p.group), p.id + ' translation');
  }
});

console.log('Units');
check('length, pressure and temperature conversions', () => {
  near(U.toDisplay('length', 25.4, 'IMP'), 1, 1e-12);
  near(U.fromDisplay('pressure', 1450.3774, 'IMP'), 100, 1e-6);
  near(U.toDisplay('temp', 100, 'IMP'), 212, 1e-9);
  near(U.convert('temp', 32, '°F', 'K'), 273.15, 1e-9);
  near(U.convert('pressure', 1, 'MPa', 'psi'), 145.03774, 1e-4);
});
check('inch fractions', () => {
  assert.strictEqual(U.inchFraction(0.139), '9/64');
  assert.strictEqual(U.inchFraction(1.5), '1 1/2');
  assert.strictEqual(U.inchFraction(2), '2');
});

console.log('Translations');
check('every row has four non-empty texts and the same placeholders', () => {
  for (const r of I.rows()) {
    assert.strictEqual(r.length, 4, r[0]);
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const x of r) assert.ok(x && ph(x) === ph(r[0]), 'placeholders differ: ' + r[0]);
  }
});
check('every t() / add() text in the code has a translation', () => {
  const src = ['app.js', 'calc.js'].map((f) => fs.readFileSync(path.join(__dirname, '../js', f), 'utf8')).join('\n');
  const missing = [];
  const re = /(?:\bt\(|add\('(?:error|warn|info)',\s*)'((?:[^'\\]|\\.)+)'/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const k = m[1].replace(/\\'/g, "'");
    if (!keys.has(k)) missing.push(k);
  }
  for (const m of D.MATERIALS) for (const k of [m.name, m.good, m.bad]) if (!keys.has(k)) missing.push(k);
  for (const s of Object.values(D.SERIES)) if (!keys.has(s.note)) missing.push(s.note);
  assert.deepStrictEqual(missing, []);
});
check('static page texts are translated', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '');
  const missing = [];
  const body = html.slice(html.indexOf('<body>'));
  const ok = /^(?:[\s·©Ø±%✕—ⓘ]*|\(°\)|[\d\s.,–-]+|ehcrea\.com|MIT License|© 2026 Eren Tozlu|SI|.*Shore A|Parker \(ORD 5700\)|\(%\))$/;
  for (const m of body.matchAll(/>([^<>]+)</g)) {
    const txt = m[1].replace(/&amp;/g, '&').trim();
    if (txt && !ok.test(txt) && !keys.has(txt)) missing.push(txt);
  }
  for (const m of body.matchAll(/(?:title|aria-label|placeholder)="([^"]+)"/g)) if (!keys.has(m[1].replace(/&amp;/g, '&'))) missing.push(m[1]);
  assert.deepStrictEqual([...new Set(missing)], []);
});
check('about and notes exist in all languages', () => {
  for (const b of Object.values(I.html())) for (const l of ['en', 'de', 'nl', 'tr']) assert.ok(b[l] && b[l].length > 200, l);
});

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
