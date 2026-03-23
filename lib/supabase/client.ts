import { getSupabaseUrlAndKey } from "@/lib/supabase/get-url-and-key";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client; respects RLS using the logged-in session from cookies.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseUrlAndKey();
  return createBrowserClient(url, anonKey);
}
