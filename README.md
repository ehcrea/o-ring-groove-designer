# O-Ring Groove Designer

**Live:** https://ehcrea.github.io/o-ring-groove-designer/

A browser-based tool for designing and checking **O-ring grooves (glands)**. Pick a seal type, a standard or custom O-ring and the hardware dimensions, and it checks:

- **Compression (squeeze)**: nominal and worst case with O-ring and machining tolerances, the flattening of the cross-section by installation stretch (Parker's empirical curve) and, optionally, full eccentricity. Also compression at the minimum temperature (shrinkage) and at the maximum temperature with volume swell
- **Gland fill**: nominal, worst case and hot (thermal expansion + fluid swell), against the 60–85 % band with at least 10 % void
- **Stretch and seating**: ID stretch on the piston groove or the rod, circumferential compression in rod glands, and for face seals whether the O-ring seats on the correct groove wall for the pressure direction
- **Extrusion gap**: diametral clearance against the guideline maximum for the cross-section (halved for silicones), and when back-up rings or a harder compound are needed for the pressure
- **Material limits**: temperature range of the elastomer, dynamic suitability, swell and shrinkage limits
- **Recommended groove** for the selected O-ring from the guideline tables, with one click to apply it, and **Suggest O-ring** to pick the standard size that best fits the hardware

Seal types: **piston** (radial, male gland), **rod** (radial, female gland), static or dynamic (reciprocating), and **face / axial** seals with pressure from inside or outside. The groove outline can be a **circle** or a **rectangle with rounded corners**, for face seals (covers, lids, flanges) as well as radial seals in non-round bores. Rounded rectangles use the perimeter 2(L + W) − (8 − 2π)R and check the corner radius at the groove centreline.

Available in **English, German, Dutch and Turkish**, in **metric or inch** units, with light and dark themes. It includes a **unit converter** (length with inch fractions, pressure, temperature, force, area and volume), can be installed to a phone's home screen, and every design can be shared as a link.

> The results are design guidance based on the manufacturers' public guidelines. Confirm critical seals with the seal supplier and by testing.

## Libraries

| Library | Contents |
|---|---|
| O-ring sizes | All 349 **AS568** sizes (-001 … -475, inch and mm, with tolerances) and the **ISO 3601-1 series G** metric sizes (1.80 / 2.65 / 3.55 / 5.30 / 7.00 mm). Custom sizes can be entered too |
| Materials | NBR, HNBR, FKM, FFKM, EPDM, VMQ, FVMQ, CR, ACM, AU/EU, FEPM, IIR: typical temperature range, hardness, thermal expansion, good for / avoid |
| Groove guidelines | **Parker O-Ring Handbook ORD 5700**: Design Tables 4-2 (industrial static), 4-3 (face seals, liquids and vacuum/gas), 5-2 and 5-2-b (industrial reciprocating, inch and metric), with 0 / 1 / 2 back-up rings. **ERIKS O-ring Technical Handbook** section 12: metric Tables 3.C-1 (face), 3.C-2 (static radial), 3.D-1 (dynamic), 3.D-2 (back-up ring widths). Cross-sections between table rows are interpolated |

Design limits (Parker ORD 5700 §3.5–3.7 and ERIKS): static compression 12–30 % (max. 30 %), dynamic 8–16 %, minimum squeeze ≈ 0.2 mm, installed stretch ≤ 5 % (≤ 3 % for face seals), circumferential compression ≤ 3 %, back-up rings above 103.5 bar static or 50 bar dynamic, centreline corner radius ≥ 3 × cross-section for rounded-rectangle grooves.

This project is not affiliated with or endorsed by Parker Hannifin or ERIKS; their names are used only to cite the public sources of the guideline values.

## Run it

It's a static site with no build step and no dependencies. Serve the folder and open it in a browser:

```bash
python3 -m http.server 8766
```

Then go to http://localhost:8766. It can also be hosted on GitHub Pages as is.

## Tests

```bash
node tests/calc.test.js
```

The tests check the size and guideline tables against the handbook values, the compression, fill and stretch calculations, the rounded-rectangle geometry, that the recommended groove gives no errors for every standard size, the unit conversions, and that every text in the interface has all four translations.

## Project layout

| File | Purpose |
|---|---|
| `js/data.js` | O-ring sizes, materials, guideline tables and design limits |
| `js/calc.js` | Gland calculation, design checks, recommended groove and O-ring suggestion |
| `js/units.js` | Metric / inch display units and the unit converter |
| `js/i18n.js` | Translations (EN, DE, NL, TR) |
| `js/drawing.js` | Cross-section and groove outline drawings (SVG) |
| `js/app.js` | User interface |

## License

[MIT](LICENSE) © 2026 Eren Tozlu · [ehcrea.com](https://ehcrea.com)
