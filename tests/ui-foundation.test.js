import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

test('tailwind config files exist', () => {
  assert.ok(
    existsSync(pathOf('tailwind.config.ts')),
    'tailwind.config.ts must exist'
  );
  assert.ok(
    existsSync(pathOf('postcss.config.js')),
    'postcss.config.js must exist'
  );
});

test('globals.css includes tailwind directives', () => {
  const globalsPath = pathOf('app/globals.css');
  assert.ok(existsSync(globalsPath), 'app/globals.css must exist');

  const content = readFileSync(globalsPath, 'utf8');
  assert.ok(
    content.includes('@tailwind base'),
    'globals.css should include @tailwind base'
  );
  assert.ok(
    content.includes('@tailwind utilities'),
    'globals.css should include @tailwind utilities'
  );
});

test('layout imports global styles', () => {
  const layoutPath = pathOf('app/layout.tsx');
  assert.ok(existsSync(layoutPath), 'app/layout.tsx must exist');

  const content = readFileSync(layoutPath, 'utf8');
  assert.ok(
    content.includes("import './globals.css'") ||
      content.includes('import "./globals.css"'),
    'app/layout.tsx should import globals.css'
  );
});

test('shadcn button component exists', () => {
  const buttonPath = pathOf('components/ui/button.tsx');
  assert.ok(existsSync(buttonPath), 'components/ui/button.tsx must exist');

  const content = readFileSync(buttonPath, 'utf8');
  assert.ok(
    content.includes('Button'),
    'components/ui/button.tsx should define Button'
  );
});
