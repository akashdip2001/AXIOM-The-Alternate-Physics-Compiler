# System Architecture

<a href="./index.md">⬅️ Back to Index</a> | <a href="./journey.md">⬅️ Previous: Journey</a> | <a href="./conclusion.md">Next: Conclusion ➡️</a>

## 🏗️ High-Level Architecture (HLD)

The AXIOM platform acts as a bridge between natural language physics queries and visual 3D simulations.

```mermaid
graph TD
    User[User] -->|Natural Language Query| UI[React Frontend]
    UI -->|Prompt Engineering| Service[Gemini Service]
    Service -->|API Request| AI[Google Gemini 3 Pro]
    AI -->|Raw Code Response| Service
    Service -->|Sanitizer Patch| CleanCode[Executable Three.js Code]
    CleanCode -->|Injection| Visualizer[Visualizer Component]
    Visualizer -->|Render| Canvas[3D Canvas]
```

## ⚙️ Low-Level Design (LLD) & Systems

### The "Brain Transplant" Architecture
Separating the UI state from the Physics engine to prevent crashes and allow for complex interactions.

```mermaid
classDiagram
    class App {
        +State: isPaused
        +State: simulationData
        +handleCommand()
    }
    class Terminal {
        +Input: User Query
        +Output: Logs
    }
    class Visualizer {
        +Ref: mountRef
        +Method: executeCode()
        +Context: THREE.Scene
    }
    class GeminiService {
        +generateSimulation()
        -Sanitizer()
    }

    App --> Terminal : Controls
    App --> Visualizer : Passes Code
    App --> GeminiService : Fetches Data
    GeminiService ..> Visualizer : Generates Code for
```

### The Sanitizer Logic
The critical defense layer that allows the AI to "collaborate" without breaking the host environment.

```mermaid
flowchart LR
    Raw[Raw AI Response] --> Step1{Remove Markdown}
    Step1 --> Step2{Remove Declarations}
    Step2 -->|Regex: const scene = ...| Clean[Clean Code Body]
    Clean --> Step3{Injection}
    Step3 -->|Function Body| Execution["new Function(scene, ...)"]
```

### UX State Machine
Defining the "Reality OS" feel.

```mermaid
stateDiagram-v2
    [*] --> InitialLoad
    InitialLoad --> V3_Starfield : Default Background
    V3_Starfield --> ActiveSimulation : User Query
    ActiveSimulation --> PausedState : User Clicks Pause
    PausedState --> V4_Sphere : Frozen Time Effect
    V4_Sphere --> ActiveSimulation : Resume
```

---
<a href="#top">⬆️ Back to Top</a>
