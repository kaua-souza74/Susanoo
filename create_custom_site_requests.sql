CREATE TABLE IF NOT EXISTS public.custom_site_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget_range TEXT,
  desired_deadline DATE,
  reference_url TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'team' CHECK (assignment_type IN ('team', 'developer')),
  preferred_developer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'triage', 'quoted', 'accepted', 'in_progress', 'delivered', 'cancelled')),
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT custom_site_requests_client_profile_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT custom_site_requests_assignment_check CHECK (
    (assignment_type = 'team' AND preferred_developer_id IS NULL)
    OR (assignment_type = 'developer' AND preferred_developer_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS custom_site_requests_client_id_idx ON public.custom_site_requests (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS custom_site_requests_developer_id_idx ON public.custom_site_requests (preferred_developer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS custom_site_requests_status_idx ON public.custom_site_requests (status, created_at DESC);

ALTER TABLE public.custom_site_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.custom_site_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.custom_site_requests TO authenticated;

DROP POLICY IF EXISTS "Clients can view own custom requests" ON public.custom_site_requests;
CREATE POLICY "Clients can view own custom requests" ON public.custom_site_requests
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = client_id);

DROP POLICY IF EXISTS "Assigned developers can view custom requests" ON public.custom_site_requests;
CREATE POLICY "Assigned developers can view custom requests" ON public.custom_site_requests
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = preferred_developer_id);

DROP POLICY IF EXISTS "Admins can view custom requests" ON public.custom_site_requests;
CREATE POLICY "Admins can view custom requests" ON public.custom_site_requests
FOR SELECT TO authenticated USING (
  LOWER(COALESCE((SELECT auth.jwt() ->> 'email'), '')) = ANY (
    ARRAY['davi@susanoo.com','vinicius172321@gmail.com','limasilvallsss@gmail.com','kauasesi156@gmail.com']
  )
);

DROP POLICY IF EXISTS "Clients can create own custom requests" ON public.custom_site_requests;
CREATE POLICY "Clients can create own custom requests" ON public.custom_site_requests
FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = client_id AND status = 'submitted');

DROP POLICY IF EXISTS "Clients can update own custom requests" ON public.custom_site_requests;
CREATE POLICY "Clients can update own custom requests" ON public.custom_site_requests
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = client_id AND status IN ('draft', 'submitted'))
WITH CHECK ((SELECT auth.uid()) = client_id AND status IN ('draft', 'submitted', 'cancelled'));

DROP POLICY IF EXISTS "Admins can update custom requests" ON public.custom_site_requests;
CREATE POLICY "Admins can update custom requests" ON public.custom_site_requests
FOR UPDATE TO authenticated
USING (
  LOWER(COALESCE((SELECT auth.jwt() ->> 'email'), '')) = ANY (
    ARRAY['davi@susanoo.com','vinicius172321@gmail.com','limasilvallsss@gmail.com','kauasesi156@gmail.com']
  )
)
WITH CHECK (
  LOWER(COALESCE((SELECT auth.jwt() ->> 'email'), '')) = ANY (
    ARRAY['davi@susanoo.com','vinicius172321@gmail.com','limasilvallsss@gmail.com','kauasesi156@gmail.com']
  )
);
