-- Rollback-only adversarial suite for the tasks/timeline release candidate.
-- Run only through run-p0-phase3-work-items-lab.ps1 against its new target.
\set ON_ERROR_STOP on
SELECT current_database() = :'target_database'
   AND current_database() ~ '^commerce_test_workitems_[a-z0-9_]{8,24}$'
   AND current_user = 'postgres'
   AND current_setting('application_name',true) = 'p0-workitems-rls-test'
   AND inet_server_addr() IS NOT DISTINCT FROM '127.0.0.1'::inet
   AND inet_server_port() = 5432
   AND current_setting('server_version_num')::integer BETWEEN 170000 AND 179999 AS target_ok \gset
\if :target_ok
\else
  \echo 'HOLD: work-items SQL suite target identity mismatch.'
  \quit 3
\endif

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SET LOCAL application_name='p0-workitems-rls-test';

DO $preflight$
BEGIN
  IF current_user IS DISTINCT FROM 'postgres'
     OR current_setting('application_name',true) IS DISTINCT FROM 'p0-workitems-rls-test'
     OR NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid='public.tasks'::regclass)
     OR NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid='public.timeline_steps'::regclass)
     OR (SELECT array_agg(polname::text ORDER BY polname) FROM pg_policy WHERE polrelid='public.tasks'::regclass)
        IS DISTINCT FROM ARRAY['p0p3_tasks_read_project_member']::text[]
     OR (SELECT array_agg(polname::text ORDER BY polname) FROM pg_policy WHERE polrelid='public.timeline_steps'::regclass)
        IS DISTINCT FROM ARRAY['p0p3_timeline_read_project_member']::text[] THEN
    RAISE EXCEPTION 'work-items RLS post-migration state differs';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN
      ('d1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000004')
      OR email IN ('p0-workitems-a@example.invalid','p0-workitems-b@example.invalid','p0-workitems-dev@example.invalid'))
     OR EXISTS (SELECT 1 FROM public.projects WHERE id IN
      ('d2000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000003'))
     OR EXISTS (SELECT 1 FROM public.tasks WHERE id IN
      ('d3000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000002','d3000000-0000-4000-8000-000000000003','d3000000-0000-4000-8000-000000000004'))
     OR EXISTS (SELECT 1 FROM public.timeline_steps WHERE id IN
      ('d4000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000004')) THEN
    RAISE EXCEPTION 'synthetic fixture collision; refusing reuse';
  END IF;
END
$preflight$;

INSERT INTO auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) VALUES
 ('d1000000-0000-4000-8000-000000000001','authenticated','authenticated','p0-workitems-a@example.invalid',now(),'{}','{"name":"Synthetic work-items A"}',now(),now()),
 ('d1000000-0000-4000-8000-000000000002','authenticated','authenticated','p0-workitems-b@example.invalid',now(),'{}','{"name":"Synthetic work-items B"}',now(),now()),
 ('d1000000-0000-4000-8000-000000000004','authenticated','authenticated','p0-workitems-dev@example.invalid',now(),'{}','{"name":"Synthetic work-items developer"}',now(),now());
UPDATE public.profiles SET role='developer' WHERE id='d1000000-0000-4000-8000-000000000004';
DO $profile_trigger$
BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE id IN
      ('d1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002') AND role='client') <> 2
     OR (SELECT count(*) FROM public.profiles WHERE id='d1000000-0000-4000-8000-000000000004' AND role='developer') <> 1 THEN
    RAISE EXCEPTION 'auth profile trigger or synthetic roles differ';
  END IF;
END
$profile_trigger$;

INSERT INTO public.projects(id,name,client_id,developer_id,show_in_gallery) VALUES
 ('d2000000-0000-4000-8000-000000000001','Synthetic work project A','d1000000-0000-4000-8000-000000000001',NULL,false),
 ('d2000000-0000-4000-8000-000000000002','Synthetic work project B','d1000000-0000-4000-8000-000000000002',NULL,false),
 ('d2000000-0000-4000-8000-000000000003','Synthetic work project A assigned developer','d1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000004',false);
