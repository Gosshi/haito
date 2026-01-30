import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const read = (rel) => readFileSync(pathOf(rel), 'utf8');

const expectFile = (rel) => {
  assert.ok(existsSync(pathOf(rel)), `${rel} must exist`);
  return read(rel);
};

test('refresh dividends button component exists and calls api', () => {
  const content = expectFile('components/portfolio/refresh-dividends-button.tsx');
  assert.match(
    content,
    /\/api\/dividends\/fetch/,
    'refresh button should call /api/dividends/fetch'
  );
});

test('holdings table uses refresh dividends button', () => {
  const content = expectFile('components/portfolio/holdings-table.tsx');
  assert.match(
    content,
    /RefreshDividendsButton/,
    'holdings table should render RefreshDividendsButton'
  );
});

test('add holding form auto-completes stock name via api', () => {
  const content = expectFile('components/portfolio/add-holding-form.tsx');
  assert.match(
    content,
    /\/api\/dividends\/fetch\?code=/,
    'add holding form should fetch stock name from dividends api'
  );
});
