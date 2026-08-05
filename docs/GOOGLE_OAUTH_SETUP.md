# Google OAuth via Supabase

O código da Andor inicia o login em `/api/auth/google` e recebe o código PKCE em
`/api/auth/callback`. O segredo Google fica apenas no painel Supabase; nunca deve
ser adicionado ao repositório nem a uma variável `NEXT_PUBLIC_*`.

## 1. Google Cloud Console

1. Abre **Google Cloud Console → APIs & Services → OAuth consent screen**.
2. Define o nome da aplicação como `Andor`, o email de suporte e os domínios que
   a equipa controla. Em produção, publica páginas reais de homepage, privacidade
   e termos no mesmo domínio.
3. Enquanto a aplicação estiver em modo de teste, adiciona explicitamente as
   contas de teste autorizadas.
4. Em **Credentials → Create credentials → OAuth client ID**, escolhe
   **Web application**.
5. Em **Authorized JavaScript origins**, adiciona:
   - `http://localhost:3000`
   - `https://<dominio-de-producao>`
6. Em **Authorized redirect URIs**, adiciona a callback apresentada em
   **Supabase Dashboard → Authentication → Providers → Google**, com este formato:
   - `https://<project-ref>.supabase.co/auth/v1/callback`

O URI Google é a callback do Supabase, não `/api/auth/callback`. Tem de coincidir
exatamente, incluindo protocolo, host e caminho.

## 2. Supabase Dashboard

1. Abre **Authentication → Providers → Google**.
2. Ativa o provider e introduz o **Client ID** e **Client secret** criados no
   Google Cloud Console.
3. Abre **Authentication → URL Configuration**.
4. Define **Site URL** como `https://<dominio-de-producao>`.
5. Adiciona a **Redirect URLs**:
   - `http://localhost:3000/api/auth/callback`
   - `https://<dominio-de-producao>/api/auth/callback`
   - callbacks exatas dos ambientes de preview que forem realmente utilizados.

Evita wildcards em produção. O parâmetro interno `next` é validado pela aplicação
e só pode apontar para um caminho local.

## 3. Variáveis da Andor

Desenvolvimento (`.env.local`):

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
```

Produção: altera `NEXT_PUBLIC_SITE_URL` para a origem HTTPS canónica. Não coloques
o Client secret Google nestas variáveis: ele pertence ao cofre do Supabase.

## 4. Validação antes de produção

- Iniciar login em desktop e mobile e regressar ao caminho pedido.
- Cancelar no ecrã Google e confirmar uma mensagem clara, sem loop.
- Confirmar que `/api/auth/me` devolve o utilizador e que o perfil foi criado.
- Recarregar e abrir um novo separador para confirmar persistência da sessão.
- Terminar sessão e confirmar que cookies e dados privados deixam de estar ativos.
- Testar uma conta nova e uma conta cujo email já existe.
- Confirmar que não há tokens em URLs, logs, analytics ou HTML.

O fluxo real só pode ser dado como validado depois destes testes contra o projeto
Supabase e o cliente OAuth de produção.

Referências oficiais: [Supabase — Google login](https://supabase.com/docs/guides/auth/social-login/auth-google),
[Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) e
[Google — OAuth 2.0 para aplicações web](https://developers.google.com/identity/protocols/oauth2/web-server).
