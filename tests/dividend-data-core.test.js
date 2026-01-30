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

test('dividend types module exists', () => {
  const content = expectFile('lib/dividends/types.ts');
  assert.match(
    content,
    /export\s+type\s+DividendSnapshot/,
    'DividendSnapshot type must be exported'
  );
  assert.match(
    content,
    /export\s+type\s+DividendApiResult/,
    'DividendApiResult type must be exported'
  );
});

test('yahoo finance provider module exists', () => {
  const content = expectFile('lib/external/yahoo-finance.ts');
  assert.match(
    content,
    /yahoo-finance2/,
    'yahoo-finance2 should be imported'
  );
  assert.match(
    content,
    /DividendProvider/,
    'DividendProvider should be referenced'
  );
});

test('dividends api module exists', () => {
  const content = expectFile('lib/api/dividends.ts');
  assert.match(
    content,
    /export\s+(async\s+)?function\s+upsertDividendData|export\s+const\s+upsertDividendData/,
    'upsertDividendData must be exported'
  );
  assert.match(
    content,
    /export\s+(async\s+)?function\s+fetchHoldingCodesByUser|export\s+const\s+fetchHoldingCodesByUser/,
    'fetchHoldingCodesByUser must be exported'
  );
  assert.match(
    content,
    /export\s+(async\s+)?function\s+fetchDistinctHoldingCodes|export\s+const\s+fetchDistinctHoldingCodes/,
    'fetchDistinctHoldingCodes must be exported'
  );
});

test('dividends route handler exists', () => {
  const content = expectFile('app/api/dividends/fetch/route.ts');
  assert.match(
    content,
    /export\s+async\s+function\s+GET/,
    'GET handler must be exported'
  );
  assert.match(
    content,
    /export\s+async\s+function\s+POST/,
    'POST handler must be exported'
  );
});
