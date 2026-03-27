"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc, collection, query, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Beef, Beer, Candy, Coffee, Upload, Plus, Calculator, Share2, Flame } from "lucide-react";
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
  const [isParticipant, setIsParticipant] = useState(true);

  useEffect(() => {
    async function fetchEventDetails() {
      if (!user || !eventId) return;
      
      try {
        const docRef = doc(db, "events", eventId as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.participants || !data.participants.includes(user.uid)) {
            setIsParticipant(false);
          } else {
            setIsParticipant(true);
          }
          setEventData({ id: docSnap.id, ...data });
          
          if (data.participants && data.participants.includes(user.uid)) {
            const itemsRef = collection(db, "events", eventId as string, "items");
            const itemsSnap = await getDocs(itemsRef);
            
            const itemsList: EventItem[] = [];
            itemsSnap.forEach((itemDoc) => {
              itemsList.push({ id: itemDoc.id, ...itemDoc.data() } as EventItem);
            });
            setItems(itemsList);
          }
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

  const handleJoinEvent = async () => {
    if (!user || !eventData) return;
    try {
      const newParticipants = [...(eventData.participants || []), user.uid];
      await updateDoc(doc(db, "events", eventId as string), { participants: newParticipants });
      setEventData({ ...eventData, participants: newParticipants });
      setIsParticipant(true);
      // Fetch items gently now
      const itemsRef = collection(db, "events", eventId as string, "items");
      const itemsSnap = await getDocs(itemsRef);
      const itemsList: EventItem[] = [];
      itemsSnap.forEach((item) => itemsList.push({ id: item.id, ...item.data() } as EventItem));
      setItems(itemsList);
    } catch(err) {
      console.error(err);
      alert("Eroare la intrarea în grup.");
    }
  };

  const handleInvite = () => {
    const inviteLink = `${window.location.origin}/dashboard/events/${eventId}`;
    const text = `Hai și tu la grătarul "${eventData.name}"! Intră pe link să te adaugi pe listă: ${inviteLink}`;
    if (navigator.share) {
      navigator.share({
        title: 'Invitație Grătar',
        text: text,
        url: inviteLink,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Linkul invitației a fost copiat în memorie (Clipboard). Trimite-l prietenilor tăi!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-pulse text-zinc-400">Întoarcem micii...</div>
      </div>
    );
  }

  if (!eventData) return null;

  if (!isParticipant) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
          <Flame className="w-12 h-12 text-orange-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Ai fost invitat la grătar!</h2>
        <p className="text-zinc-500 mb-8 max-w-sm">Te alături evenimentului <strong>{eventData.name}</strong> creat recent?</p>
        <Button 
          onClick={handleJoinEvent} 
          className="w-full max-w-xs h-14 text-lg rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-5 h-5 mr-2" />
          Mă bag!
        </Button>
      </div>
    );
  }

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
                  <span className="text-orange-500">{(item.price / (item.consumers.length || 1)).toFixed(2)} RON</span> / om
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
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white line-clamp-1">{eventData.name}</h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${eventData.status === 'active' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                {eventData.status === 'active' ? 'Activ' : 'Decontat'}
              </span>
            </div>
            <p className="text-xs font-medium text-zinc-500">
              {new Date(eventData.date.toDate()).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <Button onClick={handleInvite} variant="outline" size="icon" className="rounded-full shrink-0 shadow-sm border-zinc-200">
          <Share2 className="w-4 h-4 text-orange-500" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center h-28 relative">
          <span className="text-sm text-zinc-500 font-medium mb-1">Total consumat</span>
          <span className="text-3xl font-black text-zinc-900 dark:text-white">{totalCost.toFixed(2)} <span className="text-lg text-zinc-400">RON</span></span>
        </div>
        <div onClick={handleInvite} className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-3xl border border-orange-200 dark:border-orange-900/30 flex flex-col items-center justify-center text-center h-28 cursor-pointer hover:bg-orange-100 transition-colors">
          <span className="text-sm text-orange-600/80 dark:text-orange-400/80 font-medium mb-1">Participanți</span>
          <span className="text-3xl font-black text-orange-600 dark:text-orange-500 flex items-center gap-2">
            {eventData.participants?.length || 1} 
            <Plus className="w-5 h-5 opacity-50" />
          </span>
        </div>
      </div>

      {/* Manual Buy Button (Floating above Action bar if empty, or inside action bar) */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Lista de cumpărături</h2>
        <Link href={`/dashboard/events/${eventId}/add`}>
          <Button size="sm" variant="outline" className="rounded-full shadow-sm text-xs font-semibold h-9">
            <Plus className="w-4 h-4 mr-1" /> Adaugă manual
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4 scale-95 opacity-50">
            <Beef className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Pustietate totală!</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6 px-4">Scanează bonul tău de la supermarket sau adaugă produsele unul câte unul.</p>
          <Link href={`/dashboard/events/${eventId}/add`}>
            <Button variant="secondary" className="rounded-xl">Adaugă primul produs</Button>
          </Link>
        </div>
      ) : (
        <div className="pt-2">
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
             <Button variant="default" className="w-full rounded-full gap-2 whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-white">
              <Calculator className="w-4 h-4" />
              <span>Sărăcia (Decont)</span>
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
