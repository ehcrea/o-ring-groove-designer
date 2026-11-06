// Settings for tools/build-pages.js (language pages, SEO tags, sitemap).
'use strict';
const I18N = require('../js/i18n.js');

module.exports = {
  base: 'https://ehcrea.github.io/o-ring-groove-designer/',
  repo: 'https://github.com/ehcrea/o-ring-groove-designer',
  name: 'O-Ring Groove Designer',
  ogImage: 'icons/og-image.png',
  langs: Object.keys(I18N.LANGS), // English first
  meta: I18N.meta(),
  featureList: ["O-ring groove dimensions for piston, rod, face, dovetail and boss seals", "Squeeze, gland fill, stretch and extrusion gap checks", "AS568 and ISO 3601 O-ring sizes", "Parker and ERIKS design guidelines", "Metric and inch units", "English, German, Dutch, Turkish and Spanish"],
  dict: (l) => I18N.dict()[l],
  blocks: () => I18N.html(),
  assets: /\b(href|src)="(icons\/|css\/|js\/|manifest\.webmanifest)/g,
};
