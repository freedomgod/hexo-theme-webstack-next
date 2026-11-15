const assert = require('node:assert/strict');
const { test } = require('node:test');
const { convertLinkLists } = require('../lib/card-list.cjs');

function list(items) {
  return `<ul>\n${items.map(item => `<li>${item}</li>`).join('\n')}\n</ul>`;
}

test('a list of links becomes a card grid', () => {
  const html = convertLinkLists(list([
    '<a href="https://github.com/">GitHub</a> <img src="/images/logos/github.png" alt="icon"> Code hosting.',
    '<a href="https://hexo.io/">Hexo</a> Static site generator.'
  ]));
  assert.equal((html.match(/class="resource-card"/g) || []).length, 2);
  assert.equal((html.match(/class="resource-grid"/g) || []).length, 1);
  assert(html.includes('<strong class="resource-name">GitHub</strong>'));
  assert(html.includes('<span class="resource-description">Code hosting.</span>'));
  assert(html.includes('<img src="/images/logos/github.png" loading="lazy"'));
  assert(html.includes('class="fas fa-link"'), 'an item without an image falls back to a link glyph');
  assert(html.includes('href="https://hexo.io/" target="_blank" rel="noopener noreferrer"'));
  assert(!html.includes('<ul>'), 'the list itself is replaced');
});

test('a description may start with a separator', () => {
  const html = convertLinkLists(list(['<a href="https://example.com/">Example</a> — Short text.']));
  assert(html.includes('<span class="resource-description">Short text.</span>'));
});

test('lists without links are left untouched', () => {
  const source = list(['plain item', 'another item']);
  assert.equal(convertLinkLists(source), source);
});

test('a list is only converted when every item starts with a link', () => {
  const source = list(['<a href="https://example.com/">Example</a> Text.', 'plain item']);
  assert.equal(convertLinkLists(source), source);
});

test('nested lists and ordered lists are left untouched', () => {
  const nested = '<ul>\n<li><a href="https://example.com/">Example</a>\n<ul>\n<li>inner</li>\n</ul>\n</li>\n</ul>';
  assert.equal(convertLinkLists(nested), nested);
  const ordered = '<ol>\n<li><a href="https://example.com/">Example</a> Text.</li>\n</ol>';
  assert.equal(convertLinkLists(ordered), ordered);
});

test('every top level list is converted', () => {
  const html = convertLinkLists(`${list(['<a href="https://a.example/">A</a> First.'])}\n<p>between</p>\n${list(['<a href="https://b.example/">B</a> Second.'])}`);
  assert.equal((html.match(/class="resource-grid"/g) || []).length, 2);
  assert(html.includes('<p>between</p>'));
});

test('loose list items wrapped in a paragraph are still converted', () => {
  const html = convertLinkLists('<ul>\n<li>\n<p><a href="https://example.com/">Example</a> Wrapped.</p>\n</li>\n</ul>');
  assert(html.includes('<strong class="resource-name">Example</strong>'));
  assert(html.includes('Wrapped.'));
});

test('markup in the item text does not leak into the card', () => {
  const html = convertLinkLists(list(['<a href="https://example.com/">Ex<em>ample</em></a> <code>text</code> <strong>bold</strong>.']));
  assert(html.includes('<strong class="resource-name">Ex ample</strong>'));
  assert(html.includes('<span class="resource-description">text bold.</span>'));
});

test('non string input is returned as is', () => {
  assert.equal(convertLinkLists(undefined), undefined);
});
