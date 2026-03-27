"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Flame, LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin p-2 bg-orange-500 rounded-lg">
          <Flame className="h-6 w-6 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <header className="px-4 sm:px-6 h-16 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/dashboard">
          <div className="p-1.5 bg-orange-500 rounded-lg">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white hidden sm:block">
            GrillSync
          </span>
        </Link>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{user.displayName || "Profil"}</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="w-5 h-5 text-zinc-500 hover:text-red-500 transition-colors" />
          </Button>
        </nav>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
