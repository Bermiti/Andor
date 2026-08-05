# Supabase e Google OAuth — runbook de staging

## Estado verificado em 2026-08-05

- A stack Supabase local aplica todas as migrations a partir de uma base vazia.
- `npm run db:verify` cobre reset, lint, matriz RLS, contratos reais de Supabase
  Auth e o percurso da aplicação contra a stack local.
- Password signup, trigger de perfil, email repetido, password errada, logout,
  novo login e rejeição de token expirado foram executados no GoTrue local.
- Google OAuth real não foi executado: este checkout não contém Client ID,
  Client secret, projeto Supabase remoto nem domínio de staging.
- Não existem secrets reais versionados. Credenciais locais emitidas pelo CLI são
  efémeras e não devem ser copiadas para documentação, logs ou commits.

## Fonte de verdade do schema

Os ficheiros ordenados em `supabase/migrations/` são a fonte canónica. O ficheiro
`supabase/schema.sql` é gerado a partir da base local já migrada:

```bash
npm run db:schema:snapshot
```

Não aplicar o snapshot manualmente e depois executar as migrations. Esse processo
criaria duas fontes de verdade.

## Validação local reproduzível

Pré-requisitos: Node 22.13+, Docker Desktop ativo e recursos suficientes para a
stack Supabase. Depois de um clone limpo:

```bash
npm ci
npm run db:start
npm run db:verify
```

`db:verify` destrói e recria apenas a base Supabase local deste projeto. Executa:

1. migrations e `supabase/seed.sql` desde zero;
2. lint SQL com nível `error`;
3. matriz RLS em Postgres para owner, editor, viewer, outsider e anon;
4. contrato Auth real pelo endpoint local do GoTrue;
5. registo pela API Andor, geração e persistência durável, isolamento de outsider,
   aceitação e replay de convite, logout, novo login e soft delete, com duas
   sessões reais.

O seed contém apenas uma identidade `.invalid`, sem password utilizável, para
confirmar o trigger `auth.users → profiles`. Não é dado de produção.

Para ligar a aplicação manualmente à stack local, obtém as variáveis efémeras com
`npx supabase status --output env` e mapeia-as apenas num `.env.local` ignorado:

- `API_URL` → `NEXT_PUBLIC_SUPABASE_URL`;
- `PUBLISHABLE_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- `SECRET_KEY` → `SUPABASE_SECRET_KEY`;
- define um `ANDOR_EMAIL_HASH_SECRET` local aleatório.

Nunca coloques `SECRET_KEY`, `SERVICE_ROLE_KEY` ou o HMAC secret numa variável
`NEXT_PUBLIC_*`.

## Projeto remoto de staging novo

1. Criar um projeto Supabase dedicado a staging, sem dados de produção.
2. Instalar as mesmas versões de Node e dependências com `npm ci`.
3. Autenticar o CLI e ligar explicitamente o projeto:

   ```bash
   npx supabase login
   npx supabase link --project-ref <staging-project-ref>
   npx supabase migration list
   npx supabase db push --dry-run
   npx supabase db push
   ```

4. Não usar `db reset --linked` num projeto com dados que devam ser preservados.
5. Não enviar o seed por omissão. Se o staging for descartável e a equipa quiser
   fixtures, usar conscientemente `db push --include-seed`; nunca em produção.
6. Configurar no runtime da aplicação apenas as quatro variáveis Supabase/URL da
   secção anterior e um HMAC secret exclusivo de staging.
7. Executar a aplicação e repetir manualmente a matriz funcional abaixo.

### Ambiente que já registou migrations antigas

A baseline `202608010000_base_schema.sql` foi acrescentada retroativamente para
tornar instalações vazias reproduzíveis. Antes de atualizar um projeto existente:

1. guardar backup e consultar `npx supabase migration list`;
2. confirmar que as sete tabelas-base existem e têm as colunas esperadas;
3. se `202608020001` já estiver registada, não reaplicar cegamente a baseline;
4. marcar a baseline como aplicada apenas com `supabase migration repair` depois
   dessa verificação;
5. aplicar a migration de reconciliação e repetir os testes num clone de staging.

Num staging descartável, a opção preferida é recriá-lo do zero.

## Google OAuth de staging

Segue também `docs/GOOGLE_OAUTH_SETUP.md`. Valores obrigatórios:

- origem HTTPS canónica de staging em `NEXT_PUBLIC_SITE_URL`;
- URL e publishable key do projeto Supabase de staging;
- secret key apenas no servidor;
- Google OAuth Client ID/secret guardados no painel Supabase;
- callback Google exata: `https://<project-ref>.supabase.co/auth/v1/callback`;
- redirect Supabase exato: `https://<staging-host>/api/auth/callback`.

Sem estes valores, o estado correto é **bloqueado por configuração externa**.

## Checklist funcional de staging

Registar data, browser, utilizador de teste, request/correlation ID e resultado de
cada caso, sem copiar tokens:

- conta nova com password cria exatamente um perfil;
- conta nova com Google cria exatamente um perfil;
- email já existente não cria uma segunda identidade inesperada;
- tentativa controlada de associar password e Google segue a política definida no
  Supabase, sem tomar contas automaticamente;
- cancelamento no ecrã Google regressa com mensagem segura e sem sessão falsa;
- callback sem código ou com estado inválido falha fechado;
- sessão expirada perde acesso a viagens privadas;
- logout revoga a sessão visível à aplicação;
- `next=/invitations/<token>` regressa ao mesmo convite;
- `next` externo ou codificado nunca sai da origem Andor;
- owner, editor e viewer veem apenas as operações autorizadas;
- outsider e anon não leem viagem, membros, perfil, tokens ou audit;
- link público só lê o snapshot sanitizado quando está ativo;
- convite errado, expirado, revogado e do próprio owner não cria membership;
- duas aceitações do mesmo convite deixam exatamente um membro e um estado aceite;
- uma viagem soft-deleted deixa de estar acessível a editor/viewer.

Depois da execução, guardar apenas resultados e IDs não sensíveis no registo de
verificação. Não anexar cookies, JWTs, OAuth codes, hashes de convite ou emails.
