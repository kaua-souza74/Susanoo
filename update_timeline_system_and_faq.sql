-- 1. Adicionar coluna na tabela projects indicando se o cliente solicitou cronograma
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS timeline_requested BOOLEAN DEFAULT false;

-- 2. Adicionar coluna de foto/imagem em cada etapa do cronograma (timeline_steps)
ALTER TABLE public.timeline_steps ADD COLUMN IF NOT EXISTS photo_url TEXT;
