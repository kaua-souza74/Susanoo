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

### 1. Deploy HQ (Admin)
- **Hospedagem Estática**: Upload direto de arquivos HTML/CSS para o Supabase Storage.
- **Preview Seguro**: Rota de visualização interna que ignora restrições de sandbox.
- **Vercel Engine**: Publicação mundial com um clique usando a API oficial da Vercel.
- **Controle de Progresso**: Slider administrativo para definir a porcentagem de conclusão que o cliente vê.

### 2. War Room (Chat de Equipe)
- Sistema estilo WhatsApp com suporte a textos, imagens e múltiplos anexos.
- Preview de mídia antes do envio.

### 3. Dashboard do Cliente
- **Meus Projetos**: Visualização premium do progresso do software.
- **Kanban Realtime**: O cliente acompanha cada tarefa saindo da produção em tempo real.
- **Tutorial Integrado**: Página de ajuda detalhando como a agência opera.

---

## 🔐 Segurança (RLS)
Durante o desenvolvimento, o **Row Level Security (RLS)** está desabilitado para agilizar a prototipagem. Antes de ir para produção, é altamente recomendável reativar e configurar as políticas no Supabase.

---

## 🧔 Desenvolvido por
**Equipe Susanoo** - *Transformando código em ativos de alto nível.*
