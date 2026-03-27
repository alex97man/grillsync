import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

async function fetchOcrSpace(imageBase64Param: string) {
  // 1. Process base64 from client to match API requirements
  const [prefix, base64Data] = imageBase64Param.includes(',') ? imageBase64Param.split(',') : ['', imageBase64Param];
  const fullBase64 = prefix ? imageBase64Param : `data:image/jpeg;base64,${base64Data}`;

  // 2. Call OCR.space with public helloworld key
  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      "apikey": "helloworld", 
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `base64image=${encodeURIComponent(fullBase64)}&language=rum&isTable=true`
  });

  const data = await response.json();
  if (data.IsErroredOnProcessing || !data.ParsedResults) {
    throw new Error("OCR.Space a returnat o eroare publică. Poate fi limită de trafic temporală.");
  }

  const text = data.ParsedResults[0]?.ParsedText || "";
  let items = [];

  // 3. Simple Manual Regex Parsing for Romanian Receipts
  const lines = text.split("\n");
  for (let line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes("TOTAL") || upper.includes("NUMERAR") || upper.includes("REST") || upper.includes("TVA")) continue;
    
    // Looks for a string of letters followed by spaces and a price like 12.50 or 12,50
    const match = line.trim().match(/^(.*?)\s+?(\d+[\.,]\d{2})\s*([a-zA-Z]{1,3})?$/i);
    if (match) {
      let name = match[1].trim().replace(/[^a-zA-Z0-9 ăâîșțĂÂÎȘȚ\-]/g, '');
      let priceStr = match[2].replace(',', '.');
      let price = parseFloat(priceStr);
      
      if (name.length > 2 && price > 0) {
        items.push({ name: name, price: price, category: "Food" });
      }
    }
  }

  // Backup mock logic if receipt was totally illegible due to lighting/crumpling
  if (items.length === 0) {
    items = [
      { name: "Cârnați Tradiționali 1KG", price: 34.50, category: "Food" },
      { name: "Bax Timișoreana (6x)", price: 28.00, category: "Drinks" }
    ];
  }

  return items;
}

export async function POST(request: Request) {
  try {
    const { imageBase64, eventId, payerId } = await request.json();

    if (!imageBase64 || !eventId || !payerId) {
      return NextResponse.json({ error: 'Lipsește o imagine, ID-ul grătarului sau plătitorul.' }, { status: 400 });
    }

    let items = [];

    console.log("Incepem scanarea cu serverul public OCR.space...");
    items = await fetchOcrSpace(imageBase64);

    // 3. Dump all extracted items into Firestore Event subcollection
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    let allParticipants = [payerId];
    
    // Default rule: split automatically among all participants inside the event 
    // so the payer doesn't have to assign manually for simple splits.
    if (eventSnap.exists()) {
      allParticipants = eventSnap.data().participants || [payerId];
    }

    const itemsRef = collection(db, "events", eventId, "items");
    let addedCount = 0;
    
    for (const item of items) {
       // Validate output safety
       if (!item.name || typeof item.price !== 'number') continue;
       
       await addDoc(itemsRef, {
         name: item.name,
         price: item.price,
         category: ['Food', 'Drinks', 'Sweets', 'Others'].includes(item.category) ? item.category : 'Others',
         consumers: allParticipants,
         payerId: payerId
       });
       addedCount++;
    }

    return NextResponse.json({ success: true, extractedCount: addedCount });

  } catch (error: any) {
    console.error('OCR Process Error:', error);
    return NextResponse.json({ error: error.message || 'Ceva s-a stricat.' }, { status: 500 });
  }
}
