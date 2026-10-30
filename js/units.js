/*
 * Unit conversion. All calculations run in mm, bar and °C; this module
 * converts between those internal values and the displayed unit for the
 * active unit system (metric or inch). It also defines the families used by
 * the stand-alone unit converter.
 */
(function (root) {
  'use strict';

  const linear = (label, factor, offset = 0) => ({
    label,
    toDisplay: (v) => v * factor + offset,
    fromDisplay: (d) => (d - offset) / factor,
  });

  const QUANTITIES = {
    // internal unit           metric display                inch display
    length:   { base: 'mm',    SI: linear('mm', 1),          IMP: linear('in', 1 / 25.4) },
    pressure: { base: 'bar',   SI: linear('bar', 1),         IMP: linear('psi', 14.503774) },
    temp:     { base: '°C',    SI: linear('°C', 1),          IMP: linear('°F', 1.8, 32) },
    area:     { base: 'mm²',   SI: linear('mm²', 1),         IMP: linear('in²', 1 / 645.16) },
    volume:   { base: 'mm³',   SI: linear('mm³', 1),         IMP: linear('in³', 1 / 16387.064) },
  };

  /*
   * Converter families: each unit is [label, factor to base, offset]. A value v
   * in that unit is v·factor + offset in the base unit.
   */
  const FAMILIES = {
    length: { base: 'mm', units: [['mm', 1], ['cm', 10], ['m', 1000], ['µm', 0.001], ['in', 25.4], ['thou (mil)', 0.0254], ['ft', 304.8]] },
    pressure: { base: 'bar', units: [['bar', 1], ['mbar', 0.001], ['MPa', 10], ['kPa', 0.01], ['psi', 1 / 14.503774], ['kgf/cm²', 0.980665], ['atm', 1.01325], ['N/mm²', 10]] },
    temp: { base: '°C', units: [['°C', 1, 0], ['°F', 5 / 9, -32 * 5 / 9], ['K', 1, -273.15]] },
    force: { base: 'N', units: [['N', 1], ['kN', 1000], ['lbf', 4.4482216], ['kgf', 9.80665]] },
    area: { base: 'mm²', units: [['mm²', 1], ['cm²', 100], ['in²', 645.16]] },
    volume: { base: 'mm³', units: [['mm³', 1], ['cm³ (mL)', 1000], ['in³', 16387.064], ['L', 1e6]] },
  };

  let system = 'SI';

  const Units = {
    QUANTITIES, FAMILIES,
    get system() { return system; },
    setSystem(s) { system = s === 'IMP' ? 'IMP' : 'SI'; },
    label(q, sys = system) { return QUANTITIES[q][sys].label; },
    toDisplay(q, v, sys = system) { return QUANTITIES[q][sys].toDisplay(v); },
    fromDisplay(q, d, sys = system) { return QUANTITIES[q][sys].fromDisplay(d); },
    /** Digits shown for a length: three decimals in mm, four in inches. */
    lengthDigits(sys = system) { return sys === 'IMP' ? 4 : 3; },
    format(q, v, opts = {}) {
      if (v === null || v === undefined || !isFinite(v)) return '—';
      const sys = opts.system || system;
      const d = Units.toDisplay(q, v, sys);
      const unit = opts.noUnit ? '' : ' ' + Units.label(q, sys);
      let digits = opts.digits;
      if (digits === undefined && q === 'length') digits = Units.lengthDigits(sys);
      return Units.fmtNumber(d, digits) + unit;
    },
    fmtNumber(v, digits) {
      if (!isFinite(v)) return '—';
      const a = Math.abs(v);
      let d = digits;
      if (d === undefined) d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
      if (a >= 1e7 || (a > 0 && a < 1e-5)) return v.toExponential(2);
      return v.toLocaleString((root.I18N && root.I18N.locale) || 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: d });
    },
    /** Convert within a converter family. */
    convert(family, value, from, to) {
      const f = FAMILIES[family].units;
      const a = f.find((u) => u[0] === from), b = f.find((u) => u[0] === to);
      const base = value * a[1] + (a[2] || 0);
      return (base - (b[2] || 0)) / b[1];
    },
    /** Nearest fraction of an inch (denominator up to 64), e.g. "9/64". */
    inchFraction(inches) {
      if (!isFinite(inches)) return '';
      const sign = inches < 0 ? '-' : '';
      const x = Math.abs(inches);
      let whole = Math.floor(x);
      let n = Math.round((x - whole) * 64), d = 64;
      if (n === 64) { whole += 1; n = 0; }
      while (n && n % 2 === 0) { n /= 2; d /= 2; }
      const frac = n ? `${n}/${d}` : '';
      return sign + (whole && frac ? `${whole} ${frac}` : whole ? String(whole) : frac || '0');
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Units;
  else root.Units = Units;
})(typeof window !== 'undefined' ? window : globalThis);
