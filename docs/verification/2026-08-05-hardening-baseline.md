# Verificação independente da baseline de hardening — 2026-08-05

## Limite da evidência

Esta verificação foi executada na branch `codex/andor-product-hardening`, no commit
`b8bfc97`, sem credenciais Supabase, Google OAuth ou providers de IA no ambiente.
Por isso, os testes de autenticação Supabase/OAuth abaixo são testes de contrato com
mocks; não são apresentados como validação de staging.

## Estado inicial e comandos

| Verificação | Evidência | Resultado | Problema encontrado | Alteração efetuada |
| --- | --- | --- | --- | --- |
| Branch e árvore de trabalho | `git status --short --branch` | Branch correta; árvore limpa | Nenhum | Nenhuma |
| Commits de referência | `git log` e `git show --stat` para `bdb2a55`, `58eeab8`, `ac7c4f1`, `b8bfc97` | Os quatro commits estão no `HEAD`, pela ordem indicada | Nenhum | Nenhuma |
| Instalação limpa | `npm ci` | 261 pacotes instalados | A primeira tentativa encontrou `ENOTEMPTY` em `node_modules/core-js/modules`; a repetição limpa concluiu sem intervenção manual | Nenhuma alteração versionada |
| Testes unitários e de integração local | `npm test` | 65 ficheiros, 277 testes aprovados | A suite mistura unitários e integrações SQLite/mocks; não contém Postgres real | Nenhuma |
| E2E | `npm run test:e2e` | 54 testes aprovados em Chromium desktop e WebKit mobile | Uma primeira invocação com timeout externo de 5 s deixou Playwright/Next órfãos; os PIDs dessa execução foram terminados e a execução limpa concluiu em 40,2 s | Nenhuma alteração ao produto |
| Build de produção | `npm run build` | Next.js 16.2.12 compilou, validou TypeScript e gerou 45 rotas/páginas | Avisos do SQLite experimental, sem erro de build | Nenhuma |
| Gate de lançamento | `npm run check:launch` | Aprovado | Nenhum | Nenhuma |
| Dependências | `npm audit` e `npm audit --omit=dev` | 0 vulnerabilidades conhecidas | Nenhum | Nenhuma |
| Diferenças e ficheiros não versionados | `git diff --check`, `git status`, `git ls-files --others --exclude-standard` | Limpo no fim da baseline | Nenhum | Nenhuma |

## Afirmações do relatório anterior

| Afirmação verificada | Teste ou evidência | Resultado | Problema encontrado | Alteração efetuada |
| --- | --- | --- | --- | --- |
| Uma geração não persistida nunca é apresentada como guardada | `generate-itinerary-persistence.test.js`: guest draft, falha, exceção e sucesso sem ID; `wizard-preferences.test.jsx`: resolução da resposta | Confirmada localmente com mocks | Não prova falha real de rede/Postgres | Nenhuma; contrato atual é explícito |
| `durable` e `local_draft` têm comportamentos distintos | Os mesmos testes verificam navegação pelo ID apenas em `durable` e escrita no browser apenas em `local_draft` | Confirmada localmente | `localStorage` ainda precisa de confirmação de escrita nas edições do itinerário, fora deste fluxo de geração | Registado para o slice de edição |
| A geração exige exatamente o número de dias pedido | `itinerary-validation-regression.test.js` e casos `test.each([-1, 1])` da rota | Confirmada localmente | Provider real não executado | Nenhuma |
| Dias vazios são rejeitados | `itinerary-validation-regression.test.js`: `Day 2 has no activities` é fatal | Confirmada localmente | Provider real não executado | Nenhuma |
| Coordenadas absurdas são rejeitadas | Testes Menorca validam distância Haversine genérica e removem coordenadas de Tóquio num itinerário de Menorca | Confirmada no validator usado pela geração | `itinerary-store.js` legado ainda contém correções especiais para Tóquio; a garantia não é universal a todas as migrações client-side | Registado para remoção no modelo por etapas |
| Coimbra funciona sem depender de `name` | `wizard-preferences.test.jsx`: normalização, seleção e preservação de sugestão estruturada sem `name`; geração usa entidade estruturada | Confirmada localmente | Não foi exercitado um provider geográfico externo | Nenhuma |
| Lisboa e Tóquio têm dados geográficos válidos | `community-itinerary-demo.test.js` valida todas as atividades após normalização; `demo-regressions.spec.js` abre os dois mapas | Confirmada localmente e por E2E | São demos curadas, não resultados atuais de providers | Nenhuma |
| Redirects OAuth não permitem open redirect | `google-auth.test.js`: URLs externas e codificadas são rejeitadas; callback usa origem canónica | Confirmada com mocks | Sem round-trip OAuth real | Nenhuma |
| Login Google não cria identidade local falsa | `google-auth.test.js` e `LoginModal.test.jsx`: ausência de Supabase devolve erro de configuração | Confirmada com mocks | Sem credenciais Google/Supabase | Nenhuma |
| Analytics remove dados privados | `analytics-privacy.test.js`: chaves sensíveis, query strings, URLs, tokens de paths e payloads estruturados | Confirmada localmente | Analytics continua apenas em memória e sem consent manager/provider | Nenhuma nesta baseline |
| Newsletter exige consentimento explícito | `persistence-integrity.test.js`: rejeição sem `consent: true`, persistência e path sanitizado | Confirmada localmente com repository mockado | Sem double opt-in ou fornecedor real | Nenhuma nesta baseline |
| Convites preservam o destino após autenticação | `LoginModal.test.jsx` verifica o `redirectPath`; `google-auth.test.js` preserva o path seguro; `invitation-page.spec.js` abre o modal no URL do convite | Confirmada até à fronteira mockada | O regresso completo após Google OAuth real não foi executado | Nenhuma |

## Divergências encontradas

1. O relatório anterior descrevia o schema como alinhado, mas a cadeia de migrations
   não cria uma base vazia: `202608020001_sprint1_identity_authorization.sql` começa
   por alterar `public.itineraries`, e a migration seguinte pressupõe `profiles`.
2. `supabase/schema.sql` e a migration/repository divergem no estado inicial da
   viagem: o snapshot restringe o insert a `active`, enquanto o repositório grava
   `draft` e a migration/teste RLS usam `draft`.
3. `supabase/tests/sprint1_rls_matrix.sql` existe, mas não tinha sido executado contra
   Postgres/Supabase nesta máquina. O teste JavaScript do schema valida apenas texto.
4. A aceitação de convite Supabase faz o upsert do membro e o update do convite em
   duas requests administrativas; portanto não é atómica apesar de o fluxo SQLite
   usar uma transação.
5. Não existe `.env.local`; Google OAuth e um projeto Supabase remoto permanecem sem
   validação real. O sucesso dos testes mockados não altera esse estado.

Estas divergências são entradas obrigatórias da fase seguinte e não são consideradas
resolvidas por este documento.
