# PRODUCTION_QA.md — Validação Pós-Deploy em Produção

## 📋 Introdução

Este documento é uma **checklist completa de smoke testing** a executar após o deploy da Andor Travels em produção (Vercel ou outro hosting).

Objetivo: Validar que todas as funcionalidades principais funcionam corretamente, performance é aceitável, e não há erros críticos.

**Tempo estimado**: 30-45 minutos por validação completa.

---

## 🔍 Setup Inicial

1. Acede a `https://seu-dominio-producao.com` (ex: `https://andor-travels.vercel.app`)
2. Abre o DevTools (F12) e vai à aba **Console**
3. Limpa o localStorage para simular primeiro utilizador: `localStorage.clear(); location.reload()`
4. Nota qualquer erro vermelho na consola
5. Verifica que `window.andor_events` existe e começa a registar eventos

---

## ✅ Secção 1: Landing Page & Hero

- [ ] **Landing page carrega em <3s**: Mede com DevTools Network
- [ ] **Hero section é visível e responsivo**: Verifica layout em mobile/tablet/desktop
- [ ] **Navbar é visível**: Logo, links (Pricing, Profile, Favorites)
- [ ] **Autocomplete funciona**:
  - Clica em "Onde queres ir?"
  - Digita "tok" → deve aparecer "Tokyo"
  - Digita "par" → deve aparecer "Paris"
  - Seleciona um resultado → deve ir para o Wizard
- [ ] **Background images carregam**: Sem "404" ou "broken image"
- [ ] **Imagens de destinos são responsivas**: Em mobile, não saem da viewport
- [ ] **Hero CTA ("Planear Viagem") é clicável**: Abre o Wizard
- [ ] **Evento `landing_cta_clicked` é disparado**: Verifica `window.andor_events` na consola

---

## ✅ Secção 2: Onboarding & Splash Screen

- [ ] **Splash Screen (avião animado) aparece**: Apenas na primeira visita
- [ ] **Splash Screen desaparece após 2-3s**: Transição suave
- [ ] **Onboarding Modal aparece após splash**: Perguntas sobre preferências de viagem
- [ ] **Onboarding é responsivo**: Funciona em mobile e desktop
- [ ] **Passos são navegáveis**: Clica "Next" entre os 3 passos
- [ ] **Preferências são guardadas**: Fecha o modal e recarrega → modal não aparece de novo
- [ ] **Evento `onboarding_started` é disparado**: Verifica `window.andor_events`
- [ ] **Evento `onboarding_completed` é disparado**: Ao fechar/concluir
- [ ] **Teste sem localStorage**:
  - Abre DevTools → Applicatiion → Storage → LocalStorage → apaga tudo
  - Recarrega página → onboarding deve aparecer de novo

---

## ✅ Secção 3: AI Concierge

- [ ] **Botão flutuante AI aparece**: Canto inferior direito
- [ ] **Clica no botão**: Abre modal de chat
- [ ] **Título e descrição são claros**: Ex: "AI Concierge" e "Diga-me mais sobre..."
- [ ] **Input field é funcional**: Clica e consegues digitar
- [ ] **Envia mensagem simples**: "olá" ou "oi"
- [ ] **Resposta aparece com streaming**: Efeito de digitação em tempo real
- [ ] **Evento `ai_concierge_opened` é disparado**: Verifica `window.andor_events`
- [ ] **Chat é responsivo em mobile**: Texto não sai da viewport
- [ ] **Fechar modal funciona**: Clica X ou fora do modal
- [ ] **Teste sem API key**:
  - Se `GOOGLE_GENERATIVE_AI_API_KEY` não está configurada, deve mostrar mensagem amigável
  - Ex: "AI Concierge está temporariamente indisponível"

---

## ✅ Secção 4: Páginas de Destino

- [ ] **Acede a `/destination/tokyo`**: Deve carregar com imagem, clima, veredito
- [ ] **Página é responsiva**: Sem overflow em mobile
- [ ] **Botão "Adicionar aos Favoritos" (coração) é visível**: Canto superior direito
- [ ] **Clica coração**: Deve animar com partículas rosa
- [ ] **Evento `destination_viewed` é disparado**: Verifica `window.andor_events`
- [ ] **Evento `favorite_added` é disparado**: Quando marca como favorito
- [ ] **Clica novamente**: Deve remover dos favoritos (coração vazio)
- [ ] **Gráfico de clima é visível**: Com ícones de temperatura/precipitação
- [ ] **Veredito (descrição) é legível**: Texto não fica cortado
- [ ] **Botão CTA ("Planear Viagem para Tokyo")**: Clica → abre Wizard com destino pré-preenchido
- [ ] **Testa várias páginas**:
  - `/destination/paris`
  - `/destination/bali`
  - `/destination/new-york` (destino não existente)

