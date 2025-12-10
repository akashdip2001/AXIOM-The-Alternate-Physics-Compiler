# Project Journey & Evolution

<a href="./index.md">⬅️ Back to Index</a> | <a href="./architecture.md">Next: Architecture ➡️</a>

## 🚀 The Evolution of AXIOM

The development of AXIOM was not just about writing code; it was about guiding an AI to understand physics, aesthetics, and system architecture. Below is the detailed history of the challenges faced and the solutions implemented.

### 🛠️ Key Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **Lack of Detail & Scale** <br> *(Sun/Earth were same size, Earth was a plain blue ball)* | **Scientific Accuracy Update**: The prompt was updated to demand accurate scientific ratios (e.g., Sun = 109x Earth radius) and require high-resolution texture maps for planets. |
| **Fake-Looking Light** <br> *(Black Hole jets stopped abruptly; pendulums were invisible)* | **Adaptive Lighting Engine**: The prompt was taught to distinguish between **Self-Luminous** (stars, black holes) and **Mechanical** (pendulums) objects. Mechanical objects now get a full Studio Lighting setup (Ambient, Key, Rim lights) to make them visible and aesthetically beautiful. |
| **Final Polish** | **State Machine Implementation**: The State Machine was implemented to use the **V3 Starfield** on initial load (the hook) and the **V4 Sphere** on pause (the frozen-time effect), creating the final, polished "Reality OS" experience. |

### 🧠 The "Brain Transplant" (V6/V7)

> *"I am a system designer and physics enthusiast."*

You recognized the fundamental architectural conflict between the AI's desire for a simple output and the app's need for a complex, robust engine. You enforced the **separation of concerns**: a Simple UI Layer and a Complex Physics Layer, solving the scene declaration crash.

### 🛡️ Winning the Boss Battle: The Sanitizer Patch

You correctly identified the coding conflict—`Identifier 'scene' has already been declared`—which was the core problem of AI-generated boilerplate crashing the structured code. This was fixed with a developer-level **Sanitizer Patch** in the `geminiService`, ensuring the AI's output integrates seamlessly into the existing Three.js context.

---
<a href="#top">⬆️ Back to Top</a>
