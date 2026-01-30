import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const migrationsDir = 'supabase/migrations';
const seedFile = 'supabase/seed.sql';
const migrationSuffixes = {
  createTables: 'create_tables.sql',
  setupRls: 'setup_rls.sql',
};

const normalizeSql = (sql) => {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const findMigration = (suffix) => {
  const files = readdirSync(pathOf(migrationsDir));
  return files.find((file) => {
    return /^\d{14}_.+\.sql$/.test(file) && file.endsWith(`_${suffix}`);
  });
};

const readMigration = (suffix) => {
  const file = findMigration(suffix);
  assert.ok(file, `Missing migration file with suffix _${suffix}`);
  const content = readFileSync(pathOf(join(migrationsDir, file)), 'utf8');
  return { file, content, normalized: normalizeSql(content) };
};

test('supabase migrations directory and seed file exist', () => {
  assert.ok(existsSync(pathOf('supabase')), 'Missing supabase directory');
  assert.ok(
    existsSync(pathOf(migrationsDir)),
    'Missing supabase/migrations directory'
  );
  assert.ok(existsSync(pathOf(seedFile)), 'Missing supabase/seed.sql file');
});

test('migrations for create_tables and setup_rls exist and are non-empty', () => {
  for (const suffix of Object.values(migrationSuffixes)) {
    const { file, content } = readMigration(suffix);
    assert.ok(
      content.trim().length > 0,
      `${file} should include migration SQL`
    );
  }
});

test('create_tables migration defines tables, constraints, and index', () => {
  const { normalized } = readMigration(migrationSuffixes.createTables);

  assert.match(normalized, /create table holdings/);
  assert.match(
    normalized,
    /id uuid primary key default gen_random_uuid\(\)/
  );
  assert.match(
    normalized,
    /user_id uuid references auth\.users\(id\) on delete cascade/
  );
  assert.match(normalized, /stock_code varchar\(10\) not null/);
  assert.match(normalized, /stock_name varchar\(100\)/);
  assert.match(normalized, /shares integer not null/);
  assert.match(normalized, /acquisition_price decimal\(10,2\)/);
  assert.match(normalized, /account_type varchar\(20\) not null/);
  assert.match(normalized, /created_at timestamp default now\(\)/);
  assert.match(normalized, /updated_at timestamp default now\(\)/);
  assert.match(
    normalized,
    /unique\s*\(\s*user_id\s*,\s*stock_code\s*,\s*account_type\s*\)/
  );

  assert.match(normalized, /create table dividend_data/);
  assert.match(
    normalized,
    /stock_code varchar\(10\) not null unique/
  );
  assert.match(normalized, /stock_name varchar\(100\)/);
  assert.match(normalized, /annual_dividend decimal\(10,2\)/);
  assert.match(normalized, /dividend_yield decimal\(5,2\)/);
  assert.match(normalized, /ex_dividend_months integer\[\]/);
  assert.match(normalized, /payment_months integer\[\]/);
  assert.match(normalized, /last_updated timestamp default now\(\)/);

  assert.match(normalized, /create table user_settings/);
  assert.match(
    normalized,
    /user_id uuid primary key references auth\.users\(id\) on delete cascade/
  );
  assert.match(normalized, /annual_dividend_goal decimal\(12,2\)/);
  assert.match(
    normalized,
    /display_currency varchar\(3\) default 'jpy'/
  );
  assert.match(normalized, /created_at timestamp default now\(\)/);
  assert.match(normalized, /updated_at timestamp default now\(\)/);

  assert.match(
    normalized,
    /create index [a-z0-9_]+ on holdings\s*\(\s*user_id\s*\)/
  );
});

test('create_tables migration adds updated_at triggers', () => {
  const { normalized } = readMigration(migrationSuffixes.createTables);

  assert.match(
    normalized,
    /create or replace function public\.set_updated_at\(\)/
  );
  assert.match(normalized, /new\.updated_at = now\(\)/);
  assert.match(
    normalized,
    /create trigger [a-z0-9_]+ on holdings[^;]+execute function public\.set_updated_at\(\)/
  );
  assert.match(
    normalized,
    /create trigger [a-z0-9_]+ on user_settings[^;]+execute function public\.set_updated_at\(\)/
  );
});

test('setup_rls migration enables RLS and policies', () => {
  const { normalized } = readMigration(migrationSuffixes.setupRls);

  assert.match(normalized, /alter table holdings enable row level security/);
  assert.match(
    normalized,
    /alter table dividend_data enable row level security/
  );
  assert.match(
    normalized,
    /alter table user_settings enable row level security/
  );

  assert.match(
    normalized,
    /create policy[^;]+on holdings[^;]+auth\.uid\(\)\s*=\s*user_id/
  );
  assert.match(
    normalized,
    /create policy[^;]+on user_settings[^;]+auth\.uid\(\)\s*=\s*user_id/
  );
  assert.match(
    normalized,
    /create policy[^;]+on dividend_data[^;]+for select[^;]+using\s*\(\s*true\s*\)/
  );
});
