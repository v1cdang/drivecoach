import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0b2f6b]">Create account</h1>
        <p className="mt-2 text-sm text-[rgb(39_58_86)]">Choose an email and password to get started.</p>
      </div>
      <Suspense fallback={<p className="text-[rgb(39_58_86)]">Loading…</p>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

