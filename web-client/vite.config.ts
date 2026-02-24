import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    // Load .env files based on mode
    envDir: './',

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },

    server: {
      port: 5173,
    },
  };
});
