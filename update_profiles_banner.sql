-- Script de Atualização para Suporte a Banner e Metadados Completos do Perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;

-- Garante que o bucket project_files exista no Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project_files', 'project_files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Libera permissões de upload e leitura pública
DROP POLICY IF EXISTS "Public Read project_files" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload project_files" ON storage.objects;
DROP POLICY IF EXISTS "Public Update project_files" ON storage.objects;

CREATE POLICY "Public Read project_files" ON storage.objects FOR SELECT USING (bucket_id = 'project_files');
CREATE POLICY "Public Upload project_files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project_files');
CREATE POLICY "Public Update project_files" ON storage.objects FOR UPDATE USING (bucket_id = 'project_files');
