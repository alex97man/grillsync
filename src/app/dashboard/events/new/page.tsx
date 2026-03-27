"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Flame, Calendar, Type } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      if (!db.app.options.apiKey || db.app.options.apiKey === "your_api_key_here") {
        console.warn("MOCK Firestore Create Event.");
        setTimeout(() => {
          router.push(`/dashboard/events/mock-event`);
        }, 800);
        return;
      }

      const docRef = await addDoc(collection(db, "events"), {
        name: name || "Grătar Ad-Hoc",
        date: new Date(date),
        adminId: user.uid,
        participants: [user.uid], // Initially, just the creator is in the event
        status: "active",
        createdAt: serverTimestamp(),
      });

      // Redirect to the newly created event dashboard
      router.push(`/dashboard/events/${docRef.id}`);
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError("A crăpat serverul, probabil ai pus prea multă ceapă în mici.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="h-16 w-16 bg-orange-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500">
          <Flame className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Organizare Grătar</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Setează baza noului vostru ospăț.</p>
        </div>
      </div>

      <form onSubmit={handleCreateEvent} className="space-y-6 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Ce sărbătorim?</label>
          <div className="relative">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Grătar la munte / Zilele Comunei"
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Când se dă cep butoiului?</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
              required
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard">
            <Button type="button" variant="ghost">Anulează</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px] rounded-xl shadow-lg shadow-orange-500/20 px-6 h-12 text-base">
            {isSubmitting ? "Aprind cărbunii..." : "Dă drumul la foc"}
          </Button>
        </div>

      </form>
    </div>
  );
}
