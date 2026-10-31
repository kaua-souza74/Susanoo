BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Derived from the preserved Phase 3 candidate. The invoking release executor
-- must verify the explicitly approved project/endpoint/database/role before
-- transmitting this file. This migration performs structural checks only.

DO $preflight$
DECLARE
  v_table text;
  v_expected_columns text[];
  v_actual_columns text[];
  v_expected_constraints text[];
  v_actual_constraints text[];
  v_policy_count integer;
  v_priv text;
  v_role text;
  v_default text;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'P0 phase 3 work-items preflight: migration role must be postgres';
  END IF;

  FOREACH v_table IN ARRAY ARRAY['tasks','timeline_steps'] LOOP
    IF to_regclass(format('public.%I', v_table)) IS NULL THEN
      RAISE EXCEPTION 'P0 phase 3 work-items preflight: public.% missing', v_table;
    END IF;
    IF (SELECT pg_get_userbyid(c.relowner) FROM pg_class c WHERE c.oid=to_regclass(format('public.%I',v_table))) IS DISTINCT FROM 'postgres'
       OR (SELECT c.relrowsecurity OR c.relforcerowsecurity FROM pg_class c WHERE c.oid=to_regclass(format('public.%I',v_table))) THEN
      RAISE EXCEPTION 'P0 phase 3 work-items preflight: owner/RLS drift on public.%', v_table;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid=to_regclass(format('public.%I',v_table)) AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL) THEN
      RAISE EXCEPTION 'P0 phase 3 work-items preflight: column ACL drift on public.%', v_table;
    END IF;
  END LOOP;

  SELECT array_agg(a.attname::text ORDER BY a.attnum) INTO v_actual_columns FROM pg_attribute a WHERE a.attrelid='public.tasks'::regclass AND a.attnum>0 AND NOT a.attisdropped;
  v_expected_columns := ARRAY['id','project_id','title','description','status','created_at','assignee'];
  IF v_actual_columns IS DISTINCT FROM v_expected_columns THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks columns drift'; END IF;
  SELECT array_agg(a.attname::text||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull::text ORDER BY a.attnum)
    INTO v_actual_columns FROM pg_attribute a WHERE a.attrelid='public.tasks'::regclass AND a.attnum>0 AND NOT a.attisdropped;
  v_expected_columns := ARRAY['id:uuid:true','project_id:uuid:false','title:text:true','description:text:false','status:text:false','created_at:timestamp with time zone:false','assignee:text:false'];
  IF v_actual_columns IS DISTINCT FROM v_expected_columns THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks types/nullability drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.tasks'::regclass AND a.attname='id';
  IF v_default IS DISTINCT FROM 'gen_random_uuid()' THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks.id default drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.tasks'::regclass AND a.attname='status';
  IF v_default IS DISTINCT FROM '''todo''::text' THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks.status default drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.tasks'::regclass AND a.attname='created_at';
  IF v_default IS DISTINCT FROM 'now()' THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks.created_at default drift'; END IF;
  SELECT array_agg(a.attname::text ORDER BY a.attnum) INTO v_actual_columns FROM pg_attribute a WHERE a.attrelid='public.timeline_steps'::regclass AND a.attnum>0 AND NOT a.attisdropped;
  v_expected_columns := ARRAY['id','project_id','title','description','date','status','order_index','created_at','photo_url'];
  IF v_actual_columns IS DISTINCT FROM v_expected_columns THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps columns drift'; END IF;
  SELECT array_agg(a.attname::text||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull::text ORDER BY a.attnum)
    INTO v_actual_columns FROM pg_attribute a WHERE a.attrelid='public.timeline_steps'::regclass AND a.attnum>0 AND NOT a.attisdropped;
  v_expected_columns := ARRAY['id:uuid:true','project_id:uuid:false','title:text:true','description:text:false','date:text:false','status:text:false','order_index:integer:false','created_at:timestamp with time zone:false','photo_url:text:false'];
  IF v_actual_columns IS DISTINCT FROM v_expected_columns THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps types/nullability drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.timeline_steps'::regclass AND a.attname='id';
  IF v_default IS DISTINCT FROM 'gen_random_uuid()' THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps.id default drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.timeline_steps'::regclass AND a.attname='status';
  IF v_default IS DISTINCT FROM '''upcoming''::text' THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps.status default drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.timeline_steps'::regclass AND a.attname='order_index';
  IF v_default IS DISTINCT FROM '0' THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps.order_index default drift'; END IF;
  SELECT pg_get_expr(d.adbin,d.adrelid,true) INTO v_default FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
    WHERE d.adrelid='public.timeline_steps'::regclass AND a.attname='created_at';
  IF v_default IS DISTINCT FROM 'now()' THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps.created_at default drift'; END IF;

  SELECT array_agg(conname::text ORDER BY conname) INTO v_actual_constraints FROM pg_constraint WHERE conrelid='public.tasks'::regclass;
  v_expected_constraints := ARRAY['tasks_pkey','tasks_project_id_fkey','tasks_status_check'];
  IF v_actual_constraints IS DISTINCT FROM v_expected_constraints THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks constraints drift'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.tasks'::regclass
      AND c.conname='tasks_pkey' AND c.contype='p' AND c.convalidated
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.tasks'::regclass AND attname='id')]::smallint[]) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: tasks primary key definition differs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.tasks'::regclass
      AND c.conname='tasks_project_id_fkey' AND c.contype='f' AND c.confrelid='public.projects'::regclass
      AND c.convalidated AND NOT c.condeferrable AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.tasks'::regclass AND attname='project_id')]::smallint[]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.projects'::regclass AND attname='id')]::smallint[]) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: tasks.project_id relation differs from expected project cascade';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.tasks'::regclass
      AND c.conname='tasks_status_check' AND c.contype='c' AND c.convalidated
      -- Use non-pretty deparsing so this comparison matches the canonical
      -- pg_dump/complement DDL instead of accepting alternate formatting.
      AND regexp_replace(pg_get_constraintdef(c.oid,false),'\s','','g') =
        'CHECK((status=ANY(ARRAY[''todo''::text,''doing''::text,''review''::text,''done''::text])))') THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: tasks.status constraint differs';
  END IF;
  SELECT array_agg(conname::text ORDER BY conname) INTO v_actual_constraints FROM pg_constraint WHERE conrelid='public.timeline_steps'::regclass;
  v_expected_constraints := ARRAY['timeline_steps_pkey','timeline_steps_project_id_fkey'];
  IF v_actual_constraints IS DISTINCT FROM v_expected_constraints THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps constraints drift'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.timeline_steps'::regclass
      AND c.conname='timeline_steps_pkey' AND c.contype='p' AND c.convalidated
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.timeline_steps'::regclass AND attname='id')]::smallint[]) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps primary key definition differs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.timeline_steps'::regclass
      AND c.conname='timeline_steps_project_id_fkey' AND c.contype='f' AND c.confrelid='public.projects'::regclass
      AND c.convalidated AND NOT c.condeferrable AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.timeline_steps'::regclass AND attname='project_id')]::smallint[]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.projects'::regclass AND attname='id')]::smallint[]) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps.project_id relation differs from expected project cascade';
  END IF;

  IF (SELECT count(*) FROM pg_attribute a
      WHERE a.attrelid='public.projects'::regclass AND a.attname IN ('id','client_id','developer_id')
        AND a.attnum>0 AND NOT a.attisdropped AND format_type(a.atttypid,a.atttypmod)='uuid') <> 3 THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: projects membership columns missing or have unexpected types';
  END IF;
  IF (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='public.projects'::regclass) IS DISTINCT FROM 'postgres'
     OR (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='public.profiles'::regclass) IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: projects/profiles owner differs';
  END IF;
  IF (SELECT array_agg(conname::text ORDER BY conname) FROM pg_constraint
      WHERE conrelid='public.projects'::regclass AND conname IN
        ('projects_pkey','projects_client_id_fkey','projects_developer_id_fkey'))
     IS DISTINCT FROM ARRAY['projects_client_id_fkey','projects_developer_id_fkey','projects_pkey']::text[] THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: projects identity/assignment constraints missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.projects'::regclass
      AND c.conname='projects_pkey' AND c.contype='p' AND c.convalidated
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.projects'::regclass AND attname='id')]::smallint[])
     OR NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.projects'::regclass
      AND c.conname='projects_client_id_fkey' AND c.contype='f' AND c.confrelid='public.profiles'::regclass
      AND c.convalidated AND c.confdeltype='c'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.projects'::regclass AND attname='client_id')]::smallint[]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='id')]::smallint[])
     OR NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.projects'::regclass
      AND c.conname='projects_developer_id_fkey' AND c.contype='f' AND c.confrelid='public.profiles'::regclass
      AND c.convalidated AND c.confdeltype='a'
      AND c.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.projects'::regclass AND attname='developer_id')]::smallint[]
      AND c.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attname='id')]::smallint[]) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: projects primary/assignment relation definition drift';
  END IF;
  IF NOT has_column_privilege('authenticated','public.projects','id','SELECT')
     OR NOT has_column_privilege('authenticated','public.projects','client_id','SELECT')
     OR NOT has_column_privilege('authenticated','public.projects','developer_id','SELECT') THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: authenticated lacks required project membership-column SELECT';
  END IF;
  IF NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid='public.projects'::regclass)
     OR NOT EXISTS (
       SELECT 1 FROM pg_policy p
       WHERE p.polrelid='public.projects'::regclass AND p.polname='projects_select_policy'
         AND p.polcmd='r' AND p.polqual IS NOT NULL
         AND (0=ANY(p.polroles) OR (SELECT oid FROM pg_roles WHERE rolname='authenticated')=ANY(p.polroles))
         AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%client_id%'
         AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%developer_id%'
     ) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: projects SELECT RLS does not include client and assigned developer';
  END IF;
  IF NOT has_schema_privilege('service_role','public','USAGE') THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: service_role lacks public schema USAGE';
  END IF;
  FOREACH v_table IN ARRAY ARRAY['tasks','timeline_steps'] LOOP
    FOREACH v_priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
      IF NOT has_table_privilege('service_role',format('public.%I',v_table),v_priv) THEN
        RAISE EXCEPTION 'P0 phase 3 preflight: service_role lacks required API privilege (% on public.%)',v_priv,v_table;
      END IF;
    END LOOP;
  END LOOP;
  IF NOT has_table_privilege('service_role','public.projects','SELECT')
     OR NOT has_table_privilege('service_role','public.profiles','SELECT') THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: service_role lacks project/profile read privileges used by admin APIs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger
      WHERE tgrelid IN ('public.tasks'::regclass,'public.timeline_steps'::regclass) AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'P0 phase 3 preflight: unexpected application trigger on work-item tables';
  END IF;

  SELECT count(*) INTO v_policy_count FROM pg_policy WHERE polrelid='public.tasks'::regclass;
  IF v_policy_count <> 1 OR NOT EXISTS (
    SELECT 1 FROM pg_policy p WHERE p.polrelid='public.tasks'::regclass AND p.polname='Permitir full access para autenticados'
      AND p.polcmd='*' AND pg_get_expr(p.polqual,p.polrelid,true)='true'
      AND p.polroles=ARRAY[(SELECT oid FROM pg_roles WHERE rolname='authenticated')]::oid[]
  ) THEN RAISE EXCEPTION 'P0 phase 3 preflight: tasks policy drift'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.timeline_steps'::regclass) THEN RAISE EXCEPTION 'P0 phase 3 preflight: timeline_steps policy drift'; END IF;

  FOREACH v_table IN ARRAY ARRAY['tasks','timeline_steps'] LOOP
    FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH v_priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
        IF NOT has_table_privilege(v_role,format('public.%I',v_table),v_priv) THEN
          RAISE EXCEPTION 'P0 phase 3 preflight: expected baseline client grant missing (% on public.% to %)',v_priv,v_table,v_role;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
    WHERE n.nspname='public' AND c.relname IN ('tasks','timeline_steps') AND x.grantee=0
  ) THEN RAISE EXCEPTION 'P0 phase 3 work-items preflight: unexpected PUBLIC table ACL'; END IF;
