import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are AXIOM, an advanced physics engine compiler using Three.js. 
Your task is to convert natural language physics descriptions into executable JavaScript code for a Three.js scene.

**CONTEXT:**
The user has a Three.js scene already initialized with:
- \`scene\`: THREE.Scene
- \`camera\`: THREE.PerspectiveCamera
- \`renderer\`: THREE.WebGLRenderer
- \`THREE\`: The global THREE object

**YOUR GOAL:**
Return the body of a function that initializes objects, lights, and materials to visualize the user's request. 

**STRICT REQUIREMENTS:**
1. Return **ONLY** raw JavaScript code. NO markdown formatting (no \`\`\`), no comments outside the code, no explanations.
2. **DO NOT** create the scene, camera, or renderer. They are passed to you.
3. You MUST return an object at the end of your code with two properties:
   - \`update\`: A function \`(time: number) => void\` that runs every frame. Use \`time\` (seconds) for animation.
   - \`cleanup\`: A function \`() => void\` to dispose geometries/materials when the scene resets.
4. Make the visualization impressive. Use nice colors, lighting, and movement.
5. If the user asks for something impossible, interpret it artistically (e.g., "inverted gravity" -> particles floating up).

**EXAMPLE OUTPUT:**
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff9f, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(5, 5, 5);
scene.add(light);

return {
  update: (time) => {
    cube.rotation.x = time * 0.5;
    cube.rotation.y = time * 0.5;
  },
  cleanup: () => {
    geometry.dispose();
    material.dispose();
    scene.remove(cube);
    scene.remove(light);
  }
};
`;

export const generateSimulationCode = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for better coding capabilities
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balance between creativity and syntax correctness
      },
    });

    const text = response.text;
    if (!text) throw new Error("No code generated.");

    // Clean up markdown if the model accidentally includes it despite instructions
    const cleanedText = text.replace(/```javascript/g, '').replace(/```/g, '').trim();
    
    return cleanedText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
