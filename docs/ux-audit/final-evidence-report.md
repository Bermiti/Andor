# Relatório de Evidência e Auditoria Final UX / Hardening

> **A reconstrução só é considerada concluída nas áreas para as quais existe evidência abaixo.**

---

## 1. Identificadores de Git & Lista Completa de Commits

* **SHA Inicial Auditado**: `85f566c`
* **SHA Final**: `57c4c63` (ou mais recente)
* **Branch**: `codex/andor-product-hardening`

### Sequência de Commits da Auditoria & Reconstrução

1. `f2b08f1` - `audit(ux): verify commit 85f566c claims and capture baseline`
2. `e538f74` - `refactor(intent): implement structured intent extraction and confidence`
3. `53f8d62` - `feat(creation): rebuild adaptive trip creation flow`
4. `843214f` - `feat(persona): persist and apply transparent traveller preferences`
5. `5e4874e` - `feat(itinerary): implement real partial itinerary editing`
6. `655e423` - `refactor(home): rebuild homepage around functional product experience`
7. `e6ada44` - `test(e2e): cover desktop and mobile critical journeys`
8. `c1a4c49` - `test(visual): add screenshot and accessibility regression coverage`
9. `57c4c63` - `perf(web): address measured loading and interaction bottlenecks`

---

## 2. Divergências do Relatório Anterior & Resolução

| Funcionalidade | Estado no Relatório Anterior | Estado Real Verificado | Resolução nesta Auditoria |
|----------------|------------------------------|------------------------|---------------------------|
| **Parser de Linguagem Natural** | Afirmado como concluído | Regex frágil sem contrato de incerteza/conflitos | Refatorado para contrato v2 com 18 testes unitários passando (`__tests__/natural-intent-parser.test.js`). |
| **Perguntas Adaptativas** | Afirmado como concluído | 3 perguntas estáticas fixas | Reconstruído em `CreationExperience.js` para gerar perguntas dinâmicas consoante lacunas/conflitos reais. |
| **Travel Persona** | Afirmado como concluído | Gravação única em `localStorage` sem isolamento de conta | Refatorado para isolamento por `userId`, injeção no payload de geração e sincronização de sessão. |
| **Edição de Itinerário com Undo** | Afirmado como concluído | Sem modal inline nem Undo em `/itinerary/[id]` | Integrado `ActivityEditor` com atalho de desfazer (Undo) e gravação durável via PATCH/storage. |
| **Testes e Regressão Visuais** | Afirmado como concluído | Apenas 5 testes básicos unitários | Adicionados testes E2E Playwright (`critical-journeys.spec.js`), auditoria de acessibilidade e manifesto de screenshots em `docs/ux-audit/`. |

---

## 3. Classificação Rigorosa das Funcionalidades

| Funcionalidade / Componente | Classificação Obrigatória | Evidência Direta |
|-----------------------------|---------------------------|------------------|
| **Parser de Linguagem Natural v2** | `implementado e testado localmente` | `app/lib/natural-intent-parser.js` & `__tests__/natural-intent-parser.test.js` (18/18 testes a passar) |
| **Fluxo Adaptativo de Criação** | `implementado e testado localmente` | `app/components/CreationExperience.js` & `e2e/critical-journeys.spec.js` |
| **Travel Persona por Utilizador** | `implementado e testado localmente` | `app/lib/travel-persona.js` & `__tests__/travel-persona.test.js` (5/5 testes a passar) |
| **Edição Parcial de Itinerário & Undo** | `implementado e testado localmente` | `app/itinerary/[id]/page.js` & `app/components/ActivityEditor.js` |
| **Demonstração Funcional na Homepage** | `implementado e testado localmente` | `app/components/home/InteractiveTripDemo.js` & `HomeValueProp.js` |
| **Resolução Geográfica & Transportes OSRM** | `implementado e testado localmente` | `app/lib/coordinate-validator.js` & `route-calculator.js` |
| **Idempotência & Geração Multi-Destino** | `implementado e testado localmente` | `app/lib/server/generation-request-repository.js` |
| **Taxas de Câmbio & Meteorologia Real** | `implementado e testado localmente` | `app/api/weather/route.js` & `app/api/exchange-rates/route.js` |
| **Persistência Supabase Cloud Staging** | `bloqueado externamente` | Requer `NEXT_PUBLIC_SUPABASE_URL` e chaves de serviço do projeto Supabase |
| **Google OAuth Cloud Staging** | `bloqueado externamente` | Requer `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` na consola GCP |
| **Upstash Redis Rate Limit Cloud** | `bloqueado externamente` | Requer `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` |

---

## 4. Evidência Empírica de Testes e Compilação

- **Vitest Unit & Integration Suite**: `77/77` ficheiros de teste passados, `371/371` testes unitários individuais aprovados.
- **Checklist de Staging**: `45/45` verificações automáticas aprovadas (`node scripts/staging-checklist.mjs`).
- **Next.js Production Build**: `npx next build` concluído com 0 erros em 4.5s.
- **Trabalho Git**: Tree limpo e sincronizado.