END
$preflight$;

CREATE TEMP TABLE p0p3_work_acl_snapshot ON COMMIT DROP AS
SELECT c.oid AS relid, x.grantee, x.grantor, x.privilege_type, x.is_grantable
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
WHERE n.nspname='public' AND c.relname IN ('tasks','timeline_steps')
  AND x.grantee IN (SELECT oid FROM pg_roles WHERE rolname IN ('postgres','service_role'));

DROP POLICY "Permitir full access para autenticados" ON public.tasks;
REVOKE ALL PRIVILEGES ON TABLE public.tasks, public.timeline_steps FROM PUBLIC, anon, authenticated;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_steps ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.tasks, public.timeline_steps TO authenticated;

CREATE POLICY p0p3_tasks_read_project_member ON public.tasks
  FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id=tasks.project_id
      AND (p.client_id=(SELECT auth.uid()) OR p.developer_id=(SELECT auth.uid()))
  ));
CREATE POLICY p0p3_timeline_read_project_member ON public.timeline_steps
  FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id=timeline_steps.project_id
      AND (p.client_id=(SELECT auth.uid()) OR p.developer_id=(SELECT auth.uid()))
  ));

DO $postcheck$
DECLARE
  v_table text;
  v_priv text;
  v_role text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['tasks','timeline_steps'] LOOP
    IF NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid=to_regclass(format('public.%I',v_table))) THEN
      RAISE EXCEPTION 'P0 phase 3 post-check: RLS state drift on public.%',v_table;
    END IF;
    IF (SELECT array_agg(polname::text ORDER BY polname) FROM pg_policy WHERE polrelid=to_regclass(format('public.%I',v_table))) IS DISTINCT FROM ARRAY[CASE v_table WHEN 'tasks' THEN 'p0p3_tasks_read_project_member' ELSE 'p0p3_timeline_read_project_member' END]::text[] THEN
      RAISE EXCEPTION 'P0 phase 3 post-check: exact policy set differs on public.%',v_table;
    END IF;
    FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH v_priv IN ARRAY ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
        IF has_table_privilege(v_role,format('public.%I',v_table),v_priv) THEN
          RAISE EXCEPTION 'P0 phase 3 post-check: forbidden table privilege remains (% on public.% to %)',v_priv,v_table,v_role;
        END IF;
      END LOOP;
    END LOOP;
    IF has_table_privilege('anon',format('public.%I',v_table),'SELECT') THEN RAISE EXCEPTION 'P0 phase 3 post-check: anon SELECT remains on public.%',v_table; END IF;
    IF NOT has_table_privilege('authenticated',format('public.%I',v_table),'SELECT') THEN RAISE EXCEPTION 'P0 phase 3 post-check: authenticated SELECT missing on public.%',v_table; END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid='public.tasks'::regclass
      AND p.polname='p0p3_tasks_read_project_member' AND p.polcmd='r'
      AND p.polroles=ARRAY[(SELECT oid FROM pg_roles WHERE rolname='authenticated')]::oid[]
      AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%client_id%'
      AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%developer_id%'
      AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%auth.uid%')
     OR NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid='public.timeline_steps'::regclass
      AND p.polname='p0p3_timeline_read_project_member' AND p.polcmd='r'
      AND p.polroles=ARRAY[(SELECT oid FROM pg_roles WHERE rolname='authenticated')]::oid[]
      AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%client_id%'
      AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%developer_id%'
      AND pg_get_expr(p.polqual,p.polrelid,true) LIKE '%auth.uid%') THEN
    RAISE EXCEPTION 'P0 phase 3 post-check: member-only policy predicates differ';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
    WHERE n.nspname='public' AND c.relname IN ('tasks','timeline_steps') AND x.grantee=0
  ) THEN RAISE EXCEPTION 'P0 phase 3 post-check: PUBLIC table ACL remains'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('tasks','timeline_steps')
      AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
  ) THEN RAISE EXCEPTION 'P0 phase 3 post-check: unexpected column ACL remains'; END IF;
  IF EXISTS (
    (SELECT relid,grantee,grantor,privilege_type,is_grantable FROM p0p3_work_acl_snapshot)
    EXCEPT
    (SELECT c.oid,x.grantee,x.grantor,x.privilege_type,x.is_grantable FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x WHERE n.nspname='public' AND c.relname IN ('tasks','timeline_steps') AND x.grantee IN (SELECT oid FROM pg_roles WHERE rolname IN ('postgres','service_role')))
  ) OR EXISTS (
    (SELECT c.oid,x.grantee,x.grantor,x.privilege_type,x.is_grantable FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x WHERE n.nspname='public' AND c.relname IN ('tasks','timeline_steps') AND x.grantee IN (SELECT oid FROM pg_roles WHERE rolname IN ('postgres','service_role')))
    EXCEPT
    (SELECT relid,grantee,grantor,privilege_type,is_grantable FROM p0p3_work_acl_snapshot)
  ) THEN RAISE EXCEPTION 'P0 phase 3 post-check: postgres/service_role ACL changed'; END IF;
END
$postcheck$;

COMMIT;
