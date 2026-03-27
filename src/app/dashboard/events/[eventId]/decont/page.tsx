"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Landmark, CheckCircle, Calculator, UserCheck, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Debt {
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  creditorRevolut?: string;
  creditorIban?: string;
  status: 'pending' | 'paid';
}

export default function SettlementPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [eventData, setEventData] = useState<any>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [myTotalDebt, setMyTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function calculateDecont() {
      if (!eventId || !user) return;
      try {
        const eventRef = doc(db, "events", eventId as string);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) return router.push("/dashboard");
        const eData = { id: eventSnap.id, ...eventSnap.data() } as any;
        setEventData(eData);

        // Fetch all items
        const itemsRef = collection(db, "events", eventId as string, "items");
        const itemsSnap = await getDocs(itemsRef);
        
        // Fetch users info for names and payment details
        const usersCache: Record<string, any> = {};
        for (const uid of eData.participants) {
          const uSnap = await getDoc(doc(db, "users", uid));
          usersCache[uid] = uSnap.exists() ? uSnap.data() : { displayName: "Anonim", paymentDetails: {} };
        }

        let total = 0;
        const rawDebts: Record<string, Record<string, number>> = {}; // debtor -> creditor -> amount

        // Calculate raw owe amounts
        itemsSnap.forEach(itemDoc => {
          const item = itemDoc.data();
          total += item.price;
          
          if (!item.consumers || item.consumers.length === 0) return;
          const costPerPerson = item.price / item.consumers.length;
          const creditor = item.payerId;

          item.consumers.forEach((debtor: string) => {
            if (debtor !== creditor) {
              if (!rawDebts[debtor]) rawDebts[debtor] = {};
              if (!rawDebts[debtor][creditor]) rawDebts[debtor][creditor] = 0;
              rawDebts[debtor][creditor] += costPerPerson;
            }
          });
        });

        setTotalSpent(total);

        // Simplify debts algorithm
        const simplified: Debt[] = [];
        let myOwed = 0;
        
        const participants = Object.keys(usersCache);
        for (let i = 0; i < participants.length; i++) {
          for (let j = i + 1; j < participants.length; j++) {
            const p1 = participants[i];
            const p2 = participants[j];
            
            const p1OwesP2 = (rawDebts[p1] && rawDebts[p1][p2]) || 0;
            const p2OwesP1 = (rawDebts[p2] && rawDebts[p2][p1]) || 0;
            
            const net = p1OwesP2 - p2OwesP1;
            
            if (net > 0.01) { // p1 owes p2
              simplified.push({
                debtorId: p1,
                debtorName: usersCache[p1]?.displayName || "Anonim",
                creditorId: p2,
                creditorName: usersCache[p2]?.displayName || "Anonim",
                amount: Number(net.toFixed(2)),
                creditorRevolut: usersCache[p2]?.paymentDetails?.revolutTag,
                creditorIban: usersCache[p2]?.paymentDetails?.iban,
                status: 'pending' // Should fetch from 'settlements' subcollection in prod
              });
              if (p1 === user.uid) myOwed += net;
            } else if (net < -0.01) { // p2 owes p1
              simplified.push({
                debtorId: p2,
                debtorName: usersCache[p2]?.displayName || "Anonim",
                creditorId: p1,
                creditorName: usersCache[p1]?.displayName || "Anonim",
                amount: Number(Math.abs(net).toFixed(2)),
                creditorRevolut: usersCache[p1]?.paymentDetails?.revolutTag,
                creditorIban: usersCache[p1]?.paymentDetails?.iban,
                status: 'pending'
              });
              if (p2 === user.uid) myOwed += Math.abs(net);
            }
          }
        }
        
        setDebts(simplified);
        setMyTotalDebt(myOwed);

      } catch (err) {
        console.error("Calculate error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    calculateDecont();
  }, [eventId, user, router]);

  const markAsPaid = async (debtIndex: number) => {
    // In a full implementation, you'd write this to a `settlements` collection
    // Here we just update the local state to simulate the action
    const newDebts = [...debts];
    newDebts[debtIndex].status = 'paid';
    setDebts(newDebts);
    
    if (newDebts.every(d => d.status === 'paid') && eventData?.status === 'active') {
      try {
        await updateDoc(doc(db, "events", eventId as string), { status: 'settled' });
        setEventData({ ...eventData, status: 'settled' });
      } catch (e) { console.error(e); }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-pulse text-zinc-400">Împărțim dauna...</div>
      </div>
    );
  }

  // Filter debts involving current user
  const strictlyMyDebts = debts.filter(d => d.debtorId === user?.uid);
  const othersOweMe = debts.filter(d => d.creditorId === user?.uid);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Decont Final</h1>
          <p className="text-sm font-medium text-zinc-500">
            Adevărul crud (matematic) iese la iveală.
          </p>
        </div>
      </div>

      {eventData?.status === 'settled' && (
        <div className="bg-green-50, dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4 rounded-2xl flex items-center gap-4 text-green-700 dark:text-green-400 shadow-sm">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Grătar Decontat Complet</h3>
            <p className="text-sm opacity-90">Toată lumea a cotizat. Zero dușmănii.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-6 rounded-3xl text-center border-orange-500/10">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-500 mx-auto mb-3">
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1 block">Total Consumație</span>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{totalSpent.toFixed(2)} RON</span>
        </div>
        <div className="glass p-6 rounded-3xl text-center border-red-500/10 dark:bg-red-950/20">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center text-red-500 mx-auto mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-sm text-red-600/80 dark:text-red-400/80 font-medium mb-1 block">Tu mai dai</span>
          <span className="text-2xl font-black text-red-600 dark:text-red-500">{myTotalDebt.toFixed(2)} RON</span>
        </div>
      </div>

      {strictlyMyDebts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            🚨 Datoriile tale
          </h3>
          <div className="space-y-3">
            {strictlyMyDebts.map((debt, idx) => (
              <div key={`d-${idx}`} className={`p-5 rounded-2xl border transition-all ${debt.status === 'paid' ? 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 opacity-60' : 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/20'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-zinc-500 block mb-1">Îi datorezi lui</span>
                    <span className="font-bold text-zinc-900 dark:text-white text-lg">{debt.creditorName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-zinc-500 block mb-1">Suma</span>
                    <span className={`font-black text-xl ${debt.status === 'paid' ? 'text-zinc-400' : 'text-red-600 dark:text-red-500'}`}>
                      {debt.amount.toFixed(2)} <span className="text-sm">RON</span>
                    </span>
                  </div>
                </div>

                {debt.status !== 'paid' && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {debt.creditorRevolut && (
                        <a href={`https://revolut.me/${debt.creditorRevolut.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold hover:bg-blue-200 transition-colors">
                          <Wallet className="w-4 h-4" /> Platește Revolut
                        </a>
                      )}
                      {debt.creditorIban && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-mono select-all">
                          <Landmark className="w-4 h-4" /> {debt.creditorIban}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => markAsPaid(debts.indexOf(debt))} 
                      className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl"
                    >
                      <UserCheck className="w-4 h-4 mr-2" /> Am scăpat de datorie
                    </Button>
                  </>
                )}
                {debt.status === 'paid' && (
                  <div className="text-center text-sm font-semibold text-green-600 dark:text-green-500 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    Rezolvată! Ești om corect.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {othersOweMe.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            🤑 Ai de recuperat
          </h3>
          <div className="space-y-3">
            {othersOweMe.map((debt, idx) => (
              <div key={`c-${idx}`} className={`p-4 rounded-2xl flex items-center justify-between border ${debt.status === 'paid' ? 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 opacity-60' : 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/20'}`}>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white block">{debt.debtorName}</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">{debt.amount.toFixed(2)} RON</span>
                </div>
                {debt.status !== 'paid' ? (
                  <div className="flex flex-col gap-2 items-end">
                    <Button size="sm" variant="outline" onClick={() => markAsPaid(debts.indexOf(debt))} className="h-9 px-4 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100/50">
                      Confirmă Plata
                    </Button>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Salut, ${debt.debtorName}! Vezi că ai de dat ${debt.amount.toFixed(2)} RON pentru grătar. 🍖${debt.creditorRevolut ? `\n\nPoți să-mi pui pe Revolut aici: https://revolut.me/${debt.creditorRevolut.replace('@','')}` : ''}${debt.creditorIban && !debt.creditorRevolut ? `\n\nSau în contul IBAN: ${debt.creditorIban}` : ''}\n\nMersi!`)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-2 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Trimite WhatsApp
                    </a>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-zinc-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Plătit</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {debts.length === 0 && (
        <div className="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50">
           <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Pace și armonie</h3>
           <p className="text-zinc-500 text-sm">Nimeni nu datorează nimic. Sau ați mâncat gratis.</p>
        </div>
      )}

    </div>
  );
}
