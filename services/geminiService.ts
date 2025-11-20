import { GoogleGenAI, Schema, Type, Modality } from "@google/genai";
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
    return [
      { name: "The Skeptic", hook: "Does it actually work?" },
      { name: "The Value Hunter", hook: "Best bang for buck." },
      { name: "The Trend Follower", hook: "Everyone is using it." }
    ];
  }
};

export const generateAwarenessLevels = async (persona: string, product: string): Promise<{ level: string; description: string }[]> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Product: ${product}
      Target Persona: ${persona}
      
      Define 2 distinct 'Awareness Levels' for this persona related to the product.
      (e.g., "Unaware: Doesn't know why face is oily", "Solution Aware: Looking for best serum").
      Return JSON: [{ "level": "Name", "description": "Context" }]
    `;

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["level", "description"],
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
    console.error("Gemini Awareness Error:", error);
    return [
      { level: "Problem Aware", description: "Knows the pain, seeks relief." },
      { level: "Solution Aware", description: "Comparing options." }
    ];
  }
};

export const generateHooks = async (persona: string, awareness: string, product: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const prompt = `
          Product: ${product}
          Persona: ${persona}
          Awareness Level: ${awareness}
          
          Write 3 distinct, punchy marketing "Hooks" (Angles) for this specific context.
          Return JSON array of strings.
        `;

         const responseSchema: Schema = {
            type: Type.ARRAY,
            items: { type: Type.STRING }
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
        console.error("Gemini Hook Error:", error);
        return ["Stop covering up.", "The secret ingredient.", "Why it works."];
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

export const generateAdConcepts = async (
    framework: AdFramework, 
    persona: string, 
    product: string,
    hook?: string, 
    awareness?: string
): Promise<{ headline: string; bodyText: string; cta: string; formula: any; visualPrompt: string }> => {
    try {
        const ai = getAiClient();
        
        const prompt = `
            Act as a world-class Direct Response copywriter specializing in "Ugly Ads" for Meta.
            
            CRITICAL CONTEXT:
            - Product: ${product}
            - Target Persona: ${persona}
            - Mental Awareness State: ${awareness || 'General'}
            - SPECIFIC HOOK TO USE: "${hook || 'General Appeal'}" (You MUST base the copy on this hook).
            - Selected Format: ${framework}
            
            You must apply the "Ugly Ad Formula":
            1. Keyword (What they search for)
            2. Emotion (Struggle/Pain related to the HOOK)
            3. Qualifier (Who is this for?)
            4. Long Text (Slippery slope pattern interrupt - Start with a shock or question)
            5. Outcome (The result promised by the product)

            Format Specific Instructions for Visual Prompt (image generation description):
            - If "Ugly Visual": Describe a messy, amateur, authentically bad photo background (e.g., "dirty bathroom sink with clutter", "dimly lit bedroom desk", "flash photography of skin texture"). DO NOT include the product in the description, just the environment.
            - If "Big Font": Describe a solid, harsh background color (e.g., "solid neon yellow hex code background", "concrete wall texture").
            - If "Notes App": Describe a "crumpled yellow paper texture" or "clean white digital note background".
            - If "Billboard": Describe "a view of a highway billboard against a blue sky, looking up from the ground".
            - If "Gmail UX": Describe "a clean white digital interface background".
            
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
                visualPrompt: { type: Type.STRING, description: "Detailed prompt for an image generation model to create the background. MAX 40 words." }
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

export const generateAdImage = async (visualPrompt: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        
        // Add strict styling cues for the image model
        const improvedPrompt = `${visualPrompt}. Amateur photography, realistic lighting, high quality, 4k.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: improvedPrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
             const base64Image = candidates[0].content.parts[0].inlineData.data;
             return `data:image/jpeg;base64,${base64Image}`;
        }
        return null;

    } catch (error) {
        console.error("Gemini Image Generation Error:", error);
        return null;
    }
};
