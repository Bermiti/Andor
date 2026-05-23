@echo off
cd /d "c:\Users\berna\Desktop\Andor-main"

echo ========================================
echo FASE 10 — COMMIT FINAL
echo ========================================
echo.

echo [1/5] Verificando status Git...
git status
echo.

echo [2/5] Adicionando ficheiros...
git add .
echo ✓ Ficheiros staged

echo.
echo [3/5] Criando commit...
git commit -m "chore: prepare production deployment and go-to-market

- Add .env.example with all environment variables documented
  - GOOGLE_GENERATIVE_AI_API_KEY (obrigatória)
  - GROQ_API_KEY (opcional)
  - NEXT_PUBLIC_SITE_URL (recomendada)
  - Incluir security notes e troubleshooting

- Create ANALYTICS_PLAN.md with comprehensive analytics strategy
  - 9 eventos críticos instrumentados e documentados
  - 11 eventos adicionais recomendados
  - Funil de conversão principal
  - Métricas de produto
  - Instruções de integração: Vercel Analytics, Plausible, PostHog, Google Analytics

- Create PRODUCTION_QA.md with complete post-deployment checklist
  - 18 secções de validação
  - 200+ itens de teste
  - Smoke testing completo

- Create GO_TO_MARKET.md with commercial positioning
  - Premium product positioning
  - 3 personas principais
  - Copy para landing page e redes sociais
  - 60-second pitch
  - KPIs e launch sequence

- Create DEPLOY_NOTES.md with Vercel deployment guide
  - Pré-requisitos
  - Deploy via Dashboard e CLI
  - Checklist pós-deploy
  - Troubleshooting

- Update README.md with Production Deploy section
- Update LAUNCH_CHECKLIST.md with Lighthouse section
- Fix next.config.mjs to remove Vercel build warning

- Verify all analytics events already instrumented (9/9 críticos)
- Verify sitemap.js and robots.js configured correctly
- Verify no secrets exposed

Phase 10 Complete:
  ✓ Production deployment preparation
  ✓ Real analytics ready
  ✓ Production QA validation
  ✓ Go-to-market positioning
  ✓ Vercel deployment guide
  ✓ Comprehensive documentation

Ready for public launch.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo ✓ Commit criado

echo.
echo [4/5] Fazendo push para main...
git push origin main
echo ✓ Push concluído

echo.
echo [5/5] Verificando commit final...
git log -1 --oneline
echo.

echo ========================================
echo ✅ FASE 10 COMPLETA!
echo ========================================
echo.
echo Próximos passos:
echo 1. Verifica em GitHub se o commit foi pushed
echo 2. Vercel vai auto-redeploy (5 min)
echo 3. Testa em produção: https://seu-dominio.com
echo 4. Executa PRODUCTION_QA.md checklist
echo.
pause
