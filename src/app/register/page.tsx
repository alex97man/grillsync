"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Flame, UserPlus } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        paymentDetails: { revolutTag: "", iban: "" },
        createdAt: new Date()
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 selection:bg-orange-500/30">
      
      <Link href="/login" className="absolute top-6 left-6 flex items-center gap-2 group">
        <div className="p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span className="font-semibold text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
          Înapoi la Logare
        </span>
      </Link>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2">
              Cont <span className="text-orange-500">Nou</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Uite cine s-a hotărât să-și plătească partea la grătare!
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded-xl text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Cum te strigă ai tăi?</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Ion Decontoru"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
                required
              />
            </div>

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
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Parolă</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minim 6 caractere"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-base rounded-xl mt-4">
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? "Se pregătește lista..." : "Băgați-mă pe listă"}
            </Button>
          </form>

        </div>
        
      </div>
    </div>
  );
}
