"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Keyboard, Save, Trash2, CheckCircle2, Beef } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface ParsedItem {
  id: string;
  name: string;
  price: number;
}

export default function FastAddPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [textInput, setTextInput] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const handleParseText = () => {
    if (!textInput.trim()) {
      setError("Scrie ceva mai întâi!");
      return;
    }
    
    setError("");
    const lines = textInput.split("\n");
    const extracted: ParsedItem[] = [];
    
    for (let line of lines) {
      const tLine = line.trim();
      if (!tLine) continue;
      
      // Attempt 1: Line ends with a valid price structure like "Carnati 45.50" or "Bere 12 lei" or "Apa 5,5 ron"
      const matchFull = tLine.match(/^(.*?)\s+?(\d+[\.,]\d{0,2})\s*(lei|ron)?$/i) || 
                        tLine.match(/^(.*?)\s+(\d+)\s*(lei|ron)?$/i);
      
      if (matchFull) {
         let name = matchFull[1].trim().replace(/[^a-zA-Z0-9 ăâîșțĂÂÎȘȚ\-]/g, '');
         let priceStr = matchFull[2].replace(',', '.');
         let price = parseFloat(priceStr);
         
         if (name.length > 2 && price > 0) {
            extracted.push({ id: Math.random().toString(36).substr(2, 9), name, price });
            continue;
         }
      }
      
      // Attempt 2: Just find the last word acting as a number
      const parts = tLine.split(/\s+/);
      if (parts.length > 1) {
         const lastPart = parts[parts.length - 1].replace(',', '.');
         const possiblePrice = parseFloat(lastPart);
         if (!isNaN(possiblePrice) && possiblePrice > 0) {
            const name = parts.slice(0, parts.length - 1).join(" ").replace(/[^a-zA-Z0-9 ăâîșțĂÂÎȘȚ\-]/g, '');
            if (name.length > 2) {
               extracted.push({ id: Math.random().toString(36).substr(2, 9), name, price: possiblePrice });
            }
         }
      }
    }
    
    if (extracted.length === 0) {
      setError("Nu am putut despărți niciun produs. Încearcă formatul: 'Nume Produs 15.50'");
    } else {
      setParsedItems([...parsedItems, ...extracted]);
      setTextInput(""); // Clear input on success
    }
  };

  const removeItem = (id: string) => {
    setParsedItems(parsedItems.filter(i => i.id !== id));
  };

  const saveToGrill = async () => {
    if (!user || parsedItems.length === 0) return;
    setIsSubmitting(true);
    
    try {
      // Get participants to split by default to everyone in the party
      const eventRef = doc(db, "events", eventId as string);
      const eventSnap = await getDoc(eventRef);
      let eventParticipants = [user.uid];
      if (eventSnap.exists()) {
        eventParticipants = eventSnap.data().participants || [user.uid];
      }

      const itemsRef = collection(db, "events", eventId as string, "items");
      
      for (const item of parsedItems) {
        await addDoc(itemsRef, {
          name: item.name,
          price: item.price,
          category: "Food", // Default category
          consumers: eventParticipants,
          payerId: user.uid
        });
      }
      
      router.push(`/dashboard/events/${eventId}`);
    } catch (err) {
      console.error(err);
      alert("A apărut o eroare la salvare.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Adăugare Rapidă</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
        <p className="text-sm font-medium text-zinc-500 mb-6 leading-relaxed">
          Folosește <strong className="text-zinc-700 dark:text-zinc-300">microfonul de la tastatura telefonului</strong> (dictare) și citește bonul. Sau pur și simplu tastează rapid <i>"Nume Preț"</i> unul sub altul.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 font-medium text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="relative mb-4">
          <textarea 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Exemplu rostit:&#10;Cârnați Pleșcoi 34.50&#10;Bax Timișoreana 26 lei&#10;Pâine feliată 5.5"
            className="w-full h-40 p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:border-orange-500 dark:text-white resize-none transition-colors"
          ></textarea>
          <div className="absolute bottom-4 right-4 flex gap-2 text-zinc-400">
            <Mic className="w-5 h-5" />
            <Keyboard className="w-5 h-5" />
          </div>
        </div>

        <Button onClick={handleParseText} className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold">
          Analizează Textul
        </Button>
      </div>

      {/* Preview Section */}
      {parsedItems.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-3xl border border-orange-200 dark:border-orange-900/30 shadow-sm animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 mb-6 text-orange-800 dark:text-orange-400">
             <CheckCircle2 className="w-6 h-6" />
             <h3 className="text-xl font-bold">Lista Pregătită</h3>
          </div>
          
          <div className="space-y-2 mb-8">
            {parsedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-orange-100 dark:border-orange-900/50">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                     <Beef className="w-4 h-4" />
                   </div>
                   <span className="font-semibold text-zinc-900 dark:text-white line-clamp-1 max-w-[150px] sm:max-w-xs">{item.name}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="font-bold text-orange-600 dark:text-orange-400">{item.price.toFixed(2)} RON</span>
                   <button onClick={() => removeItem(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={saveToGrill} 
            disabled={isSubmitting} 
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 transition-all"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Se încarcă pe grătar..." : `Salvează ${parsedItems.length} Produse (${parsedItems.reduce((acc, curr) => acc + curr.price, 0).toFixed(2)} RON)`}
          </Button>
        </div>
      )}

    </div>
  );
}