INSERT INTO public.tasks(id,project_id,title,status) VALUES
 ('d3000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000001','Task A','todo'),
 ('d3000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000002','Task B','todo'),
 ('d3000000-0000-4000-8000-000000000003','d2000000-0000-4000-8000-000000000003','Task A assigned developer','todo');
INSERT INTO public.timeline_steps(id,project_id,title,status,order_index) VALUES
 ('d4000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000001','Timeline A','upcoming',1),
 ('d4000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000002','Timeline B','upcoming',1),
 ('d4000000-0000-4000-8000-000000000003','d2000000-0000-4000-8000-000000000003','Timeline A assigned developer','upcoming',2);

-- anon has neither table ACL nor row access.
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $anon$
DECLARE v_state text; v_denied boolean;
BEGIN
  v_denied:=false;
  BEGIN PERFORM id FROM public.tasks; EXCEPTION WHEN SQLSTATE '42501' THEN v_denied:=true; GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE; END;
  IF NOT v_denied OR v_state IS DISTINCT FROM '42501' THEN RAISE EXCEPTION 'anon tasks SELECT was not denied'; END IF;
  v_denied:=false;
  BEGIN PERFORM id FROM public.timeline_steps; EXCEPTION WHEN SQLSTATE '42501' THEN v_denied:=true; GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE; END;
  IF NOT v_denied OR v_state IS DISTINCT FROM '42501' THEN RAISE EXCEPTION 'anon timeline SELECT was not denied'; END IF;
END
$anon$;
RESET ROLE;

