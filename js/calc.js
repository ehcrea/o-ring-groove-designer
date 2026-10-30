/*
 * O-ring gland calculations. Internal units: mm, bar, °C. Ratios are
 * fractions (0.2 = 20 %).
 *
 * Seal types:
 *   piston – radial seal, groove in the inner part (male gland)
 *   rod    – radial seal, groove in the housing bore (female gland)
 *   face     – axial (flange) seal, groove in a flat face
 *   dovetail – axial seal in an undercut groove that retains the O-ring
 *   boss     – AS568 -9xx O-ring of a straight-thread tube fitting (port standard)
 * Groove outline: circle, or rectangle with rounded corners.
 *
 * Worst-case tolerance stacking: minimum compression uses the smallest
 * cross-section, the deepest gland and the largest installed stretch;
 * maximum compression the opposite. Stretch flattens the cross-section
 * (Parker ORD 5700 §3.5, "observed" GM curve).
 */
(function (root) {
  'use strict';

  const D = root.Data || require('./data.js');
  const PI = Math.PI;
  const IN = D.IN;

  // ---------- Geometry helpers ----------

  /** Perimeter of a rectangle with rounded corners (radius clamped to the shape). */
  function rrPerimeter(L, W, R) {
    const r = Math.max(0, Math.min(R || 0, L / 2, W / 2));
    return 2 * (L + W) - (8 - 2 * PI) * r;
  }

  /** Parker Figure 3-3: percent reduction of cross-section for a given ID stretch (fraction in, fraction out). */
  function csReduction(stretch) {
    const X = stretch * 100;
    if (X <= 0) return 0;
    const Y = X <= 3
      ? -0.005 + 1.19 * X - 0.19 * X * X - 0.001 * X ** 3 + 0.008 * X ** 4
      : 0.56 + 0.59 * X - 0.0046 * X * X;
    return Math.max(0, Y) / 100;
  }

  /** Cross-section after installation: flattened by stretch, slightly thickened by circumferential compression. */
  function effectiveCs(cs, stretch, circ) {
    if (stretch > 0) return cs * (1 - csReduction(stretch));
    if (circ > 0) return cs * Math.sqrt(1 + circ);
    return cs;
  }

  /** Cross-section area after installation (volume is conserved along the circumference). */
  function ringArea(cs, stretch, circ) {
    const a = PI / 4 * cs * cs;
    if (stretch > 0) return a / (1 + stretch);
    if (circ > 0) return a * (1 + circ);
    return a;
  }

  const kindOf = (s) => (s.type === 'face' || s.type === 'dovetail' || s.type === 'boss' ? s.type : s.motion === 'dynamic' ? 'dynamic' : 'staticRadial');
  /** Axial seals: the gland depth is measured from the groove bottom to the mating face. */
  const isAxial = (s) => s.type === 'face' || s.type === 'dovetail';
  const AS568_CS = [0.070, 0.103, 0.139, 0.210, 0.275];
  const isAs568Cs = (cs) => AS568_CS.some((c) => Math.abs(c * IN - cs) < 0.03);

  // ---------- Guidelines ----------

  const lerp = (a, b, f) => a + (b - a) * f;
  /** Locate cs in a sorted list of cross-sections: [lower index, upper index, fraction]. */
  function bracket(list, cs) {
    if (cs <= list[0]) return [0, 0, 0];
    const n = list.length - 1;
    if (cs >= list[n]) return [n, n, 0];
    let i = 0;
    while (list[i + 1] < cs) i++;
    return [i, i + 1, (cs - list[i]) / (list[i + 1] - list[i])];
  }
  /** Value scaled with the cross-section: exact rows as listed, otherwise interpolate value/cs. */
  function scaled(rows, csOf, valOf, cs) {
    const [i, j, f] = bracket(rows.map(csOf), cs);
    const ri = valOf(rows[i]) / csOf(rows[i]), rj = valOf(rows[j]) / csOf(rows[j]);
    return lerp(ri, rj, f) * cs;
  }
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  /**
   * Recommended gland for a cross-section (mm).
   * Returns { source, exact, L:[min,max], G:[min,max], R:[min,max], E (max diametral clearance), sq:[min,max] %, ecc }.
   */
  function guideline(cs, kind, opts = {}) {
    const backups = opts.backups || 0;
    const medium = opts.medium || 'liquid';
    let src = opts.source || 'auto';
    if (src === 'auto') src = isAs568Cs(cs) ? 'parker' : 'eriks';

    if (src === 'parker') {
      const table = D.PARKER_IN[kind];
      const exactRow = table.find((r) => near(r.cs * IN, cs, 0.03));
      // Parker's metric dynamic chart covers metric cross-sections in reciprocating glands.
      if (!exactRow && kind === 'dynamic') {
        const m = D.PARKER_IN.dynamicMetricMm;
        const row = m.find((r) => near(r[0], cs, 0.03));
        const L = row ? row[1] : scaled(m, (r) => r[0], (r) => r[1], cs);
        const G = row ? row[2] : scaled(m, (r) => r[0], (r) => r[2], cs);
        const Rr = row ? [row[3], row[4]] : (cs < 3 ? [0.2, 0.4] : [0.4, 0.8]);
        const E = scaled(table, (r) => r.cs * IN, (r) => r.E[1] * IN, cs);
        return finish({ source: 'parker', exact: !!row, L: [L, L + 0.05], G: [G, G + 0.1], R: Rr, E, ecc: E / 2 }, cs, opts);
      }
      const pick = (f) => (exactRow ? f(exactRow) * IN : scaled(table, (r) => r.cs * IN, (r) => f(r) * IN, cs));
      const out = { source: 'parker', exact: !!exactRow };
      out.L = [pick((r) => r.L[0]), pick((r) => r.L[1])];
      if (kind === 'dovetail') {
        out.G = [pick((r) => r.G[0]), pick((r) => r.G[1])];
        const R1 = pick((r) => r.R1);
        out.R = [R1, R1];
        out.Rtop = pick((r) => r.R[0]);
        out.angle = D.PARKER_IN.dovetailAngle;
        if (exactRow) out.sq = exactRow.sq.slice();
        return finish(out, cs, opts);
      }
      if (kind === 'face') {
        const key = medium === 'gas' ? 'Gv' : 'Gl';
        out.G = [pick((r) => r[key][0]), pick((r) => r[key][1])];
      } else {
        out.G = [pick((r) => r.G[backups][0]), pick((r) => r.G[backups][1])];
        out.E = pick((r) => r.E[1]);
        out.Emin = pick((r) => r.E[0]);
        out.ecc = pick((r) => r.ecc);
      }
      out.R = [pick((r) => r.R[0]), pick((r) => r.R[1])];
      if (exactRow) out.sq = exactRow.sq.slice();
      return finish(out, cs, opts);
    }

    // ERIKS metric tables
    const table = D.ERIKS_MM[kind];
    const row = table.find((r) => near(r[0], cs, 0.03));
    const val = (k) => (row ? row[k] : scaled(table, (r) => r[0], (r) => r[k], cs));
    const out = { source: 'eriks', exact: !!row };
    if (kind === 'dovetail') {
      out.L = [val(1) - 0.05, val(1) + 0.05];
      out.G = [val(2) - 0.05, val(2) + 0.05];
      out.angle = row ? row[3] : 24;
      out.R = [val(4), val(4)];
      out.Rtop = val(5);
      return finish(out, cs, opts);
    }
    const L = val(2), Ltol = row ? row[3] : val(3);
    out.L = [L, L + Ltol];
    if (kind === 'face') {
      const g = medium === 'gas' ? val(5) : val(4);
      out.G = [g, g + 0.13];
      out.R = [val(6), val(6)];
    } else {
      out.E = val(4);
      let g = val(5);
      if (backups > 0) {
        const b = D.ERIKS_MM.backup;
        const brow = b.find((r) => near(r[0], cs, 0.03));
        g = brow ? brow[2 + backups] : scaled(b, (r) => r[0], (r) => r[2 + backups], cs);
      }
      out.G = [g, g + 0.13];
      out.R = [val(6), val(6)];
      out.ecc = val(7);
    }
    return finish(out, cs, opts);
  }

  /** Fill in the squeeze range implied by the gland depth and a typical cross-section tolerance. */
  function finish(g, cs, opts) {
    if (!g.sq) {
      const tol = opts.csTol !== undefined ? opts.csTol : csTolFor(cs);
      g.sq = [100 * (cs - tol - g.L[1]) / (cs - tol), 100 * (cs + tol - g.L[0]) / (cs + tol)];
    }
    g.Lmid = (g.L[0] + g.L[1]) / 2;
    g.Gmid = (g.G[0] + g.G[1]) / 2;
    g.Rmid = (g.R[0] + g.R[1]) / 2;
    return g;
  }

  /** ISO 3601-1 class cross-section tolerance (approx. for non-listed sizes). */
  function csTolFor(cs) {
    if (cs <= 2.0) return 0.08;
    if (cs <= 3.15) return 0.09;
    if (cs <= 4.5) return 0.10;
    if (cs <= 6.3) return 0.13;
    if (cs <= 8.4) return 0.15;
    return 0.2;
  }

  // ---------- Main calculation ----------

  /**
   * Rod (female) gland: the ring is stretched if its ID is smaller than the rod;
   * otherwise its centreline is compressed if it is longer than the gland's mean
   * circumference. Diameters may be perimeter-equivalent (perimeter / π).
   */
  function rodFit(rod, glandMean, d1, d2) {
    const st = rod / d1 - 1;
    if (st >= 0) return { s: st, c: 0 };
    return { s: 0, c: Math.max(0, (d1 + d2) / glandMean - 1) };
  }

  /** Installed geometry for nominal and worst-case tolerances. */
  function geometry(s) {
    const r = s.ring;
    const tD = s.tolD || 0, tH = s.tolH || 0;
    const d1 = r.id, it = r.idTol || 0, d2 = r.cs;
    const g = { type: s.type, shape: s.shape };
    // stretch and circumferential compression as functions of (ring ID, seat size) at a tolerance corner
    let fit; // (sign) => { s, c } where sign = +1 gives max stretch corner, -1 min stretch corner

    if (s.type === 'piston' || s.type === 'rod') {
      if (s.shape === 'rect') {
        g.L = s.depth; g.Ltol = tH;
        g.gapR = (s.E || 0) / 2; g.gapRMax = g.gapR + tD;
        const P = (dl) => rrPerimeter(s.Lc + dl, s.Wc + dl, s.Rc + dl / 2);
        if (s.type === 'piston') {
          // groove root = bore contour offset inwards by the depth
          fit = (k) => ({ s: P(-2 * s.depth + k * 2 * tD) / (PI * (d1 - k * it)) - 1, c: 0 });
          g.seat = { L: s.Lc - 2 * s.depth, W: s.Wc - 2 * s.depth, R: Math.max(0, s.Rc - s.depth) };
          g.outer = { L: s.Lc, W: s.Wc, R: s.Rc };
        } else {
          // rod contour; groove bottom offset outwards by the depth
          fit = (k) => rodFit(P(k * 2 * tD) / PI, P(s.depth - k * 2 * tD) / PI, d1 - k * it, d2);
          g.seat = { L: s.Lc, W: s.Wc, R: s.Rc };
          g.outer = { L: s.Lc + 2 * s.depth, W: s.Wc + 2 * s.depth, R: s.Rc + s.depth };
        }
        g.length = rrPerimeter(g.seat.L + s.depth, g.seat.W + s.depth, g.seat.R + s.depth / 2);
      } else if (s.type === 'piston') {
        g.L = (s.A - s.B1) / 2; g.Ltol = tD;
        g.gapR = (s.A - s.C) / 2; g.gapRMax = g.gapR + tD;
        fit = (k) => ({ s: (s.B1 + k * tD) / (d1 - k * it) - 1, c: 0 });
        g.length = PI * (s.B1 + g.L);
      } else {
        g.L = (s.A1 - s.B) / 2; g.Ltol = tD;
        g.gapR = (s.D - s.B) / 2; g.gapRMax = g.gapR + tD;
        fit = (k) => rodFit(s.B + k * tD, (s.A1 + s.B) / 2 - k * tD, d1 - k * it, d2);
        g.length = PI * (s.B + g.L);
      }
    } else if (s.type === 'dovetail') {
      // mean groove diameter (at the opening centreline) should coincide with the mean O-ring diameter
      g.L = s.h + (s.gap || 0); g.Ltol = tH;
      g.gapR = s.gap || 0; g.gapRMax = g.gapR;
      g.undercut = s.h * Math.tan((s.angle || 0) * PI / 180);
      const P = (dl) => (s.shape === 'rect' ? rrPerimeter(s.Lm + dl, s.Wm + dl, s.Rm + dl / 2) : PI * (s.Dm + dl));
      fit = (k) => {
        const f = P(k * 2 * tD) / (PI * (d1 - k * it + d2)) - 1;
        return f >= 0 ? { s: f, c: 0 } : { s: 0, c: 1 / (1 + f) - 1 };
      };
      g.length = P(0);
      const G = s.G;
      if (s.shape === 'rect') {
        g.outer = { L: s.Lm + G, W: s.Wm + G, R: s.Rm + G / 2 };
        g.inner = { L: s.Lm - G, W: s.Wm - G, R: Math.max(0, s.Rm - G / 2) };
        g.centreRadius = s.Rm;
      } else {
        g.outerD = s.Dm + G; g.innerD = s.Dm - G;
      }
    } else {
      // face seal: depth includes the flange gap
      g.L = s.h + (s.gap || 0); g.Ltol = tH;
      g.gapR = s.gap || 0; g.gapRMax = g.gapR;
      const G = s.G;
      const outerP = (dl) => (s.shape === 'rect' ? rrPerimeter(s.Lo + dl, s.Wo + dl, s.Ro + dl / 2) : PI * (s.Do + dl));
      const innerP = (dl) => (s.shape === 'rect'
        ? rrPerimeter(s.Lo - 2 * G + dl, s.Wo - 2 * G + dl, Math.max(0, s.Ro - G) + dl / 2)
        : PI * (s.Do - 2 * G + dl));
      if (s.pdir === 'external') {
        // ring ID should seat on the groove inner wall
        fit = (k) => {
          const f = innerP(k * 2 * tD) / (PI * (d1 - k * it)) - 1;
          return f >= 0 ? { s: f, c: 0 } : { s: 0, c: 0, loose: -f };
        };
      } else {
        // ring OD should seat on the groove outer wall
        fit = (k) => {
          const f = (PI * (d1 + 2 * d2 - k * it)) / outerP(-k * 2 * tD) - 1;
          return f >= 0 ? { s: 0, c: f } : { s: 1 / (1 + f) - 1, c: 0 };
        };
      }
      g.outerPerimeter = outerP(0);
      g.innerPerimeter = innerP(0);
      g.length = (g.outerPerimeter + g.innerPerimeter) / 2;
      if (s.shape === 'rect') {
        g.outer = { L: s.Lo, W: s.Wo, R: s.Ro };
        g.inner = { L: s.Lo - 2 * G, W: s.Wo - 2 * G, R: Math.max(0, s.Ro - G) };
        g.centreRadius = Math.max(0, s.Ro - G / 2);
      } else {
        g.outerD = s.Do; g.innerD = s.Do - 2 * G;
      }
    }
    g.fitNom = fit(0);
    g.fitHi = fit(1);   // largest stretch (smallest ring, largest seat)
    g.fitLo = fit(-1);  // smallest stretch (largest ring, smallest seat)
    return g;
  }

  function calc(s) {
    if (s.type === 'boss') return calcBoss(s);
    const r = s.ring;
    const kind = kindOf(s);
    const mat = D.MATERIALS.find((m) => m.id === s.material) || D.MATERIALS[0];
    const guide = guideline(r.cs, kind, { source: s.source, backups: s.backups, medium: s.medium, csTol: r.csTol });
    const g = geometry(s);
    const issues = [];
    const add = (level, text, params) => issues.push({ level, text, params: params || {} });

    // invalid geometry guard
    const bad = !(r.id > 0 && r.cs > 0 && g.L > 0 && s.G > 0 && isFinite(g.fitNom.s));
    if (bad) {
      add('error', 'Check the inputs: the gland depth, groove width and O-ring size must be positive.');
      return { kind, mat, guide, geom: g, issues, valid: false, status: 'error' };
    }

    const csMin = r.cs - (r.csTol || 0), csMax = r.cs + (r.csTol || 0);
    const Lmin = g.L - g.Ltol;
    const LmaxEcc = g.L + g.Ltol + (s.ecc && !isAxial(s) ? g.gapRMax : 0);
    const Gmin = s.G - (s.tolG || 0), Gmax = s.G + (s.tolG || 0);

    const { s: sN, c: cN } = g.fitNom;
    const { s: sH, c: cH } = g.fitHi;
    const { s: sL, c: cL } = g.fitLo;

    const csE = { nom: effectiveCs(r.cs, sN, cN), min: effectiveCs(csMin, sH, cH), max: effectiveCs(csMax, sL, cL) };
    const squeeze = {
      nom: (csE.nom - g.L) / csE.nom,
      min: (csE.min - LmaxEcc) / csE.min,
      max: (csE.max - Lmin) / csE.max,
    };
    const squeezeAbs = { nom: csE.nom - g.L, min: csE.min - LmaxEcc, max: csE.max - Lmin };

    // temperature and swell: rubber grows (or shrinks), the metal is assumed fixed (conservative for fill)
    const lin = (T) => 1 + mat.cte * (T - 20);
    const swellLin = Math.cbrt(1 + (s.swell || 0) / 100);
    const tMin = s.tMin !== undefined ? s.tMin : 20, tMax = s.tMax !== undefined ? s.tMax : 20;
    const squeezeCold = (csE.min * lin(tMin) * swellLin - LmaxEcc) / (csE.min * lin(tMin) * swellLin);
    const squeezeHot = (csE.max * lin(tMax) * swellLin - Lmin) / (csE.max * lin(tMax) * swellLin);

    // gland fill: ring cross-section area over gland area (bottom corner radii removed)
    const R = s.r || 0;
    const corner = 2 * (1 - PI / 4) * R * R;
    // dovetail: the two undercut triangles add h² · tan(angle) to the opening-width rectangle
    const dove = s.type === 'dovetail' ? s.h * s.h * Math.tan((s.angle || 0) * PI / 180) : 0;
    const gArea = (L, G) => Math.max(1e-9, L * G + dove - corner);
    const fill = {
      nom: ringArea(r.cs, sN, cN) / gArea(g.L, s.G),
      min: ringArea(csMin, sH, cH) / gArea(g.L + g.Ltol, Gmax),
      max: ringArea(csMax, sL, cL) / gArea(Lmin, Gmin),
    };
    fill.hot = fill.max * (1 + (s.swell || 0) / 100) * Math.pow(lin(tMax), 3);

    const ringVolume = PI * PI / 4 * r.cs * r.cs * (r.id + r.cs);
    const glandVolume = gArea(g.L, s.G) * g.length;

    // extrusion gap: recommended max. diametral clearance, halved for silicones
    const Emax = guide.E !== undefined ? guide.E * (mat.lowStrength ? 0.5 : 1) : undefined;

    const res = {
      kind, mat, guide, geom: g, valid: true, issues,
      L: { nom: g.L, min: Lmin, max: g.L + g.Ltol },
      squeeze, squeezeAbs, squeezeCold, squeezeHot, csE, fill,
      stretch: { nom: sN, min: sL, max: sH },
      circ: { nom: cN, min: cL, max: cH },
      loose: g.fitNom.loose || 0,
      gapR: g.gapR, gapRMax: g.gapRMax, Emax,
      ringVolume, glandVolume,
      ringOD: r.id + 2 * r.cs,
    };
    check(s, res, add);
    guidelineChecks(s, res, add);
    res.status = issues.some((i) => i.level === 'error') ? 'error' : issues.some((i) => i.level === 'warn') ? 'warn' : 'ok';
    return res;
  }

  // ---------- Design checks ----------

  const pct = (v, d = 1) => (100 * v).toFixed(d);

  function check(s, res, add) {
    const L = D.LIMITS;
    const kind = res.kind;
    const band = L.squeeze[kind];
    const sq = res.squeeze;
    const mat = res.mat;
    const small = s.ring.cs <= 2.0;

    // compression: the tabulated squeeze ranges leave out stretch and machining tolerances,
    // which the worst case here includes, so the lower limit (and the approximate dynamic
    // maximum) get a 2-point margin; the 30 % static maximum is a hard Parker limit
    const lo = band[0] - 2;
    const hi = kind === 'dynamic' ? band[1] + 2 : band[1];
    const maxAllowed = kind === 'dynamic' ? (small ? L.squeezeMaxDynamicSmall : band[1] + 6) : L.squeezeMaxStatic + 5;
    if (sq.min <= 0) add('error', 'No compression at the worst-case tolerances: the gland is deeper than the O-ring cross-section. The seal can leak.');
    else if (100 * sq.min < lo - 4) add('error', 'Minimum compression {v} % is far below the recommended {lo}–{hi} %.', { v: pct(sq.min), lo: band[0], hi: band[1] });
    else if (100 * sq.min < lo) add('warn', 'Minimum compression {v} % is below the recommended {lo}–{hi} %.', { v: pct(sq.min), lo: band[0], hi: band[1] });
    if (100 * sq.max > maxAllowed) add('error', 'Maximum compression {v} % is too high (recommended {lo}–{hi} %): high installation force, compression set and risk of damage.', { v: pct(sq.max), lo: band[0], hi: band[1] });
    else if (100 * sq.max > hi) add('warn', 'Maximum compression {v} % is above the recommended {lo}–{hi} %.', { v: pct(sq.max), lo: band[0], hi: band[1] });
    if (sq.min > 0 && res.squeezeAbs.min < L.minSqueezeMm) add('warn', 'Minimum squeeze is only {v} mm. Keep at least about 0.2 mm (0.007 in), otherwise most elastomers take full compression set.', { v: res.squeezeAbs.min.toFixed(3) });
    if (res.squeezeCold < (band[0] - 5) / 100 && res.squeezeCold < sq.min - 0.005 && s.tMin < 0) add('warn', 'At the minimum temperature the O-ring shrinks: worst-case compression drops to {v} %.', { v: pct(res.squeezeCold) });
    if (res.squeezeHot > 0.35 && res.squeezeHot > sq.max + 0.01) add('warn', 'At the maximum temperature (with volume swell) worst-case compression rises to {v} %.', { v: pct(res.squeezeHot) });

    // gland fill: the 60–85 % band applies to the nominal fill; worst-case stacks of the
    // manufacturers' own tables reach ~90 %, so worst-case limits are looser
    const f = res.fill;
    if (f.max >= 1) add('error', 'The O-ring does not fit: worst-case gland fill is {v} %. Make the groove wider or deeper.', { v: pct(f.max, 0) });
    else if (100 * f.max > L.fill.worstMax) add('warn', 'Worst-case gland fill {v} % leaves almost no void. Allow room for swell and thermal expansion.', { v: pct(f.max, 0) });
    if (100 * f.nom > L.fill.max) add('warn', 'Nominal gland fill {v} % is above the recommended 85 % (optimum 75 %).', { v: pct(f.nom, 0) });
    if (f.max < 1 && f.hot >= 1) add('error', 'At {t} with {sw} % volume swell the O-ring overfills the gland ({v} %).', { v: pct(f.hot, 0), t: fmtT(s.tMax), sw: s.swell || 0 });
    else if (f.max < 1 && 100 * f.hot > L.fill.worstMax && 100 * f.max <= L.fill.worstMax) add('warn', 'At {t} with {sw} % volume swell the gland fill reaches {v} %.', { v: pct(f.hot, 0), t: fmtT(s.tMax), sw: s.swell || 0 });
    if (100 * f.nom < L.fillMin) add('info', 'Gland fill {v} % is low (typical 60–85 %, optimum 75 %). The O-ring can move and roll in the groove; check if a narrower groove is possible.', { v: pct(f.nom, 0) });
    if (s.type !== 'dovetail' && s.G - (s.tolG || 0) < s.ring.cs + (s.ring.csTol || 0)) add('warn', 'Groove width is smaller than the O-ring cross-section: the ring is squeezed sideways during installation.');

    // stretch / circumferential fit
    const st = res.stretch, ci = res.circ;
    if (s.type === 'dovetail') {
      const fit = Math.max(st.nom, ci.nom);
      if (100 * fit > L.dovetailFitMax) add('warn', 'The O-ring mean diameter differs by {v} % from the groove mean diameter; in dovetail grooves they should coincide.', { v: pct(fit) });
      if (s.G + (s.tolG || 0) >= s.ring.cs - (s.ring.csTol || 0)) add('warn', 'The groove opening is not narrower than the O-ring cross-section, so the ring is not retained.');
      if (s.ring.cs < L.dovetailMinCs - 0.01) add('info', 'ERIKS recommends dovetail grooves only for cross-sections of 3.53 mm (.139 in) and larger.');
      if (!(s.angle > 0)) add('warn', 'Enter the side wall (undercut) angle of the dovetail.');
      add('info', 'Dovetail grooves are expensive to machine; the radius at the opening edges is critical (too small damages the O-ring, too large lets it extrude).');
    } else if (s.type === 'face') {
      if (s.pdir === 'external') {
        if (res.loose > 0.005) add('warn', 'O-ring ID is {v} % larger than the groove inner wall. With external pressure the ID should seat on the inner wall (choose a smaller O-ring).', { v: pct(res.loose) });
        if (100 * st.max > L.stretchMax) add('error', 'Installed stretch up to {v} % exceeds 5 %: faster ageing and loss of cross-section.', { v: pct(st.max) });
        else if (100 * st.max > L.stretchFaceMax) add('warn', 'Installed stretch up to {v} %. For face seals keep the initial stretch below 3 %.', { v: pct(st.max) });
      } else {
        if (100 * st.max > L.stretchFaceMax) add(100 * st.max > L.stretchMax ? 'error' : 'warn', 'The O-ring OD is smaller than the groove outer wall: it has to be stretched by up to {v} % to seat there. With internal pressure the OD should seat on the outer wall.', { v: pct(st.max) });
        if (100 * ci.max > L.circCompressionMax) add('warn', 'The O-ring OD is {v} % larger than the groove outer wall: risk of buckling or lifting out of the groove during assembly.', { v: pct(ci.max) });
      }
    } else if (s.type === 'piston') {
      if (100 * st.max > L.stretchMax) add('warn', 'Installed stretch up to {v} % exceeds 5 % (Parker): faster ageing, the cross-section flattens. Consider the next larger O-ring ID.', { v: pct(st.max) });
      if (st.min < 0) add('warn', 'The O-ring ID is larger than the groove diameter (stretch {v} %): the ring sits loose and can be pinched when the piston enters the bore.', { v: pct(st.min) });
    } else {
      if (100 * st.max > L.stretchMax) add('warn', 'The O-ring is stretched up to {v} % on the rod. Choose a larger ID.', { v: pct(st.max) });
      if (100 * ci.max > L.circCompressionMax) add('warn', 'The O-ring centreline is up to {v} % longer than the gland circumference: circumferential compression can cause buckling. Choose a smaller ID.', { v: pct(ci.max) });
    }

    if (Math.max(st.max, ci.max, res.loose) > 0.15) add('info', 'The O-ring size is far from this groove outline. Use “Suggest O-ring” to pick a standard size that fits.');

    // corners of rounded-rectangle grooves
    if (s.shape === 'rect') {
      const rc = isAxial(s) ? res.geom.centreRadius : (s.type === 'piston' ? Math.max(0, s.Rc - s.depth / 2) : s.Rc + s.depth / 2);
      const minR = L.cornerRadiusFactor * s.ring.cs;
      if (rc < minR) add('warn', 'Corner radius at the groove centreline is {v}; at least {min} (3 × cross-section) is recommended so the O-ring does not kink or lift in the corners.', { v: fmtL(rc), min: fmtL(minR) });
    }

    // extrusion gap and pressure
    const p = s.pressure || 0;
    if (res.Emax !== undefined && !isAxial(s)) {
      const Ed = 2 * res.gapRMax;
      if (Ed > res.Emax * 1.0001) add('warn', 'Diametral clearance up to {v} exceeds the guideline maximum {max} for this cross-section{sil}. Extrusion risk.', { v: fmtL(Ed), max: fmtL(res.Emax), sil: mat.lowStrength ? ' (halved for silicone)' : '' });
      if (res.gapR < 0) add('error', 'The clearance is negative: the parts interfere.');
    }
    if (s.type === 'face' && s.gap > 0 && res.Emax !== undefined && s.gap > res.Emax / 2) add('warn', 'Flange gap {v} is large; keep metal-to-metal contact or a very small gap to avoid extrusion.', { v: fmtL(s.gap) });
    const limitBar = kind === 'dynamic' ? L.pressureNoBackup.dynamic : L.pressureNoBackup.static;
    if (!s.backups && !isAxial(s)) {
      if (p > limitBar) add('warn', 'Pressure {p} is above {lim} without back-up rings ({mode}). Use back-up rings or a 90 Shore A compound.', { p: fmtP(p), lim: fmtP(limitBar), mode: kind === 'dynamic' ? 'dynamic' : 'static' });
      else if (kind !== 'dynamic' && p > L.pressureNoBackup.staticEriks) add('info', 'Pressure above 70 bar (1000 psi): ERIKS recommends back-up rings for static seals at this level.');
    }
    if (s.hardness <= 70 && p > L.pressure70ShoreStatic && !s.backups) add('info', 'With a 70 Shore A compound above about 80 bar, 90 Shore A or back-up rings reduce the extrusion risk.');
    if (isAxial(s) && p > 400) add('warn', 'Very high pressure for a face seal: check flange deflection (gap opening) under pressure.');

    materialChecks(s, mat, kind, add);
  }

  function materialChecks(s, mat, kind, add) {
    if (s.tMin < mat.tMin) add('warn', '{m} is typically rated down to {t}: minimum temperature {v} is below that.', { m: mat.name, t: fmtT(mat.tMin), v: fmtT(s.tMin) });
    if (s.tMax > mat.tMax) add('warn', '{m} is typically rated up to {t}: maximum temperature {v} is above that.', { m: mat.name, t: fmtT(mat.tMax), v: fmtT(s.tMax) });
    if (kind === 'dynamic' && mat.lowStrength) add('warn', 'Silicone and fluorosilicone have low tear strength and are not recommended for dynamic seals.');
    if (kind === 'dynamic' && s.swell > 20) add('warn', 'Volume swell above 20 % causes high friction in dynamic seals (ERIKS).');
    if (kind === 'dynamic' && s.swell < -4) add('warn', 'Shrinkage of more than 4 % can cause leakage in dynamic seals (ERIKS).');
    if (s.ring.cs < 1.5 && kind === 'dynamic') add('info', 'Small cross-sections are sensitive to tolerances and wear in dynamic service.');
  }

  function guidelineChecks(s, res, add) {
    // guideline comparison
    const gd = res.guide;
    if (res.L.nom < gd.L[0] - 1e-6 || res.L.nom > gd.L[1] + 1e-6) add('info', 'Gland depth {v} is outside the guideline {lo}–{hi} for this cross-section.', { v: fmtL(res.L.nom), lo: fmtL(gd.L[0]), hi: fmtL(gd.L[1]) });
    if (s.type === 'dovetail' && gd.angle && Math.abs((s.angle || 0) - gd.angle) > 1) add('info', 'Side wall angle {v}° differs from the guideline {g}°.', { v: s.angle, g: gd.angle });
    if (s.G < gd.G[0] - 1e-6 || s.G > gd.G[1] + 1e-6) add('info', 'Groove width {v} is outside the guideline {lo}–{hi}.', { v: fmtL(s.G), lo: fmtL(gd.G[0]), hi: fmtL(gd.G[1]) });
    if (!gd.exact) add('info', 'No table row for this cross-section: guideline values are interpolated.');
  }

  /**
   * Boss seal: the gland is defined by the port and fitting-end standards, so the
   * check is the stretch on the fitting undercut and the material limits.
   */
  function calcBoss(s) {
    const r = s.ring;
    const mat = D.MATERIALS.find((m) => m.id === s.material) || D.MATERIALS[0];
    const size = D.SIZES.find((z) => z.series === 'BOSS' && z.code === s.size);
    const boss = size && size.boss;
    const issues = [];
    const add = (level, text, params) => issues.push({ level, text, params: params || {} });
    if (!boss || !(s.F > 0)) {
      add('error', 'Select an AS568 -9xx boss seal size.');
      return { kind: 'boss', mat, issues, valid: false, status: 'error' };
    }
    const Ftol = [0.003 * IN, 0.002 * IN]; // undercut Ø +.002 / −.003 in
    const stretch = {
      nom: s.F / r.id - 1,
      min: (s.F - Ftol[0]) / (r.id + r.idTol) - 1,
      max: (s.F + Ftol[1]) / (r.id - r.idTol) - 1,
    };
    const res = {
      kind: 'boss', mat, issues, valid: true, boss, stretch,
      csE: { nom: r.cs * (1 - csReduction(Math.max(0, stretch.nom))) },
      ringOD: r.id + 2 * r.cs, ringVolume: PI * PI / 4 * r.cs * r.cs * (r.id + r.cs),
    };
    const Fstd = boss.fit.F * IN;
    if (Math.abs(s.F - Fstd) > 0.01) add('info', 'Fitting undercut Ø differs from the MS33656 value {v}.', { v: fmtL(Fstd) });
    if (100 * stretch.nom > D.LIMITS.stretchMax) add('warn', 'Installed stretch up to {v} % exceeds 5 % (Parker): faster ageing, the cross-section flattens. Consider the next larger O-ring ID.', { v: pct(stretch.nom) });
    if (stretch.min < 0) add('warn', 'The O-ring can sit loose on the fitting undercut (stretch {v} %).', { v: pct(stretch.min) });
    if (mat.lowStrength) add('warn', 'Silicone and fluorosilicone are not recommended for boss seals: low strength and extrusion resistance.');
    if (s.hardness < 90 && (s.pressure || 0) > 210) add('info', 'Boss seals in high-pressure hydraulics usually use 90 Shore A compounds.');
    add('info', 'The gland is defined by the port (boss) and fitting-end standards: check the port dimensions below rather than a groove.');
    materialChecks(s, mat, 'static', add);
    res.status = issues.some((i) => i.level === 'error') ? 'error' : issues.some((i) => i.level === 'warn') ? 'warn' : 'ok';
    return res;
  }

  // Formatting hooks: the app replaces these with unit-aware formatters.
  let fmtL = (v) => v.toFixed(3) + ' mm';
  let fmtP = (v) => v.toFixed(0) + ' bar';
  let fmtT = (v) => v.toFixed(0) + ' °C';

  // ---------- Design helpers ----------

  /** Hardware dimensions from the guideline, keeping the primary dimension (bore, rod, groove wall). */
  function recommend(s) {
    const kind = kindOf(s);
    if (kind === 'boss') {
      const z = D.SIZES.find((x) => x.series === 'BOSS' && x.code === s.size);
      return z ? { F: round(z.boss.fit.F * IN) } : {};
    }
    const g = guideline(s.ring.cs, kind, { source: s.source, backups: s.backups, medium: s.medium, csTol: s.ring.csTol });
    const out = { G: round(g.Gmid), r: round(g.Rmid) };
    if (kind === 'dovetail') {
      out.h = round(Math.max(0.01, g.Lmid - (s.gap || 0)));
      out.angle = g.angle;
      if (s.shape !== 'rect') out.Dm = round(s.ring.id + s.ring.cs); // mean groove Ø = mean O-ring Ø
      return out;
    }
    const E = g.E !== undefined ? g.E * 0.6 : 0;
    if (s.type === 'piston' && s.shape !== 'rect') { out.B1 = round(s.A - 2 * g.Lmid); out.C = round(s.A - E); }
    else if (s.type === 'rod' && s.shape !== 'rect') { out.A1 = round(s.B + 2 * g.Lmid); out.D = round(s.B + E); }
    else if (!isAxial(s)) { out.depth = round(g.Lmid); out.E = round(E); }
    else {
      out.h = round(Math.max(0.01, g.Lmid - (s.gap || 0)));
      if (s.shape !== 'rect') {
        const r = s.ring;
        // internal pressure: groove OD = O-ring OD; external: groove ID gives ~1 % stretch
        out.Do = s.pdir === 'external' ? round(r.id * 1.01 + 2 * out.G) : round(r.id + 2 * r.cs);
      }
    }
    return out;
  }
  const round = (v) => Math.round(v * 1000) / 1000;

  /** Suggested cross-section for a seat diameter (mm), used when no cross-section is preferred. */
  function preferredCs(dia) {
    if (dia < 10) return 1.78;
    if (dia < 30) return 2.62;
    if (dia < 100) return 3.53;
    if (dia < 250) return 5.33;
    return 6.99;
  }

  /**
   * Pick the standard O-ring that best fits the primary hardware dimension,
   * then size the groove for it. Returns { size, patch } or null.
   */
  function suggest(s, sizes, preferCs) {
    let best = null;
    for (const z of sizes) {
      if (preferCs && Math.abs(z.cs - preferCs) > 0.03) continue;
      const trial = Object.assign({}, s, { ring: z });
      const patch = recommend(trial);
      if (s.type === 'dovetail') delete patch.Dm; // keep the groove, find the ring that matches it
      // face seals keep the primary groove wall: outer wall (internal pressure) or inner wall (external)
      if (s.type === 'face') {
        if (s.pdir === 'external' && s.shape !== 'rect') patch.Do = round(s.Do - 2 * s.G + 2 * patch.G);
        else delete patch.Do;
        if (s.shape === 'rect' && s.pdir === 'external') {
          patch.Lo = round(s.Lo - 2 * s.G + 2 * patch.G); patch.Wo = round(s.Wo - 2 * s.G + 2 * patch.G);
          patch.Ro = round(Math.max(0, s.Ro - s.G) + patch.G);
        }
      }
      Object.assign(trial, patch);
      // rectangular face grooves: keep the outline, so the ring must match its perimeter
      const res = calc(trial);
      if (!res.valid) continue;
      let target, seat;
      if (s.type === 'piston') { target = 0.01; seat = res.stretch.min; } // worst case must not sit loose
      else if (s.type === 'rod') { target = 0.015; seat = res.stretch.nom - res.circ.nom; }
      else if (s.type === 'dovetail') { target = 0; seat = res.stretch.nom - res.circ.nom; }
      else if (s.pdir === 'external') { target = 0.01; seat = res.stretch.nom - res.loose; }
      else { target = 0.005; seat = res.circ.nom - res.stretch.nom; }
      const errs = res.issues.filter((i) => i.level === 'error').length;
      const warns = res.issues.filter((i) => i.level === 'warn').length;
      const ref = s.type === 'piston' ? (s.shape === 'rect' ? (s.Lc + s.Wc) / 2 : s.A)
        : s.type === 'rod' ? (s.shape === 'rect' ? (s.Lc + s.Wc) / 2 : s.B)
          : s.type === 'dovetail' ? (s.shape === 'rect' ? (s.Lm + s.Wm) / 2 : s.Dm)
            : (s.shape === 'rect' ? (s.Lo + s.Wo) / 2 : s.Do);
      const csPenalty = preferCs ? 0 : 0.01 * Math.abs(z.cs - preferredCs(ref)) / preferredCs(ref);
      // a loose ring (negative seat) is worse than the same amount of extra stretch
      const miss = (seat - target) * (seat < 0 ? 3 : 1);
      const score = Math.abs(miss) + 0.05 * errs + 0.02 * warns + csPenalty;
      if (!best || score < best.score) best = { score, size: z, patch };
    }
    return best;
  }

  const Calc = {
    calc, guideline, recommend, suggest, csReduction, rrPerimeter, kindOf, isAxial, isAs568Cs, csTolFor,
    setFormatters(f) { if (f.length) fmtL = f.length; if (f.pressure) fmtP = f.pressure; if (f.temp) fmtT = f.temp; },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Calc;
  else root.Calc = Calc;
})(typeof window !== 'undefined' ? window : globalThis);
