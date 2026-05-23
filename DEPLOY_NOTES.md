# DEPLOY_NOTES.md — Guia Completo para Deploy em Produção

## 📦 Introdução

Este guia fornece instruções passo-a-passo para fazer deploy da Andor Travels em produção via **Vercel** (recomendado) ou outro hosting.

**Tempo estimado**: 15-30 minutos para deploy completo + validação básica.

---

## ✅ Pré-Requisitos

Antes de começar, certifica-te de que tens:

1. ✅ Repositório em GitHub: `https://github.com/Bermiti/Andor`
2. ✅ Conta Vercel: [vercel.com](https://vercel.com) (login com GitHub)
3. ✅ Chave de API Google Gemini: [aistudio.google.com](https://aistudio.google.com/apikey)
4. ✅ Domínio personalizado (opcional, ex: `andor.travels` ou `andor-travels.com`)
5. ✅ Build local passou: `npm run build` ✓

---

## 🚀 Opção 1: Deploy via Vercel Dashboard (Recomendado)

### Passo 1: Conectar Repositório

1. Vai a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clica **"Add New..."** → **"Project"**
3. Seleciona **"Import Git Repository"**
4. Procura `Bermiti/Andor` ou cola o URL: `https://github.com/Bermiti/Andor.git`
5. Clica **"Import"**

### Passo 2: Configurar Variáveis de Ambiente

1. Vercel apresenta página de configuração
2. Vai para **"Environment Variables"** (ou fica lá se já está)
3. Adiciona as seguintes variáveis:

| Nome | Valor | Escopo |
| :--- | :--- | :--- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIza...` (tua chave Gemini) | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://andor-travels.vercel.app` (ou teu domínio) | Production, Preview, Development |

**Notas**:
- Deixa as outras variáveis por preencher (são opcionais)
- `NEXT_PUBLIC_SITE_URL` pode estar vazio se usares o domínio default de Vercel
- `GOOGLE_GENERATIVE_AI_API_KEY` é **obrigatória**

### Passo 3: Deploy Automático

1. Vercel deteta automaticamente que é Next.js
2. **Build Command**: `npm run build` (detectado automaticamente)
3. **Output Directory**: `.next` (detectado automaticamente)
4. Clica **"Deploy"**
5. Aguarda ~3-5 minutos pelo build e deploy

**Resultado esperado**:
- ✅ Build completed successfully
- ✅ Deployment live at `https://andor-travels.vercel.app`

### Passo 4: Domínio Personalizado (Opcional)

1. Após deploy estar vivo, vai a **Settings** → **Domains**
2. Clica **"Add Domain"**
3. Digita `andor.travels` ou `andor-travels.com`
4. Vercel fornece instruções para apontar DNS
5. Aguarda propagação de DNS (~5-48 horas)

---

## 💻 Opção 2: Deploy via Vercel CLI

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Autenticar

```bash
vercel login
```

Abre o browser, faz login na tua conta Vercel, e volta ao terminal.

### Passo 3: Deploy

```bash
cd c:\Users\berna\Desktop\Andor-main
vercel --prod
```

**Na primeira vez, Vercel pergunta**:
- "Set up and deploy?" → **Y** (Sim)
- "Which scope should contain your project?" → Seleciona tua conta
- "Link to existing project?" → **N** (Não, é novo)
- "What's your project's name?" → `andor` ou `andor-travels`
- "In which directory is your code located?" → `.` (current)
- "Want to modify vercel.json?" → **N** (Não, usa defaults)

### Passo 4: Definir Environment Variables

```bash
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
# Paste your Google Gemini API key

vercel env add NEXT_PUBLIC_SITE_URL
# Type: https://andor-travels.vercel.app
```

### Passo 5: Redeploy com Variáveis

```bash
vercel --prod
```

Aguarda ~3-5 minutos.

---

## 🔧 Variáveis de Ambiente Obrigatórias

Estas variáveis **devem estar configuradas** para que a app funcione em produção:

### `GOOGLE_GENERATIVE_AI_API_KEY`
- **O quê**: Chave de API do Google Gemini
- **Onde obter**: [Google AI Studio](https://aistudio.google.com/apikey)
- **Formato**: Começa com `AIza` (ex: `AIzaSyD7...`)
- **Obrigatório**: ✅ SIM
- **Risco se faltar**: AI Concierge não funciona, erros na geração de itinerários

### `NEXT_PUBLIC_SITE_URL`
- **O quê**: URL públic de produção
- **Exemplo**: `https://andor-travels.vercel.app` ou `https://andor.travels`
- **Obrigatório**: Recomendado (fallback para `https://andor.travels`)
- **Risco se faltar**: Open Graph tags, canonical URLs, sitemap podem estar errados

---

## ✅ Checklist Pós-Deploy

Depois de deploy estar live, valida o seguinte:

### 1. Verificação de Acesso
- [ ] App carrega em `https://seu-dominio.com`
- [ ] Sem timeout ou erro 500
- [ ] Sem "502 Bad Gateway"

### 2. Variáveis de Ambiente
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` está configurada em Vercel Settings
- [ ] `NEXT_PUBLIC_SITE_URL` está correcta
- [ ] App consegue chamar Google Gemini API

### 3. Funcionalidades Críticas
- [ ] Homepage carrega
- [ ] Autocomplete funciona
- [ ] Wizard abre e gera itinerário
- [ ] AI Concierge responde a mensagens
- [ ] Favoritos guardam
- [ ] PDF exporta

### 4. SEO & Metadados
- [ ] Acede `/sitemap.xml` → retorna XML válido
- [ ] Acede `/robots.txt` → retorna robots.txt válido
- [ ] Open Graph tags apontam para `https://seu-dominio.com` (não `vercel.app`)

### 5. Analytics
- [ ] Abre DevTools Console
- [ ] Escreve `window.andor_events`
- [ ] Deve ver array com eventos rastreados

### 6. Performance
- [ ] Lighthouse Score > 70
- [ ] First Contentful Paint < 2.5s
- [ ] Largest Contentful Paint < 4s

### 7. Erros
- [ ] DevTools Console → sem erros vermelhos
- [ ] Sem 404s para recursos estáticos
- [ ] Vercel Logs → sem deploy errors

---

## 🔍 Verificação Pós-Deploy Detalhada

### Sitemap Dinâmico

1. Acede a `https://seu-dominio/sitemap.xml`
2. Deve retornar XML com URLs:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://andor-travels.vercel.app/</loc>
     </url>
     <url>
       <loc>https://andor-travels.vercel.app/pricing</loc>
     </url>
     <url>
       <loc>https://andor-travels.vercel.app/profile</loc>
     </url>
     <url>
       <loc>https://andor-travels.vercel.app/favorites</loc>
     </url>
     ...
   </urlset>
   ```
3. Se vê `<?xml`, está correto ✓

### Robots.txt

1. Acede a `https://seu-dominio/robots.txt`
2. Deve retornar:
   ```
   User-agent: *
   Allow: /
   
   Sitemap: https://seu-dominio/sitemap.xml
   ```

### Verificar Logs

1. Vai a Vercel Dashboard → Projeto → **Deployments**
2. Clica no deploy atual → **View Build Logs**
3. Procura por:
   - ❌ Build errors
   - ❌ Failed deployments
   - ✅ "Build completed"
   - ✅ "Deploy succeeded"

### Testar API Gemini

1. Abre DevTools Console
2. Cria um itinerário pelo Wizard
3. Se gerar itinerário com sucesso → API está funcional ✓
4. Se vir erro "API key not found" → Configuração falta

---

## 🔄 Rollback Básico

Se algo correr mal após deploy:

### Opção 1: Revert via Vercel Dashboard
1. Vai a Vercel Dashboard → Projeto → **Deployments**
2. Lista anterior de deploys
3. Encontra o deploy anterior que estava funcional
4. Clica **...** → **Redeploy**
5. Vercel redeployment automático

### Opção 2: Revert via Git
```bash
git log --oneline
# Encontra o commit anterior estável
git revert HEAD
git push origin main
# Vercel auto-redeploy triggered
```

### Opção 3: Rollback Manual
1. Se nada funcionar, desativar a app:
   - Vercel Dashboard → **Settings** → **Git** → **Disable Auto Deploy**
2. Reparar o código localmente
3. Fazer commit e push
4. Reativar auto-deploy

---

## 🛡️ Segurança Post-Deploy

### Verificar Exposição de Secrets

1. DevTools Console → **Network** tab
2. Recarrega a página
3. Procura por requests que contenham `AIza` ou `GOOGLE`
4. Se encontrares, há bug → Fix urgente!

**Nota**: `NEXT_PUBLIC_*` variáveis são públicas por design. Nunca coloques `GOOGLE_GENERATIVE_AI_API_KEY` como `NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY`.

### Monitorizar Custos da API

1. Vai a [Google Cloud Console](https://console.cloud.google.com)
2. Navega para **Billing** → **Budget Alerts**
3. Define alerta para €50/mês (ou o que for aceitável)
4. Recebe notificação se uso disparar

### Rotação de Chaves

Se suspeitas que a chave foi comprometida:
1. Vai a [Google AI Studio](https://aistudio.google.com/apikey)
2. Regenera a chave
3. Atualiza em Vercel Settings
4. Redeploy imediatamente

---

## 📊 Monitorização Contínua

### Vercel Analytics (Built-in)

Vercel oferece analytics grátis:
1. Vai a Vercel Dashboard → **Analytics**
2. Vê pageviews, única users, geolocation, etc

### Google Search Console (Recomendado)

1. Vai a [Google Search Console](https://search.google.com/search-console)
2. Adiciona propriedade: `https://seu-dominio.com`
3. Submete sitemap manualmente
4. Monitora impressões e clicks em Search

### Uptime Monitoring (Optional)

Services como [Updown.io](https://updown.io) ou [StatusPage.io](https://www.statuspage.io):
1. Configure verificação de `https://seu-dominio.com`
2. Recebe alerta se site fica down

---

## 🆘 Troubleshooting Comum

### Problema: "503 Service Unavailable" após deploy

**Causa**: Build fez timeout ou deploy foi interrompido
**Solução**:
1. Vai a Vercel Deployments
2. Clica no deploy falho
3. Revê Build Logs para erro específico
4. Clica **Redeploy** ou faz push novo para main

### Problema: "NEXT_PUBLIC_SITE_URL não está correto"

**Causa**: Apontando para `vercel.app` quando deveria ser domínio custom
**Solução**:
1. Vercel Settings → Environment Variables
2. Atualiza `NEXT_PUBLIC_SITE_URL` para domínio correto
3. **Important**: Triggerredeploy manual ou faz push novo

### Problema: AI Concierge retorna "Oops, algo correu mal"

**Causa**: API key inválida ou quota atingida
**Solução**:
1. Valida chave em [Google AI Studio](https://aistudio.google.com/apikey)
2. Se está certa, verifica quota em [Google Cloud Console](https://console.cloud.google.com)
3. Se quota foi atingida, aguarda reset mensal ou upgrades plano

### Problema: Sitemap ou Robots.txt retorna 404

**Causa**: Next.js não compilou ficheiros dinâmicos
**Solução**:
1. Verifica se `app/sitemap.js` e `app/robots.js` existem
2. Se existem, triggerarebuild: `git push origin main` ou Vercel "Redeploy"

---

## 📋 Resumo Final

### Vercel Deployment Checklist

- [ ] Repositório conectado a Vercel
- [ ] Variáveis de ambiente configuradas
  - [ ] GOOGLE_GENERATIVE_AI_API_KEY
  - [ ] NEXT_PUBLIC_SITE_URL (opcional mas recomendado)
- [ ] Deploy passou com sucesso
- [ ] Domínio personalizado configurado (opcional)
- [ ] DNS propagou (se domínio custom)
- [ ] Homepage carrega sem erros
- [ ] AI Concierge funciona
- [ ] Sitemap.xml válido
- [ ] Robots.txt válido
- [ ] Lighthouse score > 70
- [ ] Sem erros na consola
- [ ] Analytics.js funciona (`window.andor_events`)

---

## 🚀 Próximos Passos Após Deploy

1. **Primeiras 24h**: Monitoriza logs, feedback de utilizadores, erros críticos
2. **Primeira semana**: Recolhe dados de analytics, taxa de conversão, bounce rate
3. **Primeira mês**: Integra com Vercel Analytics ou Plausible para dados detalhados
4. **Permanente**: Monitora performance, custos API, uptime

---

## 📚 Referências Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Google AI Studio](https://aistudio.google.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Search Console](https://search.google.com/search-console)

**Boa sorte! 🚀 Andor Travels está pronta para o mundo.**
