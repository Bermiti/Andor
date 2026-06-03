import { defineConfig } from 'vitest/config';
import { transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        const cleanId = id.replace(/\\/g, '/');
        if (!cleanId.endsWith('.js') || !cleanId.includes('/app/')) return null;
        return transformWithOxc(code, id + 'x');
      },
    },
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
    include: ['__tests__/**/*.{test,spec}.{js,jsx}'],
    exclude: ['tests/**/*'],
  },
});
