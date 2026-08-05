import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { localSupabaseAppEnv } from './local-supabase-env.mjs';

const env = localSupabaseAppEnv();
const nextBin = resolve('node_modules/next/dist/bin/next');

async function waitForAuth() {
  const healthUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(healthUrl, {
        headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      });
      if (response.ok) return;
    } catch {
      // A local reset restarts GoTrue after the database is recreated.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error('Local Supabase Auth did not become healthy within 10 seconds.');
}

await waitForAuth();

const build = spawnSync(process.execPath, [nextBin, 'build'], {
  env,
  stdio: 'inherit',
});

if (build.error || build.status !== 0) {
  process.exit(build.status || 1);
}

const server = spawn(process.execPath, [nextBin, 'start'], {
  env,
  stdio: 'inherit',
});

const stop = (signal) => {
  if (!server.killed) server.kill(signal);
};

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
server.on('error', (error) => {
  console.error(`Unable to start Next.js: ${error.message}`);
  process.exit(1);
});
server.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
