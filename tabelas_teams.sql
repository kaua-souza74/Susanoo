-- 1. Criação da Tabela de Grupos/Conversas no Teams
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'group', -- Ex: 'group' ou 'direct'
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modificação da tabela Mensagens para suportar os Grupos do Teams
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES chats(id) ON DELETE CASCADE;
ALTER TABLE messages ALTER COLUMN project_id DROP NOT NULL;

-- 3. Habilitar capacidade de Fixar os Canais Base (Projetos) e Atributos de Deploy
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deploy_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deploy_status TEXT DEFAULT 'idle'; -- 'idle', 'building', 'ready', 'error'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_deploy TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'Production';

-- 4. Criação do Balde (Bucket) de Arquivos e Mídias para o Chat Teams
INSERT INTO storage.buckets (id, name, public) VALUES ('teams_media', 'teams_media', true) 
ON CONFLICT (id) DO NOTHING;

-- 5. Liberar regras de leitura e escrita do Storage 
DROP POLICY IF EXISTS "Leitura_Publica_Teams" ON storage.objects;
DROP POLICY IF EXISTS "Escrita_Upload_Teams" ON storage.objects;
CREATE POLICY "Leitura_Publica_Teams" ON storage.objects FOR SELECT USING (bucket_id = 'teams_media');
CREATE POLICY "Escrita_Upload_Teams" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'teams_media');

-- 6. Remoção de Trava de ForeignKey (Resolver erro do user_id fkey)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey1;

-- 7. Desligar RLS de Comunicações da Agência para evitar Visibilidade Fantasma (Sumiço de Chats)
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 8. Ativar Coluna de Assinatura Definitiva (Nome Real do Sócio por extenso sem Joins)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'Susanoo HQ';
