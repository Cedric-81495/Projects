/// <reference types="vite/client" />

/**
 * Typed environment surface.
 *
 * Declaring the variables the app reads means a typo in an import.meta.env
 * lookup is a compile error rather than an undefined at runtime.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_STORAGE_BUCKET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
