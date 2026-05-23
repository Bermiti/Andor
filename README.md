# ✦ Andor Travels — O Teu Concierge de Viagens AI de Elite

O **Andor Travels** é um planeador de viagens de luxo e assistente pessoal inteligente, desenvolvido para criar, adaptar e guiar a tua próxima aventura em tempo real. Alimentado por modelos avançados do Google Gemini, a plataforma substitui com eficácia um agente de viagens humano, entregando itinerários sob medida, mapas interativos e segredos locais em menos de 30 segundos.

---

## ✨ Funcionalidades Principais

- **💬 AI Concierge de Luxo**: Conversa fluida com streaming de respostas, capaz de interpretar intenções, ajustar itinerários em tempo real, sugerir companhias aéreas, hotéis com links diretos do Booking.com/Skyscanner e revelar segredos escondidos que a maioria dos guias turísticos ignora.
- **🗺️ Itinerários Inteligentes**: Planeamento de dias estruturado por períodos (manhã, tarde, noite) com distâncias e tempos de trânsito realistas. Banimos títulos genéricos de dias para dar lugar a experiências evocativas (ex. *"Ancient Kyoto at Dawn"*).
- **📍 LiveMap Interativo**: Integração de mapas Leaflet.js client-side com renderização de caminhos geográficos precisos e marcadores de atividades personalizados por período do dia.
- **🎨 Travel Persona Engine**: Dashboard de perfil que calcula dinamicamente o teu perfil de viajante (como *"O Explorador Urbano"* ou *"O Nómada Espiritual"*) com base nas tuas pesquisas, itinerários e destinos favoritos.
- **📊 Mapa do Mundo de Exploração**: Um mapa mundi SVG dinâmico e interativo que pinta e destaca os países visitados ou planeados pelo utilizador a partir de interações.
- **💰 Calculadora de Orçamento**: Ajuste interativo do orçamento estimado com segmentação por barras de progresso verticais em tempo real.
- **📄 Exportador PDF Premium**: Criação de um "Livro de Viagem" elegante, com tipografia Georgia, tabelas de orçamento estruturadas e quebras de página controladas para evitar truncamento de atividades.
- **🚀 Onboarding Imersivo**: Ecrã inicial de introdução e modal de 3 passos para recolha inicial de preferências de viagem, personalizado localmente.
- **🧭 Página 404 & Preços Estilizados**: Experiências visuais premium e fluidas com animações suaves de rotação de bússola, toggle de faturação interativo (com 27% de poupança anual) e acordeões de FAQ expansíveis.

---

## 🛠️ Stack Tecnológica

- **Core**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS Modules (Design System responsivo de alto contraste, suporte a variáveis CSS para temas e safe-areas de dispositivos iOS)
- **AI Engine**: Google Gemini API via `@google/generative-ai`
- **Mapas**: Leaflet.js
- **PDF Generation**: html2pdf.js
- **SEO & Metadados**: Next.js Metadata API, Robots.js e Sitemap.js dinâmicos, e esquemas estruturados JSON-LD (`TravelAgency`, `Product`, `TouristDestination`).
- **Telemetria**: Barramento local `trackEvent` em `window.andor_events` pronto para integração com Vercel Analytics, Plausible ou PostHog.

---

## 📁 Estrutura de Pastas Relevante

```
Andor-main/
├── app/
│   ├── api/
│   │   ├── adapt-itinerary/         # Rota para ajustar orçamento/itinerários
│   │   ├── chat/                    # AI Concierge Chat Streaming
│   │   ├── generate-itinerary/      # Geração de itinerários via IA
│   │   └── regenerate-day/          # Regenerador dinâmico de dias
│   ├── components/                  # Componentes reutilizáveis (Wizard, AI, Map, etc)
│   ├── context/                     # Context Providers (Auth, Toast, Chat, Language)
│   ├── destination/[slug]/          # Detalhe premium de destinos estáticos
│   ├── favorites/                   # Página dedicada de favoritos
│   ├── lib/
│   │   ├── analytics.js             # Rastreio de telemetria local
│   │   ├── itinerary-store.js       # Armazenamento em localStorage
│   │   └── itinerary-validate.js    # Validadores e normalizadores de JSON de itinerários
│   ├── pricing/                     # Página de planos e FAQ
│   ├── profile/                     # Perfil, Travel Persona e Mapa SVG
│   ├── globals.css                  # Variáveis CSS e Design System global
│   ├── layout.js                    # Estrutura HTML global, meta tags e JSON-LD
│   └── page.js                      # Homepage com secções premium
```

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
Certifica-te de ter o **Node.js (v18+)** e **npm** instalados.

