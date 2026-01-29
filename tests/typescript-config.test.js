import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('tsconfig enables strict mode', () => {
  const configPath = pathOf('tsconfig.json');
  assert.ok(existsSync(configPath), 'tsconfig.json must exist');

  const raw = readFileSync(configPath, 'utf8');
  let config;

  try {
    config = JSON.parse(raw);
  } catch (error) {
    assert.fail('tsconfig.json must be valid JSON');
  }

  assert.equal(
    config?.compilerOptions?.strict,
    true,
    'compilerOptions.strict must be true'
  );
});
