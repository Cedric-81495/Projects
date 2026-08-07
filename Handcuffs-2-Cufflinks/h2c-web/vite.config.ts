import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Vendor code is split by package so a content edit never invalidates
         * the framework cache.
         *
         * This is resolved-id matching rather than a list of package names on
         * purpose: naming "react-dom" does not match an `import from
         * 'react-dom/client'`, which silently dropped react-dom into the app
         * chunk and defeated the caching this exists to provide.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router';
          if (
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react';
          }
          if (id.includes('react-hook-form')) return 'forms';
          return 'vendor';
        },
      },
    },
  },
  server: { port: 5173, open: false },
});
