// House app-icon standard (shared with redline/jambo): favicon.ico (16/32/48),
// apple-touch-icon (180), rounded 192/512 and a maskable 512, rendered from
// scripts/icons/icon.svg by `npm run icons`, and wired into the head + manifest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (f) => readFileSync(path.join(ROOT, 'public', f));
const PNGS = { 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512 };

test('every icon PNG is a real PNG at its declared size', () => {
  for (const [file, size] of Object.entries(PNGS)) {
    const b = pub(file);
    assert.equal(b.subarray(1, 4).toString(), 'PNG', file);
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [size, size], file);
  }
});

test('favicon.ico holds 16, 32 and 48', () => {
  const ico = pub('favicon.ico');
  assert.deepEqual([...ico.subarray(0, 6)], [0, 0, 1, 0, 3, 0]);
  assert.deepEqual([ico[6], ico[22], ico[38]], [16, 32, 48]);
});

test('head links the icon set; manifest lists 192, 512 and maskable', () => {
  const html = pub('index.html').toString();
  assert.ok(html.includes('<link rel="icon" href="/favicon.ico" sizes="any">'));
  assert.ok(html.includes('<link rel="apple-touch-icon" href="/apple-touch-icon.png">'));
  const m = JSON.parse(pub('manifest.webmanifest'));
  assert.deepEqual(m.icons.map((i) => i.src), ['/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']);
  assert.equal(m.icons[2].purpose, 'maskable');
});

test('service worker pre-caches the new icons under a new cache name', () => {
  const sw = pub('sw.js').toString();
  for (const f of ['/favicon.ico', '/apple-touch-icon.png', '/icon-maskable-512.png']) assert.ok(sw.includes(`'${f}'`), f);
  assert.ok(Number(/study-v(\d+)/.exec(sw)[1]) >= 6);
});

test('the master SVG has the bg and mark layers build.py expects', () => {
  const svg = readFileSync(path.join(ROOT, 'scripts/icons/icon.svg'), 'utf8');
  assert.ok(svg.includes('id="bg"') && svg.includes('id="mark"'));
});
