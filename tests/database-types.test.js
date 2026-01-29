import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('database type definitions exist', () => {
  assert.ok(
    existsSync(pathOf('types/database.ts')),
    'types/database.ts must exist'
  );
});

test('database types include required tables', () => {
  const content = readFileSync(pathOf('types/database.ts'), 'utf8');

  assert.match(
    content,
    /export\s+type\s+Database/,
    'Database type must be exported'
  );
  assert.match(
    content,
    /holdings/,
    'Database type must include holdings table'
  );
  assert.match(
    content,
    /dividend_data/,
    'Database type must include dividend_data table'
  );
  assert.match(
    content,
    /user_settings/,
    'Database type must include user_settings table'
  );
});

test('database types include account_type enum', () => {
  const content = readFileSync(pathOf('types/database.ts'), 'utf8');

  assert.match(
    content,
    /export\s+enum\s+account_type/,
    'account_type enum must be exported'
  );
});
