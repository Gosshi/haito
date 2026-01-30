import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('edit holding dialog renders validation and form errors', () => {
  const file = 'components/portfolio/edit-holding-dialog.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /fieldErrors\.shares/, 'shares error should be rendered');
  assert.match(
    content,
    /fieldErrors\.acquisition_price/,
    'acquisition price error should be rendered'
  );
  assert.match(
    content,
    /fieldErrors\.account_type/,
    'account type error should be rendered'
  );
  assert.match(content, /formError/, 'form error should be rendered');
});

test('toast store exists for holdings errors', () => {
  const file = 'stores/toast-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /useToastStore/, 'toast store hook should be exported');
  assert.match(content, /pushToast|addToast|enqueueToast/, 'toast push helper should exist');
});

test('toaster component exists and uses toast store', () => {
  const file = 'components/ui/toaster.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /useToastStore/, 'toaster should use toast store');
  assert.match(content, /toasts/, 'toaster should render toast list');
});

test('portfolio page renders toaster', () => {
  const file = 'app/portfolio/page.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /Toaster/, 'portfolio page should include toaster');
});

test('holdings store triggers auth error toast with rollback', () => {
  const file = 'stores/holdings-store.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /pushToast|addToast|enqueueToast/, 'store should use toast helper');
  assert.match(
    content,
    /unauthorized|permission/i,
    'store should detect authorization errors'
  );
  assert.match(
    content,
    /set\(\{\s*holdings:\s*previousHoldings/,
    'store should rollback on auth errors'
  );
});
