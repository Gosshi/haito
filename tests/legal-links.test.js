import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('legal links module defines defaults and env overrides', () => {
  const file = 'lib/legal/links.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /['"]\/terms['"]/, 'default terms path should exist');
  assert.match(
    content,
    /['"]\/privacy['"]/,
    'default privacy path should exist'
  );
  assert.match(
    content,
    /NEXT_PUBLIC_TERMS_URL/,
    'terms env override should be supported'
  );
  assert.match(
    content,
    /NEXT_PUBLIC_PRIVACY_URL/,
    'privacy env override should be supported'
  );
  assert.match(
    content,
    /NEXT_PUBLIC_FEEDBACK_URL/,
    'feedback env override should be supported'
  );
  assert.match(
    content,
    /package\.json|bugs\.url/,
    'default feedback url should come from package.json'
  );
  assert.match(
    content,
    /isExternalUrl/,
    'external url detection should be present'
  );
  assert.match(content, /external/, 'external flag should be included');
});

test('legal links module exports expected types', () => {
  const file = 'lib/legal/links.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /type\s+LegalLink/, 'LegalLink type should be defined');
  assert.match(content, /type\s+LegalLinks/, 'LegalLinks type should be defined');
  assert.match(
    content,
    /interface\s+LegalLinksService/,
    'LegalLinksService interface should be defined'
  );
});
