const PALETTE = [
  ['#FDE8E4', '#B4432E'],
  ['#E8F1FD', '#2F5DA8'],
  ['#E6F6EC', '#2E7D4F'],
  ['#FFF4D9', '#8A5A12'],
  ['#F0E9FB', '#6546A6'],
  ['#E5F6F8', '#1F6F7A'],
  ['#FBE9F3', '#A03A6B'],
  ['#EEF0F4', '#4A5568']
];

const FONT_FAMILY = 'PingFang SC,Hiragino Sans GB,Microsoft YaHei,Helvetica,Arial,sans-serif';

function escapeXml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

// Keep the same name on the same colour while different names get a stable spread.
function paletteFor(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialAvatar(name) {
  const label = typeof name === 'string' ? name.trim() : '';
  const initial = Array.from(label)[0] || '?';
  const [background, foreground] = paletteFor(label || '?');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
    + `<rect width="48" height="48" rx="13" fill="${background}"/>`
    + `<text x="24" y="32.2" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="24" font-weight="600" fill="${foreground}">${escapeXml(initial)}</text>`
    + '</svg>';
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

module.exports = { initialAvatar };
