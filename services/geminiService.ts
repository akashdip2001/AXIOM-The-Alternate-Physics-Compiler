import { GoogleGenAI } from "@google/genai";
import { RenderStyle } from "../types";
import { SCIENTIFIC_KEYWORDS, CYBER_KEYWORDS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Heuristic to determine simulation style
export const detectStyle = (prompt: string): RenderStyle => {
  const lower = prompt.toLowerCase();
  
  // Check Scientific keywords
  if (SCIENTIFIC_KEYWORDS.some(k => lower.includes(k))) {
    return RenderStyle.SCIENTIFIC;
  }
  
  // Check Cyber keywords
  if (CYBER_KEYWORDS.some(k => lower.includes(k))) {
    return RenderStyle.CYBER;
  }

  // Default to Cyber if ambiguous (cleaner for general requests)
  return RenderStyle.CYBER;
};

export const generateSimulationCode = async (userPrompt: string, style: RenderStyle): Promise<string> => {
  const isScientific = style === RenderStyle.SCIENTIFIC;

  const styleInstruction = isScientific
    ? `STYLE: SCIENTIFIC REALISM. 
       - Use PBR materials (MeshStandardMaterial, MeshPhysicalMaterial).
       - Lighting must be realistic (PointLights, AmbientLight is low).
       - Use particle systems for accretion disks or stars.
       - Colors: Deep blacks, realistic star temperatures, high dynamic range.
       - If a black hole is requested, create an accretion disk and gravitational lensing effect using torus/particles.
       - Background should be black.`
    : `STYLE: CYBER-AESTHETIC.
       - Use Basic or Lambert materials.
       - Colors: Neon Cyan (0x00ffff), Bright Magenta (0xff00ff), Electric Blue.
       - High contrast. Use wireframes or simple geometric primitives.
       - Make connections visible (thin lines).
       - Background should be deep black.
       - Prioritize clarity over realism.`;

  const systemInstruction = `
    You are AXIOM, a Three.js Physics Compiler.
    Your task is to convert the User's Request into a VALID JavaScript code block that utilizes the Three.js library.
    
    EXECUTION CONTEXT:
    - You do NOT need to import THREE. It is available globally as 'THREE'.
    - You do NOT need to create the scene, camera, or renderer. They are passed to you as variables: 'scene', 'camera', 'renderer'.
    - 'camera' is a THREE.PerspectiveCamera.
    - 'scene' is a THREE.Scene.
    - 'renderer' is a THREE.WebGLRenderer.
    
    REQUIREMENTS:
    1. Reset the scene content at the start of your code: 'while(scene.children.length > 0){ scene.remove(scene.children[0]); }'.
    2. Setup lighting, meshes, materials, and geometries based on the User's Request.
    3. Position the camera appropriately (e.g., camera.position.set(...); camera.lookAt(0,0,0);).
    4. **CRITICAL**: The last part of your code MUST return a function 'update(time)'.
       - This function will be called every frame.
       - 'time' is the elapsed time in seconds.
       - Use this function to animate objects (rotation, position updates).
    5. ${styleInstruction}
    
    OUTPUT FORMAT:
    - Return ONLY the raw JavaScript code. 
    - DO NOT wrap in markdown code blocks (no \`\`\`js).
    - DO NOT add explanations or text outside the code.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    let code = response.text || "";
    
    // Cleanup if model ignores instruction and adds markdown
    code = code.replace(/```javascript/g, '').replace(/```js/g, '').replace(/```/g, '');
    
    return code;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to compile physics simulation.");
  }
};
