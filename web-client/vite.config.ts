import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    // Load .env files based on mode
    envDir: './',
    
    // Ensure assets are loaded from root
    base: '/',

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // Ensure assets are properly referenced
      assetsDir: 'assets',
    },

    server: {
      port: 5173,
    },
  };
});
