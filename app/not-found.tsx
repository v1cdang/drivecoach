import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-[#0b2f6b]">Not found</h1>
      <p className="text-sm text-[rgb(39_58_86)]">That trip or page does not exist.</p>
      <Link href="/dashboard" className="text-[#00b9ac] hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