---

## ✅ Secção 5: Criação de Itinerário (Wizard)

- [ ] **Wizard Modal abre**: Com "Passo 1 de 4"
- [ ] **Campo de destino é pré-preenchido**: Se abriu via card de destino
- [ ] **Passo 1 - Destino**: Autocomplete funciona e reage à entrada
- [ ] **Passo 2 - Duração**: Seletor de dias funciona (1-21 dias)
- [ ] **Passo 3 - Orçamento**: Slider de orçamento reage
- [ ] **Passo 4 - Tipo de Viagem**: Botões de categoria (Relaxation, Adventure, Culture, etc) são clicáveis
- [ ] **"Criar Itinerário" dispara geração**: Splash screen com avião animado aparece
- [ ] **Itinerário é gerado**: Após 3-10s, mostram-se os dias com atividades
- [ ] **Evento `itinerary_created` é disparado**: Verifica `window.andor_events`
- [ ] **Mapa interativo carrega**: Com marcadores de atividades
- [ ] **Scrolla através dos dias**: Cada dia tem 3 períodos (manhã, tarde, noite)
- [ ] **Clica no botão "Chat"**: Abre AI Concierge com contexto da viagem
- [ ] **Clica no botão "PDF"**: Começa download do ficheiro "Andor-Tokyo.pdf"
- [ ] **Clica no botão "Partilhar"**: Copia link ou permite partilhar (depending on browser)

---

## ✅ Secção 6: Mapa Interativo

- [ ] **Mapa Leaflet carrega**: Mostra mapa do mundo com o destino centrado
- [ ] **Marcadores de atividades são visíveis**: Coloridos por período do dia
- [ ] **Caminho entre atividades é visível**: Linhas ligando marcadores
- [ ] **Clica em marcador**: Mostra nome da atividade e hora
- [ ] **Zoom funciona**: Scroll ou pinch para zoom in/out
- [ ] **Mapa é responsivo em mobile**: Sem scroll horizontal

---

## ✅ Secção 7: Favoritos

- [ ] **Acede a `/favorites`**: Deve mostrar lista de destinos marcados como favoritos
- [ ] **Se nenhum favorito, mostra mensagem**: Ex: "Nenhum favorito ainda"
- [ ] **Se há favoritos, mostra cards**: Com imagem, nome, veredito
- [ ] **Clica em card**: Vai para `/destination/[slug]`
- [ ] **Remove favorito do card**: Clica coração → remove da lista
- [ ] **Page é responsivo**: Cards adaptam-se ao tamanho da tela
- [ ] **Scrolla lista**: Se houver muitos favoritos, scrolla sem problemas

---

## ✅ Secção 8: Pricing

- [ ] **Acede a `/pricing`**: Página carrega com tabela de planos
- [ ] **3 planos são visíveis**: Ex: "Explorer", "Pathfinder", "Visionary"
- [ ] **Toggle Annual/Monthly funciona**:
  - Clica toggle "Annual"
  - Preços mudam e mostram 27% de poupança
  - Clica toggle "Monthly"
  - Preços voltam ao normal
- [ ] **Evento `pricing_viewed` é disparado**: Verifica `window.andor_events`
- [ ] **Evento `pricing_toggle` é disparado**: Ao mudar billing cycle
- [ ] **FAQ section funciona**: Clica em perguntas, elas expandem/contraem
- [ ] **Página é responsivo**: Tabela adapta-se a mobile
- [ ] **CTA "Choose Plan" é clicável**: Apesar de não ter checkout, botão reage

---

## ✅ Secção 9: Profile & Travel Persona

- [ ] **Acede a `/profile`**: Mostra avatar do utilizador e Travel Persona
- [ ] **Travel Persona é exibida**: Ex: "O Explorador Urbano" com descrição
- [ ] **Mapa SVG do mundo é visível**: Mostra países visitados/planeados
- [ ] **Página é responsivo**: Em mobile, não fica truncada
- [ ] **Botão "Editar Preferências" funciona**: Se implementado

