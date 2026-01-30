import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);
const actionsFile = 'lib/auth/actions.ts';

const content = readFileSync(pathOf(actionsFile), 'utf8');

test('auth actions use server supabase client for cookie-based sessions', () => {
  assert.ok(
    content.includes('supabase/server'),
    'auth actions should import the server supabase client'
  );
  assert.ok(
    content.includes('createClient'),
    'auth actions should create a supabase server client'
  );
});

test('auth actions call supabase auth methods', () => {
  assert.ok(
    content.includes('supabase.auth.signUp'),
    'signUp should call supabase.auth.signUp'
  );
  assert.ok(
    content.includes('supabase.auth.signInWithPassword'),
    'signIn should call supabase.auth.signInWithPassword'
  );
  assert.ok(
    content.includes('supabase.auth.signOut'),
    'signOut should call supabase.auth.signOut'
  );
});

test('auth actions expose redirect targets', () => {
  assert.ok(
    content.includes("'/dashboard'"),
    'auth actions should reference /dashboard redirect'
  );
  assert.ok(
    content.includes("'/login'"),
    'auth actions should reference /login redirect'
  );
});

test('signup validates password confirmation on server', () => {
  assert.ok(
    content.includes('passwordConfirm'),
    'signUp should validate password confirmation'
  );
});
