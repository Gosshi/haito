import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const validationPath = '.kiro/specs/supabase-rls-tables/validation.md';

const requiredSnippets = [
  '## Migration/Seed',
  'Result: PASS',
  'supabase db reset --local',
  '## RLS Access Checks',
  'Result: PASS',
];

test('supabase rls validation report exists', () => {
  assert.ok(
    existsSync(pathOf(validationPath)),
    `${validationPath} must exist`
  );
});

test('validation report includes migration and RLS verification results', () => {
  const content = readFileSync(pathOf(validationPath), 'utf8');

  for (const snippet of requiredSnippets) {
    assert.ok(
      content.includes(snippet),
      `Validation report must include "${snippet}"`
    );
  }
});
