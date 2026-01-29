import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const supabaseFiles = [
  'lib/supabase/server.ts',
  'lib/supabase/client.ts',
];

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

test('supabase client files exist', () => {
  for (const file of supabaseFiles) {
    assert.ok(
      existsSync(pathOf(file)),
      `Missing required file: ${file}`
    );
  }
});

test('supabase client files export createClient and use env vars', () => {
  for (const file of supabaseFiles) {
    const content = readFileSync(pathOf(file), 'utf8');

    assert.ok(
      /export\s+(const|function)\s+createClient/.test(content),
      `${file} must export createClient`
    );

    assert.ok(
      content.includes('@supabase/supabase-js'),
      `${file} must import @supabase/supabase-js`
    );

    for (const envVar of requiredEnvVars) {
      assert.ok(
        content.includes(envVar),
        `${file} must reference ${envVar}`
      );
    }
  }
});

test('.env.local.example lists Supabase env vars with comments', () => {
  const envPath = pathOf('.env.local.example');
  assert.ok(existsSync(envPath), '.env.local.example must exist');

  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/).map((line) => line.trim());

  const previousNonEmptyLine = (index) => {
    for (let i = index - 1; i >= 0; i -= 1) {
      if (lines[i] !== '') return lines[i];
    }
    return '';
  };

  for (const envVar of requiredEnvVars) {
    const index = lines.findIndex((line) => line.startsWith(envVar));
    assert.ok(index >= 0, `.env.local.example must include ${envVar}`);

    const comment = previousNonEmptyLine(index);
    assert.ok(
      comment.startsWith('#'),
      `Add a comment line before ${envVar}`
    );
  }
});
