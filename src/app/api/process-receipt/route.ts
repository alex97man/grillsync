import { NextResponse } from 'next/server';

// To effectively use Mindee API, the user needs to provide a token in .env.local
// MINDEE_API_KEY=your_mindee_key
export async function POST(req: Request) {
  try {
    const { imageUrl, eventId, payerId } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided." }, { status: 400 });
    }

    const mindeeKey = process.env.MINDEE_API_KEY;
    
    // Simulate Mindee OCR Data Extraction if token is missing
    // Since Mindee expects form-data with binary or URL (for URL needs specific setup),
    // and we fetch the actual binary from firebase storage url.
    
    // --- MOCK RESPONSE FOR DEMONSTRATION OF FLOW WITHOUT REAL KEYS ---
    if (!mindeeKey) {
      console.warn("No MINDEE_API_KEY found. Returning MOCK data.");
      
      // Artificial delay
      await new Promise(r => setTimeout(r, 2000));
      
      const mockItems = [
        { name: "Mici Vrăncenești", price: 45.50, category: "Food" },
        { name: "Timisoreana 2L", price: 15.00, category: "Drinks" },
        { name: "Paine Feliata", price: 8.50, category: "Food" },
        { name: "Cărbuni 3Kg", price: 22.00, category: "Others" },
        { name: "Muștar Tecuci", price: 6.90, category: "Food" }
      ];

      return NextResponse.json({ 
        success: true, 
        message: "Mock data generated successfully",
        extractedData: {
          items: mockItems,
          total: 97.90,
          date: new Date().toISOString()
        }
      });
    }

    // --- REAL MINDEE INTEGRATION (Placeholder logic) ---
    // Fetch image binary from Firebase Storage URL
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('document', blob, 'receipt.jpg');

    const mindeeResponse = await fetch(
      "https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict",
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${mindeeKey}`,
        },
        body: formData,
      }
    );

    if (!mindeeResponse.ok) {
      throw new Error(`Mindee API error: ${mindeeResponse.statusText}`);
    }

    const mindeeData = await mindeeResponse.json();
    
    // Parse Mindee V5 Line Items
    const lineItems = mindeeData.document.inference.prediction.line_items || [];
    const formattedItems = lineItems.map((item: any) => ({
      name: item.description,
      price: item.total_amount,
      category: "Food", // Default category, user will adjust
    }));

    return NextResponse.json({ 
      success: true,
      extractedData: {
        items: formattedItems,
        total: mindeeData.document.inference.prediction.total_amount.value
      }
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
