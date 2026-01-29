import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('eslint and prettier config files exist', () => {
  assert.ok(existsSync(pathOf('.eslintrc.json')), '.eslintrc.json must exist');
  assert.ok(existsSync(pathOf('.prettierrc')), '.prettierrc must exist');
});

test('eslint config has Next.js core web vitals preset', () => {
  const raw = readFileSync(pathOf('.eslintrc.json'), 'utf8');
  let config;

  try {
    config = JSON.parse(raw);
  } catch (error) {
    assert.fail('.eslintrc.json must be valid JSON');
  }

  assert.equal(config?.root, true, '.eslintrc.json should set root: true');
  assert.ok(
    Array.isArray(config?.extends),
    '.eslintrc.json should include an extends array'
  );
  assert.ok(
    config.extends.includes('next/core-web-vitals'),
    'eslint should extend next/core-web-vitals'
  );
});

test('prettier config is valid JSON with core options', () => {
  const raw = readFileSync(pathOf('.prettierrc'), 'utf8');
  let config;

  try {
    config = JSON.parse(raw);
  } catch (error) {
    assert.fail('.prettierrc must be valid JSON');
  }

  assert.equal(config?.singleQuote, true, 'prettier should enable singleQuote');
  assert.equal(config?.semi, true, 'prettier should enable semicolons');
  assert.equal(
    config?.trailingComma,
    'all',
    'prettier should set trailingComma to all'
  );
});
