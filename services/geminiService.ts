
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { SimulationCode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    code: { type: Type.STRING, description: "The executable JavaScript code for the Three.js simulation." },
    explanation: { type: Type.STRING, description: "Brief explanation of the simulation." }
  },
  required: ["code", "explanation"]
};

export const generateSimulation = async (prompt: string): Promise<SimulationCode> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Balance creativity with syntax correctness
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as SimulationCode;

    // --- 🛡️ THE SANITIZER FIX 🛡️ ---
    // 1. Remove markdown code blocks
    let sanitizedCode = data.code.replace(/```(javascript|js)?/g, '').replace(/```/g, '');

    // 2. FORCEFULLY remove forbidden variable declarations
    // This regex deletes "const scene = ..." and "var scene = ..." etc.
    sanitizedCode = sanitizedCode.replace(/(const|var|let)\s+(scene|camera|renderer)\s*=\s*new\s+THREE\.(Scene|PerspectiveCamera|WebGLRenderer)\(.*\);?/gi, '');

    // 3. Remove "return" if it returns scene/camera/renderer explicitly (optional, but safe)
    // (The AI sometimes tries to return them, which is fine, but we clean just in case)

    console.log("Sanitized Code:", sanitizedCode); // Debugging: Check console to see if lines are gone

    return {
      code: sanitizedCode,
      explanation: data.explanation
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate simulation. Please try again.");
  }
};
