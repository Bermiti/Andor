# ANALYTICS_PLAN.md — Telemetria e Estratégia Analítica

## 📊 Visão Geral

A Andor Travels utiliza um sistema de telemetria local (`window.andor_events`) pronto para integração com serviços reais de analytics como **Vercel Analytics**, **Plausible**, **PostHog** ou **Google Analytics**.

Todos os eventos são rastreados clientside através da função `trackEvent()` em `app/lib/analytics.js` e podem ser:
- Monitorados em tempo real via `window.andor_events` no DevTools
- Integrados com qualquer serviço de analytics implementando hooks simples
- Exportados para análise posterior

---

## 🎯 9 Eventos Críticos — Sempre Instrumentados

Estes são os eventos essenciais para medir o funil de conversão e o engagement principal:

### 1. **`landing_cta_clicked`**
- **Disparado**: Quando o utilizador clica em qualquer CTA (Hero "Planear Viagem", botões de destino, etc)
- **Propriedades**:
  - `cta_text`: Texto do botão clicado (ex: "Planear Viagem")
  - `location`: Onde o CTA estava (ex: "hero", "destination_card", "footer")
  - `destination`: Se aplicável, o destino alvo
- **Importância**: Mede interesse inicial e engagement com a proposta principal

### 2. **`destination_viewed`**
- **Disparado**: Quando o utilizador acessa uma página de destino (`/destination/[slug]`)
- **Propriedades**:
  - `destination`: Nome do destino (ex: "Tokyo", "Paris")
  - `slug`: Slug do destino (ex: "tokyo", "paris")
  - `source`: Como chegou lá (ex: "hero_search", "featured_list", "favorites")
- **Importância**: Mede interesse em destinos específicos e comportamento de navegação

### 3. **`favorite_added`**
- **Disparado**: Quando o utilizador marca um destino como favorito (coração no card)
- **Propriedades**:
  - `destination`: Nome do destino
  - `itinerary_id`: ID da viagem (se dentro de um itinerário)
  - `action`: "add" ou "remove"
- **Importância**: Mede preferências e intenção de retorno

### 4. **`itinerary_created`**
- **Disparado**: Quando o utilizador completa o Wizard e gera uma viagem
- **Propriedades**:
  - `destination`: Destino planeado
  - `duration`: Número de dias
  - `budget_min`: Orçamento mínimo
  - `budget_max`: Orçamento máximo
  - `travel_type`: Tipo de viagem (ex: "relaxation", "adventure", "culture")
- **Importância**: Evento de conversão principal — mede criação efetiva de itinerários

### 5. **`ai_concierge_opened`**
- **Disparado**: Quando o utilizador abre o chat AI Concierge (botão flutuante)
- **Propriedades**:
  - `from_page`: Página onde abriu (ex: "home", "destination", "itinerary")
  - `itinerary_id`: ID da viagem (se aplicável)
- **Importância**: Mede engagement com a funcionalidade IA premium

### 6. **`pricing_viewed`**
- **Disparado**: Quando o utilizador acessa a página `/pricing`
- **Propriedades**:
  - `from_page`: Referrer (ex: "home", "navbar", "cta")
  - `source`: Como chegou (ex: "direct", "referrer", "link")
- **Importância**: Mede interesse em planos e potencial monetização

### 7. **`pricing_toggle`**
- **Disparado**: Quando o utilizador alterna entre Annual/Monthly na página de pricing
- **Propriedades**:
  - `new_billing_cycle`: "annual" ou "monthly"
  - `selected_plan`: Plano selecionado (ex: "explorer", "pathfinder", "visionary")
- **Importância**: Mede preferência de faturação e interesse em desconto anual

### 8. **`onboarding_started`**
- **Disparado**: Quando o OnboardingModal aparece e o utilizador começa os passos
- **Propriedades**:
  - `step`: Qual passo começou (ex: 1, 2, 3)
  - `trigger`: Como foi disparado (ex: "first_visit", "user_click")
- **Importância**: Mede entrada no funil de onboarding

