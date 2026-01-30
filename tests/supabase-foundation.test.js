import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const supabaseFiles = [
  'lib/supabase/server.ts',
  'lib/supabase/client.ts',
  'lib/supabase/middleware.ts',
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

test('browser supabase client uses supabase-js and env vars', () => {
  const file = 'lib/supabase/client.ts';
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
});

test('server supabase client uses @supabase/ssr and cookies', () => {
  const file = 'lib/supabase/server.ts';
  const content = readFileSync(pathOf(file), 'utf8');

  assert.ok(
    /export\s+(const|function)\s+createClient/.test(content),
    `${file} must export createClient`
  );

  assert.ok(
    content.includes('@supabase/ssr'),
    `${file} must import @supabase/ssr`
  );

  assert.ok(
    content.includes('next/headers'),
    `${file} must import next/headers for cookies`
  );

  for (const envVar of requiredEnvVars) {
    assert.ok(
      content.includes(envVar),
      `${file} must reference ${envVar}`
    );
  }
});

test('middleware supabase client uses @supabase/ssr and NextResponse', () => {
  const file = 'lib/supabase/middleware.ts';
  const content = readFileSync(pathOf(file), 'utf8');

  assert.ok(
    /export\s+(const|function)\s+createMiddlewareClient/.test(content),
    `${file} must export createMiddlewareClient`
  );

  assert.ok(
    content.includes('@supabase/ssr'),
    `${file} must import @supabase/ssr`
  );

  assert.ok(
    content.includes('next/server'),
    `${file} must import next/server`
  );
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
