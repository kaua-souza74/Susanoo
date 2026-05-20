CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- 'todo', 'doing', 'review', 'done'
    assignee TEXT, -- Davi, Vinicius, Lucas, Kaua
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que a coluna existea caso a tabela já tenha sido criada antes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Criar tabela de Cronograma (Timeline)
CREATE TABLE IF NOT EXISTS timeline_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    status TEXT DEFAULT 'upcoming', -- 'completed', 'current', 'upcoming'
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir alguns passos iniciais se houver projetos
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
        INSERT INTO timeline_steps (project_id, title, description, date, status, order_index)
        SELECT id, 'Briefing e Estrutura', 'Definição de objetivos e mapa do site.', '10 Mai', 'completed', 1 FROM projects;
        
        INSERT INTO timeline_steps (project_id, title, description, date, status, order_index)
        SELECT id, 'Design de Interface (UI)', 'Criação do visual premium e prototipagem.', '15 Mai', 'completed', 2 FROM projects;
        
        INSERT INTO timeline_steps (project_id, title, description, date, status, order_index)
        SELECT id, 'Desenvolvimento Front-end', 'Transformação do design em código funcional.', '20 Mai', 'current', 3 FROM projects;
    END IF;
END $$;

-- Desativar RLS para facilitar (como nos outros arquivos)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_steps DISABLE ROW LEVEL SECURITY;

-- Garantir que a tabela profiles tenha o campo email para busca do ADM
-- Remover restrição de papel (role) que impede o uso de 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 1. Função para criar perfil automático quando um novo usuário se cadastrar pelo Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), -- Pega o nome do meta_data ou o email
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'client') -- Define como client por padrão
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger que executa a função acima após um INSERT na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. MIGRATION: Popular perfis de usuários que já existem no Auth mas não no Profiles
INSERT INTO public.profiles (id, name, email, role)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email), 
    email, 
    COALESCE(raw_user_meta_data->>'role', 'client')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Criação do Balde para Arquivos de Deploys Reais (HTML/CSS)
INSERT INTO storage.buckets (id, name, public) VALUES ('project_files', 'project_files', true) 
ON CONFLICT (id) DO NOTHING;

-- Liberar acesso total ao balde de deploys (Desenvolvimento)
DROP POLICY IF EXISTS "Public Display Deploy" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Deploy" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Deploy" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Deploy" ON storage.objects;

CREATE POLICY "Public Display Deploy" ON storage.objects FOR SELECT USING (bucket_id = 'project_files');
CREATE POLICY "Public Upload Deploy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project_files');
CREATE POLICY "Public Update Deploy" ON storage.objects FOR UPDATE USING (bucket_id = 'project_files');
CREATE POLICY "Public Delete Deploy" ON storage.objects FOR DELETE USING (bucket_id = 'project_files');

-- 5. Adicionar controle manual de progresso aos projetos
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manual_progress INTEGER DEFAULT 0;