### 9. **`onboarding_completed`**
- **Disparado**: Quando o utilizador conclui o OnboardingModal (fecha ou completa tudo)
- **Propriedades**:
  - `completed_all_steps`: true/false
  - `travel_preferences`: Array de preferências selecionadas (ex: ["luxury", "culture", "adventure"])
  - `travel_pace`: "relaxed", "moderate", "fast"
- **Importância**: Mede onboarding efetivo e coleta de preferências iniciais

---

## 📋 Eventos Adicionais Recomendados (Nice-to-Have)

Estes eventos adicionam contexto e insights mais profundos:

### User Behavior
- **`search_performed`**: Quando utiliza o autocomplete para pesquisar destino
  - Props: `query`, `results_count`, `selected_index`
- **`wizard_step_completed`**: Cada passo do Wizard completo
  - Props: `step`, `duration_seconds`, `destination`, `budget_range`
- **`itinerary_exported`**: Quando exporta PDF
  - Props: `format`, `itinerary_id`, `destination`

### AI Interactions
- **`ai_message_sent`**: Cada mensagem enviada ao Concierge
  - Props: `message_length`, `has_attachments`, `conversation_id`
- **`ai_message_received`**: Cada resposta do Concierge
  - Props: `response_length`, `generation_time_ms`, `model_version`
- **`ai_error_occurred`**: Se a API AI falha
  - Props: `error_type`, `error_message`, `recovery_attempted`

### Content Engagement
- **`testimonial_viewed`**: Quando a secção de testemunhos é vista
- **`feature_highlight_viewed`**: Quando vê funcionalidades principais
- **`faq_expanded`**: Quando expande pergunta FAQ
  - Props: `question_id`, `question_text`

### Social & Sharing
- **`itinerary_shared`**: Quando partilha itinerário
  - Props: `destination`, `share_method` (copy_link, email, etc)
- **`social_proof_impression`**: Quando vê notificações de utilizadores ativos
  - Props: `notification_count`, `location`

### Performance & Technical
- **`page_performance`**: Performance da página (se integrar com web-vitals)
  - Props: `page_path`, `LCP`, `FID`, `CLS`
- **`error_boundary_triggered`**: Quando o Error Boundary apanha um erro
  - Props: `error_type`, `component_stack`, `error_message`

---

## 🔁 Funil Principal de Conversão

```
Landing (Homepage)
    ↓ landing_cta_clicked
Explore Destinations
    ↓ destination_viewed
    ↓ favorite_added (opcional)
Create Itinerary (Wizard)
    ↓ itinerary_created ⭐ CONVERSÃO
View & Adapt Itinerary
    ↓ ai_concierge_opened
Upgrade Path (Pricing)
    ↓ pricing_viewed
    ↓ pricing_toggle
Checkout/Subscription
    ↓ [PAYMENT EVENT - a implementar]
```

**Taxa de Conversão Esperada a Medir**:
- Landing → Destination Viewed: ~30-40% (interesse inicial)
- Destination → Itinerary Created: ~5-15% (conversão principal)
- Itinerary → Pricing Viewed: ~20-30% (upsell)
- Pricing → Subscription: ~2-5% (monetização)

---

## 📊 Métricas Principais de Produto

### Engagement Metrics
- **Average Session Duration**: Tempo médio por sessão
- **Bounce Rate**: % de utilizadores que saem sem interagir
- **Pages Per Session**: Média de páginas visitadas
- **Return Rate**: % de utilizadores que voltam

### Conversion Metrics
- **Itinerary Creation Rate**: (itinerary_created / landing_cta_clicked) × 100%
- **Favorite Rate**: (favorite_added / destination_viewed) × 100%
- **Concierge Adoption**: (ai_concierge_opened / itinerary_created) × 100%
- **Pricing Conversion**: (pricing_viewed / total_sessions) × 100%

### Content Performance
- **Most Viewed Destinations**: Top 5 destinos mais vistos
- **Favorite Destinations**: Top 5 marcados como favoritos
- **Search Queries**: Destinos mais pesquisados

### Technical Metrics
- **Page Load Time**: Performance por página
- **Error Rate**: % de erros capturados
- **API Availability**: Uptime da API Gemini

