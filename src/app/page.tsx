import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Beef, Flame, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-zinc-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900 selection:bg-orange-500/30">
      <header className="px-6 h-16 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="p-1.5 bg-orange-500 rounded-lg">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
            GrillSync
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">
              Intră-n horă
            </Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium mb-4">
            <Beef className="w-4 h-4" />
            <span>Fără certuri la nota de plată</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Grătare organizate, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              datorii recuperate.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Ion a mâncat 5 mici și tu doar o salată? Acum plătiți exact cât consumați. 
            Scanează bonul, distribuie costurile și lasă-ne pe noi să ne luăm de cei care \"au uitat\" portofelul.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base h-12 px-8 rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all">
                Începe un decont nou
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-base h-12 px-8 rounded-full bg-transparent border-2">
                Ai cod de invitație?
              </Button>
            </Link>
          </div>

        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 max-w-4xl w-full text-left">
          
          <div className="glass p-6 rounded-2xl">
            <div className="w-12 h-12 bg-orange-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
              <Users className="text-orange-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">Split pe consum</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Trage linie și împarte nota doar între cei care chiar au pus gura pe ceafa aia de porc.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl">
            <div className="w-12 h-12 bg-orange-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-4 text-2xl">
              🧾
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">Scanează bonul</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Faci poză la bonul stufos de la supermarket și noi îl transformăm direct în iteme digitale gata de împărțit.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl">
            <div className="w-12 h-12 bg-orange-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-4 text-2xl">
              💸
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">Recuperatori virtuali</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Trimitem notificări pasiv-agresive prietenilor tăi până când își achită datoria pe Revolut sau IBAN.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
