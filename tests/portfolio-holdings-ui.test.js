import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('portfolio page renders holdings table component', () => {
  const file = 'app/portfolio/page.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /HoldingsTable/, 'HoldingsTable must be referenced');
});

test('portfolio add page renders add holding form component', () => {
  const file = 'app/portfolio/add/page.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /AddHoldingForm/, 'AddHoldingForm must be referenced');
});

test('holdings table component uses shadcn table elements', () => {
  const file = 'components/portfolio/holdings-table.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /TableHeader/, 'TableHeader should be used');
  assert.match(content, /TableBody/, 'TableBody should be used');
});

test('add holding form includes account type options', () => {
  const file = 'components/portfolio/add-holding-form.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /nisa_legacy/, 'nisa_legacy option must be present');
  assert.match(content, /account_type|accountType/, 'account type input must be present');
});

test('holdings table component connects to holdings store', () => {
  const file = 'components/portfolio/holdings-table.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /useHoldingsStore/, 'holdings table should use holdings store');
});

test('add holding form component connects to holdings store', () => {
  const file = 'components/portfolio/add-holding-form.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /useHoldingsStore/, 'add holding form should use holdings store');
});

test('holdings table shows legacy nisa label', () => {
  const file = 'components/portfolio/holdings-table.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /旧NISA/, 'legacy NISA label should be present');
});

test('edit holding dialog component exists', () => {
  const file = 'components/portfolio/edit-holding-dialog.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /Dialog/, 'edit dialog should use Dialog');
  assert.match(
    content,
    /parseHoldingEditForm/,
    'edit dialog should use validation helper'
  );
  assert.match(
    content,
    /updateHolding/,
    'edit dialog should call updateHolding'
  );
  assert.match(content, /銘柄コード/, 'edit dialog should display stock code');
});

test('delete holding dialog component exists', () => {
  const file = 'components/portfolio/delete-holding-dialog.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /AlertDialog/, 'delete dialog should use AlertDialog');
  assert.match(
    content,
    /deleteHolding/,
    'delete dialog should call deleteHolding'
  );
  assert.match(
    content,
    /削除しますか/,
    'delete dialog should ask confirmation'
  );
});

test('holdings table includes edit/delete actions', () => {
  const file = 'components/portfolio/holdings-table.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /EditHoldingDialog/,
    'holdings table should render edit dialog'
  );
  assert.match(
    content,
    /DeleteHoldingDialog/,
    'holdings table should render delete dialog'
  );
});
