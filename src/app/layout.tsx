import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://curriclio.app"),
  title: "Curriclio — Curriculum management for school districts",
  description: "A simple, organized way for curriculum coordinators to write, review, and approve UBD unit plans across every grade and subject.",
  openGraph: {
    title: "Curriclio — Curriculum management for school districts",
    description: "Curriculum management without the headache. Built for the way curriculum offices actually work.",
    url: "https://curriclio.app",
    siteName: "Curriclio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curriclio — Curriculum management for school districts",
    description: "Curriculum management without the headache.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-300 text-center py-4 text-sm">
          <p>Curriclio &middot; Curriculum management for school districts</p>
        </footer>
      </body>
    </html>
  );
}
