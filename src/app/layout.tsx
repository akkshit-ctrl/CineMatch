import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/bottom-nav";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

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
          "min-h-screen bg-background font-sans antialiased text-foreground film-grain",
          inter.className,
          playfair.variable
        )}
      >
        <main className="relative flex min-h-screen flex-col pb-20">
          {children}
          <Toaster position="top-center" richColors />
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
