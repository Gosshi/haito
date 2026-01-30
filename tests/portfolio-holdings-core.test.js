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

test('holdings store uses holdings api module', () => {
  const file = 'stores/holdings-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /from\s+['"]\.\.\/lib\/api\/holdings['"]/,
    'holdings store should import holdings api module'
  );
  assert.match(content, /createHolding/, 'store should use createHolding');
  assert.match(
    content,
    /fetchHoldings/,
    'store should use fetchHoldings API'
  );
});

test('holdings api exposes update/delete functions', () => {
  const file = 'lib/api/holdings.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /export\s+(async\s+)?function\s+updateHolding|export\s+const\s+updateHolding/,
    'updateHolding must be exported'
  );
  assert.match(
    content,
    /export\s+(async\s+)?function\s+deleteHolding|export\s+const\s+deleteHolding/,
    'deleteHolding must be exported'
  );
  assert.match(
    content,
    /from\(['"]holdings['"]\)\.update/,
    'updateHolding should update holdings table'
  );
  assert.match(
    content,
    /from\(['"]holdings['"]\)\.delete/,
    'deleteHolding should delete holdings table'
  );
});

test('holdings store exposes update/delete actions', () => {
  const file = 'stores/holdings-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /updateHolding:/, 'updateHolding action must be defined');
  assert.match(content, /deleteHolding:/, 'deleteHolding action must be defined');
});

test('holdings store uses update/delete api functions', () => {
  const file = 'stores/holdings-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /updateHolding/, 'store should use updateHolding');
  assert.match(content, /deleteHolding/, 'store should use deleteHolding');
});

test('holdings store applies optimistic update rollback', () => {
  const file = 'stores/holdings-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /previousHoldings/,
    'store should snapshot holdings for rollback'
  );
  assert.match(
    content,
    /set\(\{\s*holdings:\s*previousHoldings/,
    'store should rollback to previousHoldings on error'
  );
});
