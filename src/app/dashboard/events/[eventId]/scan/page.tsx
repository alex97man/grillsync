"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, RotateCw } from "lucide-react";
import Link from "next/link";

export default function ScanReceiptPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError("");
      } else {
        setError("Acceptăm doar poze (JPG, PNG, PDF-uri transformate în poze).");
      }
    }
  };

  const convertFileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const processReceipt = async () => {
    if (!file || !user) return;
    
    setIsProcessing(true);
    setError("");
    setProgress(10);
    
    try {
      const base64Image = await convertFileToBase64(file);
      setProgress(50);
      
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64Image,
          eventId: eventId,
          payerId: user.uid
        }),
      });
      
      setProgress(80);
      
      if (!res.ok) throw new Error("API Route Failed");
      
      const data = await res.json();
      
      setProgress(100);
      
      setTimeout(() => {
        router.push(`/dashboard/events/${eventId}`);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError("Ceva a mers epic fail cu prelucrarea. E prea mare poza.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Scanează Bonul</h1>
          <p className="text-sm font-medium text-zinc-500">
            Dă-ne poză cu foaia aia lungă de la supermarket.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 z-10 backdrop-blur-sm flex flex-col items-center justify-center">
            <RotateCw className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Descifrăm hieroglifele...</h3>
            <p className="text-zinc-500 font-medium text-sm text-center mb-6">
              Sperăm că ai luat bere bună. <br/>Așteaptă câteva secunde.
            </p>
            <div className="w-64 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-orange-600 dark:text-orange-400 text-xs font-bold mt-2">{Math.round(progress)}%</span>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900/50 group"
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
            <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-orange-500 group-hover:scale-110 transition-all shadow-sm mb-6">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Apasă sau dă drag & drop</h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              Poți face și poze direct cu telefonul. Încearcă să încadrezi tot bonul clar.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-900">
               <img 
                src={previewUrl!} 
                alt="Preview bon" 
                className="object-cover w-full h-full"
              />
              <div className="absolute top-4 right-4">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-full shadow-lg"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Schimbă poza
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200 rounded-xl border border-orange-200 dark:border-orange-900/30">
              <FileText className="w-6 h-6 shrink-0 text-orange-500" />
              <p className="text-sm font-medium">Bonul e lizibil? Să ne ajute zeii Machine Learning-ului!</p>
            </div>
            
            <Button onClick={processReceipt} className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-orange-500/20">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Extrage Produsele
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
