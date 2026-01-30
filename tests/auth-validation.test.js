import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const loginForm = readFileSync(
  pathOf('components/auth/login-form.tsx'),
  'utf8'
);
const signupForm = readFileSync(
  pathOf('components/auth/signup-form.tsx'),
  'utf8'
);
const logoutButton = readFileSync(
  pathOf('components/auth/logout-button.tsx'),
  'utf8'
);
const actions = readFileSync(pathOf('lib/auth/actions.ts'), 'utf8');

test('login form validates input and renders error messages', () => {
  assert.ok(
    loginForm.includes('validateLoginInput'),
    'Login form should validate input'
  );
  assert.ok(
    loginForm.includes('Email is required'),
    'Login form should show required email error'
  );
  assert.ok(
    loginForm.includes('Email format is invalid'),
    'Login form should show invalid email error'
  );
  assert.ok(
    loginForm.includes('Password is required'),
    'Login form should show required password error'
  );
  assert.ok(
    loginForm.includes('Password must be at least'),
    'Login form should show minimum password length error'
  );
  assert.ok(
    loginForm.includes('formError'),
    'Login form should render form-level errors'
  );
});

test('signup form validates confirmation and renders error messages', () => {
  assert.ok(
    signupForm.includes('validateSignupInput'),
    'Signup form should validate input'
  );
  assert.ok(
    signupForm.includes('Password confirmation is required'),
    'Signup form should show required confirmation error'
  );
  assert.ok(
    signupForm.includes('Passwords do not match'),
    'Signup form should show mismatch error'
  );
  assert.ok(
    signupForm.includes('formError'),
    'Signup form should render form-level errors'
  );
});

test('logout button reports server errors', () => {
  assert.ok(
    logoutButton.includes('formError') || logoutButton.includes('setError'),
    'Logout button should surface server errors'
  );
  assert.ok(
    logoutButton.includes('Failed to log out'),
    'Logout button should show a fallback error message'
  );
});

test('auth actions surface validation and auth errors', () => {
  assert.ok(
    actions.includes('buildFieldErrors'),
    'Auth actions should validate input'
  );
  assert.ok(
    actions.includes('Password confirmation is required'),
    'Auth actions should validate password confirmation'
  );
  assert.ok(
    actions.includes('formError'),
    'Auth actions should return form-level errors'
  );
});
