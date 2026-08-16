import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    // Next 16/React 19 surfaced pre-existing component debt in these rules.
    // Keep it visible and cap the repository-wide baseline via --max-warnings.
    rules: {
      '@next/next/no-html-link-for-pages': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'build/**',
    'out/**',
    'next-env.d.ts',
    'playwright-report/**',
    'reports/**',
    'test-results/**',
  ]),
]);
