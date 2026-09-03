# ⚡ Susanoo SaaS HQ - Operational System

Bem-vindo à central de comando da **Susanoo**, a plataforma administrativa de elite para gestão de projetos SaaS e infraestrutura de deploy em tempo real.

---

## 🚀 Visão Geral
O Susanoo HQ é um ecossistema completo desenvolvido para agências de software que buscam transparência total com o cliente e agilidade operacional. Ele integra comunicação em tempo real, gestão de tarefas (Kanban) e uma infraestrutura de hospedagem direta via **Vercel API**.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 16 (Turbopack)](https://nextjs.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Backend / Realtime**: [Supabase](https://supabase.com/)
- **Hospedagem de Projetos**: [Vercel API](https://vercel.com/docs/api)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Configuração do Ambiente (.env.local)
Para que o sistema funcione, você deve criar um arquivo `.env.local` na raiz do projeto com as seguintes chaves:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VERCEL_TOKEN=seu-token-de-acesso-pessoal-da-vercel
```

### 📦 Dependências Principais
O comando `npm install` instalará automaticamente tudo o que é necessário. As principais bibliotecas utilizadas são:
- **`@supabase/supabase-js`**: Comunicação com o Banco e Storage.
- **`framer-motion`**: Animações fluidas e transições premium.
- **`lucide-react`**: Biblioteca de ícones moderna.
- **`three` & `@react-three/fiber`**: (Opcional) Para as animações de Shader na Home.
- **`clsx` & `tailwind-merge`**: Utilitários para gestão de classes CSS.

---

## 🗄️ Estrutura do Banco de Dados
O Susanoo utiliza o Supabase para toda a lógica de dados e tempo real. Siga a ordem de execução dos scripts no **SQL Editor**:

1. **`tabelas_teams.sql`**: Configura o sistema de chat de equipe e autenticação base.
2. **`tabelas_adicionais.sql`**: 
   - Cria o sistema de Kanban (`tasks`).
   - Configura a Timeline do projeto.
   - **Crucial**: Cria o bucket `project_files` no Storage para hospedagem de HTML/CSS.
   - Ativa as Triggers de criação automática de perfil para novos usuários.

### ⚠️ Comando Manual Obrigatório
Após executar os scripts, rode este comando para ativar o controle de progresso manual no Admin:
```sql
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manual_progress INTEGER DEFAULT 0;
```

---

## 📦 Como Rodar Localmente
1. **Instale as dependências**:
   ```bash
   npm install
   ```
2. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
3. **Acesse**:
   - Plataforma: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin`
   - Dashboard Cliente: `http://localhost:3000/dashboard`

---

## 💎 Funcionalidades Principais

### 1. Deploy HQ & Catálogo de Sites (Admin)
- **Hospedagem Estática**: Upload direto de arquivos HTML/CSS para o Supabase Storage.
- **Preview Seguro**: Rota de visualização interna que ignora restrições de sandbox.
- **Vercel Engine**: Publicação mundial com um clique usando a API oficial da Vercel.
- **Controle de Progresso**: Slider administrativo para definir a porcentagem de conclusão que o cliente vê.
- **Gestão de Nichos de Comércio**: Cadastro e categorização de sites prontos com mais de 30 nichos de pequenos comércios brasileiros, publicação e visibilidade pública.

### 2. Marketplace & Catálogo de Pequenos Comércios
- **Filtros por Nicho**: Seletor moderno de tipos com pesquisa integrada e contadores dinâmicos cobrindo barbearias, confeitarias, oficinas, clínicas, pet shops, academias, e muito mais.
- **Filtro por Origem**: Separação clara entre criações oficiais Susanoo e templates da Comunidade.
- **Atualização em Tempo Real (Supabase Realtime)**: Novos sites cadastrados e publicados aparecem na vitrine instantaneamente sem necessidade de refresh.

### 3. Painel do Desenvolvedor & Gestão de Profissionais
- **Métricas Reais**: Faturamento e projetos calculados com base no usuário autenticado no Supabase.
- **Tempo Médio de Entrega**: Métrica calculada dinamicamente entre as datas de criação e conclusão dos projetos reais.
- **Vitrine de Desenvolvedores**: Listagem e páginas detalhadas de perfis carregadas diretamente da tabela `profiles`.

### 4. Gestão de Projetos, Minhas Compras e Timeline
- **Progresso Integrado (`/dashboard/timeline`)**: Visual clean e profissional com acompanhamento de etapas e marcos.
- **Minhas Compras (`/dashboard/projects`)**: Gestão de sites adquiridos, status de deploy e acesso rápido às instâncias.
- **Kanban Realtime**: O cliente e a equipe acompanham cada tarefa com sincronização total com o banco de dados.
- **Prevenção de Perda de Dados**: Notificação e modal de confirmação ao navegar com alterações não salvas no perfil.

### 5. War Room (Chat de Equipe)
- Sistema estilo WhatsApp com suporte a textos, imagens e múltiplos anexos.
- Preview de mídia antes do envio.

---

## 🔐 Segurança (RLS)
Durante o desenvolvimento, o **Row Level Security (RLS)** está desabilitado para agilizar a prototipagem. Antes de ir para produção, é altamente recomendável reativar e configurar as políticas no Supabase.

---

## 🧔 Desenvolvido por
**Equipe Susanoo** - *Transformando código em ativos de alto nível.*