---

## ✅ Secção 10: Página 404 & Error Handling

- [ ] **Acede a `/rota-que-nao-existe`**: Deve mostrar página 404 customizada
- [ ] **Bússola animada é visível**: Se implementada
- [ ] **Mensagem é clara e amigável**: Convida a voltar à homepage
- [ ] **Clica "Voltar à Homepage"**: Redireciona para `/`
- [ ] **Erro de boundary**:
  - Se conseguires trigger um erro no React (ex: quebra propositada)
  - Error Boundary deve capturar e mostrar mensagem amigável
  - Consola mostra erro mas app não fica completamente quebrada

---

## ✅ Secção 11: Sitemap & SEO

- [ ] **Acede a `/sitemap.xml`**: Deve retornar XML com URLs
- [ ] **Contem URLs principais**:
  - `/`
  - `/pricing`
  - `/profile`
  - `/favorites`
  - `/destination/tokyo`, `/destination/paris`, etc
- [ ] **Acede a `/robots.txt`**: Deve retornar ficheiro robots válido
- [ ] **Robots permite crawling**: User-agent: `*` e `Allow: /`

---

## ✅ Secção 12: Meta Tags & SEO Preview

- [ ] **Verifica Open Graph tags**: DevTools ou [og-parser.com](https://og-parser.com)
  - `og:title`: "Andor — O Teu Concierge de Viagens AI"
  - `og:description`: Descrição clara
  - `og:image`: Imagem é válida e carrega
  - `og:url`: Corrigir para URL de produção
- [ ] **Verifica Twitter Card tags**: Se `twitter:card` e `twitter:image` existem
- [ ] **Verifica canonical tag**: Aponta para a URL corrigida
- [ ] **Verifica canonical em `/destination/tokyo`**:
  - Devem ter `rel="canonical"` correto
  - Google não penaliza conteúdo duplicado

---

## ✅ Secção 13: Responsividade Mobile

- [ ] **Em mobile (375px width)**:
  - Hero section é legível
  - Autocomplete funciona
  - Botões são clicáveis (tamanho mínimo 44x44px)
  - Modals não saem da viewport
- [ ] **Em tablet (768px width)**:
  - Layout é bom entre móvel e desktop
  - Colunas adaptam-se
- [ ] **Em desktop (1920px)**:
  - Layouts não são muito largos
  - Conteúdo é centrado se apropriado
- [ ] **Orientação landscape**: Funciona sem problemas

---

## ✅ Secção 14: Performance Básica

- [ ] **First Contentful Paint (FCP) < 2s**: Verifica no Lighthouse (Production)
- [ ] **Largest Contentful Paint (LCP) < 2.5s**: Deve ser rápido mesmo com imagens
- [ ] **Cumulative Layout Shift (CLS) < 0.1**: Sem saltos de layout
- [ ] **Time to Interactive (TTI) < 5s**: Page deve responder a interações rapidamente
- [ ] **Sem console errors vermelhos**: Apenas warnings são aceitáveis
- [ ] **Imagens carregam progressivamente**: Sem bloqueios

---

## ✅ Secção 15: Teste com localStorage Vazio vs Preenchido

### Teste 1: localStorage Vazio (Novo Utilizador)
- [ ] Abre DevTools → Application → Storage → LocalStorage
- [ ] Deleta tudo (`localStorage.clear()`)
- [ ] Recarrega página (`location.reload()`)
- [ ] Splash screen e onboarding devem aparecer
- [ ] Wizard deve funcionar normalmente
- [ ] Favoritos devem estar vazio

### Teste 2: localStorage Preenchido (Utilizador Recorrente)
- [ ] Cria um itinerário e guarda (favoritos, dados do wizard)
- [ ] Abre página em nova aba
- [ ] Deve ver favoritos guardados
- [ ] Se recarregar, dados devem persistir

---

## ✅ Secção 16: Teste com API de IA Indisponível

### Simulação de Falha
1. **Desativa internet temporariamente** (ou usa DevTools Network throttling)
2. **Tenta usar AI Concierge**:
   - Deve mostrar mensagem amigável
   - Ex: "Concierge está temporariamente indisponível"
   - Não deve lançar erro não tratado
3. **Tenta criar itinerário**:
   - Se API falha, deve mostrar retry ou fallback
   - Não deve deixar app num estado inválido

### Se GOOGLE_GENERATIVE_AI_API_KEY Não Está Configurada
- [ ] Concierge mostra mensagem clara: "Funcionalidade indisponível"
- [ ] App não crasheia
- [ ] Resto da app continua funcional

---

## ✅ Secção 17: Eventos de Analytics

Abre DevTools Console e escreve:
```javascript
window.andor_events
```

Deve ver um array com eventos como:
```
[
  { event: 'landing_cta_clicked', properties: {...} },
  { event: 'onboarding_started', properties: {...} },
  { event: 'destination_viewed', properties: {...} },
  { event: 'favorite_added', properties: {...} },
  { event: 'ai_concierge_opened', properties: {...} },
  { event: 'itinerary_created', properties: {...} },
  { event: 'pricing_viewed', properties: {...} },
  { event: 'pricing_toggle', properties: {...} }
]
```

- [ ] `landing_cta_clicked` está presente
- [ ] `itinerary_created` está presente
- [ ] `ai_concierge_opened` está presente
- [ ] Cada evento tem `timestamp` e `url` corretos
- [ ] Filtra com sucesso: `window.andor_events.filter(e => e.event === 'itinerary_created')`

---

## ✅ Secção 18: Checklist de Segurança

- [ ] **Nenhuma chave de API é exposta no código frontend**:
  - Verifica `app/layout.js`, `app/page.js`, componentes
  - `GOOGLE_GENERATIVE_AI_API_KEY` não aparece em JS enviado para browser
- [ ] **Nenhum secret em localStorage**: Verifica DevTools Storage
- [ ] **CORS headers são corretos**: Sem avisos no Network tab
- [ ] **CSP headers estão configurados** (se Vercel): Previne XSS
- [ ] **Sem `console.log` statements** com dados sensíveis

---

## 🔴 Problemas Comuns & Resoluções

### Problema: "GOOGLE_GENERATIVE_AI_API_KEY not found"
**Causa**: Variável não configurada em Vercel
**Solução**:
1. Vai a Vercel Dashboard → Project Settings → Environment Variables
2. Adiciona `GOOGLE_GENERATIVE_AI_API_KEY=AIza...`
3. Redeployment (ou Manual Redeploy)

### Problema: Imagens não carregam ou são muito lentas
**Causa**: Assets não otimizadas ou hosted em CDN lento
**Solução**:
1. Verifica tamanho das imagens em DevTools Network
2. Considera usar Next.js Image Optimization
3. Verifica se estão em pasta `public/` corretamente

### Problema: Map Leaflet não carrega ou é cinzento
**Causa**: Leaflet CSS não carregou ou JS falhou
**Solução**:
1. Verifica DevTools Console por erros
2. Verifica se `leaflet` está em package.json
3. Restart build

### Problema: Onboarding nunca desaparece
**Causa**: localStorage não está a guardar ou há erro em context
**Solução**:
1. Abre DevTools → Application → Storage → LocalStorage
2. Verifica se chave `onboarding_completed` existe
3. Se não, há bug em `OnboardingModal` context

### Problema: AI Concierge não responde
**Causa**: API key inválida, quota atingida ou API down
**Solução**:
1. Testa API key em [Google AI Studio](https://aistudio.google.com)
2. Verifica quotas em Google Cloud Console
3. Aguarda se Google está com problemas

---

## 📝 Reporte de Testes

Depois de completar esta checklist, preenche o seguinte:

```
Date: [DATA]
Environment: Production
URL: [https://seu-dominio.com]

Total Checklist Items: 200+
Items Passed: [ ]
Items Failed: [ ]
Items Blocked: [ ]

Critical Issues: [ ]
Minor Issues: [ ]

Notes:
[Adiciona notas sobre tudo que não correu como esperado]

Signed Off By: [NOME]
```

---

## ✅ Resultado Final

- [ ] Todos os testes passaram ✅
- [ ] Nenhum erro crítico
- [ ] App está pronta para utilizadores reais
- [ ] Analytics está funcionando
- [ ] Performance é aceitável

**Parabéns! Andor Travels está pronta para produção!** 🚀
