import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const expectFooterUsage = (file) => {
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);
  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(content, /LegalFooter/, `${file} should render LegalFooter`);
};

test('legal footer component renders links and disclaimer', () => {
  const file = 'components/legal/legal-footer.tsx';
  assert.ok(existsSync(pathOf(file)), `${file} must exist`);

  const content = readFileSync(pathOf(file), 'utf8');
  assert.match(
    content,
    /terms\.label/,
    'terms link label should be rendered'
  );
  assert.match(
    content,
    /privacy\.label/,
    'privacy link label should be rendered'
  );
  assert.match(
    content,
    /feedback\.label/,
    'feedback link label should be rendered'
  );
  assert.match(content, /投資助言/, 'disclaimer should mention investment advice');
  assert.match(content, /試算|前提条件/, 'disclaimer should mention assumptions');
  assert.match(content, /最終判断/, 'disclaimer should mention final decision');
});

test('major pages include legal footer', () => {
  expectFooterUsage('app/dashboard/page.tsx');
  expectFooterUsage('app/portfolio/page.tsx');
  expectFooterUsage('app/calendar/page.tsx');
  expectFooterUsage('app/settings/page.tsx');
  expectFooterUsage('app/simulations/dividend-goal/page.tsx');
  expectFooterUsage('app/dashboard/roadmap/page.tsx');
  expectFooterUsage('components/roadmap-history/roadmap-history-page.tsx');
});
