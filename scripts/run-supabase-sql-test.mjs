import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const testPath = resolve(process.argv[2] || 'supabase/tests/sprint1_rls_matrix.sql');
const config = readFileSync(resolve('supabase/config.toml'), 'utf8');
const projectId = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];

if (!projectId) {
  console.error('Unable to determine Supabase project_id from supabase/config.toml.');
  process.exit(1);
}

const sql = readFileSync(testPath, 'utf8');
const result = spawnSync(
  process.platform === 'win32' ? 'docker.exe' : 'docker',
  [
    'exec',
    '-i',
    `supabase_db_${projectId}`,
    'psql',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
  ],
  { input: sql, stdio: ['pipe', 'inherit', 'inherit'] }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
