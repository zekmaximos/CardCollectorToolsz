# PokéÁlbum Financeiro

MVP em Next.js App Router para controlar albuns de cartas Pokemon, valores pagos, valores declarados e gastos gerais. O projeto usa Supabase Auth/Postgres, TailwindCSS e uma rota interna para consultar a Pokemon TCG API sem expor a chave no client.

## Estrutura principal

```txt
src/app
  api/cards/search/route.ts   Rota interna para Pokemon TCG API
  login/page.tsx              Login e cadastro por email/senha
  dashboard/page.tsx          Resumo financeiro
  albums/page.tsx             Lista e criacao de albuns
  albums/[id]/page.tsx        Cartas do album
  cards/search/page.tsx       Busca e adicao de cartas
  expenses/page.tsx           Cadastro/lista de gastos
  reports/page.tsx            Relatorios simples
src/components                Componentes reutilizaveis do MVP
src/utils/supabase            Helpers client/server/proxy do Supabase
src/types                     Tipos do dominio
database/schema.sql           SQL completo com tabelas, indices e RLS
```

## Configuracao local

1. Instale dependencias:

```bash
npm install
```

2. Crie `.env.local` usando `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://woekkhvdoaortvslebdk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_publishable_key
SUPABASE_SERVICE_ROLE_KEY=
POKEMON_TCG_API_KEY=
```

3. No Supabase, rode o SQL de `database/schema.sql` no SQL Editor.

4. Inicie o app:

```bash
npm run dev
```

## Variaveis na Vercel

No projeto Vercel conectado ao GitHub, configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas se quiser compatibilidade com nome legado
- `POKEMON_TCG_API_KEY` opcional, recomendada para maior limite de API
- `SUPABASE_SERVICE_ROLE_KEY` somente se uma futura rota server-side realmente precisar; este MVP nao usa no frontend nem no codigo atual

Depois de salvar as variaveis, faca redeploy. Como o Vercel esta conectado ao GitHub, pushes na branch principal disparam novo deploy.

## Seguranca

- A chave da Pokemon TCG API so e usada em `src/app/api/cards/search/route.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` nao e exposta nem usada no client.
- Todas as queries de dados do usuario filtram por `user_id`.
- RLS esta ativo em `profiles`, `albums`, `user_cards`, `expenses` e `price_snapshots`.
- `price_snapshots` so e acessivel quando a carta relacionada pertence ao usuario autenticado.

## Proximos passos

- Aplicar o SQL no Supabase e testar cadastro/login.
- Adicionar confirmacao visual para sucesso/erro nas Server Actions.
- Criar historico automatico em `price_snapshots`.
- Adicionar filtros e paginacao em albuns, gastos e relatorios.
- Conectar uma chave real da Pokemon TCG API em Vercel.
