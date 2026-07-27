// client/src/lib/supabaseClient.ts  (NEW FILE)

import { createClient } from '@supabase/supabase-js';

// Anon/public key only — safe to expose in the browser bundle. This client
// is used ONLY for uploadToSignedUrl(), which requires a valid short-lived
// token issued by our own server (see documents.routes.ts /upload-url) —
// it cannot write anywhere in the bucket on its own.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

export const DOCUMENTS_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string;
