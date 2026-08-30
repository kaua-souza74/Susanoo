-- Tabela para armazenar o interesse e preferências dos clientes
CREATE TABLE IF NOT EXISTS public.client_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    segment TEXT NOT NULL, -- Ex: 'Agro', 'Barbearia', 'Confeitaria', 'Saúde', 'Restaurante'
    site_type TEXT NOT NULL, -- Ex: 'Landing Page', 'Loja Virtual', 'Sistema Web'
    technologies TEXT[] DEFAULT '{}', -- Ex: ['Pix/Cartão', 'WhatsApp', 'SEO']
    custom_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.client_interests ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Permitir inserção para todos ou autenticados" ON public.client_interests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura para administradores e desenvolvedores" ON public.client_interests
    FOR SELECT USING (true);
