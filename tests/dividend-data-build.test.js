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

test('next config externalizes yahoo-finance2 for server', () => {
  const content = expectFile('next.config.js');
  assert.match(
    content,
    /serverExternalPackages\s*:\s*\[[^\]]*yahoo-finance2[^\]]*\]/,
    'next.config.js should list yahoo-finance2 in serverExternalPackages'
  );
});
