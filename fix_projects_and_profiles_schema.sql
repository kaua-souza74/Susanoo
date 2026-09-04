-- ==============================================================================
-- SUSANOO - CORREÇÃO DE SCHEMA DE PROJETOS E PERFIS
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. ADICIONAR COLUNAS QUE FALTAM NA TABELA PROJECTS
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Landing Page';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS installments BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'ready_made';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deploy_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deploy_status TEXT DEFAULT 'idle';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manual_progress INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS show_in_gallery BOOLEAN DEFAULT true;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. ADICIONAR COLUNAS COMPLEMENTARES NA TABELA PROFILES (SE NÃO EXISTIREM)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_private BOOLEAN DEFAULT false;

-- 3. GARANTIR RLS DESATIVADO OU LIBERADO PARA AS OPERAÇÕES DA PLATAFORMA
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. ATUALIZAR REFRESH DO SCHEMA CACHE DO POSTGREST
NOTIFY pgrst, 'reload schema';
