"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Beef, Beer, Candy, Coffee, Upload, Plus, Calculator } from "lucide-react";
import Link from "next/link";

interface EventItem {
  id: string;
  name: string;
  price: number;
  category: "Food" | "Drinks" | "Sweets" | "Others";
  consumers: string[];
  payerId: string;
}

export default function EventPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [eventData, setEventData] = useState<any>(null);
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventDetails() {
      if (!user || !eventId) return;
      
      try {
        if (!db.app.options.apiKey || db.app.options.apiKey === "your_api_key_here") {
          console.warn("MOCK Firestore Event Details.");
          setEventData({ 
            id: eventId, 
            name: eventId === "mock-1" ? "Grătar la Bogdan" : "Miting Câmpenesc", 
            date: { toDate: () => new Date() },
            status: "active",
            participants: [user.uid, "user2"]
          });
          
          setItems([
            { id: "i1", name: "Mici Obor", price: 45.0, category: "Food", consumers: [user.uid, "user2"], payerId: user.uid },
            { id: "i2", name: "Navetă Timișoreana", price: 65.5, category: "Drinks", consumers: ["user2"], payerId: "user2" },
            { id: "i3", name: "Eugenie", price: 12.0, category: "Sweets", consumers: [user.uid], payerId: user.uid }
          ]);
          setLoading(false);
          return;
        }

        // Fetch Event Info
        const docRef = doc(db, "events", eventId as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEventData({ id: docSnap.id, ...docSnap.data() });
          
          // Fetch Event Items
          const itemsRef = collection(db, "events", eventId as string, "items");
          const itemsSnap = await getDocs(itemsRef);
          
          const itemsList: EventItem[] = [];
          itemsSnap.forEach((itemDoc) => {
            itemsList.push({ id: itemDoc.id, ...itemDoc.data() } as EventItem);
          });
          setItems(itemsList);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Error loading event:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEventDetails();
  }, [eventId, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-pulse text-zinc-400">Întoarcem micii...</div>
      </div>
    );
  }

  if (!eventData) return null;

  const totalCost = items.reduce((acc, item) => acc + item.price, 0);

  const renderCategory = (title: string, cat: "Food" | "Drinks" | "Sweets" | "Others", icon: React.ReactNode, colorClass: string) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length === 0) return null;
    
    return (
      <div className="space-y-4 mb-8">
        <h3 className={`font-bold text-lg flex items-center gap-2 ${colorClass}`}>
          {icon} {title}
        </h3>
        <div className="space-y-3">
          {catItems.map((item) => (
            <div key={item.id} className="glass p-4 rounded-2xl flex items-center justify-between hover:border-orange-500/30 transition-colors">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-white block">{item.name}</span>
                <span className="text-xs text-zinc-500">{item.consumers.length} pofticioși</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-zinc-900 dark:text-white block">{item.price.toFixed(2)} RON</span>
                <span className="text-xs text-zinc-500">
                  <span className="text-orange-500">{item.price / (item.consumers.length || 1)} RON</span> / om
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{eventData.name}</h1>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${eventData.status === 'active' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
              {eventData.status === 'active' ? 'În Curs' : 'Decontat'}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-500">
            {new Date(eventData.date.toDate()).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center h-28">
          <span className="text-sm text-zinc-500 font-medium mb-1">Total gaură buget</span>
          <span className="text-3xl font-black text-zinc-900 dark:text-white">{totalCost.toFixed(2)} <span className="text-lg text-zinc-400">RON</span></span>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-3xl border border-orange-200 dark:border-orange-900/30 flex flex-col items-center justify-center text-center h-28">
          <span className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium mb-1">Participanți</span>
          <span className="text-3xl font-black text-orange-600 dark:text-orange-500">{eventData.participants?.length || 1}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Nu ați cumpărat nimic încă?</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">Fără mâncare e doar o adunare tristă. Scanează un bon sau adaugă produse manual.</p>
        </div>
      ) : (
        <div className="pt-4">
          {renderCategory("Mâncare adevărată", "Food", <Beef className="w-5 h-5" />, "text-rose-500")}
          {renderCategory("Stingător de sete", "Drinks", <Beer className="w-5 h-5" />, "text-amber-500")}
          {renderCategory("Pentru diabetici", "Sweets", <Candy className="w-5 h-5" />, "text-indigo-500")}
          {renderCategory("Diverse (Cărbuni, Pastile)", "Others", <Coffee className="w-5 h-5" />, "text-zinc-500")}
        </div>
      )}

      {/* Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50">
        <div className="glass rounded-full p-2 flex items-center gap-2 shadow-2xl border-white/40 dark:border-white/20">
          <Link href={`/dashboard/events/${eventId}/scan`} className="flex-1">
            <Button className="w-full rounded-full gap-2 whitespace-nowrap bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white">
              <Upload className="w-4 h-4" />
              <span>Scanează bon</span>
            </Button>
          </Link>
          <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700"></div>
          <Link href={`/dashboard/events/${eventId}/decont`} className="flex-1">
             <Button variant="default" className="w-full rounded-full gap-2 whitespace-nowrap">
              <Calculator className="w-4 h-4" />
              <span>Sărăcia (Decont)</span>
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
