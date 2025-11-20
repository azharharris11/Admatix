import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AdFramework } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePersonas = async (productName: string): Promise<{ name: string; hook: string }[]> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Analyze the product "${productName}". 
      Identify 3 distinct user personas that would buy this product (e.g., The Skeptic, The Desperate Solver).
      For each persona, provide a specific 'hook' or marketing angle.
      Return JSON.
    `;

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          hook: { type: Type.STRING },
        },
        required: ["name", "hook"],
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Persona Generation Error:", error);
    // Fallback for demo if API fails
    return [
      { name: "The Skeptic", hook: "Does it actually work?" },
      { name: "The Value Hunter", hook: "Best bang for buck." },
      { name: "The Trend Follower", hook: "Everyone is using it." }
    ];
  }
};

export const rewriteCopy = async (currentText: string, style: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Rewrite the following ad copy to sound more "${style}". Keep it authentic and 'ugly' style (not too polished).\n\nOriginal: "${currentText}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || currentText;
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    return currentText;
  }
};

export const generateAdConcepts = async (framework: AdFramework, persona: string, product: string): Promise<{ headline: string; bodyText: string; cta: string; formula: any; visualPrompt: string }> => {
    try {
        const ai = getAiClient();
        
        const prompt = `
            Act as a world-class Direct Response copywriter specializing in "Ugly Ads" for Meta.
            
            Product: ${product}
            Target Persona: ${persona}
            Selected Format: ${framework}
            
            You must apply the "Ugly Ad Formula":
            1. Keyword (What they search for)
            2. Emotion (Struggle/Pain)
            3. Qualifier (Who is this for?)
            4. Long Text (Slippery slope pattern interrupt)
            5. Outcome (The result)

            Format Specific Instructions:
            - If "Big Font": Headline must be short, shocking, identifying a problem.
            - If "Notes App": Copy should look like a personal reminder or drafted text.
            - If "Gmail UX": Headline is the "Subject Line", Body is the "Email Preview".
            - If "Ugly Visual": Visual prompt must describe a messy, amateur, authentic scene (e.g., messy bathroom counter, dimly lit room).
            
            Return JSON structure containing the copy and the strategy breakdown.
        `;

        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                headline: { type: Type.STRING, description: "The main text or subject line" },
                bodyText: { type: Type.STRING, description: "The longer body copy or secondary text" },
                cta: { type: Type.STRING, description: "Button label" },
                formula: {
                    type: Type.OBJECT,
                    properties: {
                        keyword: { type: Type.STRING },
                        emotion: { type: Type.STRING },
                        qualifier: { type: Type.STRING },
                        outcome: { type: Type.STRING }
                    },
                    required: ["keyword", "emotion", "qualifier", "outcome"]
                },
                visualPrompt: { type: Type.STRING, description: "Description of the background image for generation" }
            },
            required: ["headline", "bodyText", "cta", "formula", "visualPrompt"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const text = response.text;
        if (!text) throw new Error("No text returned");
        return JSON.parse(text);

    } catch (error) {
        console.error("Ad Concept Generation Error", error);
        return {
            headline: `Problem with ${product}?`,
            bodyText: "I finally found a solution that actually works.",
            cta: "Learn More",
            formula: {
                keyword: "Generic Keyword",
                emotion: "Frustration",
                qualifier: "Everyone",
                outcome: "Solved"
            },
            visualPrompt: "A generic product shot"
        };
    }
}