"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Ends the Supabase session and returns the user to the login screen.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const onSignOut = useCallback(async (): Promise<void> => {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [router]);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onSignOut()}
      className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline disabled:opacity-50"
    >
      Sign out
    </button>
  );
}
