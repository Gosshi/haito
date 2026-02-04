import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pathOf = (rel) => join(root, rel);

const migrationsDir = 'supabase/migrations';

const normalizeSql = (sql) => {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const findRoadmapHistoryMigration = () => {
  const files = readdirSync(pathOf(migrationsDir));
  return files.find((file) => {
    return /^\d{14}_roadmap_histories\.sql$/.test(file);
  });
};

const readMigration = () => {
  const file = findRoadmapHistoryMigration();
  assert.ok(file, 'Missing migration file for roadmap_histories');
  const content = readFileSync(pathOf(join(migrationsDir, file)), 'utf8');
  return { file, content, normalized: normalizeSql(content) };
};

test('roadmap_histories migration exists', () => {
  assert.ok(existsSync(pathOf(migrationsDir)), 'Missing supabase/migrations');
  const file = findRoadmapHistoryMigration();
  assert.ok(file, 'Missing roadmap_histories migration');
});

test('roadmap_histories migration defines table and indexes', () => {
  const { normalized } = readMigration();

  assert.match(normalized, /create table roadmap_histories/);
  assert.match(
    normalized,
    /id uuid primary key default gen_random_uuid\(\)/
  );
  assert.match(
    normalized,
    /user_id uuid not null references auth\.users\(id\) on delete cascade/
  );
  assert.match(normalized, /input jsonb not null/);
  assert.match(normalized, /summary jsonb not null/);
  assert.match(normalized, /series jsonb not null/);
  assert.match(normalized, /created_at timestamp default now\(\)/);
  assert.match(normalized, /updated_at timestamp default now\(\)/);

  assert.match(
    normalized,
    /create index [a-z0-9_]+ on roadmap_histories\s*\(\s*user_id\s*\)/
  );
  assert.match(
    normalized,
    /create index [a-z0-9_]+ on roadmap_histories\s*\(\s*created_at\s*\)/
  );
});

test('roadmap_histories migration enables RLS and policies', () => {
  const { normalized } = readMigration();

  assert.match(
    normalized,
    /alter table roadmap_histories enable row level security/
  );
  assert.match(
    normalized,
    /create policy[^;]+on roadmap_histories[^;]+auth\.uid\(\)\s*=\s*user_id/
  );
});

test('roadmap_histories migration adds updated_at trigger', () => {
  const { normalized } = readMigration();

  assert.match(
    normalized,
    /create trigger [a-z0-9_]+[^;]+ on roadmap_histories[^;]+execute function public\.set_updated_at\(\)/
  );
});
