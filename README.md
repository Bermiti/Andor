# Andor

Andor é uma aplicação de planeamento de viagens em fase pré-lançamento. Cria e edita propostas de itinerário, mostra paragens num mapa e permite guardar ou partilhar planos. Não vende viagens, não confirma reservas e não substitui a validação de preços, horários, vistos, segurança ou disponibilidade nos fornecedores oficiais.

Conteúdo gerado por IA e fallbacks editoriais são propostas de planeamento. Quando não existe uma fonte externa, a interface deve identificá-los como estimativas ou demonstração — nunca como dados verificados.

## Estado atual

- Next.js 16 App Router, React 19, CSS Modules e Leaflet.
- Geração e adaptação de itinerários por Google Gemini, Anthropic ou Groq, conforme as chaves configuradas.
- Enriquecimento opcional por Wikipedia, OpenTripMap, Foursquare e Amadeus. Campos sem resposta de fornecedor ficam ausentes; não são preenchidos com ratings ou preços inventados.
- Supabase é a persistência durável prevista para produção. SQLite é suportado para desenvolvimento local e self-hosting com volume persistente explícito.
- A pesquisa de voos, hotéis e automóveis abre fornecedores externos. Andor não processa checkout nem marca reservas como confirmadas.

O produto ainda não está pronto para produção. O diagnóstico, as correções concluídas e os bloqueios seguintes estão em [ANDOR_PROGRESS.md](ANDOR_PROGRESS.md).

## Requisitos

- Node.js 22.13 ou superior
- npm

## Configuração local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sem credenciais Supabase, o desenvolvimento pode usar `.andor/andor.sqlite`. Sem um fornecedor de IA, os fluxos suportados usam conteúdo local claramente marcado como demonstração.

As variáveis e notas de segurança estão em [.env.example](.env.example). As migrations em [supabase/migrations](supabase/migrations) são a fonte canónica do schema; `supabase/schema.sql` é apenas um snapshot gerado para inspeção. O processo local e a checklist remota estão em [docs/STAGING_RUNBOOK.md](docs/STAGING_RUNBOOK.md). A configuração externa do provider Google está documentada em [docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md). Os materiais de validação comercial, lifecycle e analytics estão organizados em [docs/commercial/README.md](docs/commercial/README.md).

## Validação

```bash
npm test
npm run build
npm run test:e2e
npm run check:launch
npm audit
```

Os testes E2E criam uma base SQLite isolada dentro de `test-results/e2e`; não devem usar credenciais Supabase reais herdadas da máquina.

Com Docker ativo, a validação real de migrations, RLS, Supabase Auth e do
percurso completo da aplicação contra a stack local é:

```bash
npm run db:start
npm run db:verify
```

## Regras de produto

- Não apresentar ratings, preços, horários ou disponibilidade sem fonte identificável.
- Não representar um clique como reserva, pagamento ou confirmação quando apenas abre uma pesquisa externa.
- Não devolver sucesso de newsletter ou pedido personalizado se a escrita durável falhar.
- Não promover um fallback local como resposta em tempo real.
- Não expor chaves secretas com prefixo `NEXT_PUBLIC_`.

## Deploy

Um deploy público requer, no mínimo, Supabase configurado, políticas RLS revistas, fornecedores ativos monitorizados e conclusão dos P1 registados em `ANDOR_PROGRESS.md`. SQLite efémero não é adequado a plataformas serverless. Define `NEXT_PUBLIC_SITE_URL` para o domínio canónico e mantém todas as chaves privadas apenas no ambiente do servidor.
