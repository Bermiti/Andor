import { createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { readLocalSupabaseStatus } from './local-supabase-env.mjs';

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function expiredJwt(secret, userId) {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) - 60,
    iat: Math.floor(Date.now() / 1000) - 120,
    iss: 'supabase-demo',
    role: 'authenticated',
    sub: userId,
  });
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const status = readLocalSupabaseStatus();
const apiUrl = status.API_URL;
const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
const secretKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY;

if (!apiUrl || !publicKey || !secretKey || !status.JWT_SECRET) {
  throw new Error('Supabase local status did not expose the required test credentials.');
}

const authOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const client = createClient(apiUrl, publicKey, authOptions);
const admin = createClient(apiUrl, secretKey, authOptions);
const suffix = randomUUID();
const email = `auth-contract-${suffix}@andor.invalid`;
const password = `Andor-${suffix}-Aa1!`;
let userId = null;

try {
  const { data: signup, error: signupError } = await client.auth.signUp({
    email,
    password,
    options: { data: { name: 'Auth Contract' } },
  });
  if (signupError || !signup.user?.id || !signup.session) {
    throw new Error(`Password signup failed: ${signupError?.message || 'missing user/session'}`);
  }
  userId = signup.user.id;

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, email, name')
    .eq('id', userId)
    .single();
  if (profileError || profile?.email !== email || profile?.name !== 'Auth Contract') {
    throw new Error('auth.users -> profiles trigger did not persist the expected profile.');
  }

  await client.auth.signUp({ email, password });
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError || users.users.filter((user) => user.email === email).length !== 1) {
    throw new Error('Repeated signup created more than one auth identity.');
  }

  const { error: wrongPasswordError } = await client.auth.signInWithPassword({
    email,
    password: `${password}-wrong`,
  });
  if (!wrongPasswordError) throw new Error('Wrong password was accepted.');

  const { error: signOutError } = await client.auth.signOut();
  if (signOutError) throw new Error(`Logout failed: ${signOutError.message}`);
  const { data: loggedOut } = await client.auth.getSession();
  if (loggedOut.session) throw new Error('Logout left a local session active.');

  const { data: signedIn, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError || signedIn.user?.id !== userId || !signedIn.session) {
    throw new Error(`Password sign-in failed: ${signInError?.message || 'missing session'}`);
  }

  const expiredResponse = await fetch(`${apiUrl}/auth/v1/user`, {
    headers: {
      apikey: publicKey,
      Authorization: `Bearer ${expiredJwt(status.JWT_SECRET, userId)}`,
    },
  });
  const expiredBody = await expiredResponse.text();
  if (![401, 403].includes(expiredResponse.status)
      || !/expired|invalid.*jwt|jwt.*invalid/i.test(expiredBody)) {
    throw new Error(
      `Expired session token was not rejected as an auth error (HTTP ${expiredResponse.status}: ${expiredBody}).`
    );
  }

  console.log('Supabase Auth contract passed: signup, profile, duplicate email, logout, login, expiry.');
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId);
}
