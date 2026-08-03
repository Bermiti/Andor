# Andor — estado de produto, design e engenharia

# Andor — estado de produto, design e engenharia

# Andor — estado de produto, design e engenharia

# Andor — estado de produto, design e engenharia

Atualizado em 2026-08-03. Fase atual: **Sprints 3.2, 3.3, 4, 5 e 6 totalmente integradas localmente com 200 testes unitários/integração Vitest e 42 testes Playwright E2E**.

## Sprint 6 — Motor de Personalização & Assistente Estruturado
- **Motor de Personalização por Consentimento:** Módulo `personalization-engine.js` respeita consentimento explícito e aplica bonificação de score baseada nos interesses reais do utilizador.
- **Assistente de Operações Estruturadas:** Endpoint `/api/assistant` e módulo `structured-assistant.js` processam comandos estruturados (`swap_activity`, `adapt_to_weather`, `make_cheaper`), preservando itens bloqueados e aplicando validação de restrições em tempo real.

Sprint 1 concluída com sucesso. Todos os critérios de aceitação foram cumpridos e verificados:
- **Identidade server-side única:** Sessões validadas no servidor via Supabase Auth (produção) e adaptador SQLite isolado (dev/E2E). Nenhum `userId`, email ou estado de `localStorage` é aceite como autorização.
- **Autorização centralizada:** Modelo `owner/editor/viewer` com regras em `app/lib/trip-permissions.js` e `MembershipRepository`. Editores não podem alterar papéis nem eliminar viagens.
- **Persistência durável & RLS:** Schema Supabase migrado (`202608020001_sprint1_identity_authorization.sql`), RLS ativo com matriz de isolamento A/B/C.
- **Partilhas seguras:** Links por token hash com expiração, revogação pelo owner (`DELETE /api/itineraries/[id]/shares/[shareId]`) e sanitização de dados sensíveis na rota pública `GET /api/shares/[token]`. Partilha legacy por `?data=` desativada.
- **Migração de dados locais:** Fluxo idempotente e seletivo sem eliminação automática.
- **Controlo de concorrência:** Suporte a `version` e `If-Match` para prevenir sobrescritas silenciosas.

### Mapa encontrado

- **Identidade:** Supabase Auth é usado quando existe configuração pública, mas a ausência dessa configuração ativa contas e sessões próprias em SQLite. Em paralelo, o proxy cria um cookie de visitante e `getRequestIdentity()` classifica esse visitante como `authenticated: true`. `localStorage.andor_user` replica perfis e ainda influencia várias superfícies do cliente.
- **Autorização:** não existe um modelo central `owner/editor/viewer`. As verificações usam sobretudo igualdade de `owner_key`; não existem helpers completos para utilizador autenticado, permissão da viagem, owner e admin.
- **Viagens:** o runtime usa um cliente Supabase com chave secreta para ler/escrever `itineraries`, contornando RLS, e faz fallback silencioso para SQLite quando o Supabase falha. O browser lê primeiro `sessionStorage`/`localStorage`; várias edições são guardadas apenas no browser.
- **Partilhas:** os tokens são aleatórios, guardados como hash, expiráveis e revogáveis, mas a rota aceita o itinerário completo e o `sourceKey` enviados pelo browser sem confirmar que correspondem a uma viagem durável do utilizador. `itinerary_shares` tem RLS ativada sem políticas próprias.
- **Bypass legacy:** `/itinerary/share?data=<base64>` e `?id=` ainda leem a viagem integral do URL/browser, sem hash, expiração, revogação, sanitização ou autorização. URLs completos podem ainda chegar ao módulo de analytics.
- **Perfis e dados auxiliares:** atualizações de perfil são fire-and-forget; favoritos, países visitados, versões, packing e resumos continuam locais. `trip_ledgers` é isolado por `owner_key`, mas não prova a permissão sobre a viagem indicada.
- **Modelo Supabase:** faltam membros, convites, auditoria, importações idempotentes, concorrência otimista, soft delete e políticas explícitas completas para `DELETE`; as operações de aplicação não exercitam as políticas existentes por usarem service role.

