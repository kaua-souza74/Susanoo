-- Adicionando novos campos na tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS installments BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';

-- Já existe "description", mas se não houver:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
