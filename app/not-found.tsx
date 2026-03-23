import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-white">Not found</h1>
      <p className="text-sm text-zinc-400">That trip or page does not exist.</p>
      <Link href="/dashboard" className="text-emerald-400 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
