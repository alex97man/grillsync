"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Flame, LogIn, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Email sau parolă greșită.");
      } else if (code === "auth/too-many-requests") {
        setError("Prea multe încercări. Contul e blocat temporar.");
      } else if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") {
        setError("CONFIGURARE LIPSĂ: Nu ai activat 'Email/Password' în Firebase Console.");
      } else {
        setError("A apărut o eroare necunoscută. Apasă F12.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 selection:bg-orange-500/30">
      
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 group">
        <div className="p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg group-hover:bg-orange-500 transition-colors">
          <Flame className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-white transition-colors" />
        </div>
        <span className="font-semibold text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
          Înapoi la meniu
        </span>
      </Link>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2">
              Salutare, <span className="text-orange-500">grataragiule</span>!
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Autentifică-te ca să vezi cine ți-a furat aripioarele și câți bani ai de recuperat.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-xl text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ion@fara-nicio-datorie.ro"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
                required
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Parolă</label>
                <Link href="#" className="text-xs text-orange-500 hover:text-orange-600">
                  Ai uitat-o de la sarmale?
                </Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-base rounded-xl mt-2">
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? "Se încinge grătarul..." : "Intră la grătar"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">sau dă click aici</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-12 text-base rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Continuă cu Google
          </Button>

        </div>
        
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-500 mt-8">
          Încă nu ai fost invitat vreodată la grătar? <br/>
          <Link href="/register" className="text-orange-500 font-medium hover:underline">
            Creează-ți un cont
          </Link>
        </p>

      </div>
    </div>
  );
}
