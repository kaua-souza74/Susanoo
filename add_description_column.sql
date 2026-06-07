-- Execute este script SQL no Editor de SQL do Supabase (Supabase Dashboard > SQL Editor)
-- para adicionar a coluna de descrição detalhada dos projetos.

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
