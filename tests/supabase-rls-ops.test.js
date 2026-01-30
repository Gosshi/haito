import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const prSummaryPath = '.kiro/specs/supabase-rls-tables/pr-summary.md';

const requiredPhrases = [
  'supabase db push',
  '--include-seed',
  'supabase migration up',
  'Storage',
  'Edge Functions',
  'Backup',
  'holdings',
  'dividend_data',
  'user_settings',
  'Users can manage own holdings',
  'Users can manage own settings',
  'Allow read access to dividend data',
  'service_role',
];

test('supabase rls tables PR summary exists', () => {
  assert.ok(
    existsSync(pathOf(prSummaryPath)),
    `${prSummaryPath} must exist`
  );
});

test('pr summary includes migration, verification, and policy details', () => {
  const content = readFileSync(pathOf(prSummaryPath), 'utf8');

  for (const phrase of requiredPhrases) {
    assert.ok(
      content.includes(phrase),
      `PR summary must include "${phrase}"`
    );
  }
});
