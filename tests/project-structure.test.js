import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const requiredDirs = [
  'app',
  'components',
  'components/ui',
  'lib',
  'lib/supabase',
  'types',
];

const requiredFiles = ['app/layout.tsx', 'app/page.tsx'];

const placeholderText = 'Haito';

test('project base directories exist', () => {
  for (const dir of requiredDirs) {
    assert.ok(
      existsSync(pathOf(dir)),
      `Missing required directory: ${dir}`
    );
  }
});

test('app router files exist', () => {
  for (const file of requiredFiles) {
    assert.ok(
      existsSync(pathOf(file)),
      `Missing required file: ${file}`
    );
  }
});

test('pages directory is not used', () => {
  assert.ok(!existsSync(pathOf('pages')), 'pages directory must not exist');
});

test('root page contains placeholder content', () => {
  const content = readFileSync(pathOf('app/page.tsx'), 'utf8');
  assert.ok(
    content.includes(placeholderText),
    'app/page.tsx should include placeholder text'
  );
});
