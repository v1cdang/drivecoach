"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

/**
 * Sends a Supabase magic link; session is established on `/auth/callback`.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const baseUrl: string =
    siteUrl !== undefined && siteUrl.trim() !== "" ? siteUrl : window.location.origin;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      setPending(true);
      setError(null);
      setMessage(null);
      const supabase = createSupabaseBrowserClient();
      const nextQuery = new URLSearchParams({ next: nextPath.startsWith("/") ? nextPath : "/dashboard" });
      const { error: signError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?${nextQuery.toString()}`,
        },
      });
      setPending(false);
      if (signError !== null) {
        setError(signError.message);
        return;
      }
      setMessage("Check your email for the login link.");
    },
    [email, nextPath, baseUrl],
  );
  return (
    <form onSubmit={(ev) => void onSubmit(ev)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-zinc-300">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base text-white outline-none ring-emerald-600 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white active:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a link"}
      </button>
      {message !== null ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error !== null ? <p className="text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
