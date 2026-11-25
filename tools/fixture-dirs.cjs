// Shared fixture-directory policy for the test suite and tools/verify-install.cjs.
//
// Fixtures live under output/ on purpose: the copied theme inside them requires
// js-yaml/pug, which only resolve from this repo's node_modules, and Hexo needs a
// real site root. They must be deleted afterwards, because installing the theme
// with `file:` points the theme dir at this whole checkout and `hexo s` walks and
// hashes every file in the theme dir — hundreds of leftover fixtures eventually
// fail with EMFILE: too many open files.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const fixturesRoot = path.join(root, 'output');
const prefixes = ['sqlite-check-', 'install-check-', 'next-local-install-'];

function create(prefix) {
  fs.mkdirSync(fixturesRoot, {recursive: true});
  return fs.mkdtempSync(path.join(fixturesRoot, prefix));
}

// Windows keeps handles on files it just wrote, so retry briefly rather than leak the fixture.
function remove(dir) {
  fs.rmSync(dir, {recursive: true, force: true, maxRetries: 10, retryDelay: 100});
}

// A killed run leaves fixtures behind; reclaim them once no live run can own them.
function sweepStale(maxAgeMs = 60 * 60 * 1000) {
  if (!fs.existsSync(fixturesRoot)) return 0;
  const now = Date.now();
  let removed = 0;
  for (const entry of fs.readdirSync(fixturesRoot)) {
    if (!prefixes.some(prefix => entry.startsWith(prefix))) continue;
    const full = path.join(fixturesRoot, entry);
    try {
      if (now - fs.statSync(full).mtimeMs < maxAgeMs) continue;
      remove(full);
      removed++;
    } catch {
      // Another run owns it now; the next sweep picks it up.
    }
  }
  return removed;
}

module.exports = {create, remove, sweepStale};
