# Relatório final de evidência — criação de roteiros e redesign

Data da validação: 2026-08-16<br>
Branch: `codex/andor-product-hardening`<br>
Base auditada: `main`

## 1. Root cause

O erro visível no fim de “Criar roteiro” não tinha uma única causa isolada. Havia uma quebra de contrato entre as camadas:

1. `CreationExperience` enviava `travelStyle`, `budgetTier`, um objeto em `travelers` e datas aninhadas, enquanto a API espera `style`, `budget`, um número de viajantes e `startDate`/`endDate` no topo.
2. O cliente considerava a resposta válida apenas se existisse `data.ok`. A resposta de sucesso real da API nunca incluiu esse campo, pelo que uma geração bem-sucedida era transformada em erro no browser.
3. A resposta explícita `local_draft` para convidados não era guardada no browser e não produzia um identificador navegável.
4. Cada retry criava uma intenção nova, anulando a proteção de idempotência e permitindo duplicações.
5. A arquitetura anterior também misturava respostas HTTP 200, falhas de persistência, IDs sintéticos e `localStorage`, sem uma source of truth inequívoca.

A correção central está em `app/lib/generation-client.js` e `app/components/CreationExperience.js`: existe agora um adaptador único do intent para o contrato da API, validação do contrato de sucesso, persistência explícita do modo convidado e reutilização da mesma chave de idempotência quando o payload não muda.

## 2. Arquitetura anterior e nova

Fluxo anterior:

```text
UI/wizard → payload divergente → API/IA → resposta ambígua
          → teste inexistente de data.ok → erro no cliente
          → ID sintético/localStorage ou viagem desaparecida
```

Fluxo atual:

```text
Natural-language wizard
  → generation-client (contrato canónico + fingerprint)
  → POST /api/generate-itinerary (Idempotency-Key)
  → schema/validation
  → AI provider boundary
  → parsing + normalization do domínio
  → persistência durável (Supabase/SQLite) ou local_draft explícito
  → response resolver
  → /itinerary/:id → refresh → My Trips → reabrir
```

Falhas do provider, timeout, output inválido e persistência usam erros estruturados; sem dados suficientes ou credenciais o servidor devolve erro explícito e não inventa um roteiro.

## 3. Alterações principais

- `app/lib/generation-client.js`: payload canónico, datas, viajantes, multi-destino, validação da resposta e idempotência.
- `app/components/CreationExperience.js`: integração com o contrato real, preservação do formulário, retry, persistência de convidado, navegação e semântica de diálogo.
- `app/components/StageNavigator.js`: datas determinísticas entre SSR e browser, eliminando o mismatch de hidratação.
- `app/components/Navbar.js` e `Navbar.module.css`: hamburger retirado do drawer oculto, scrim funcional e atributos ARIA.
- `tests/scotland-creation.spec.js`: ciclo completo da viagem da Escócia em desktop e mobile.
- `__tests__/generation-client.test.js` e `__tests__/CreationExperience.test.jsx`: contratos, destinos, falhas e retry.
- `package-lock.json`: DOMPurify 3.4.13 e nanoid 3.3.18, removendo os advisories detetados.

## 4. Escócia e independência de destino

O cenário E2E parte da homepage com “7 dias na Escócia em família com natureza” e comprova:

- payload correto (`7` dias, `4` viajantes, natureza, ritmo equilibrado);
- timeout estruturado, formulário preservado e retry com a mesma chave de idempotência;
- persistência através da API real de itinerários em SQLite;
- sete dias, atividades, navegação entre dias e mapa;
- refresh, listagem em My Trips e reabertura da mesma viagem;
- ausência de overflow a 320, 375, 390 e 430 px.

A fixture está identificada como dado de teste e não introduz ratings, preços ou horários apresentados como verificados. Testes unitários adicionais constroem payloads para Japão e Marrocos, provando que o adaptador não depende de hardcodes da Escócia.

## 5. Redesign e qualidade de produto

O trabalho acumulado desta branch substitui a landing page e os fluxos genéricos por uma experiência editorial dark, criação por linguagem natural, perguntas adaptativas, demonstração interativa, detalhe integrado com mapa, edição parcial e estados de viagem persistidos. A validação final corrigiu ainda duas regressões do redesign: o menu mobile inacessível e a formatação de datas dependente do locale do servidor.

As melhorias de performance já presentes na branch incluem imports dinâmicos para superfícies pesadas, otimização de imagens/fontes e contenção das client boundaries. O build de produção continua a compilar 45 páginas/rotas sem erro.

## 6. Evidência de validação

| Gate | Resultado |
| --- | --- |
| Instalação limpa | `npm ci` PASS |
| Unitários + integração Vitest | 80/80 ficheiros, 395/395 testes PASS |
| E2E Chromium desktop | 28/28 PASS |
| E2E WebKit mobile | 28/28 PASS |
| E2E total | 56/56 PASS |
| Repetição do fluxo adaptativo | 6/6 PASS |
| Checklist staging | 45/45 PASS |
| Avaliador de itinerários | 6/6 destinos PASS; scores 90–97; 0 falhas fatais |
| Lint | Não existe script/configuração de lint no repositório |
| Typecheck standalone | Não existe script; a etapa TypeScript do `next build` passou |
| Build Next.js 16.2.12 | PASS, 45/45 páginas estáticas geradas |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Segredos no tree/histórico | Nenhum match de formatos de credenciais; só `.env.example` versionado |

## 7. Commits desta fase final

- `8dc7d92` — `fix(creation): align generation persistence contract`
- `d991f44` — `fix(ui): restore responsive navigation and hydration`
- `930b9c8` — `test(creation): cover Scotland lifecycle and retries`
- `00d2b17` — `chore(deps): patch audited transitive packages`

Estes commits seguem os commits de auditoria, arquitetura, redesign, acessibilidade, E2E e performance já presentes na mesma branch.

## 8. Limitações e riscos conhecidos

- A geração live contra um provider de IA não foi executada porque o ambiente local não possui chaves externas. Esse caso foi reproduzido e devolve `503 ITINERARY_DATA_UNAVAILABLE` de forma segura, sem inventar dados.
- Supabase cloud, Google OAuth e Upstash continuam dependentes de credenciais/configuração de staging. A persistência E2E foi validada no provider SQLite local.
- O avaliador penaliza fixtures sem `ratingSource`; os ratings foram deliberadamente omitidos em vez de fabricados. Todos os destinos passam e não existem falhas fatais.
- O repositório ainda não fornece comandos independentes de lint e typecheck; isto deve ser acrescentado numa futura melhoria de tooling.
