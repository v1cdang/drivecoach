import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0b2f6b]">Sign in</h1>
        <p className="mt-2 text-sm text-[rgb(39_58_86)]">Email and password sign-in.</p>
      </div>
      <Suspense fallback={<p className="text-[rgb(39_58_86)]">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-[rgb(39_58_86)]">
        New here?{" "}
        <Link href="/register" className="text-[#00b9ac] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