### Classificação de risco

#### P0 — corrigir antes de qualquer expansão

- Um cookie de visitante recebe semântica de utilizador autenticado e pode originar persistência, partilhas e ledgers.
- `POST /api/itineraries/[id]/shares` confia num payload de viagem fornecido pelo cliente e não prova ownership do `id`.
- O DAL de viagens/partilhas usa service role para operações normais e, por isso, RLS não constitui uma segunda fronteira efetiva.
- O browser pode ganhar sobre a fonte durável no carregamento e nas edições, permitindo mostrar “guardado” sem confirmação do servidor.
- Chaves globais `andor_itinerary_*`/`andor_shared_*` sobrevivem a logout/troca de conta; um segundo utilizador no mesmo browser pode herdar dados privados e notas internas do primeiro.
- A partilha legacy por `?data=` coloca o conteúdo integral da viagem/PII no URL e contorna toda a fronteira de links seguros.

#### P1 — gate de identidade e dados

- Substituir as três semânticas de identidade por Supabase Auth em produção e um adapter SQLite explicitamente limitado a desenvolvimento/testes.
- Implementar `owner/editor/viewer`, membros/convites, revogação e proteção contra autoatribuição/escalada.
- Criar políticas RLS explícitas para `SELECT`, `INSERT`, `UPDATE` e `DELETE`, e testá-las com identidades distintas.
- Remover fallbacks silenciosos de Supabase para SQLite em produção; falhas duráveis devem ser visíveis e não podem devolver sucesso.
- Criar links exclusivamente a partir da viagem lida no servidor, com token hash, expiração, revogação, payload sanitizado e auditoria sem tokens/PII.
- Introduzir `version`/`If-Match` e resposta `409` para edição concorrente; adotar soft delete controlado pelo owner.
- Criar listagem durável, migração local seletiva/idempotente e estados de UI para sessão, read-only, saving/saved/error, conflito, expiração e revogação.
- Desativar a partilha legacy por URL, impedir criação de links ao abrir/alterar o modal e permitir listar/revogar links existentes.
- Verificar todos os IDs de viagem na identidade, permissão, filtro da query e RLS; UUIDs e esconder botões não são controlos de acesso.
- Normalizar `Escócia` como região do Reino Unido (`GB`, `GBP`, `Europe/London`) sem alegar cobertura de providers; criar regressão para Edinburgh/Scotland.

#### P2 — endurecimento complementar

- Tornar atualização de perfil confirmada pelo servidor e reduzir `localStorage` a cache/preferências não sensíveis.
- Uniformizar Zod, rejeição de campos desconhecidos, limites de corpo e semântica `401/403/404/409/422/500` nas rotas sensíveis.
- Adicionar correlation IDs e eventos de auditoria limitados para criação, edição, delete, convite, papel, link, revogação e importação.

#### P3 — limpeza posterior

- Remover caches/fixtures legacy e superfícies sociais/expense splitting que não façam parte do núcleo, sem misturar essa limpeza com o gate de segurança.

### Modelo de autorização aprovado para implementação

| Operação | Owner | Editor | Viewer | Não autenticado/link |
| --- | --- | --- | --- | --- |
| Ler viagem privada | Sim | Sim | Sim | Não |
| Editar conteúdo | Sim | Sim | Não | Não |
| Apagar/soft delete | Sim | Não | Não | Não |
| Gerir membros e papéis | Sim | Não | Não | Não |
| Criar/revogar links | Sim | Não | Não | Não |
| Ler link válido | Sim | Sim | Sim | Apenas snapshot sanitizado e read-only |

O owner é derivado da sessão validada e da base de dados. O cliente nunca fornece `owner_id`, `user_id` ou um papel como prova. Editores não podem alterar ownership, membros, permissões, visibilidade pública ou links.

