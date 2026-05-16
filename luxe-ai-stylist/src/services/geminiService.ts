import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiModel = "gemini-3-flash-preview";

export interface OutfitSuggestion {
  title: string;
  brand: string;
  price: string;
  platform: string;
  link: string;
  reason: string;
  styleHint: string; // e.g., 'warm', 'cool', 'sepia', 'vibrant', 'silk'
  description: string; // Detailed visual description for the AI try-on
  tryOnDetails: {
    color: string; // Hex color for draping
    pattern?: 'solid' | 'striped' | 'floral' | 'checkered';
    sheen: number; // 0 to 1
  };
}

export interface MakeupItem {
  name: string;
  link: string;
}

export interface AnalysisResult {
  gender: string;
  skinTone: string;
  suggestedMakeup: MakeupItem[];
  suggestedOutfits: OutfitSuggestion[];
}

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: [
      {
        parts: [
          { text: "CRITICAL GENDER AND AGE ENFORCEMENT: Carefully analyze the person's biological gender and age group from the photo. If female, suggest ONLY women's wear and makeup products. If male, suggest ONLY men's wear. For ALL clothing and makeup suggestions, you MUST provide direct, valid search URLs for multiple platforms where possible (Myntra, Ajio, Nykaa). \n- Myntra: https://www.myntra.com/[query]\n- Ajio: https://www.ajio.com/search/?text=[query]\n- Nykaa: https://www.nykaa.com/search/result/?q=[query]\nSuggest 5 distinct outfits, 2 accessories, and 3 specific makeup items. For each outfit, include a 'styleHint' (e.g., 'silk-glow', 'linen-matte'), a 'description', and 'tryOnDetails' containing a representative 'color' (hex code), 'pattern', and 'sheen' (0-1). Return ONLY a valid JSON object matching this schema: { gender: string, skinTone: string, suggestedMakeup: [{ name: string, link: string }], suggestedOutfits: [{ title: string, brand: string, price: string, platform: string, link: string, reason: string, styleHint: string, description: string, tryOnDetails: { color: string, pattern: string, sheen: number } }] }" },
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || '{}');
};

export const chatWithAi = async (message: string, history: any[] = []): Promise<string> => {
  const chat = ai.chats.create({
    model: geminiModel,
    config: {
      systemInstruction: "You are a professional fashion consultant. MANDATORY: For every outfit, accessory, or makeup item you mention, you MUST provide explicit direct shopping links for Myntra, Ajio, and Nykaa. For category searches, append the gender (e.g., [Party Wear for Women on Myntra](https://www.myntra.com/women-party-wear)). Ensure all makeup suggestions have direct links to Nykaa or Purple. Always suggest 3 outfits and matching accessories. Be concise, luxurious, and helpful."
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text || "Sorry, I couldn't process that.";
};

export const comparePrices = async (base64Image: string, itemName: string): Promise<any> => {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: [
      {
        parts: [
          { text: `The user wants to find the best price for this item: ${itemName}. Analyze the item in the photo and search for its price across Myntra, Ajio, Flipkart, Nykaa, and Meesho. 
          Return a JSON array of objects with 'platform', 'price', and 'link'. 
          CRITICAL: Provide VALID, CLICKABLE search URLs for each platform:
          - Myntra: https://www.myntra.com/[query]
          - Ajio: https://www.ajio.com/search/?text=[query]
          - Nykaa: https://www.nykaa.com/search/result/?q=[query]
          - Flipkart: https://www.flipkart.com/search?q=[query]
          Sort by price ascending. Highlight the cheapest one.` },
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || '[]');
};

export const generateVirtualTryOn = async (base64Image: string, outfit: OutfitSuggestion): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: `Generate a photorealistic image of the person from the provided photo wearing this outfit: ${outfit.title} by ${outfit.brand}. 
            Outfit Details: ${outfit.description}. 
            Style Context: ${outfit.styleHint}.
            REQUIREMENTS:
            - Keep the person's face, hair, skin tone, and body pose identical to the original image.
            - Keep the background exactly as it is in the original image.
            - Replace their current clothes with the specified outfit.
            - Ensure high-fidelity fabric draping, realistic shadows, and lighting that matches the original photo's environment.
            - The result must be a seamless, professional-grade virtual try-on image.`,
          },
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Image part not found in response");
  } catch (error) {
    console.error("Virtual Try On Generation failed:", error);
    throw error;
  }
};
