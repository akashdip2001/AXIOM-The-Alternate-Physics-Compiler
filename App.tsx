import React, { useState, useCallback } from 'react';
import { Terminal } from './components/Terminal';
import { Viewport } from './components/Viewport';
import { compileReality } from './services/geminiService';
import { LogEntry, LogType } from './types';
import { v4 as uuidv4 } from 'uuid'; // Actually we don't have uuid lib, let's make a simple helper

// Simple ID generator since we can't add arbitrary packages easily
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: generateId(),
      timestamp: new Date().toLocaleTimeString(),
      message: "System Online. AXIOM Kernel v2.5 initialized.",
      type: LogType.SYSTEM
    }
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const addLog = (message: string, type: LogType = LogType.INFO) => {
    setLogs(prev => [...prev, {
      id: generateId(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const handleCompile = useCallback(async (prompt: string) => {
    setIsCompiling(true);
    addLog(`Initiating compilation sequence for: "${prompt}"`, LogType.INFO);
    addLog("Interfacing with Neural Core (Gemini 2.5)...", LogType.SYSTEM);

    try {
      const start = performance.now();
      const code = await compileReality(prompt);
      const end = performance.now();
      
      addLog(`Matrix generated in ${((end - start) / 1000).toFixed(2)}s`, LogType.INFO);
      addLog("Injecting runtime executable...", LogType.SYSTEM);
      
      setActiveCode(code);
      // Success log is handled by Viewport callback to ensure it actually runs
    } catch (error: any) {
      addLog(`Compilation Failed: ${error.message}`, LogType.ERROR);
      setIsCompiling(false);
    }
  }, []);

  const handleViewportError = (error: string) => {
    addLog(`Runtime Error: ${error}`, LogType.ERROR);
    setIsCompiling(false);
  };

  const handleViewportSuccess = () => {
    addLog("Reality successfully rendered.", LogType.SUCCESS);
    setIsCompiling(false);
  };

  return (
    <div className="flex w-full h-screen bg-axiom-black text-white font-sans overflow-hidden">
      {/* Left Panel: Terminal (30% width on Desktop) */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 h-full border-r border-white/5 relative z-20 shadow-[10px_0_30px_-5px_rgba(0,0,0,0.5)]">
        <Terminal 
          onCompile={handleCompile} 
          logs={logs} 
          isCompiling={isCompiling}
        />
      </div>

      {/* Right Panel: Viewport (Remaining width) */}
      <div className="flex-1 h-full relative z-10">
        <Viewport 
          code={activeCode} 
          onError={handleViewportError}
          onSuccess={handleViewportSuccess}
        />
        
        {/* Overlay Gradient for better integration */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default App;