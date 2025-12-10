import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

export const generatePhysicsCode = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly creative but grounded in syntax
        maxOutputTokens: 4000,
      },
    });

    let code = response.text || "";

    // Cleanup: Remove markdown code blocks if the model ignores the "no markdown" rule
    code = code.replace(/```javascript/g, "").replace(/```js/g, "").replace(/```/g, "");
    
    return code.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
