import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const expectLayout = (content) => {
  assert.match(
    content,
    /mx-auto\s+max-w-5xl/,
    'page should use max width layout'
  );
  assert.match(content, /space-y-6/, 'page should use vertical spacing');
  assert.match(content, /p-6/, 'page should include padding');
};

test('terms page renders heading and content', () => {
  const file = 'app/terms/page.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /利用規約/, 'terms heading should be present');
  assert.match(content, /text-sm/, 'terms page should include body text');
  expectLayout(content);
});

test('privacy page renders heading and content', () => {
  const file = 'app/privacy/page.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /プライバシーポリシー/,
    'privacy heading should be present'
  );
  assert.match(content, /text-sm/, 'privacy page should include body text');
  expectLayout(content);
});
