-- 1. Adicionar tipo de produto na tabela projects para diferenciar site pronto e template
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'ready_made';

-- 2. Criar a tabela de avaliações (reviews) para sites/templates e desenvolvedores
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    developer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    CONSTRAINT review_target_check CHECK (
        (project_id IS NOT NULL AND developer_id IS NULL) OR 
        (project_id IS NULL AND developer_id IS NOT NULL)
    )
);

-- Habilitar RLS na tabela de reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
DROP POLICY IF EXISTS "Qualquer pessoa pode ler avaliações" ON public.reviews;
CREATE POLICY "Qualquer pessoa pode ler avaliações" 
ON public.reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem publicar avaliações" ON public.reviews;
CREATE POLICY "Usuários autenticados podem publicar avaliações" 
ON public.reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem apagar suas próprias avaliações" ON public.reviews;
CREATE POLICY "Usuários podem apagar suas próprias avaliações" 
ON public.reviews FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