-- Client A sees its own and assigned project rows, never B's; all direct DML is denied.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
DO $client_a$
DECLARE v_state text; v_denied boolean;
BEGIN
  IF (SELECT count(*) FROM public.tasks)<>2 OR EXISTS (SELECT 1 FROM public.tasks WHERE project_id='d2000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'client A task isolation failed'; END IF;
  IF (SELECT count(*) FROM public.timeline_steps)<>2 OR EXISTS (SELECT 1 FROM public.timeline_steps WHERE project_id='d2000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'client A timeline isolation failed'; END IF;
  v_denied:=false; BEGIN INSERT INTO public.tasks(project_id,title) VALUES('d2000000-0000-4000-8000-000000000001','forbidden'); EXCEPTION WHEN SQLSTATE '42501' THEN v_denied:=true; GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE; END;
  IF NOT v_denied OR v_state IS DISTINCT FROM '42501' THEN RAISE EXCEPTION 'client task INSERT was not denied'; END IF;
  v_denied:=false; BEGIN UPDATE public.tasks SET status='done' WHERE id='d3000000-0000-4000-8000-000000000001'; EXCEPTION WHEN SQLSTATE '42501' THEN v_denied:=true; GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE; END;
  IF NOT v_denied OR v_state IS DISTINCT FROM '42501' THEN RAISE EXCEPTION 'client task UPDATE was not denied'; END IF;
  v_denied:=false; BEGIN DELETE FROM public.timeline_steps WHERE id='d4000000-0000-4000-8000-000000000001'; EXCEPTION WHEN SQLSTATE '42501' THEN v_denied:=true; GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE; END;
  IF NOT v_denied OR v_state IS DISTINCT FROM '42501' THEN RAISE EXCEPTION 'client timeline DELETE was not denied'; END IF;
END
$client_a$;
RESET ROLE;

-- Client B is a third party to A and sees only B's project.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"d1000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
DO $client_b$
BEGIN
  IF (SELECT count(*) FROM public.tasks)<>1 OR NOT EXISTS (SELECT 1 FROM public.tasks WHERE project_id='d2000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.tasks WHERE project_id IN ('d2000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000003')) THEN RAISE EXCEPTION 'client B task third-party isolation failed'; END IF;
  IF (SELECT count(*) FROM public.timeline_steps)<>1 OR NOT EXISTS (SELECT 1 FROM public.timeline_steps WHERE project_id='d2000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.timeline_steps WHERE project_id IN ('d2000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000003')) THEN RAISE EXCEPTION 'client B timeline third-party isolation failed'; END IF;
END
$client_b$;
RESET ROLE;

-- Assigned developer sees only the project assigned to them, and has no direct DML.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"d1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
DO $developer$
DECLARE v_state text; v_denied boolean;
BEGIN
  IF (SELECT count(*) FROM public.tasks)<>1 OR NOT EXISTS (SELECT 1 FROM public.tasks WHERE project_id='d2000000-0000-4000-8000-000000000003') THEN RAISE EXCEPTION 'developer assigned task read failed'; END IF;
  IF (SELECT count(*) FROM public.timeline_steps)<>1 OR NOT EXISTS (SELECT 1 FROM public.timeline_steps WHERE project_id='d2000000-0000-4000-8000-000000000003') THEN RAISE EXCEPTION 'developer assigned timeline read failed'; END IF;
  v_denied:=false; BEGIN INSERT INTO public.timeline_steps(project_id,title) VALUES('d2000000-0000-4000-8000-000000000003','forbidden'); EXCEPTION WHEN SQLSTATE '42501' THEN v_denied:=true; GET STACKED DIAGNOSTICS v_state=RETURNED_SQLSTATE; END;
  IF NOT v_denied OR v_state IS DISTINCT FROM '42501' THEN RAISE EXCEPTION 'developer direct timeline INSERT was not denied'; END IF;
END
$developer$;
RESET ROLE;

-- Backend admin API's service role can perform CRUD; API authorization remains tested in Node.
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $service_admin$
DECLARE v_rows integer;
BEGIN
  IF (SELECT count(*) FROM public.tasks)<>3 OR (SELECT count(*) FROM public.timeline_steps)<>3 THEN RAISE EXCEPTION 'service_role cannot read work items'; END IF;
  INSERT INTO public.tasks(id,project_id,title,status) VALUES('d3000000-0000-4000-8000-000000000004','d2000000-0000-4000-8000-000000000003','Admin API task','todo');
  GET DIAGNOSTICS v_rows=ROW_COUNT; IF v_rows<>1 THEN RAISE EXCEPTION 'service_role task INSERT failed'; END IF;
  UPDATE public.tasks SET status='doing' WHERE id='d3000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS v_rows=ROW_COUNT; IF v_rows<>1 THEN RAISE EXCEPTION 'service_role task UPDATE failed'; END IF;
  DELETE FROM public.tasks WHERE id='d3000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS v_rows=ROW_COUNT; IF v_rows<>1 THEN RAISE EXCEPTION 'service_role task DELETE failed'; END IF;
  INSERT INTO public.timeline_steps(id,project_id,title,status,order_index) VALUES('d4000000-0000-4000-8000-000000000004','d2000000-0000-4000-8000-000000000003','Admin API step','upcoming',3);
  GET DIAGNOSTICS v_rows=ROW_COUNT; IF v_rows<>1 THEN RAISE EXCEPTION 'service_role timeline INSERT failed'; END IF;
  UPDATE public.timeline_steps SET status='completed' WHERE id='d4000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS v_rows=ROW_COUNT; IF v_rows<>1 THEN RAISE EXCEPTION 'service_role timeline UPDATE failed'; END IF;
  DELETE FROM public.timeline_steps WHERE id='d4000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS v_rows=ROW_COUNT; IF v_rows<>1 THEN RAISE EXCEPTION 'service_role timeline DELETE failed'; END IF;
END
$service_admin$;
RESET ROLE;

ROLLBACK;

DO $postrollback$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN
      ('d1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000004')
      OR email IN ('p0-workitems-a@example.invalid','p0-workitems-b@example.invalid','p0-workitems-dev@example.invalid'))
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id IN
      ('d1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000004'))
     OR EXISTS (SELECT 1 FROM public.projects WHERE id IN
      ('d2000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000003'))
     OR EXISTS (SELECT 1 FROM public.tasks WHERE id IN
      ('d3000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000002','d3000000-0000-4000-8000-000000000003','d3000000-0000-4000-8000-000000000004'))
     OR EXISTS (SELECT 1 FROM public.timeline_steps WHERE id IN
      ('d4000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000004')) THEN
    RAISE EXCEPTION 'work-items rollback left a synthetic fixture';
  END IF;
END
$postrollback$;
SELECT 'PASS: work-items fixtures rolled back and verified' AS result;
