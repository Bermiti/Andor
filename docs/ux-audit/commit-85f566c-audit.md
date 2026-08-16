# Auditoria de Código do Commit `85f566c`

> **Commit**: `85f566c` (`feat(ux): implement natural language intent parser, hybrid creation experience, travel persona drawer, and editorial home redesign`)  
> **Data da Auditoria**: 2026-08-05  
> **Avaliador**: Antigravity Automated & Empirical Audit  

## Tabela de Auditoria de Afirmações vs Código Real

| Afirmação anterior | Evidência no código | Teste real | Resultado | Problema | Estado |
|-------------------|-------------------|------------|-----------|----------|--------|
| **Entrada por linguagem natural** | `app/lib/natural-intent-parser.js` | `natural-intent-parser.test.js` (5 testes simples) | Parcial | O parser é baseado estritamente em expressões regulares (regex) e listas estáticas (`DESTINATION_CANONICAL_MAP`). Não lida com frases complexas, múltiplos destinos, idiomas mistos, preservação de texto não compreendido, nem deteção de conflitos ou incerteza. Não utiliza IA/fallback estruturado. | `parcialmente confirmado` |
| **Criação híbrida adaptativa** | `app/components/CreationExperience.js` | Rendilhado em componente React (sem testes E2E) | Parcial | Apresenta modal com chips e 3 perguntas **estáticas** fixas (Ritmo, Estilo, Orçamento). Não adapta as perguntas às lacunas reais, à confiança da interpretação ou ao tipo de destino (ex: múltiplos destinos vs cidade única). | `parcialmente confirmado` |
| **Identidade visual editorial** | `app/components/home/HomeHero.js`, `HomeHero.module.css`, `globals.css` | Compilação Next.js / visual manual | Parcial | Altera cores no hero e adiciona fontes `Playfair Display`, mas reduz páginas secundárias e não unifica o design system em toda a aplicação (dashboard, my-trips, itinerário completo). | `parcialmente confirmado` |
| **Travel Persona** | `app/lib/travel-persona.js`, `PreferencesDrawer.js` | `travel-persona.test.js` (5 testes unitários) | Parcial | Grava apenas em `localStorage` (`andor_travel_persona_v1`). Não persiste na base de dados Supabase/Postgres, não isola utilizadores autenticados, não sincroniza sessões e não injeta automaticamente preferências no pipeline de geração no servidor. | `parcialmente confirmado` |
| **Demonstração interativa** | `app/components/home/InteractiveTripDemo.js` | Visualização em `app/page.js` | Parcial | Utiliza dados 100% hardcoded (`DEMO_STAGES`, `DEMO_DAYS`, `DEMO_RECOMMENDATION`). A adição de recomendações altera apenas um estado React efémero em memória. Não reutiliza componentes reais nem persiste dados. | `parcialmente confirmado` |
| **Integração idempotente & Geração** | `app/components/CreationExperience.js` (linha 86) | Apelo a `/api/generate-itinerary` | Confirmado | Dispara a rota real de geração com payload JSON e trata resposta com redirecionamento para `/itinerary/[id]`. | `confirmado` |
| **Edição parcial de itinerário com Undo** | Componentes soltos (`ActivityEditor.js`, `StageNavigator.js`) | Testes unitários parciais | Parcial | Componentes foram criados, mas não estavam totalmente integrados com mutações estruturadas na página `/itinerary/[id]` com persistência durável em BD e Undo funcional. | `parcialmente confirmado` |

---

## Análise de Riscos e Gaps Principais

1. **Parser Frágil (Regex-only)**:
   - Não cumpre o contrato de incerteza, confiança por campo, deteção de conflitos ou texto não processado.
   - Falha em frases com múltiplos destinos (ex: "5 dias entre Porto e Douro").

2. **Perguntas Não-Adaptativas**:
   - A experiência de criação faz sempre as mesmas 3 perguntas, mesmo quando o utilizador já respondeu a todas na frase inicial ou quando faltam dados críticos como o destino.

3. **Travel Persona Apenas em Browser**:
   - Perda total de perfil ao mudar de dispositivo ou navegador.
   - Ausência de reconciliação de dados entre utilizador anónimo e conta autenticada Supabase.

4. **Falta de Testes E2E e Visuais**:
   - Não existiam screenshots de regressão nem testes Playwright cobrindo o fluxo completo com estado real de base de dados e persistência.
