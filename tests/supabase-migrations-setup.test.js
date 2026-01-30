import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const migrationsDir = 'supabase/migrations';
const seedFile = 'supabase/seed.sql';
const migrationSuffixes = ['create_tables.sql', 'setup_rls.sql'];

test('supabase migrations directory and seed file exist', () => {
  assert.ok(existsSync(pathOf('supabase')), 'Missing supabase directory');
  assert.ok(
    existsSync(pathOf(migrationsDir)),
    'Missing supabase/migrations directory'
  );
  assert.ok(existsSync(pathOf(seedFile)), 'Missing supabase/seed.sql file');
});

test('placeholder migrations for create_tables and setup_rls exist', () => {
  const files = readdirSync(pathOf(migrationsDir));

  for (const suffix of migrationSuffixes) {
    const match = files.find((file) => {
      return /^\d{14}_.+\.sql$/.test(file) && file.endsWith(`_${suffix}`);
    });

    assert.ok(match, `Missing migration file with suffix _${suffix}`);

    const content = readFileSync(pathOf(join(migrationsDir, match)), 'utf8');
    assert.equal(
      content.trim(),
      '',
      `${match} should be an empty placeholder`
    );
  }
});
