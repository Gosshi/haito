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

test('env example includes service role key and cron secret', () => {
  const content = expectFile('.env.local.example');
  assert.match(
    content,
    /SUPABASE_SERVICE_ROLE_KEY=/,
    'SUPABASE_SERVICE_ROLE_KEY must be defined in env example'
  );
  assert.match(
    content,
    /CRON_SECRET=/,
    'CRON_SECRET must be defined in env example'
  );
});

test('vercel cron config includes dividends fetch route', () => {
  const content = expectFile('vercel.json');
  const parsed = JSON.parse(content);
  assert.ok(Array.isArray(parsed.crons), 'vercel.json should include crons');
  const hasDividendsCron = parsed.crons.some(
    (cron) => cron && cron.path === '/api/dividends/fetch'
  );
  assert.ok(hasDividendsCron, 'crons should include /api/dividends/fetch');
});

test('service role supabase client module exists', () => {
  const content = expectFile('lib/supabase/service.ts');
  assert.match(
    content,
    /SUPABASE_SERVICE_ROLE_KEY/,
    'service client should read SUPABASE_SERVICE_ROLE_KEY'
  );
});
