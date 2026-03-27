import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GrillSync | Grătare organizate, datorii recuperate.",
  description: "Aplicația care face decontul la grătare ca să nu te mai cerți de la nota de plată.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="antialiased">
      <body className={cn(inter.className, "min-h-screen bg-background font-sans text-foreground")}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
