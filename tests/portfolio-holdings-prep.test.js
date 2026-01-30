import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('holdings shared types exist', () => {
  const file = 'lib/holdings/types.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /export\s+type\s+AccountType/,
    'AccountType type must be exported'
  );
  assert.match(
    content,
    /export\s+type\s+Holding/,
    'Holding type must be exported'
  );
});

test('shadcn table component exists', () => {
  const file = 'components/ui/table.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /export\s+\{[^}]*Table/, 'Table must be exported');
});

test('shadcn select component exists', () => {
  const file = 'components/ui/select.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /export\s+\{[^}]*Select/, 'Select must be exported');
});

test('shadcn card component exists', () => {
  const file = 'components/ui/card.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /export\s+\{[^}]*Card/, 'Card must be exported');
});

test('holdings edit validation helper exists', () => {
  const file = 'lib/holdings/validation.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /export\s+const\s+parseHoldingEditForm|export\s+function\s+parseHoldingEditForm/,
    'parseHoldingEditForm must be exported'
  );
  assert.match(
    content,
    /保有株数は必須です。/,
    'shares required message should be present'
  );
  assert.match(
    content,
    /保有株数は正の整数で入力してください。/,
    'shares validation message should be present'
  );
  assert.match(
    content,
    /取得単価は正の数値で入力してください。/,
    'acquisition price validation message should be present'
  );
  assert.match(
    content,
    /口座種別は必須です。/,
    'account type required message should be present'
  );
  assert.match(
    content,
    /口座種別が不正です。/,
    'account type validation message should be present'
  );
});

test('holdings edit/delete types exist', () => {
  const file = 'lib/holdings/types.ts';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /export\s+type\s+HoldingUpdate/,
    'HoldingUpdate type must be exported'
  );
  assert.match(
    content,
    /export\s+type\s+UpdateHoldingInput/,
    'UpdateHoldingInput type must be exported'
  );
  assert.match(
    content,
    /export\s+type\s+DeleteHoldingInput/,
    'DeleteHoldingInput type must be exported'
  );
  assert.match(
    content,
    /export\s+type\s+HoldingEditResult/,
    'HoldingEditResult type must be exported'
  );
});
