import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  /**
   * Build-time guard for the Supabase configuration.
   *
   * Vite inlines `import.meta.env.*` at build time, so an unset variable is not
   * "missing at runtime" — it is a compile-time constant. The guard clause in
   * supabaseClient.ts then becomes statically true and Rollup dead-code
   * eliminates the createClient call, dropping supabase-js from the bundle
   * entirely. The result is a deploy where document upload can never work, with
   * nothing in the build output to say so.
   *
   * Warning loudly here is the difference between catching that in CI and
   * discovering it from a customer.
   */
  if (mode === 'production' && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)) {
    console.warn(
      '\n\x1b[33m⚠  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.\n' +
        '   Document upload will be disabled in this build and supabase-js will be\n' +
        '   tree-shaken out. Set both in the Netlify build environment to enable it.\x1b[0m\n',
    )
  }

  if (mode === 'production' && !env.VITE_API_URL) {
    console.warn(
      '\n\x1b[33m⚠  VITE_API_URL is not set — this build will call http://localhost:4000.\n' +
        '   Set it to the Render API URL in the Netlify build environment.\x1b[0m\n',
    )
  }

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          /**
           * Braintree's Drop-in is large and only needed on checkout, so it is
           * split out. Combined with the React.lazy boundary around that route,
           * a visitor reading the funnel never downloads it.
           */
          manualChunks(id: string) {
            if (id.includes('braintree')) return 'braintree'
            // Only claim a supabase chunk when the SDK is actually reachable;
            // otherwise Rollup emits a confusing empty chunk.
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('react-router')) return 'router'
            if (id.includes('node_modules/react')) return 'react'
            return undefined
          },
        },
      },
      chunkSizeWarningLimit: 700,
      sourcemap: false,
    },
    server: {
      port: 5173,
    },
  }
})