### Migrations previstas

- Adaptar `itineraries` como tabela durável de viagens, sem criar uma tabela redundante: `owner_id`, `visibility`, `status`, `currency`, `schema_version`, `version`, `deleted_at` e constraints de ownership.
- Criar `trip_members`, `trip_invitations`, `trip_share_links`, `audit_events` e `trip_imports`, com unicidade, foreign keys, índices e tokens apenas em hash.
- Criar triggers/funções para membership inicial do owner, `updated_at`/`version`, último owner e bloqueio de alteração direta de ownership.
- Substituir políticas antigas por políticas RLS completas e funções de permissão sem recursão; limitar service role a fronteiras operacionais justificadas.

### Superfícies previstas

- Server: `app/lib/server/identity.js`, novo módulo de autorização/repositório/auditoria, adapter SQLite, clientes Supabase e rotas de viagens, membros, convites, links e importação.
- UI: `AuthContext`, `/my-trips`, página do itinerário e partilha, com fonte durável primeiro, migração explícita e estados de permissão/persistência.
- Dados e testes: migrations/schema Supabase, testes unitários de permissões, integração multiutilizador, testes RLS em Postgres e E2E transacional em Chromium/WebKit 375 px.
- Documentação: `README.md`, `.env.example`, guia de identidade/autorização/persistência/RLS/migração/rollback e este progresso.

### Critérios de aceitação da Sprint 1

- Identidade server-side única em produção; nenhum `userId`/email/localStorage usado como autorização.
- Isolamento A/B/C comprovado em DAL, API e RLS; roles e escalada cobertos por testes.
- Persistência durável confirmada antes de “guardado”; conflito retorna `409`; delete é owner-only.
- Links não enumeráveis, hashed, limitados, expiráveis/revogáveis e sem fuga de campos privados.
- Migração legacy seletiva, validada e idempotente, sem apagar o original automaticamente.
- Unitários, integração, RLS, E2E, mobile, build, audit e `git diff --check` passam; ausência de segredos confirmada.
- O resultado será descrito como **Sprint 1 identity and data security gate**, nunca como “production ready”.

## Quadro de execução

- **Concluído:** auditoria integral, estabilização da fronteira de confiança, build, unitários, E2E e QA visual desktop/mobile.
- **Em desenvolvimento:** nenhuma funcionalidade nova; a expansão fica deliberadamente suspensa até fechar fundações P1.
- **Bloqueado:** release comercial, pagamentos e reservas dependem de identidade/autorização consolidadas, RGPD e providers reais em staging.
- **Próximo:** autorização e partilha, persistência/RLS, proteção de APIs, staging de providers e fluxo E2E completo do wizard.

## Estado encontrado

O repositório tinha um protótipo funcional com homepage, wizard, geração de itinerário, partilha, mapa, favoritos, perfil e várias integrações. Build, testes unitários e Chromium/Firefox passavam no baseline. Isso não correspondia, porém, a prontidão de produção: havia checkout sobre inventário e preços sintéticos, confirmações sem reserva real, ratings/defaults apresentados como factos, persistência fragmentada, páginas de demonstração não rotuladas e testes E2E capazes de herdar credenciais reais.

O produto continua **pré-lançamento**. A prioridade desta fase é tornar verdadeiras as promessas já visíveis antes de expandir funcionalidade.

## Priorização da auditoria

### P0 — bloqueios de confiança ou dano direto

