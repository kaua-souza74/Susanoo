import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const migration = read('../supabase/migrations/20261031140000_p0_phase3_project_work_items_release_candidate.sql');
const sqlSuite = read('../supabase/tests/p0_phase3_work_items_release.test.sql');
const timeline = read('../src/app/dashboard/timeline/page.tsx');
const kanban = read('../src/app/dashboard/kanban/[id]/page.tsx');
const adminTasks = read('../src/app/admin/tasks/page.tsx');
const adminTimeline = read('../src/app/admin/timeline/page.tsx');
const adminOverview = read('../src/app/admin/page.tsx');
const apiRoutes = [
  '../src/app/api/admin/tasks/route.ts',
  '../src/app/api/admin/tasks/[id]/route.ts',
  '../src/app/api/admin/tasks/summary/route.ts',
  '../src/app/api/admin/timeline-steps/route.ts',
  '../src/app/api/admin/timeline-steps/[id]/route.ts',
];

test('release migration remains fail-closed and grants users SELECT only', () => {
  assert.match(migration, /current_user <> 'postgres'/);
  assert.match(migration, /tasks columns drift/);
  assert.match(migration, /timeline_steps columns drift/);
  assert.match(migration, /tasks\.status constraint differs/);
  assert.match(migration, /projects SELECT RLS does not include client and assigned developer/);
  assert.match(migration, /service_role lacks required API privilege/);
  assert.match(migration, /postgres\/service_role ACL changed/);
  assert.match(migration, /GRANT SELECT ON TABLE public\.tasks, public\.timeline_steps TO authenticated/);
  assert.doesNotMatch(migration, /GRANT (INSERT|UPDATE|DELETE)[^;]*TO (anon|authenticated)/);
  assert.match(migration, /REVOKE ALL PRIVILEGES ON TABLE public\.tasks, public\.timeline_steps FROM PUBLIC, anon, authenticated/);
});

test('assigned developers can discover projects in Timeline and access work items by RLS-protected project id', () => {
  assert.match(timeline, /\.or\(`client_id\.eq\.\$\{session\.user\.id\},developer_id\.eq\.\$\{session\.user\.id\}`\)/);
  assert.match(timeline, /\.from\('tasks'\)[\s\S]*?\.eq\('project_id', projectId\)/);
  assert.match(timeline, /\.from\('timeline_steps'\)[\s\S]*?\.eq\('project_id', projectId\)/);
  assert.match(kanban, /\.from\('projects'\)\.select\('\*'\)\.eq\('id', projectId\)/);
  assert.match(kanban, /\.from\('tasks'\)[\s\S]*?\.eq\('project_id', projectId\)/);
  assert.match(kanban, /\.from\('timeline_steps'\)[\s\S]*?\.eq\('project_id', projectId\)/);
});

test('browser task and timeline subscriptions use INSERT and UPDATE only', () => {
  for (const [name, source] of [['timeline', timeline], ['kanban', kanban]]) {
    for (const table of ['tasks', 'timeline_steps']) {
      assert.match(source, new RegExp(`event: 'INSERT', schema: 'public', table: '${table}'`), `${name} ${table} INSERT listener missing`);
      assert.match(source, new RegExp(`event: 'UPDATE', schema: 'public', table: '${table}'`), `${name} ${table} UPDATE listener missing`);
      assert.doesNotMatch(source, new RegExp(`event: '\\*', schema: 'public', table: '${table}'`), `${name} wildcard ${table} listener`);
      assert.doesNotMatch(source, new RegExp(`event: 'DELETE', schema: 'public', table: '${table}'`), `${name} DELETE ${table} listener`);
    }
  }
});

test('admin pages route task/timeline writes through authenticated server APIs', () => {
  for (const [name, source] of [['admin tasks', adminTasks], ['admin timeline', adminTimeline]]) {
    assert.match(source, /adminApiFetch\(/, `${name} must use the server API`);
    assert.doesNotMatch(source, /\.from\(['"](tasks|timeline_steps)['"]\)/, `${name} must not write directly`);
  }
  assert.match(adminOverview, /adminApiFetch\("\/api\/admin\/tasks\/summary"\)/);
  for (const path of apiRoutes) {
    const source = read(path);
    assert.ok(source.includes('authenticateAdminRequest'), `${path} must authorize requests`);
    assert.ok(source.includes('createAdminChatClient'), `${path} must use server-side privileged client`);
    assert.ok(source.indexOf('authenticateAdminRequest') < source.indexOf('createAdminChatClient'), `${path} must authorize before constructing privileged client`);
  }
  assert.match(read('../src/lib/admin/chat-api.ts'), /import "server-only"/);
  assert.match(read('../src/lib/admin/authority.ts'), /legacy-allowlist/);
});

test('SQL security suite is target-guarded, rollback-only, and checks fixture absence', () => {
  assert.equal((sqlSuite.match(/^BEGIN;$/gm) ?? []).length, 1);
  assert.equal((sqlSuite.match(/^ROLLBACK;$/gm) ?? []).length, 1);
  assert.equal((sqlSuite.match(/^COMMIT;$/gm) ?? []).length, 0);
  assert.match(sqlSuite, /current_database\(\) = :'target_database'/);
  assert.match(sqlSuite, /work-items rollback left a synthetic fixture/);
  assert.match(sqlSuite, /client B task third-party isolation failed/);
  assert.match(sqlSuite, /developer assigned task read failed/);
});
