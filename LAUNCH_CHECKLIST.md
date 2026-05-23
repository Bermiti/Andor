# Checklist de Lançamento — Andor Travels 🚀

Este guia serve como a lista final de validação técnica e comercial antes e depois de implantar o **Andor Travels** em produção (ex: Vercel).

---

## 🔑 Variáveis de Ambiente Necessárias

Certifica-te de configurar as seguintes variáveis no teu painel do provedor de alojamento (ex: Vercel Dashboard):

| Variável | Descrição | Valor Sugerido / Exemplo | Requerido |
| :--- | :--- | :--- | :--- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chave de API do Google Gemini para planeamento de itinerários e conversas de IA. | `AIzaSy...` | **Sim** |
| `GROQ_API_KEY` | Chave de API Groq (utilizada como fallback em algumas rotas). | `gsk_...` | Não (opcional) |
| `NEXT_PUBLIC_SITE_URL` | URL público de produção para canónicos de SEO, sitemaps e partilhas. | `https://andor-travels.vercel.app` | Não (opcional) |

---

## 🛠️ Comandos de Build e Deploy

### 1. Validação Local
Executar a validação local completa para verificar lints, compilador e empacotamento:
```bash
npm run build
```

### 2. Comando de Início (Self-hosted)
Se não estiveres a usar Vercel/Netlify, podes iniciar o servidor de produção localmente com:
```bash
npm run start
```

---

## 📋 Checklist Pré-Deploy

- [ ] **Build sem erros**: Correr `npm run build` e confirmar compilação com zero erros.
- [ ] **Console Logs Limpos**: Garantir que não existem `console.log` na pasta `app` (auditado com sucesso).
- [ ] **Metadados Sociais**: Verificar que as tags de Open Graph e Twitter Cards apontam para imagens e caminhos relativos corretos em `app/layout.js`.
- [ ] **Configuração Robots & Sitemap**: Validar que os ficheiros `app/sitemap.js` e `app/robots.js` estão criados para geração dinâmica.

---

## 📋 Checklist Pós-Deploy (Smoke Testing)

Executar os seguintes testes manuais após o deploy em produção estar concluído:

### 1. Rotas Estáticas Principais
- [ ] Aceder a `/` (Homepage) e verificar se o Onboarding Modal aparece na primeira visita.
- [ ] Aceder a `/pricing` e alternar o switch de faturação anual/mensal para confirmar que a interface e preços mudam instantaneamente.
- [ ] Aceder a `/favorites` e verificar os cartões demo criados por padrão.
- [ ] Aceder a `/profile` e ver se a Travel Persona é exibida corretamente.
- [ ] Testar uma URL inexistente (ex: `/rota-que-nao-existe`) e validar se a página de erro 404 personalizada aparece com a bússola animada.

### 2. Recursos Dinâmicos
- [ ] Testar `/destination/tokyo` e confirmar que o gráfico climático, o veredito e o botão sticky funcionam.
- [ ] Tentar clicar em "Favoritar" (botão do coração) e verificar a elástica micro-animação do coração e partículas rosa.
- [ ] Pesquisar no Autocomplete do Hero e selecionar um destino para confirmar que avança para o Wizard.

### 3. Integração com IA e Geração
- [ ] Criar uma viagem usando o Wizard e validar o ecrã de carregamento animado com o avião SVG.
- [ ] Confirmar se o itinerário gerado é renderizado no ecrã com mapa interativo e se os botões laterais (PDF, Chat, Partilhar) respondem.
- [ ] Testar o chat flutuante (AI Concierge) enviando uma mensagem rápida (ex: "olá") para confirmar que o streaming funciona.

### 4. Telemetria e Validação de SEO
- [ ] Abrir as ferramentas de desenvolvedor (F12) na consola após interações e escrever `window.andor_events`. Confirmar se os eventos disparados (ex: `pricing_toggle`, `destination_viewed`) estão registados no array.
- [ ] Validar a presença do sitemap digitando `/sitemap.xml` no browser.
- [ ] Validar orobots txt digitando `/robots.txt` no browser.

---

## 🔍 Performance & Lighthouse

Depois de deploy em produção, valida a pontuação Lighthouse em `https://seu-dominio.com`:

### Como Correr Lighthouse

1. **Via Chrome DevTools** (Local):
   - Abre DevTools (F12)
   - Vai à aba **Lighthouse**
   - Clica **Analyze page load**
   - Aguarda resultado

2. **Via PageSpeed Insights** (Produção):
   - Vai a [pagespeed.web.dev](https://pagespeed.web.dev)
   - Digita a URL de produção
   - Clica **Analyze**
   - Recebe relatório detalhado

3. **Via Vercel Analytics** (Integrado):
   - Vai a Vercel Dashboard → **Analytics**
   - Vê Core Web Vitals automáticos

### Métricas-Alvo

| Métrica | Alvo |
| :--- | :--- |
| **Performance** | > 70 |
| **Accessibility** | > 90 |
| **Best Practices** | > 90 |
| **SEO** | > 90 |

### Otimizações Recomendadas

- **Imagens**: Compress e lazy-load — usa Next.js `<Image>` component
- **Fonts**: Google Fonts já estão otimizadas
- **CSS**: Vanilla CSS modules já são bem-otimizados
- **JavaScript**: Evita grandes bundles — tree-shaking automático
- **Core Web Vitals**:
  - **LCP** (Largest Contentful Paint): Deve ser < 2.5s
  - **FID** (First Input Delay): Deve ser < 100ms
  - **CLS** (Cumulative Layout Shift): Deve ser < 0.1

### Checklist Lighthouse

- [ ] Performance > 70
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
- [ ] Sem erros críticos no relatório
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

---
