/*
 * Application examples. Each preset sets the seal type, O-ring, material,
 * primary hardware dimension and operating conditions; the groove is then
 * sized from the guideline, so every example starts from a design that passes
 * the checks. Lengths in mm, pressure in bar, temperatures in °C.
 */
(function (root) {
  'use strict';

  const PRESETS = [
    // ----- Hydraulics -----
    { id: 'cyl-piston', group: 'Hydraulics', name: 'Hydraulic cylinder piston (dynamic, 160 bar)',
      state: { type: 'piston', motion: 'dynamic', shape: 'circle', series: 'ISO3601', size: '56 × 3.55', material: 'NBR', hardness: 90, backups: 1, A: 63, pressure: 160, tMin: -20, tMax: 80, swell: 3 } },
    { id: 'cyl-rod', group: 'Hydraulics', name: 'Hydraulic cylinder rod (dynamic, 160 bar)',
      state: { type: 'rod', motion: 'dynamic', shape: 'circle', series: 'ISO3601', size: '35.5 × 3.55', material: 'NBR', hardness: 90, backups: 1, B: 36, pressure: 160, tMin: -20, tMax: 80, swell: 3 } },
    { id: 'valve-plug', group: 'Hydraulics', name: 'Valve plug, static, 250 bar, two back-up rings',
      state: { type: 'piston', motion: 'static', shape: 'circle', series: 'AS568', size: '-114', material: 'FKM', hardness: 90, backups: 2, A: 20, pressure: 250, tMin: -15, tMax: 120, swell: 2 } },
    { id: 'boss-port', group: 'Hydraulics', name: 'Straight-thread port, 3/8 in tube (-906)',
      state: { type: 'boss', motion: 'static', shape: 'circle', series: 'BOSS', size: '-906', material: 'NBR', hardness: 90, backups: 0, pressure: 210, tMin: -30, tMax: 100, swell: 2 } },
    // ----- Covers & housings -----
    { id: 'cover-round', group: 'Covers & housings', name: 'Round cover, face seal (6 bar)',
      state: { type: 'face', pdir: 'internal', shape: 'circle', series: 'ISO3601', size: '90 × 5.30', material: 'NBR', hardness: 70, Do: 100, pressure: 6, tMin: -20, tMax: 90 } },
    { id: 'lid-rect', group: 'Covers & housings', name: 'Rectangular enclosure lid (rounded rectangle)',
      state: { type: 'face', pdir: 'internal', shape: 'rect', series: 'ISO3601', size: '180 × 5.30', material: 'EPDM', hardness: 70, Lo: 200, Wo: 120, Ro: 25, pressure: 0.5, tMin: -30, tMax: 70 } },
    { id: 'bearing-cap', group: 'Covers & housings', name: 'Bearing cap on a shaft (static rod gland)',
      state: { type: 'rod', motion: 'static', shape: 'circle', series: 'ISO3601', size: '40 × 3.55', material: 'NBR', hardness: 70, B: 40, pressure: 2, tMin: -20, tMax: 100 } },
    { id: 'as568-piston', group: 'Covers & housings', name: 'AS568 piston seal in a 2 in bore',
      state: { type: 'piston', motion: 'static', shape: 'circle', series: 'AS568', size: '-133', material: 'NBR', hardness: 70, A: 50.8, pressure: 70, tMin: -30, tMax: 100 } },
    // ----- Process, vacuum & fuel -----
    { id: 'vacuum', group: 'Process, vacuum & fuel', name: 'Vacuum flange (pressure from outside)',
      state: { type: 'face', pdir: 'external', medium: 'gas', shape: 'circle', series: 'ISO3601', size: '109 × 5.30', material: 'FKM', hardness: 75, Do: 110, pressure: 1, tMin: 0, tMax: 120 } },
    { id: 'steam', group: 'Process, vacuum & fuel', name: 'Hot water / steam cover, EPDM (150 °C)',
      state: { type: 'face', pdir: 'internal', shape: 'circle', series: 'ISO3601', size: '71 × 5.30', material: 'EPDM', hardness: 70, Do: 80, pressure: 10, tMin: 0, tMax: 150, swell: 2 } },
    { id: 'fuel', group: 'Process, vacuum & fuel', name: 'Fuel system face seal, fluorosilicone (−55 °C)',
      state: { type: 'face', pdir: 'internal', shape: 'circle', series: 'AS568', size: '-326', material: 'FVMQ', hardness: 70, Do: 50, pressure: 3, tMin: -55, tMax: 120, swell: 4 } },
    // ----- Dovetail grooves -----
    { id: 'dovetail-door', group: 'Dovetail grooves', name: 'Vacuum chamber door (rectangular dovetail)',
      state: { type: 'dovetail', shape: 'rect', series: 'ISO3601', size: '315 × 7.00', material: 'FKM', hardness: 75, Lm: 300, Wm: 240, Rm: 40, pressure: 1, tMin: 0, tMax: 150 } },
    { id: 'dovetail-valve', group: 'Dovetail grooves', name: 'Valve seat, O-ring retained in a dovetail',
      state: { type: 'dovetail', shape: 'circle', series: 'AS568', size: '-330', material: 'EPDM', hardness: 70, Dm: 60, pressure: 10, tMin: -20, tMax: 120 } },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = PRESETS;
  else root.PRESETS = PRESETS;
})(typeof window !== 'undefined' ? window : globalThis);
