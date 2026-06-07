-- ============================================================
-- MIGRATION: Chat Fix + Description Column
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Adicionar coluna 'participants' na tabela chats (array de UUIDs)
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS participants UUID[] DEFAULT '{}';

-- 2. Adicionar coluna 'description' na tabela projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Adicionar coluna 'user_id' na tabela chats (para identificar o cliente dono do suporte)
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS user_id UUID;

-- 4. Garantir que a tabela chats esteja com RLS desligado
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- 5. Criar bucket de attachments do chat do cliente (caso não exista)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_attachments', 'chat_attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- 6. Políticas para o bucket de attachments do cliente
DROP POLICY IF EXISTS "Public Read Chat Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Chat Attachments" ON storage.objects;
CREATE POLICY "Public Read Chat Attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat_attachments');
CREATE POLICY "Public Upload Chat Attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat_attachments');
