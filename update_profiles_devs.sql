-- Adicionando colunas necessárias para exibir Desenvolvedores reais no Marketplace
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 5.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Permitir atualizações na tabela profiles pelos próprios usuários
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- A tabela profiles já tem RLS desativado pelo script anterior (DISABLE ROW LEVEL SECURITY)
-- Mas caso seja reativado no futuro, essa policy garante o UPDATE pelo próprio usuário.
