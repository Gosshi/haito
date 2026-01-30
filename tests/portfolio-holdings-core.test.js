import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('holdings api module exists', () => {
  const file = 'lib/api/holdings.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /export\s+(async\s+)?function\s+fetchHoldings|export\s+const\s+fetchHoldings/,
    'fetchHoldings must be exported'
  );
  assert.match(
    content,
    /export\s+(async\s+)?function\s+createHolding|export\s+const\s+createHolding/,
    'createHolding must be exported'
  );
});

test('holdings store module exists', () => {
  const file = 'stores/holdings-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /zustand/, 'Zustand must be used in holdings store');
  assert.match(
    content,
    /fetchHoldings/,
    'fetchHoldings action must be defined'
  );
  assert.match(content, /addHolding/, 'addHolding action must be defined');
});
