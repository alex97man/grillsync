import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

async function fetchOpenAIOcr(imageBase64Param: string, apiKey: string) {
  const [prefix, base64Data] = imageBase64Param.includes(',') ? imageBase64Param.split(',') : ['', imageBase64Param];
  const mimeType = prefix ? prefix.split(':')[1].split(';')[0] : 'image/jpeg';
  const fullBase64Url = `data:${mimeType};base64,${base64Data || imageBase64Param}`;

  const prompt = `Ești o inteligență artificială strictă și performantă, specializată exclusiv pe citirea bonurilor fiscale din România (OCR).
Atașat este o poză cu un bon fiscal.
Sarcina ta: Extrage TOATE produsele de pe bon și prețul final (totalul) al fiecărui rând. Nu include sub-totaluri, totalul general al bonului sau informații despre TVA.
Dacă rândul indică o cantitate multiplicată (ex. 3 x 5.00), extrage valoarea finală (15.00).
Grupează fiecare produs într-una din următoarele 4 categorii (trebuie să folosești fix aceste string-uri englezești): 'Food', 'Drinks', 'Sweets', 'Others'.
Returnează strict informațiile utile conform formatului curent.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Model foarte ieftin (fracțiuni de cent) și extrem de capabil vizual!
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: fullBase64Url,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_schema", json_schema: {
         name: "receipt_items",
         schema: {
             type: "object",
             properties: {
                 items: {
                     type: "array",
                     items: {
                         type: "object",
                         properties: {
                             name: { type: "string" },
                             price: { type: "number" },
                             category: { type: "string" }
                         },
                         required: ["name", "price", "category"],
                         additionalProperties: false
                     }
                 }
             },
             required: ["items"],
             additionalProperties: false
         },
         strict: true
      }},
      max_tokens: 1500
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const textContent = data.choices[0].message.content;
  const parsed = JSON.parse(textContent);
  return parsed.items;
}

async function fetchGeminiOcr(imageBase64Param: string, apiKey: string) {
  // 1. Process base64 from client
  const [prefix, base64Data] = imageBase64Param.includes(',') ? imageBase64Param.split(',') : ['', imageBase64Param];
  const mimeType = prefix ? prefix.split(':')[1].split(';')[0] : 'image/jpeg';

  const prompt = `Ești o inteligență artificială strictă și performantă, specializată exclusiv pe citirea bonurilor fiscale din România (OCR).
Atașat este o poză cu un bon fiscal.
Sarcina ta: Extrage TOATE produsele de pe bon și prețul final (totalul) al fiecărui rând. Nu include sub-totaluri, totalul general al bonului sau informații despre TVA.
Dacă rândul indică o cantitate multiplicată (ex. 3 x 5.00), extrage valoarea finală (15.00).
Grupează fiecare produs într-una din următoarele 4 categorii (trebuie să folosești fix aceste string-uri englezești): 'Food', 'Drinks', 'Sweets', 'Others'.
Returnează o listă de obiecte JSON valide (un JSON Array).

Formatul trebuie să fie EXACT așa:
[
  { "name": "Denumire Produs 1", "price": 12.50, "category": "Food" },
  { "name": "Denumire Produs 2", "price": 4.00, "category": "Drinks" }
]`;

  // 2. Aflăm ce modele are active acest API Key
  const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const listData = await listRes.json();
  
  if (!listData.models) {
     throw new Error("Eroare la conectarea la Google API: " + JSON.stringify(listData));
  }

  const availableModels = listData.models.map((m: any) => m.name);
  const preferred = [
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-exp",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-latest",
    "models/gemini-1.5-pro",
    "models/gemini-pro-vision"
  ];

  let lastError: any = null;
  let parsedJsonItems: any = null;

  for (const p of preferred) {
     if (availableModels.includes(p)) {
         try {
            console.log(`Incercăm scanarea cu modelul: ${p}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${p}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data || imageBase64Param
                      }
                    }
                  ]
                }],
                generationConfig: {
                  responseMimeType: "application/json"
                }
              })
            });

            const data = await response.json();
            
            if (data.error) {
              if (data.error.message.includes("Quota") || data.error.message.includes("limit: 0") || data.error.code === 429) {
                 lastError = new Error(data.error.message);
                 console.warn(`Modelul ${p} are COTA 0 sau LIMITA depasita. Sarim la urmatorul...`);
                 continue;
              }
              throw new Error(data.error.message);
            }

            const textOutput = data.candidates[0].content.parts[0].text;
            parsedJsonItems = JSON.parse(textOutput);
            break; // SUCCES TOTAL! Oprim bucla.
            
         } catch (e: any) {
            lastError = e;
            if (e.message.includes("Quota") || e.message.includes("limit: 0")) {
                continue; // Sarim la urmatorul
            }
            throw e; // Eroare fatala (ex: JSON invalid)
         }
     }
  }

  if (!parsedJsonItems) {
     throw lastError || new Error("Toate modelele Google au fost blocate de cota 0.");
  }

  return parsedJsonItems;
}

export async function POST(request: Request) {
  try {
    const { imageBase64, eventId, payerId } = await request.json();

    if (!imageBase64 || !eventId || !payerId) {
      return NextResponse.json({ error: 'Lipsește o imagine, ID-ul grătarului sau plătitorul.' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    let items = [];

    if (openaiKey) {
       console.log("Found OPENAI_API_KEY! Executing with ChatGPT Vision...");
       items = await fetchOpenAIOcr(imageBase64, openaiKey);
    } else if (geminiKey) {
       console.log("Found GEMINI_API_KEY! Starting true remote OCR execution...");
       items = await fetchGeminiOcr(imageBase64, geminiKey);
    } else {
       console.warn("NO OCR API KEY FOUND! Falling back to MOCK simulated OCR mode.");
       // Simulate AI Vision thinking delay
       await new Promise(r => setTimeout(r, 2500));
       items = [
         { name: "Cârnați Tradiționali 1KG", price: 34.50, category: "Food" },
         { name: "Bax Timișoreana (6x)", price: 28.00, category: "Drinks" },
         { name: "Pâine Feliată M", price: 6.50, category: "Food" },
         { name: "Cărbuni 3kg", price: 19.99, category: "Others" },
         { name: "Muștar Dulce 300g", price: 5.50, category: "Others" }
       ];
    }

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
