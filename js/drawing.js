/*
 * SVG drawings: the gland cross-section with the installed (and free)
 * O-ring, and the groove outline in plan view. Colours come from CSS classes
 * so both follow the light/dark theme.
 */
(function (root) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  const f1 = (v) => (Math.round(v * 10) / 10).toString();

  /** Dimension line with end ticks and a label. */
  function dimLine(g, x1, y1, x2, y2, label, opts = {}) {
    g.appendChild(el('line', { class: 'dim', x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2) }));
    const vertical = Math.abs(x1 - x2) < 0.5;
    const t = 4;
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      g.appendChild(el('line', vertical
        ? { class: 'dim', x1: f1(x - t), y1: f1(y), x2: f1(x + t), y2: f1(y) }
        : { class: 'dim', x1: f1(x), y1: f1(y - t), x2: f1(x), y2: f1(y + t) }));
    }
    const tx = vertical ? x1 + (opts.left ? -8 : 8) : (x1 + x2) / 2;
    const ty = vertical ? (y1 + y2) / 2 + 4 : y1 + (opts.above ? -7 : 15);
    g.appendChild(el('text', {
      class: 'dim-text' + (opts.strong ? ' strong' : ''), x: f1(tx), y: f1(ty),
      'text-anchor': vertical ? (opts.left ? 'end' : 'start') : 'middle',
    }, label));
  }

  function hatchDefs(svg, id) {
    const defs = el('defs', {});
    const p = el('pattern', { id, patternUnits: 'userSpaceOnUse', width: 7, height: 7, patternTransform: 'rotate(45)', class: 'hatch' });
    p.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 7 }));
    defs.appendChild(p);
    svg.appendChild(defs);
  }

  function arrow(g, x1, y, x2, label) {
    g.appendChild(el('line', { class: 'press', x1: f1(x1), y1: f1(y), x2: f1(x2 - Math.sign(x2 - x1) * 6), y2: f1(y) }));
    const d = Math.sign(x2 - x1);
    g.appendChild(el('path', { class: 'press-head', d: `M${f1(x2)} ${f1(y)}l${-d * 8} -4.5v9z` }));
    g.appendChild(el('text', { class: 'press-text', x: f1((x1 + x2) / 2), y: f1(y - 8), 'text-anchor': 'middle' }, label));
  }

  /**
   * Gland cross-section.
   * p = { type, G, L (gland depth incl. gap), gap, r, cs, csEff, area (installed cross-section area),
   *       pressureFrom: 'left'|'right', labels: {...}, fmt }
   */
  function section(host, p) {
    host.textContent = '';
    if (!(p.G > 0 && p.L > 0 && p.cs > 0)) return;
    const W = 480;
    const ext = Math.max(p.G * 0.75, p.cs * 0.9);
    const worldW = p.G + 2 * ext;
    const k = (W - 190) / worldW; // px per mm, leave room for dimensions
    const F = Math.max(0, p.L - p.gap); // groove depth in the grooved part
    const baseT = Math.max(p.cs * 0.55, p.L * 0.45);
    const topT = baseT;
    const H = (p.L + baseT + topT) * k + 70;
    const svg = el('svg', { viewBox: `0 0 ${W} ${f1(H)}`, role: 'img', 'aria-label': p.labels.title });
    hatchDefs(svg, 'hatch-s');
    const x0 = 80; // left edge of the metal, px
    const yB = 22 + (topT + p.L) * k; // groove bottom, px
    const X = (x) => x0 + (x + ext) * k; // world x (0 = groove left wall) to px
    const Y = (y) => yB - y * k; // world y (0 = groove bottom, up = towards mating part)

    // grooved part with the groove notch (bottom corner radius r); a dovetail widens towards the bottom
    const r = Math.min(p.r || 0, p.G / 2, F) * k;
    const u = p.undercut || 0;
    const gp = u > 0 ? [
      `M${f1(X(-ext))} ${f1(Y(-baseT))}`, `V${f1(Y(F))}`, `H${f1(X(0))}`,
      `L${f1(X(-u))} ${f1(Y(0))}`, `H${f1(X(p.G + u))}`, `L${f1(X(p.G))} ${f1(Y(F))}`,
      `H${f1(X(p.G + ext))}`, `V${f1(Y(-baseT))}`, 'Z',
    ].join('') : [
      `M${f1(X(-ext))} ${f1(Y(-baseT))}`, `V${f1(Y(F))}`, `H${f1(X(0))}`, `V${f1(Y(0) - r)}`,
      r > 0 ? `Q${f1(X(0))} ${f1(Y(0))} ${f1(X(0) + r)} ${f1(Y(0))}` : '',
      `H${f1(X(p.G) - r)}`,
      r > 0 ? `Q${f1(X(p.G))} ${f1(Y(0))} ${f1(X(p.G))} ${f1(Y(0) - r)}` : '',
      `V${f1(Y(F))}`, `H${f1(X(p.G + ext))}`, `V${f1(Y(-baseT))}`, 'Z',
    ].join('');
    svg.appendChild(el('path', { class: 'metal', d: gp }));
    svg.appendChild(el('path', { d: gp, fill: 'url(#hatch-s)', stroke: 'none' }));
    // mating part
    const mp = `M${f1(X(-ext))} ${f1(Y(p.L))}H${f1(X(p.G + ext))}V${f1(Y(p.L + topT))}H${f1(X(-ext))}Z`;
    svg.appendChild(el('path', { class: 'metal', d: mp }));
    svg.appendChild(el('path', { d: mp, fill: 'url(#hatch-s)', stroke: 'none' }));
    if (p.gap > 0) {
      svg.appendChild(el('rect', { class: 'gap-hl', x: f1(X(-ext)), y: f1(Y(p.L)), width: f1((p.G + 2 * ext) * k), height: f1(p.gap * k) }));
    }

    // installed O-ring: a stadium of the gland height with the installed cross-section area
    const right = p.pressureFrom !== 'right';
    let w, h;
    if (p.csEff > p.L) {
      h = p.L;
      w = h + Math.max(0, (p.area - Math.PI / 4 * h * h) / h);
    } else { w = h = p.csEff; }
    const room = p.G + 2 * u;
    const over = w > room;
    w = Math.min(w, room);
    const ox = p.centred ? (p.G - w) / 2 : right ? p.G - w : 0;
    svg.appendChild(el('rect', {
      class: 'oring', x: f1(X(ox)), y: f1(Y(h)), width: f1(w * k), height: f1(h * k),
      rx: f1(Math.min(w, h) / 2 * k), ry: f1(Math.min(w, h) / 2 * (over ? 0.6 : 1) * k),
    }));
    // free O-ring outline, resting on the groove bottom
    const cx = ox + w / 2;
    svg.appendChild(el('circle', { class: 'oring-free', cx: f1(X(cx)), cy: f1(Y(p.cs / 2)), r: f1(p.cs / 2 * k) }));

    // pressure arrow
    const ay = Y(h / 2);
    if (p.centred) { /* dovetail: no pressure direction */ } else if (right) arrow(svg, X(-ext * 0.9), ay, X(-ext * 0.15), p.labels.pressure);
    else arrow(svg, X(p.G + ext * 0.9), ay, X(p.G + ext * 0.15), p.labels.pressure);

    // dimensions
    const g = el('g', {});
    dimLine(g, X(0), Y(-baseT) + 16, X(p.G), Y(-baseT) + 16, 'G ' + p.fmt(p.G), { strong: true });
    dimLine(g, X(p.G + ext) + 14, Y(0), X(p.G + ext) + 14, Y(p.L), 'L ' + p.fmt(p.L), { strong: true });
    if (p.gap > 0) dimLine(g, X(-ext) - 10, Y(F), X(-ext) - 10, Y(p.L), p.fmt(p.gap), { left: true });
    svg.appendChild(g);
    // part names
    svg.appendChild(el('text', { class: 'dim-text', x: f1(X(-ext) + 6), y: f1(Y(-baseT) - 6) }, p.labels.groovePart));
    svg.appendChild(el('text', { class: 'dim-text', x: f1(X(-ext) + 6), y: f1(Y(p.L + topT) + 15) }, p.labels.matingPart));
    if (p.labels.axis) {
      svg.appendChild(el('text', { class: 'dim-text', x: f1(X(p.G + ext) - 6), y: f1(p.axisAbove ? Y(p.L + topT) + 15 : Y(-baseT) - 6), 'text-anchor': 'end' }, p.labels.axis));
    }
    host.appendChild(svg);
  }

  /** Rounded-rectangle path centred on (cx, cy). */
  function rrPath(cx, cy, L, W, R) {
    const r = Math.max(0, Math.min(R, L / 2, W / 2));
    const x = cx - L / 2, y = cy - W / 2;
    return `M${f1(x + r)} ${f1(y)}H${f1(x + L - r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + L)} ${f1(y + r)}V${f1(y + W - r)}`
      + `A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + L - r)} ${f1(y + W)}H${f1(x + r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x)} ${f1(y + W - r)}`
      + `V${f1(y + r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + r)} ${f1(y)}Z`;
  }

  /**
   * Plan view of the groove.
   * p = { shape, outer: {L, W, R} | {D}, inner: {...}, ring: {offset from outer wall to centreline (mm), width (mm)},
   *       metalOuter (optional: bore contour for radial), labels, fmt }
   */
  function plan(host, p) {
    host.textContent = '';
    const W = 440, Hmax = 300;
    const o = p.outer, i = p.inner;
    if (!o || !i) return;
    const oL = o.D || o.L, oW = o.D || o.W;
    if (!(oL > 0 && oW > 0)) return;
    const k = Math.min((W - 170) / oL, (Hmax - 70) / oW);
    const H = oW * k + 70;
    const svg = el('svg', { viewBox: `0 0 ${W} ${f1(H)}`, role: 'img', 'aria-label': p.labels.title });
    const cx = W / 2 - 20, cy = 26 + oW * k / 2;
    const shape = (s, cls, extra = {}) => {
      if (s.D !== undefined) return el('circle', Object.assign({ class: cls, cx: f1(cx), cy: f1(cy), r: f1(Math.max(0, s.D) / 2 * k) }, extra));
      return el('path', Object.assign({ class: cls, d: rrPath(cx, cy, Math.max(0, s.L) * k, Math.max(0, s.W) * k, Math.max(0, s.R) * k) }, extra));
    };
    // groove area = between outer and inner wall (even-odd fill)
    if (o.D !== undefined) {
      const ro = o.D / 2 * k, ri = Math.max(0, i.D) / 2 * k;
      svg.appendChild(el('path', {
        class: 'groove-fill', 'fill-rule': 'evenodd',
        d: `M${f1(cx - ro)} ${f1(cy)}a${f1(ro)} ${f1(ro)} 0 1 0 ${f1(2 * ro)} 0a${f1(ro)} ${f1(ro)} 0 1 0 ${f1(-2 * ro)} 0Z`
          + `M${f1(cx - ri)} ${f1(cy)}a${f1(ri)} ${f1(ri)} 0 1 0 ${f1(2 * ri)} 0a${f1(ri)} ${f1(ri)} 0 1 0 ${f1(-2 * ri)} 0Z`,
      }));
    } else {
      svg.appendChild(el('path', {
        class: 'groove-fill', 'fill-rule': 'evenodd',
        d: rrPath(cx, cy, o.L * k, o.W * k, o.R * k) + rrPath(cx, cy, Math.max(0, i.L) * k, Math.max(0, i.W) * k, Math.max(0, i.R) * k),
      }));
    }
    svg.appendChild(shape(o, 'wall'));
    svg.appendChild(shape(i, 'wall'));
    // O-ring centreline
    const off = p.ring.offset, rw = Math.max(1.5, p.ring.width * k);
    const c = o.D !== undefined ? { D: o.D - 2 * off } : { L: o.L - 2 * off, W: o.W - 2 * off, R: Math.max(0, o.R - off) };
    svg.appendChild(shape(c, 'oring-line', { 'stroke-width': f1(rw), opacity: 0.85 }));

    // dimensions
    const g = el('g', {});
    const top = cy - oW * k / 2, bottom = cy + oW * k / 2, left = cx - oL * k / 2, rightX = cx + oL * k / 2;
    if (o.D !== undefined) {
      dimLine(g, left, bottom + 18, rightX, bottom + 18, p.labels.outer + ' Ø ' + p.fmt(o.D), { strong: true });
      if (i.D > 0) dimLine(g, cx - i.D / 2 * k, cy, cx + i.D / 2 * k, cy, 'Ø ' + p.fmt(i.D), { above: true });
    } else {
      dimLine(g, left, bottom + 18, rightX, bottom + 18, p.fmt(o.L), { strong: true });
      dimLine(g, rightX + 16, top, rightX + 16, bottom, p.fmt(o.W), { strong: true });
      if (o.R > 0) g.appendChild(el('text', { class: 'dim-text', x: f1(left + 4), y: f1(top - 8) }, 'R ' + p.fmt(o.R)));
    }
    svg.appendChild(g);
    host.appendChild(svg);
  }

  /** Schematic of a straight-thread boss port with the O-ring in the conical seat (not to scale). */
  function boss(host, p) {
    host.textContent = '';
    const W = 440, H = 250;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': p.labels.title });
    hatchDefs(svg, 'hatch-b');
    // port body (section, left half shown mirrored on both sides of the axis)
    const port = (sgn) => {
      const cx = W / 2, x = (v) => f1(cx + sgn * v);
      return `M${x(200)} 110H${x(78)}L${x(60)} 136V240H${x(200)}Z`;
    };
    for (const sg of [-1, 1]) {
      svg.appendChild(el('path', { class: 'metal', d: port(sg) }));
      svg.appendChild(el('path', { d: port(sg), fill: 'url(#hatch-b)', stroke: 'none' }));
    }
    // fitting: hex shoulder on top, undercut and threaded stem going down
    const fit = `M${W / 2 - 120} 40H${W / 2 + 120}V100H${W / 2 + 52}V118H${W / 2 + 58}V240H${W / 2 - 58}V118H${W / 2 - 52}V100H${W / 2 - 120}Z`;
    svg.appendChild(el('path', { class: 'metal', d: fit, opacity: 0.85 }));
    // thread hint
    for (let y = 146; y < 236; y += 10) {
      svg.appendChild(el('line', { class: 'dim', x1: W / 2 - 60, y1: y, x2: W / 2 - 56, y2: y + 5 }));
      svg.appendChild(el('line', { class: 'dim', x1: W / 2 + 56, y1: y, x2: W / 2 + 60, y2: y + 5 }));
    }
    // O-rings in the cone between undercut and seat
    for (const sg of [-1, 1]) svg.appendChild(el('ellipse', { class: 'oring', cx: f1(W / 2 + sg * 64), cy: 112, rx: 10, ry: 9 }));
    svg.appendChild(el('line', { class: 'axis', x1: W / 2, y1: 30, x2: W / 2, y2: 246 }));
    const tx = (x, y, txt, a = 'start') => svg.appendChild(el('text', { class: 'dim-text', x, y, 'text-anchor': a }, txt));
    tx(W / 2 - 116, 58, p.labels.fitting);
    tx(W / 2 + 196, 230, p.labels.port, 'end');
    tx(W / 2 + 80, 132, p.labels.cone);
    tx(W / 2 - 80, 132, p.labels.oring, 'end');
    tx(W / 2 + 64, 196, p.thread);
    host.appendChild(svg);
  }

  root.Drawing = { section, plan, boss };
})(typeof window !== 'undefined' ? window : globalThis);
