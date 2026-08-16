#!/usr/bin/env node
/**
 * Staging Validation Checklist
 *
 * Verifies that the project is ready for staging deployment.
 * Run: node scripts/staging-checklist.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
let passed = 0;
let failed = 0;
let warnings = 0;

function check(label, condition, message) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} — ${message}`);
    failed++;
  }
}

function warn(label, condition, message) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ⚠️  ${label} — ${message}`);
    warnings++;
  }
}

function fileExists(path) {
  return existsSync(join(ROOT, path));
}

function readFile(path) {
  try {
    return readFileSync(join(ROOT, path), 'utf-8');
  } catch {
    return '';
  }
}

console.log('\n🔍 Andor Staging Validation Checklist\n');

// --- 1. Schema & Migrations ---
console.log('📦 Schema & Migrations');

const migrationsDir = join(ROOT, 'supabase', 'migrations');
const migrations = existsSync(migrationsDir)
  ? readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  : [];

check('Migrations directory exists', migrations.length > 0, 'supabase/migrations/ is missing or empty');
check('Base schema migration exists', migrations.some((f) => f.includes('base_schema')), 'Missing base schema migration');
check('Identity/auth migration exists', migrations.some((f) => f.includes('identity_authorization')), 'Missing identity authorization migration');
check('Auth profile trigger migration exists', migrations.some((f) => f.includes('auth_profile_trigger')), 'Missing auth profile trigger migration');
check('Security reconciliation migration exists', migrations.some((f) => f.includes('security_reconciliation')), 'Missing security reconciliation migration');
check('Generation requests migration exists', migrations.some((f) => f.includes('generation_requests')), 'Missing generation requests migration');

const schema = readFile('supabase/schema.sql');
check('schema.sql exists and is non-empty', schema.length > 1000, 'supabase/schema.sql is missing or too small');
check('RLS policies defined in schema', schema.includes('CREATE POLICY') || schema.includes('create policy'), 'No RLS policies found in schema');
check('Auth trigger defined', schema.includes('handle_new_auth_user') || schema.includes('auth.users'), 'Auth user trigger not found in schema');

console.log('');

// --- 2. RLS Test Coverage ---
console.log('🔒 RLS Test Coverage');

const rlsTests = readFile('supabase/tests/sprint1_rls_matrix.sql');
check('RLS test matrix exists', rlsTests.length > 500, 'supabase/tests/sprint1_rls_matrix.sql is missing');
check('Tests owner role', rlsTests.includes('owner') || rlsTests.includes('Owner'), 'Owner role not tested');
check('Tests outsider role', rlsTests.includes('outsider') || rlsTests.includes('Outsider'), 'Outsider role not tested');
check('Tests viewer role', rlsTests.includes('viewer') || rlsTests.includes('Viewer'), 'Viewer role not tested');

console.log('');

// --- 3. Auth Configuration ---
console.log('🔐 Authentication');

const authCallback = fileExists('app/api/auth/callback/route.js');
const authGoogle = fileExists('app/api/auth/google/route.js');
const authLogin = fileExists('app/api/auth/login/route.js');
const authRegister = fileExists('app/api/auth/register/route.js');
const authRedirect = fileExists('app/lib/auth-redirect.js');

check('Auth callback route exists', authCallback, 'app/api/auth/callback/route.js missing');
check('Google OAuth route exists', authGoogle, 'app/api/auth/google/route.js missing');
check('Login route exists', authLogin, 'app/api/auth/login/route.js missing');
check('Register route exists', authRegister, 'app/api/auth/register/route.js missing');
check('Auth redirect validation exists', authRedirect, 'app/lib/auth-redirect.js missing');

const oauthSetup = fileExists('docs/GOOGLE_OAUTH_SETUP.md');
const stagingSetup = fileExists('docs/STAGING_SETUP.md');
check('Google OAuth setup docs exist', oauthSetup, 'docs/GOOGLE_OAUTH_SETUP.md missing');
check('Staging setup docs exist', stagingSetup, 'docs/STAGING_SETUP.md missing');

console.log('');

// --- 4. Security ---
console.log('🛡️  Security');

const envExample = readFile('.env.example');
check('.env.example exists', envExample.length > 100, '.env.example is missing');
check('No hardcoded secrets in .env.example', !envExample.includes('sk_live') && !envExample.includes('eyJ'), '.env.example contains what looks like real credentials');

const gitignore = readFile('.gitignore');
check('.gitignore includes .env.local', gitignore.includes('.env.local'), '.env.local not in .gitignore');
check('.gitignore includes .env', gitignore.includes('.env'), '.env not in .gitignore');

console.log('');

// --- 5. Rate Limiting ---
console.log('⏱️  Rate Limiting');

const rateLimit = readFile('app/lib/server/rate-limit.js');
check('Rate limiting module exists', rateLimit.length > 500, 'rate-limit.js is missing');
check('Distributed store support', rateLimit.includes('UpstashRedis') || rateLimit.includes('distributed'), 'No distributed rate limit store found');
check('Fallback behavior', rateLimit.includes('fallback') || rateLimit.includes('memoryStore'), 'No fallback behavior defined');
check('Rate limit headers', rateLimit.includes('X-RateLimit'), 'No rate limit headers');

console.log('');

// --- 6. Multi-Destination ---
console.log('🗺️  Multi-Destination');

check('Journey model exists', fileExists('app/lib/journey-model.js'), 'journey-model.js missing');
check('Journey selectors exist', fileExists('app/lib/journey-selectors.js'), 'journey-selectors.js missing');
check('Multi-destination generation exists', fileExists('app/lib/server/multi-destination-generation.js'), 'multi-destination-generation.js missing');
check('Generation request repository exists', fileExists('app/lib/server/generation-request-repository.js'), 'generation-request-repository.js missing');
check('StageNavigator component exists', fileExists('app/components/StageNavigator.js'), 'StageNavigator.js missing');

console.log('');

// --- 7. Tests ---
console.log('🧪 Test Coverage');

const testFiles = existsSync(join(ROOT, '__tests__'))
  ? readdirSync(join(ROOT, '__tests__')).filter((f) => f.endsWith('.test.js') || f.endsWith('.test.jsx'))
  : [];

check('Unit test files exist', testFiles.length >= 50, `Only ${testFiles.length} test files found`);
check('Journey model tests', testFiles.some((f) => f.includes('journey-model')), 'Journey model tests missing');
check('Idempotency tests', testFiles.some((f) => f.includes('idempotency')), 'Idempotency tests missing');
check('Rate limit tests', testFiles.some((f) => f.includes('rate-limit')), 'Rate limit tests missing');
check('Auth tests', testFiles.some((f) => f.includes('auth')), 'Auth tests missing');
check('Recommendation tests', testFiles.some((f) => f.includes('recommendation')), 'Recommendation tests missing');

console.log('');

// --- 8. Key Components ---
console.log('🎨 Key UI Components');

const components = existsSync(join(ROOT, 'app', 'components'))
  ? readdirSync(join(ROOT, 'app', 'components')).filter((f) => f.endsWith('.js'))
  : [];

check('ActivityCard exists', components.includes('ActivityCard.js'), 'ActivityCard.js missing');
check('ActivityEditor exists', components.includes('ActivityEditor.js'), 'ActivityEditor.js missing');
check('StageNavigator exists', components.includes('StageNavigator.js'), 'StageNavigator.js missing');
check('RecommendationCard exists', components.includes('RecommendationCard.js'), 'RecommendationCard.js missing');
check('CreationWizard exists', components.includes('CreationWizard.js'), 'CreationWizard.js missing');
check('LoginModal exists', components.includes('LoginModal.js'), 'LoginModal.js missing');

console.log('');

// --- Summary ---
console.log('━'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);

if (failed > 0) {
  console.log('❌ Staging checklist has failures. Address them before deploying.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Staging checklist passed with warnings.\n');
} else {
  console.log('✅ All staging checks passed!\n');
}