---

## 🔧 Implementação de Tracking

### Como Disparar um Evento

```javascript
import { trackEvent } from '@/lib/analytics';

// Evento simples
trackEvent('landing_cta_clicked', {
  cta_text: 'Planear Viagem',
  location: 'hero'
});

// Evento com múltiplas propriedades
trackEvent('itinerary_created', {
  destination: 'Tokyo',
  duration: 7,
  budget_min: 1000,
  budget_max: 3000,
  travel_type: 'culture'
});
```

### Estrutura de Evento Registado

```javascript
// Cada evento em window.andor_events tem a seguinte estrutura:
{
  event: 'landing_cta_clicked',
  properties: {
    cta_text: 'Planear Viagem',
    location: 'hero',
    url: 'https://andor.travels/',
    path: '/',
    referrer: '',
    timestamp: '2026-05-23T18:00:29.162Z'
  }
}
```

### Visualizar em DevTools

```javascript
// Na consola do browser:
window.andor_events

// Filtrar eventos específicos:
window.andor_events.filter(e => e.event === 'itinerary_created')

// Contar eventos por tipo:
window.andor_events.reduce((acc, e) => {
  acc[e.event] = (acc[e.event] || 0) + 1;
  return acc;
}, {})
```

---

## 🔗 Integração com Serviços Reais

### Vercel Analytics (Recomendado para Vercel)

```javascript
// Em app/lib/analytics.js, adicionar:
window.addEventListener('andor-telemetry', (e) => {
  if (window.va) {
    window.va('event', {
      name: e.detail.event,
      data: e.detail.properties
    });
  }
});
```

### Plausible Analytics

```javascript
// Em app/lib/analytics.js, adicionar:
window.addEventListener('andor-telemetry', (e) => {
  if (window.plausible) {
    window.plausible(e.detail.event, {
      props: e.detail.properties
    });
  }
});
```

### PostHog

```javascript
// Em app/lib/analytics.js, adicionar:
window.addEventListener('andor-telemetry', (e) => {
  if (window.posthog) {
    window.posthog.capture(e.detail.event, e.detail.properties);
  }
});
```

### Google Analytics 4

```javascript
// Em app/lib/analytics.js, adicionar:
window.addEventListener('andor-telemetry', (e) => {
  if (window.gtag) {
    window.gtag('event', e.detail.event, e.detail.properties);
  }
});
```

---

## 📈 Recomendações para Produção

1. **Comece com Vercel Analytics**: Integrado com Vercel, não requer script adicional
2. **Considere Plausible**: Privacy-focused, GDPR-compliant, sem cookies necessários
3. **Alterne para PostHog**: Se quiser feature flags, A/B testing ou análise mais profunda
4. **Mantenha o backup local**: `window.andor_events` continua a funcionar como fallback

---

## 🎯 Checklist de Validação

- [x] `trackEvent()` função implementada em `app/lib/analytics.js`
- [x] Todos os 9 eventos críticos disparados nos locais corretos
- [x] `window.andor_events` acessível e populada
- [x] Custom event `andor-telemetry` dispara com cada evento
- [ ] Integração com Vercel Analytics (a fazer após deploy)
- [ ] Integração com Plausible (opcional, a fazer após deploy)
- [ ] Dashboard de analytics configurado e monitorizado
- [ ] Alertas de erro ou taxa de conversão baixa configurados

---

## 🚀 Próximos Passos

1. ✅ Deploy em produção
2. ⏳ Monitorar `window.andor_events` durante primeira semana
3. ⏳ Ativar Vercel Analytics ou Plausible
4. ⏳ Criar dashboard de KPIs principais
5. ⏳ Configurar alertas para anomalias
6. ⏳ Revisar dados a cada semana e otimizar funil

---

## 📚 Documentação Adicional

- [Google Generative AI API](https://ai.google.dev/docs)
- [Vercel Analytics](https://vercel.com/analytics)
- [Plausible Analytics](https://plausible.io/)
- [PostHog Docs](https://posthog.com/docs)
- [Google Analytics 4](https://support.google.com/analytics)
