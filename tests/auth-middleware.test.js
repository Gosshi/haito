import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);
const middlewareFile = 'middleware.ts';

const loadMiddleware = () => {
  const fullPath = pathOf(middlewareFile);
  assert.ok(existsSync(fullPath), `Missing required file: ${middlewareFile}`);
  return readFileSync(fullPath, 'utf8');
};

test('middleware file exists', () => {
  assert.ok(
    existsSync(pathOf(middlewareFile)),
    `Missing required file: ${middlewareFile}`
  );
});

test('middleware uses Supabase SSR middleware client', () => {
  const content = loadMiddleware();

  assert.ok(
    content.includes('createMiddlewareClient'),
    'middleware should use createMiddlewareClient'
  );
  assert.ok(
    content.includes('supabase.auth.getUser'),
    'middleware should check authenticated user via supabase.auth.getUser'
  );
});

test('middleware redirects unauthenticated users away from /dashboard', () => {
  const content = loadMiddleware();

  assert.ok(
    content.includes("'/dashboard'"),
    'middleware should reference /dashboard route'
  );
  assert.ok(
    content.includes("'/login'"),
    'middleware should reference /login redirect'
  );
  assert.ok(
    content.includes('NextResponse.redirect'),
    'middleware should use NextResponse.redirect'
  );
});

test('middleware redirects authenticated users away from auth pages', () => {
  const content = loadMiddleware();

  assert.ok(
    content.includes("'/login'"),
    'middleware should include /login in auth route list'
  );
  assert.ok(
    content.includes("'/signup'"),
    'middleware should include /signup in auth route list'
  );
  assert.ok(
    content.includes("'/dashboard'"),
    'middleware should redirect authenticated users to /dashboard'
  );
});

test('middleware config matches auth and dashboard routes', () => {
  const content = loadMiddleware();

  assert.ok(
    content.includes('matcher'),
    'middleware should export a matcher config'
  );
  assert.ok(
    content.includes('/dashboard'),
    'middleware matcher should include /dashboard'
  );
  assert.ok(
    content.includes('/login'),
    'middleware matcher should include /login'
  );
  assert.ok(
    content.includes('/signup'),
    'middleware matcher should include /signup'
  );
});
