import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CineMatch - Find Your Vibe",
  description: "AI-powered movie discovery and group decision making",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground",
          inter.className
        )}
      >
        <main className="relative flex min-h-screen flex-col">
          {children}
          <Toaster position="top-center" richColors />
        </main>
      </body>
    </html>
  );
}
