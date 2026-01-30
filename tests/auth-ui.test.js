import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const requiredFiles = [
  'app/login/page.tsx',
  'app/signup/page.tsx',
  'app/dashboard/page.tsx',
  'components/auth/login-form.tsx',
  'components/auth/signup-form.tsx',
  'components/auth/logout-button.tsx',
  'components/ui/input.tsx',
  'components/ui/label.tsx',
];

test('auth UI files exist', () => {
  for (const file of requiredFiles) {
    assert.ok(existsSync(pathOf(file)), `Missing required file: ${file}`);
  }
});

test('auth pages render expected components', () => {
  const loginPage = readFileSync(pathOf('app/login/page.tsx'), 'utf8');
  const signupPage = readFileSync(pathOf('app/signup/page.tsx'), 'utf8');
  const dashboardPage = readFileSync(
    pathOf('app/dashboard/page.tsx'),
    'utf8'
  );

  assert.match(loginPage, /LoginForm/, 'Login page should render LoginForm');
  assert.match(signupPage, /SignupForm/, 'Signup page should render SignupForm');
  assert.match(
    dashboardPage,
    /LogoutButton/,
    'Dashboard page should render LogoutButton'
  );
});

test('login/signup forms use shadcn UI components', () => {
  const loginForm = readFileSync(
    pathOf('components/auth/login-form.tsx'),
    'utf8'
  );
  const signupForm = readFileSync(
    pathOf('components/auth/signup-form.tsx'),
    'utf8'
  );

  for (const content of [loginForm, signupForm]) {
    assert.ok(
      content.includes('Input') && content.includes('Label'),
      'Forms should use Input and Label components'
    );
    assert.ok(
      content.includes('Button'),
      'Forms should use Button component'
    );
    assert.ok(
      content.includes('use client') || content.includes('"use client"'),
      'Forms should be client components'
    );
  }
});

test('auth UI components wire server actions', () => {
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

  assert.match(loginForm, /signIn/, 'Login form should call signIn');
  assert.match(signupForm, /signUp/, 'Signup form should call signUp');
  assert.match(logoutButton, /signOut/, 'Logout button should call signOut');
});
