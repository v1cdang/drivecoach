"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

const MIN_PASSWORD_LENGTH = 8;

function sanitizeNextPath(rawNextPath: string): string {
  return rawNextPath.startsWith("/") && !rawNextPath.startsWith("//") ? rawNextPath : "/dashboard";
}

/**
 * Registers a new user using Supabase email and password.
 */
export function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextPathRaw: string = searchParams.get("next") ?? "/dashboard";
  const safeNextPath: string = sanitizeNextPath(nextPathRaw);

  const siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL;
  const baseUrl: string =
    siteUrl !== undefined && siteUrl.trim() !== "" ? siteUrl : window.location.origin;

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(false);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      setPending(true);
      setError(null);
      setMessage(null);

      if (password.length < MIN_PASSWORD_LENGTH) {
        setPending(false);
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (password !== passwordConfirmation) {
        setPending(false);
        setError("Passwords do not match.");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const nextQuery = new URLSearchParams({ next: safeNextPath });
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?${nextQuery.toString()}`,
        },
      });

      setPending(false);
      if (signUpError !== null) {
        setError(signUpError.message);
        return;
      }

      if (data.session !== null) {
        setMessage("Account created. You are now signed in.");
        router.replace(safeNextPath);
        router.refresh();
        return;
      }

      setMessage("Account created. Check your email to confirm your account.");
    },
    [email, password, passwordConfirmation, router, safeNextPath, baseUrl],
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
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="rounded-xl border border-[#bfd2ed] bg-white px-4 py-4 text-base text-[#0b2f6b] outline-none ring-[#10d4c5] focus:ring-2"
          placeholder="Create a password"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[#325b93]">
        Confirm password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(ev) => setPasswordConfirmation(ev.target.value)}
          className="rounded-xl border border-[#bfd2ed] bg-white px-4 py-4 text-base text-[#0b2f6b] outline-none ring-[#10d4c5] focus:ring-2"
          placeholder="Re-type your password"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#10d4c5] py-4 text-lg font-semibold text-[#05244f] active:bg-[#0bc4b6] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
      {message !== null ? <p className="text-sm text-[#12897f]">{message}</p> : null}
      {error !== null ? <p className="text-sm text-red-400">{error}</p> : null}
    </form>
  );
}

