/**
 * Resolves public Supabase URL + anon key. When env is unset (e.g. CI before secrets exist),
 * returns well-formed placeholders so `createServerClient` does not throw during `next build`.
 * Middleware should still treat missing real env as "auth disabled" — see `middleware.ts`.
 */
export function getSupabaseUrlAndKey(): {
  readonly url: string;
  readonly anonKey: string;
  readonly hasProjectEnv: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (url && anonKey) {
    return { url, anonKey, hasProjectEnv: true };
  }
  return {
    url: "https://placeholder.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    hasProjectEnv: false,
  };
}
