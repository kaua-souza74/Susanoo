-- Desabilitar RLS temporariamente para teste
-- Execute apenas estas linhas no Supabase SQL Editor

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
