import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AddToHomePrompt } from "@/components/add-to-home-prompt";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "DriveCoach",
  description: "Real-time driving coach using device sensors",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DriveCoach",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout(props: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="flex min-h-dvh flex-col">
        <ServiceWorkerRegister />
        <AddToHomePrompt />
        <header className="sticky top-0 z-10 border-b border-[#dce6f7] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
            <Link href="/dashboard" className="shrink-0" aria-label="Go to dashboard">
              <Image
                src="/dc-logo.png"
                alt="DriveCoach"
                width={500}
                height={93}
                priority
                className="h-auto w-32 sm:w-40"
              />
            </Link>
            <nav className="flex gap-4 text-sm text-[#37629c]">
              <Link href="/dashboard" className="hover:text-[#0b2f6b]">
                Trip
              </Link>
              <Link href="/history" className="hover:text-[#0b2f6b]">
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
          {props.children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
