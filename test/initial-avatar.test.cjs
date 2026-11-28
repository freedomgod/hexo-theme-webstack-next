const assert = require('node:assert/strict');
const { test } = require('node:test');
const { initialAvatar } = require('../lib/initial-avatar.cjs');

function svgOf(data) {
  assert.match(data, /^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/);
  return Buffer.from(data.split(',')[1], 'base64').toString('utf8');
}

test('generates a deterministic base64 SVG avatar from the first character', () => {
  const avatar = initialAvatar('ChatGPT');
  assert.equal(initialAvatar('ChatGPT'), avatar);
  const svg = svgOf(avatar);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 48 48">/);
  assert.match(svg, /<rect width="48" height="48" rx="13" fill="#[0-9A-F]{6}"\/>/);
  assert.match(svg, /<text x="24" y="32\.2" text-anchor="middle"/);
  assert.match(svg, /font-size="24" font-weight="600"/);
  assert.match(svg, />C<\/text><\/svg>$/);
});

test('keeps a wide character and escapes XML-sensitive first characters', () => {
  assert.match(svgOf(initialAvatar('豆包')), />豆<\/text><\/svg>$/);
  assert.match(svgOf(initialAvatar('&')), />&amp;<\/text><\/svg>$/);
  assert.match(svgOf(initialAvatar('<')), />&lt;<\/text><\/svg>$/);
  assert.match(svgOf(initialAvatar('   ')), />\?<\/text><\/svg>$/);
  assert.match(svgOf(initialAvatar()), />\?<\/text><\/svg>$/);
});
