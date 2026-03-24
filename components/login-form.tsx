"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

/**
 * Signs in a user using Supabase email and password.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextPathRaw: string = searchParams.get("next") ?? "/dashboard";
  const safeNextPath: string =
    nextPathRaw.startsWith("/") && !nextPathRaw.startsWith("//") ? nextPathRaw : "/dashboard";
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      setPending(true);
      setError(null);
      setMessage(null);
      const supabase = createSupabaseBrowserClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setPending(false);
      if (signError !== null) {
        setError(signError.message);
        return;
      }
      setMessage("You are now signed in.");
      router.replace(safeNextPath);
      router.refresh();
    },
    [email, password, router, safeNextPath],
  );
  return (
    <form onSubmit={(ev) => void onSubmit(ev)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-[#325b93]">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="rounded-xl border border-[#bfd2ed] bg-white px-4 py-4 text-base text-[#0b2f6b] outline-none ring-[#10d4c5] focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[#325b93]">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="rounded-xl border border-[#bfd2ed] bg-white px-4 py-4 text-base text-[#0b2f6b] outline-none ring-[#10d4c5] focus:ring-2"
          placeholder="Your password"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#10d4c5] py-4 text-lg font-semibold text-[#05244f] active:bg-[#0bc4b6] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {message !== null ? <p className="text-sm text-[#12897f]">{message}</p> : null}
      {error !== null ? <p className="text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
