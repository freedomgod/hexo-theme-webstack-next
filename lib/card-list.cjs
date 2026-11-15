'use strict';

// Authors write cards as an ordinary bullet list of links. There is no marker and
// no front matter switch: a list whose every item starts with a link becomes a
// card grid, everything else keeps its normal markup.

const LIST_TAG = /<(\/?)ul\b[^>]*>/gi;
const ITEM_TAG = /<(\/?)li\b[^>]*>/gi;
const LINK = /^\s*<a\b([^>]*)>([\s\S]*?)<\/a>/;
const IMAGE = /^\s*<img\b([^>]*?)\/?>\s*/;
const LEADING_SEPARATOR = /^[-–—·:：]\s*/;

function collapse(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// Card text is plain text: nested markup would break the two-line clamp.
function textOf(html) {
  return collapse(html.replace(/<[^>]*>/g, ' ')).replace(/\s+([.,;:!?)\]])/g, '$1');
}

function attrOf(attrs, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(attrs);
  return match ? match[1] : '';
}

// Top level blocks only: a list nested inside another one is not a card list.
function topLevelBlocks(html, name) {
  const tag = name === 'li' ? ITEM_TAG : LIST_TAG;
  tag.lastIndex = 0;
  const blocks = [];
  let depth = 0;
  let start = -1;
  let innerStart = -1;
  let match;
  while ((match = tag.exec(html))) {
    if (match[1] === '/') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0) blocks.push({ start, end: match.index + match[0].length, inner: html.slice(innerStart, match.index) });
      continue;
    }
    if (depth === 0) {
      start = match.index;
      innerStart = match.index + match[0].length;
    }
    depth += 1;
  }
  return blocks;
}

function unwrapParagraph(html) {
  const match = /^<p\b[^>]*>([\s\S]*)<\/p>$/.exec(html.trim());
  return match ? match[1].trim() : html.trim();
}

// One list item: [name](url) ![icon](src) description
function parseItem(content) {
  const body = unwrapParagraph(content);
  const link = LINK.exec(body);
  if (!link) return null;
  const href = attrOf(link[1], 'href');
  const name = textOf(link[2]);
  if (!href || !name) return null;
  let rest = body.slice(link[0].length);
  let icon = '';
  const image = IMAGE.exec(rest);
  if (image) {
    icon = attrOf(image[1], 'src');
    rest = rest.slice(image[0].length);
  }
  const description = textOf(rest).replace(LEADING_SEPARATOR, '');
  return { href, name, icon, description };
}

function renderCard(card) {
  const icon = card.icon
    ? `<img src="${card.icon}" loading="lazy" decoding="async" width="40" height="40" alt="" onerror="this.hidden = true">`
    : '<i class="fas fa-link" aria-hidden="true"></i>';
  const description = card.description ? `<span class="resource-description">${card.description}</span>` : '';
  return `<a class="resource-card" href="${card.href}" target="_blank" rel="noopener noreferrer">`
    + `<span class="resource-icon">${icon}</span>`
    + `<span class="resource-copy"><strong class="resource-name">${card.name}</strong>${description}</span>`
    + '<i class="fas fa-arrow-up resource-arrow" aria-hidden="true"></i>'
    + '</a>';
}

function convertList(inner) {
  if (/<(ul|ol)\b/i.test(inner)) return null;
  const items = topLevelBlocks(inner, 'li');
  if (!items.length) return null;
  const cards = [];
  for (const item of items) {
    const card = parseItem(item.inner);
    if (!card) return null;
    cards.push(card);
  }
  return `<div class="resource-grid">${cards.map(renderCard).join('')}</div>`;
}

function convertLinkLists(html) {
  if (typeof html !== 'string') return html;
  const lists = topLevelBlocks(html, 'ul');
  let output = html;
  // Replace from the end so earlier offsets stay valid.
  for (let index = lists.length - 1; index >= 0; index -= 1) {
    const cards = convertList(lists[index].inner);
    if (!cards) continue;
    output = output.slice(0, lists[index].start) + cards + output.slice(lists[index].end);
  }
  return output;
}

function register(hexo) {
  hexo.extend.filter.register('after_post_render', data => {
    if (typeof data.content !== 'string') return data;
    data.content = convertLinkLists(data.content);
    return data;
  });
}

module.exports = { convertLinkLists, register };