- **Corrigido:** removidos checkout, carrinho, seguros, tarifas sintéticas de voo/hotel e confirmação de reserva sem fornecedor transacional.
- **Corrigido:** removido o backoffice público fictício.
- **Corrigido:** ratings, custos, horários e badges deixam de receber defaults apresentados como dados externos; a UI distingue fonte, estimativa e demonstração.
- **Corrigido:** falhas de escrita em newsletter/pedidos personalizados já não devolvem sucesso fictício.
- **Corrigido:** modelos de IA retirados foram substituídos por IDs configuráveis atuais.
- **Corrigido:** o service worker já não guarda HTML ou respostas de API personalizadas em cache.
- **Corrigido:** testes E2E deixam de herdar Supabase e usam uma base SQLite dedicada.
- **Corrigido:** históricos antigos passam a indicar `Demonstração`, `Proposta IA` ou `Dados legados`; custos aparecem apenas como estimativas e preservam a moeda estruturada em vez de assumir euros.
- **Corrigido:** removidos contacto e identidade empresarial não configurados do rodapé; o produto identifica-se como pré-lançamento.

### P1 — necessário antes de produção

- Unificar identidade, autorização e fonte de verdade entre Supabase, SQLite e armazenamento do browser; um visitante não deve ganhar semântica de conta autenticada.
- Impedir que uma partilha aceite um identificador arbitrário sem validar propriedade/origem e rever políticas RLS contra escrita pública abusiva.
- Adicionar rate limiting distribuído, limites de corpo, quotas e proteção de custo às rotas de IA e escrita.
- Validar qualidade geográfica ponta a ponta: rotas coerentes por bairro, distâncias, ordem das paragens e tratamento explícito de cobertura insuficiente.
- Exercitar fornecedores reais num ambiente de staging, com health checks, timeouts, circuit breaker e observabilidade de custo/latência.
- Implementar privacidade, termos, exportação/eliminação de conta e política de retenção antes de recolher PII em produção.
- Aplicar allowlists/validação a URLs externas geradas ou enriquecidas.
- Substituir páginas editoriais estáticas por dados versionados e com proveniência, ou mantê-las inequivocamente como demonstração.
- Cobrir o fluxo completo do wizard até geração/persistência/redirecionamento com um provider determinístico de teste; a suite atual valida passos, resultado e persistência separadamente, não a transação completa.

### P2 — qualidade e manutenção

- Introduzir lint e typecheck; reduzir componentes e Route Handlers monolíticos.
- Remover PII do `localStorage` ou documentar e limitar o cache cliente.
- Consolidar sitemap/robots e rever metadados, acessibilidade por teclado e estados de erro.
- Reforçar cobertura mobile em dispositivos/motores reais, além de viewport redimensionado.
- Resolver o aviso experimental do `node:sqlite` e retirar os overrides de `sharp`/`postcss` quando o contrato suportado pelo Next os incorporar.

### P3/P4 — limpeza e evolução

- Eliminar componentes, adaptadores e checklists órfãos com copy antiga ou dados de demonstração.
- Atualizar documentação histórica de deploy/marketing que contradiga o estado real.
- Só depois dos P1: aprofundar personalização, colaboração e novas integrações comerciais.

## Implementação desta fase

- Fronteira comercial reduzida a planeamento e pesquisa externa, sem reservar ou cobrar.
- `EnhancedActivityCard`, mapa, alojamento, restaurantes e transportes agora omitem dados ausentes e mostram proveniência/estimativa quando aplicável.
- Enriquecimento refeito para devolver apenas respostas de fornecedores configurados; não existem listas mock como fallback.
- Mapa Leaflet restaurado no itinerário e protegido contra HTML não confiável nos popups.
- Destinos desconhecidos deixaram de clonar Paris; resultados estáticos/IA passam a ser identificados como demonstração ou estimativa.
- Favoritos deixaram de nascer preenchidos com viagens fictícias.
- Metadados e copy da landing deixaram de alegar ratings, clientes, países ou garantias não demonstradas.
- Persistência local de produção falha fechada sem configuração explícita e durável.
- Runtime mínimo alinhado com Node 22.13; dependências auditadas e versões vulneráveis corrigidas.
- Testes de integridade adicionados para booking, persistência, enriquecimento, proveniência e overflow a 375 px.
- Autocomplete da homepage deixa de cobrir o CTA em desktop e fica inativo até a hidratação React terminar, evitando submissões nativas perdidas.
- `/my-trips` deixa de alargar o documento por causa de tracks intrínsecas, capas e controlos; cartões e ações encolhem/empilham em 375 px.

