import { defineConfig } from 'tsup';

/**
 * Build with esbuild rather than raw tsc.
 *
 * Two problems this removes. First, `@/` path aliases are a TypeScript
 * compile-time concept — tsc emits them verbatim, and Node cannot resolve
 * them, so a `tsc`-only build produces output that typechecks and then crashes
 * on boot. Second, tsc with NodeNext resolution disagreed with the settings
 * used during development, so the build surfaced errors that never appeared
 * while writing the code.
 *
 * Bundling resolves aliases at build time and uses one set of semantics
 * everywhere. Type safety is unaffected: `npm run typecheck` still runs tsc,
 * and it runs in CI before this.
 */
export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  // Dependencies stay external so native and dynamic requires keep working.
  skipNodeModulesBundle: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
});
