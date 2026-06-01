import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
  oxc: {
    include: [/\.[jt]sx?$/],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
    include: ['__tests__/**/*.{test,spec}.{js,jsx}'],
    exclude: ['tests/**/*'],
  },
});
