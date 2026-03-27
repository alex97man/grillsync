"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Save, UserCircle, Landmark, Wallet } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [revolutTag, setRevolutTag] = useState("");
  const [iban, setIban] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setRevolutTag(userProfile.paymentDetails?.revolutTag || "");
      setIban(userProfile.paymentDetails?.iban || "");
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage("");
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        paymentDetails: {
          revolutTag: revolutTag.startsWith("@") ? revolutTag : (revolutTag ? `@${revolutTag}` : ""),
          iban: iban,
        }
      });
      setMessage("Gata șefu', te avem în sistem! 💸");
    } catch (err) {
      console.error(err);
      setMessage("A crăpat ceva! Ești sigur că ai IBAN de România?");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="h-16 w-16 bg-orange-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500">
          <UserCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profilul tău</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Fixează-ți conturile ca să aibă unde să-ți trimită băieții banii pe mici.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        
        {message && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium text-sm border border-green-200 dark:border-green-900/50">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Nume Afișat</label>
          <div className="relative">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex. Regele Grătarului"
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-8 pt-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Setări de încasare</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Unde vrei să fii plătit când organizezi tu?</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1 rounded-md text-xs font-bold leading-none">REV</span>
                  Revolut Tag
                </label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    value={revolutTag}
                    onChange={(e) => setRevolutTag(e.target.value)}
                    placeholder="@ionbarsu"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 flex items-center gap-2">
                  <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 p-1 rounded-md text-xs font-bold leading-none">BANCĂ</span>
                  IBAN
                </label>
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="RO99 BTRL 0000 0000 0000 0000"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard">
            <Button type="button" variant="ghost">Înapoi</Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="min-w-[140px] rounded-xl shadow-lg shadow-orange-500/20">
            {isSaving ? "Salvez..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Actualizează
              </>
            )}
          </Button>
        </div>
      </form>

    </div>
  );
}
