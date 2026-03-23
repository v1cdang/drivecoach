import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { AddToHomePrompt } from "@/components/add-to-home-prompt";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "DriveCoach",
  description: "Real-time driving coach using device sensors",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DriveCoach",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout(props: { readonly children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ServiceWorkerRegister />
        <AddToHomePrompt />
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
              DriveCoach
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-400">
              <Link href="/dashboard" className="hover:text-white">
                Trip
              </Link>
              <Link href="/history" className="hover:text-white">
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
          {props.children}
        </main>
      </body>
    </html>
  );
}
