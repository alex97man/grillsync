"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Plus, TentTree, Users, ArrowRight } from "lucide-react";

export default function DashboardIndex() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!user) return;
      try {
        // Fallback for Demo Mode (No API Keys)
        if (!db.app.options.apiKey || db.app.options.apiKey === "your_api_key_here") {
           console.warn("MOCK Firestore Dashboard list.");
           setEvents([
             { id: "mock-1", name: "Grătar la Bogdan", date: { toDate: () => new Date() }, participants: [user.uid, "user2", "user3"], status: "active" },
             { id: "mock-2", name: "Zilele Comunei", date: { toDate: () => new Date(Date.now() - 86400000 * 3) }, participants: [user.uid, "user4"], status: "settled" }
           ]);
           setLoading(false);
           return;
        }

        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("participants", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);
        const eventList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
        
        // Sort in memory since compound queries require composite indexes in Firestore
        eventList.sort((a: any, b: any) => b.date.toMillis() - a.date.toMillis());
        setEvents(eventList);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, [user]);

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2">
            Unde frigem carnea azi?
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Aici sunt toate grătarele la care participi. Fă cinste sau strânge datoria.
          </p>
        </div>

        <Link href="/dashboard/events/new">
          <Button size="lg" className="rounded-2xl shadow-lg shadow-orange-500/20 whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" />
            Vreau să organizez un grătar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {loading && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-zinc-500">
            Căutăm grătarele... 🔥
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="glass rounded-3xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                <TentTree className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">E gol, prietene!</h3>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mb-6">
                Nu ai participat la niciun grătar și n-ai datorii de recuperat. Fii tu zeul cărnurilor și organizează primul ieșon.
              </p>
              <Link href="/dashboard/events/new">
                <Button className="rounded-xl">Începe Măcelul Financiar</Button>
              </Link>
            </div>
          </div>
        )}

        {!loading && events.map((event) => (
          <Link href={`/dashboard/events/${event.id}`} key={event.id}>
            <div className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/50 transition-all cursor-pointer h-full flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${event.status === 'active' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                    {event.status === 'active' ? 'În Curs' : 'Decontat'}
                  </div>
                  <span className="text-sm font-medium text-zinc-400">
                    {new Date(event.date.toDate()).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight mb-2 group-hover:text-orange-500 transition-colors">
                  {event.name}
                </h3>
                
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-4">
                  <Users className="w-4 h-4" />
                  <span>{event.participants?.length || 1} Mâncăi</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors text-zinc-400">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>
        ))}

      </div>

    </div>
  );
}
