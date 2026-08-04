/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the H2C backend API, e.g. https://h2c-api.onrender.com/api */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
