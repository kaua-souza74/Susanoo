# 🦅 SUSANOO - Sistema Operacional HQ

O sistema mestre de operações da Susanoo, concebido para gerir múltiplos projetos de software com integração suprema, Kanban integrado (Trello HQ) e central de comunicação instantânea. Modulado inteiramente na Vibe Premium Dark.

## 🚀 Como os Sócios (Davi, Vinícius, Lucas e Kauã) Trabalham Juntos?

Com certeza **TEM COMO!** A grande sacada do que nós montamos juntos aqui é que todo o sistema está ligado a apenas **1 Cérebro Central na nuvem (Seu Supabase Público)**. 

Múltiplas pessoas podem baixar o código em suas casas, rodar, e tudo estará perfeitamente sincronizado. Se o Davi em São Paulo arrastar um projeto pra coluna `Revisão`, em questão de milissegundos o card some da coluna antiga e aparece na do Vinícius, tudo sozinho. Funciona incrivelmente bem justamente por estarmos usando os WebSockets Realtime nativos da sua plataforma.

### Passo a passo para sua Equipe rodar nas próprias máquinas:

1. **Compartilhe o Código**
Suba essa pasta para um GitHub Privado seu e chame seus sócios, ou envie para eles o arquivo .zip com o código.

2. **Instalando o Reator**
Sempre que alguém baixar no PC dele, ele precisa abrir aquela pasta nova, rodar o terminal lá dentro e confirmar as engrenagens e a bateria:
`npm install --legacy-peer-deps`

3. **O Elemento Vital (Cuidado com Segredos de Estado)**
A única coisa que conecta seu banco de dados a tela de quem não for você é algo extremamente sigiloso. Peça pra cada um de seus sócios criarem na raiz do projeto (perto da onde fica package.json etc) um arquivo simples com o nome `.env.local`

Dê as chaves do seu reino para eles colocarem lá dentro (sem aspas, limpinho assim):
```env
NEXT_PUBLIC_SUPABASE_URL=https://dgbubqnzzttdkmlnifsa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYnVicW56enR0ZGttbG5pZnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjAyOTUsImV4cCI6MjA5NDYzNjI5NX0.R5fDsiMT1KsZKy4nblBfCE4p-6tumpHu453mzHjYhaY
```

4. **Ignite! (Ignição)**
`npm run dev`

Seus 4 pcs estão espelhados, dividindo e multiplicando a carga da agência. Não precisa fazer nada especial para sincronizar, basta clicar e pronto.

---
*Ambiente criado restritamente para operações táticas internas.*
