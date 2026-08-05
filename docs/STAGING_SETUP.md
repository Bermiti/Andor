# Staging Setup Guide

## Prerequisites

- Node.js >= 22.13.0
- Supabase CLI (`supabase` v2.111.0)
- A Supabase project (free tier is sufficient for staging)
- Google Cloud project with OAuth credentials (optional for Google login)

## 1. Supabase Project Setup

### Create Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Note the project URL and anon key
4. Go to Settings → API → Service Role Key (keep secure)

### Apply Migrations

Migrations must be applied **in order**:

```bash
# Option A: Using Supabase CLI (recommended)
supabase db reset --linked

# Option B: Manual execution in SQL Editor (in order)
# 1. supabase/migrations/202608010000_base_schema.sql
# 2. supabase/migrations/202608020001_sprint1_identity_authorization.sql
# 3. supabase/migrations/202608050001_auth_profile_trigger.sql
# 4. supabase/migrations/202608050002_security_reconciliation.sql
# 5. supabase/migrations/202608050003_generation_requests.sql
```

### Verify Schema

After applying migrations, run:

```bash
npm run test:db        # RLS matrix tests
npm run test:db:auth   # Auth trigger verification
```

## 2. Environment Variables

Copy `.env.example` and fill in:

```bash
cp .env.example .env.local
```

### Required for Staging

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Service role key (server-only) |
| `DATA_BACKEND_MODE` | Set to `supabase` | Enables Supabase persistence |

### Required for Google OAuth

| Variable | Source | Description |
|----------|--------|-------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | OAuth 2.0 Client Secret |

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed Google OAuth configuration.

### Optional for Production Features

| Variable | Source | Description |
|----------|--------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Dashboard | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Dashboard | Distributed rate limiting |
| `RATE_LIMIT_PROVIDER` | `auto` / `memory` / `upstash` | Rate limit backend selection |

## 3. Google OAuth Configuration

### Supabase Side

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Copy the Callback URL shown

### Google Cloud Side

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Credentials
3. Set authorized redirect URI to the Supabase callback URL
4. Set authorized JavaScript origins to your staging domain

## 4. Verification Checklist

### Schema Verification

- [ ] All 5 migrations applied successfully
- [ ] `npm run test:db` passes (RLS matrix)
- [ ] `npm run test:db:auth` passes (auth trigger)
- [ ] `npm run db:lint` shows no errors

### Auth Verification

- [ ] Password registration creates account + profile
- [ ] Password login returns valid session
- [ ] Google OAuth redirects to Google consent screen
- [ ] Google callback creates account + profile
- [ ] Existing email with different provider handled correctly
- [ ] OAuth cancellation returns to app gracefully
- [ ] Session expiry handled (redirect to login)
- [ ] Logout clears session completely

### RLS Verification

Test each role against each table:

| Action | Owner | Editor | Viewer | Outsider | Unauth |
|--------|-------|--------|--------|----------|--------|
| Read own trips | ✅ | ✅ | ✅ | ❌ | ❌ |
| Write own trips | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read other trips | ❌ | ❌ | ❌ | ❌ | ❌ |
| Write other trips | ❌ | ❌ | ❌ | ❌ | ❌ |
| Accept invitations | N/A | N/A | N/A | ✅* | ❌ |
| Enumerate profiles | ❌ | ❌ | ❌ | ❌ | ❌ |
| Enumerate tokens | ❌ | ❌ | ❌ | ❌ | ❌ |
| Bypass via RPC | ❌ | ❌ | ❌ | ❌ | ❌ |

*Only with valid invitation token for their email

### Data Flow Verification

- [ ] Create trip → saved to `itineraries` table
- [ ] Trip visible in My Trips list
- [ ] Edit activity → changes persisted
- [ ] Share trip → invitation created
- [ ] Accept invitation → member added atomically
- [ ] Logout → trip data inaccessible
- [ ] Login again → trip data restored

### Security Checks

- [ ] No secrets in repository (`git log --all -p | grep -i "secret\|password\|api_key"`)
- [ ] Service role key only used server-side
- [ ] Auth cookies set with proper flags
- [ ] Rate limiting headers present in responses
- [ ] OAuth redirect validated against allowlist

## 5. Local Development (Without Supabase)

For development without a Supabase project:

```bash
# Use SQLite backend (default)
DATA_BACKEND_MODE=sqlite npm run dev
```

This uses an in-memory SQLite database with the same schema contracts.

## 6. What Remains Blocked Without Credentials

| Feature | Status without credentials |
|---------|---------------------------|
| Supabase Auth | ❌ Requires project |
| Google OAuth | ❌ Requires OAuth credentials |
| Postgres RLS | ❌ Requires Supabase project |
| Persistent trips | ✅ Works with SQLite locally |
| Generation | ✅ Works with AI API key |
| Rate limiting | ✅ Works in-memory |
| Email sending | ❌ Requires email provider |
