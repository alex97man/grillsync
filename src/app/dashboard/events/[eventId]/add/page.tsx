"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Beef, Beer, Candy, Coffee, Save, User as UserIcon, Check } from "lucide-react";
import Link from "next/link";

export default function AddManualItemPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<"Food" | "Drinks" | "Sweets" | "Others">("Food");
  
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParticipants() {
      if (!eventId) return;
      try {
        const eventRef = doc(db, "events", eventId as string);
        const eventSnap = await getDoc(eventRef);
        
        if (eventSnap.exists()) {
          const participantIds = eventSnap.data().participants || [];
          
          // Fetch user details for each participant
          const participantDetails = await Promise.all(
            participantIds.map(async (uid: string) => {
              const uRef = doc(db, "users", uid);
              const uSnap = await getDoc(uRef);
              return uSnap.exists() ? { id: uid, ...uSnap.data() } : { id: uid, displayName: "Anonim" };
            })
          );
          
          setParticipants(participantDetails);
          // Default all to consume
          setSelectedConsumers(participantIds);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadParticipants();
  }, [eventId]);

  const toggleConsumer = (uid: string) => {
    setSelectedConsumers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventId) return;
    if (selectedConsumers.length === 0) {
      setError("Cineva trebuie să mănânce asta. Nu poți lăsa zero consumatori.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error("Prețul trebuie să fie un număr valid (ex. 15.50)");
      }

      await addDoc(collection(db, "events", eventId as string, "items"), {
        name,
        price: numericPrice,
        category,
        consumers: selectedConsumers,
        payerId: user.uid, // Persoana care adaugă e cea care a plătit by default, se poate extinde
      });

      router.push(`/dashboard/events/${eventId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Eroare la adăugarea produsului.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-pulse text-zinc-400">Adunăm gașca...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Adaugă Produs</h1>
          <p className="text-sm font-medium text-zinc-500">
            Ceva n-a ieșit pe scanare? Bagă-l manual aici.
          </p>
        </div>
      </div>

      <form onSubmit={handleAddItem} className="bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8">
        
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {/* Produs / Preț */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Ce ai luat?</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cârnați Pleșcoi"
              className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
              required
            />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Cât a costat?</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.50"
                className="w-full h-12 pl-4 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-all shadow-sm"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">RON</span>
            </div>
          </div>
        </div>

        {/* Categorie */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">La ce raion era?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
             <button type="button" onClick={() => setCategory('Food')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${category === 'Food' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                <Beef className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Mâncare</span>
             </button>
             <button type="button" onClick={() => setCategory('Drinks')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${category === 'Drinks' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                <Beer className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Băutură</span>
             </button>
             <button type="button" onClick={() => setCategory('Sweets')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${category === 'Sweets' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                <Candy className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Dulciuri</span>
             </button>
             <button type="button" onClick={() => setCategory('Others')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${category === 'Others' ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                <Coffee className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Diverse</span>
             </button>
          </div>
        </div>

        {/* Consumatori (Split Logic) */}
        <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Cine mănâncă/bea asta?</label>
            <p className="text-xs text-zinc-500 ml-1">Bifează doar pe cei la care se împarte costul.</p>
          </div>
          
          <div className="space-y-2">
            {participants.map((p) => {
              const checked = selectedConsumers.includes(p.id);
              return (
                <div 
                  key={p.id} 
                  onClick={() => toggleConsumer(p.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checked ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className={`font-medium ${checked ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {p.displayName} {p.id === user?.uid ? "(Tu)" : ""}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${checked ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-300 dark:border-zinc-700 bg-transparent'}`}>
                    {checked && <Check className="w-4 h-4" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Math Preview */}
        {selectedConsumers.length > 0 && price && !isNaN(parseFloat(price)) && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
            <span className="font-medium text-sm">Split precis:</span>
            <span className="font-bold">{(parseFloat(price) / selectedConsumers.length).toFixed(2)} RON / persoană</span>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-orange-500/20">
          <Save className="w-5 h-5 mr-2" />
          {isSubmitting ? "Salvez..." : "Adaugă pe Listă"}
        </Button>

      </form>

    </div>
  );
}
