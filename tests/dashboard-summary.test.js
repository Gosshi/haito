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

test('dashboard summary card component exists', () => {
  const content = expectFile('components/dashboard/summary-card.tsx');
  assert.match(content, /年間配当サマリー/, 'summary card title should exist');
  assert.match(
    content,
    /年間配当（税引前）/,
    'summary card should show pre-tax label'
  );
  assert.match(
    content,
    /年間配当（税引後）/,
    'summary card should show after-tax label'
  );
  assert.match(content, /配当利回り/, 'summary card should show yield label');
  assert.match(content, /総投資額/, 'summary card should show investment label');
});

test('dashboard account breakdown component exists', () => {
  const content = expectFile('components/dashboard/account-breakdown.tsx');
  assert.match(
    content,
    /口座種別ごとの内訳/,
    'account breakdown title should exist'
  );
  assert.match(content, /特定口座/, 'specific account label should exist');
  assert.match(content, /NISA成長投資枠/, 'nisa growth label should exist');
  assert.match(
    content,
    /NISAつみたて投資枠/,
    'nisa tsumitate label should exist'
  );
  assert.match(content, /税引前/, 'pre-tax label should exist');
  assert.match(content, /税引後/, 'after-tax label should exist');
});

test('dashboard page wires summary, breakdown, and navigation links', () => {
  const content = expectFile('app/dashboard/page.tsx');
  assert.match(content, /SummaryCard/, 'dashboard should render SummaryCard');
  assert.match(
    content,
    /AccountBreakdown/,
    'dashboard should render AccountBreakdown'
  );
  assert.match(content, /\/portfolio/, 'dashboard should link to /portfolio');
  assert.match(content, /\/calendar/, 'dashboard should link to /calendar');
  assert.match(
    content,
    /銘柄を登録してください/,
    'dashboard should show empty state message'
  );
  assert.match(
    content,
    /データ取得中/,
    'dashboard should mention data fetching state'
  );
});

test('dividend calculation logic includes tax rate, truncation, and exclusion', () => {
  const content = expectFile('lib/calculations/dividend.ts');
  assert.match(
    content,
    /calculateDividendSummary/,
    'calculateDividendSummary should be exported'
  );
  assert.match(content, /SPECIFIC_TAX_RATE/, 'tax rate constant should exist');
  assert.match(content, /Math\.floor/, 'after-tax truncation should exist');
  assert.match(
    content,
    /acquisition_price/,
    'acquisition price exclusion should be referenced'
  );
});
