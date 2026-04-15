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
  title: "RAMS Curriculum Manager",
  description: "Curriculum management for Robert Adams Middle School",
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
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#8B1A1A] text-red-200 text-center py-4 text-sm">
          <p>Robert Adams Middle School &middot; Personal, Local, Global</p>
          <p className="text-red-300 text-xs mt-1">Holliston Public Schools</p>
        </footer>
      </body>
    </html>
  );
}
