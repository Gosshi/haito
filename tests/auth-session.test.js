import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const serverClient = readFileSync(pathOf('lib/supabase/server.ts'), 'utf8');
const middlewareClient = readFileSync(
  pathOf('lib/supabase/middleware.ts'),
  'utf8'
);
const middleware = readFileSync(pathOf('middleware.ts'), 'utf8');

test('server supabase client wires cookie helpers for session persistence', () => {
  assert.ok(
    serverClient.includes('cookies()'),
    'Server client should read cookies from next/headers'
  );
  assert.ok(
    serverClient.includes('cookies:') &&
      serverClient.includes('get:') &&
      serverClient.includes('set:') &&
      serverClient.includes('remove:'),
    'Server client should provide cookie get/set/remove helpers'
  );
});

test('middleware supabase client updates response cookies', () => {
  assert.ok(
    middlewareClient.includes('response.cookies.set'),
    'Middleware client should write cookies to the response'
  );
  assert.ok(
    middlewareClient.includes('request.cookies.get'),
    'Middleware client should read cookies from the request'
  );
});

test('middleware preserves cookies on redirects', () => {
  assert.ok(
    middleware.includes('response.cookies.getAll'),
    'Middleware should copy cookies to redirect responses'
  );
  assert.ok(
    middleware.includes('NextResponse.redirect'),
    'Middleware should issue redirects via NextResponse.redirect'
  );
});

test('middleware defines auth and protected routes for redirects', () => {
  assert.ok(
    middleware.includes("['/login', '/signup']"),
    'Middleware should list login and signup as auth routes'
  );
  assert.ok(
    middleware.includes("['/dashboard']"),
    'Middleware should list dashboard as protected route'
  );
  assert.ok(
    middleware.includes('isProtectedRoute') &&
      middleware.includes('isAuthRoute'),
    'Middleware should check auth/protected routes'
  );
});
