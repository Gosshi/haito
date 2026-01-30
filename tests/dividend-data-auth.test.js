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

test('dividends route handler guards cron with secret', () => {
  const content = expectFile('app/api/dividends/fetch/route.ts');
  assert.match(
    content,
    /CRON_SECRET/,
    'route handler should reference CRON_SECRET'
  );
  assert.match(
    content,
    /authorization/i,
    'route handler should check authorization header'
  );
});

test('dividends route handler checks authentication for POST', () => {
  const content = expectFile('app/api/dividends/fetch/route.ts');
  assert.match(
    content,
    /export\s+async\s+function\s+POST/,
    'POST handler must exist'
  );
  assert.match(
    content,
    /requireUserId/,
    'POST handler should require authenticated user'
  );
});