### 2. Configurar Variáveis de Ambiente
Cria um ficheiro `.env.local` na raiz do projeto e adiciona a tua chave de API do Gemini:
```env
GOOGLE_GENERATIVE_AI_API_KEY=a-tua-chave-gemini-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acede a [http://localhost:3000](http://localhost:3000) no teu browser.

---

## 📦 Como Compilar e Implantar

Para validar e gerar a versão otimizada de produção:
```bash
npm run build
```

### Implementar na Vercel
A forma mais rápida de publicar este projeto é usar a plataforma Vercel:
1. Conecta o repositório na tua conta da Vercel.
2. Adiciona a variável de ambiente `GOOGLE_GENERATIVE_AI_API_KEY` nas definições do projeto.
3. Clica em **Deploy**. O Next.js tratará de otimizar os caminhos estáticos e rotas do App Router automaticamente.

---

## 🚀 Production Deploy

### Pré-Requisitos de Produção

Antes de fazer deploy, certifica-te de:

- ✅ Build local: `npm run build` passou sem erros
- ✅ Testes: `npm run test:e2e` passaram
- ✅ Chave de API: `GOOGLE_GENERATIVE_AI_API_KEY` válida e ativa
- ✅ Domínio: Domínio personalizado pronto (opcional mas recomendado)
- ✅ DNS: Se domínio custom, DNS apontado para Vercel

### Variáveis de Ambiente em Produção

Configure as seguintes variáveis em **Vercel Dashboard → Settings → Environment Variables**:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chave de API Google Gemini (obrigatória) | `AIzaSyD...` |
| `NEXT_PUBLIC_SITE_URL` | URL público de produção (recomendada) | `https://andor-travels.vercel.app` |

**Notas importantes**:
- `GOOGLE_GENERATIVE_AI_API_KEY` é **obrigatória** para funcionalidades de IA
- `NEXT_PUBLIC_SITE_URL` afecta Open Graph, canónicos e sitemap
- Nunca commit variáveis sensíveis no repositório

### Deploy Step-by-Step

1. **Conecta repositório**: [Vercel Dashboard](https://vercel.com/dashboard) → New Project → Import Git Repository
2. **Configura variáveis**: Settings → Environment Variables → Adiciona as 2 variáveis acima
3. **Deploy**: Clica Deploy — Vercel fará build automático
4. **Valida**: Acede `https://seu-dominio.com` e testa funcionalidades principais

**Para instruções detalhadas**, consulta **[DEPLOY_NOTES.md](DEPLOY_NOTES.md)**.

### Pós-Deploy

Após deploy estar live, executa:

1. **Validação Manual**: Segue checklist em **[PRODUCTION_QA.md](PRODUCTION_QA.md)**
2. **Analytics**: Verifica `window.andor_events` em DevTools Console
3. **Sitemap**: Acede `/sitemap.xml` para confirmar geração dinâmica
4. **Robots**: Acede `/robots.txt` para confirmar
5. **Google Search Console**: Submete sitemap manualmente

### Documentação de Produção

- 📋 **[.env.example](.env.example)** — Variáveis de ambiente (copia para `.env.local` em desenvolvimento)
- 📊 **[ANALYTICS_PLAN.md](ANALYTICS_PLAN.md)** — Estratégia de telemetria e eventos instrumentados
- ✅ **[PRODUCTION_QA.md](PRODUCTION_QA.md)** — Checklist completa de validação pós-deploy
- 🚀 **[DEPLOY_NOTES.md](DEPLOY_NOTES.md)** — Guia passo-a-passo de deploy via Vercel
- 🎯 **[GO_TO_MARKET.md](GO_TO_MARKET.md)** — Posicionamento comercial e estratégia de lançamento

### Monitorização em Produção

- **Vercel Analytics**: Built-in no dashboard, mostra pageviews, geolocation, etc
- **Eventos de App**: `window.andor_events` rastreia todas as interações do utilizador
- **Performance**: Lighthouse score deve estar > 70 (SEO, Accessibility, Best Practices, Performance)
- **Uptime**: Monitora com [Updown.io](https://updown.io) ou similar (opcional)
- **Custos da API**: Verifica quota em [Google Cloud Console](https://console.cloud.google.com)

### Troubleshooting

- **AI Concierge não responde**: Verifica API key em Vercel Settings e quota no Google Cloud Console
- **Sitemap retorna 404**: Triggerredeploy ou verifica se `app/sitemap.js` existe
- **Build falha**: Consulta Build Logs em Vercel Deployments, revê erros específicos
- **Domain não resolve**: Aguarda propagação de DNS (até 48h) ou verifica config em Vercel

---
