import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const requiredFiles = ['lib/auth/types.ts', 'lib/auth/actions.ts'];

test('auth contract files exist', () => {
  for (const file of requiredFiles) {
    assert.ok(
      existsSync(pathOf(file)),
      `Missing required file: ${file}`
    );
  }
});

test('auth types define AuthInput and AuthResult', () => {
  const content = readFileSync(pathOf('lib/auth/types.ts'), 'utf8');

  assert.match(
    content,
    /export\s+type\s+AuthInput/,
    'AuthInput type must be exported'
  );
  assert.match(
    content,
    /export\s+type\s+AuthResult/,
    'AuthResult type must be exported'
  );
});

test('auth actions export server actions', () => {
  const content = readFileSync(pathOf('lib/auth/actions.ts'), 'utf8');

  assert.ok(
    content.includes("'use server'") || content.includes('"use server"'),
    'auth actions must be server actions'
  );

  for (const actionName of ['signUp', 'signIn', 'signOut']) {
    assert.match(
      content,
      new RegExp(`export\\s+(async\\s+)?(function|const)\\s+${actionName}`),
      `auth actions must export ${actionName}`
    );
  }
});