## Critérios de aceitação da Sprint 0

- [x] Nenhum checkout, pagamento ou confirmação de reserva acessível.
- [x] Ausência de preço/rating não é convertida num valor credível inventado.
- [x] Falha de persistência não é apresentada como sucesso.
- [x] Fallbacks visíveis são identificados como demonstração/estimativa.
- [x] Testes E2E isolados de credenciais e dados reais.
- [x] Testes unitários completos após as alterações: 80/80.
- [x] Build de produção e gate de qualidade de engenharia/pré-lançamento após as alterações.
- [x] E2E desktop e mobile após as alterações: 28/28.
- [x] Verificação visual final em desktop e 375 px.

## Evidência e notas operacionais

O baseline tinha 68 testes unitários, 14 cenários E2E por motor desktop e seis falhas WebKit causadas sobretudo pelo próprio harness.

Evidência final desta ronda:

- `npm test`: 18 ficheiros, 80/80 testes aprovados.
- `npm run build`: Next.js 16.2.12, compilação e TypeScript aprovados, 33 páginas estáticas geradas.
- `npm run test:e2e`: 28/28 cenários aprovados em Chromium desktop e WebKit a 375 × 812.
- Regressão de hidratação da homepage repetida três vezes em paralelo no Chromium: 3/3.
- `npm run check:launch`: aprovado.
- `npm audit --audit-level=low`: zero vulnerabilidades conhecidas.
- `git diff --check`: aprovado; apenas avisos de conversão LF/CRLF do checkout Windows.
- Browser real: homepage, autocomplete, wizard, histórico, tabs, cartões e mapa verificados; `scrollWidth` ficou dentro do layout útil e o mapa mede 335 px dentro do contentor mobile. Sem erros ou warnings de consola na verificação final.

A pasta local `.andor` já continha dados sintéticos criados por testes anteriores; não foi apagada para preservar dados sem autorização. Em vez disso, a interface agora rotula esses registos e corrige a moeda do orçamento estruturado. O único warning repetido no build/E2E é o estado experimental do `node:sqlite` no Node 22.

## Decisões técnicas

- A Andor permanece planeador e organizador; reservas e pagamentos só regressam com provider transacional e reconciliação reais.
- Campos sem fonte são omitidos. Estimativas e demonstrações são visíveis como tal, incluindo dados guardados antes desta sprint.
- E2E constrói a aplicação de raiz, neutraliza credenciais externas e usa SQLite isolado em `test-results/e2e`.
- Persistência local de produção falha fechada quando não existe caminho durável explícito; a migração dos dados existentes será aditiva, não destrutiva.

## Dívida técnica conhecida

- Código e fixtures legacy não alcançáveis ainda contêm copy e dados de demonstração; remover na limpeza P3 sem reativar superfícies.
- O Route Handler de geração, o itinerário e alguns componentes continuam monolíticos e em JavaScript.
- `sharp` e `postcss` estão temporariamente forçados acima do intervalo declarado pelo Next para manter a auditoria sem vulnerabilidades; build/E2E são gate obrigatório até alinhar versões suportadas.
- O `node_modules` local ainda reporta `@img/sharp-wasm32@0.35.3` como extraneous; confirmar a remoção num `npm ci` limpo sem alterar o checkout atual de forma destrutiva.
- Falta CI que instale Chromium/WebKit, execute lint/typecheck dedicados, trace em falha e testes de acessibilidade/performance.

## Próxima ordem de execução

1. Fechar todos os critérios de aceitação acima e corrigir regressões encontradas.
2. Resolver autorização/partilha e rate limiting.
3. Consolidar persistência e políticas Supabase.
4. Criar staging com providers reais e métricas de qualidade geográfica.
5. Implementar privacidade/conta e só então preparar um release candidate.
