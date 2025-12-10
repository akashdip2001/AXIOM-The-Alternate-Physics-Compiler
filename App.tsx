import React, { useState, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import Terminal from './components/Terminal';
import { generateSimulation } from './services/geminiService';
import { AppMode, TerminalLog } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [code, setCode] = useState<string | null>(null);
  const [logs, setLogs] = useState<TerminalLog[]>([
    { id: 'init', type: 'system', message: 'AXIOM KERNEL INITIALIZED.', timestamp: Date.now() },
    { id: 'init2', type: 'info', message: 'Waiting for physics input parameters...', timestamp: Date.now() + 10 }
  ]);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: Date.now()
    }]);
  }, []);

  const handleCompile = async (prompt: string) => {
    setMode(AppMode.LOADING);
    addLog(`Analyzing input: "${prompt}"`, 'info');
    
    try {
      addLog('Transmitting to Gemini Neural Net...', 'system');
      const result = await generateSimulation(prompt);
      
      addLog('Code generation successful.', 'success');
      addLog(`Simulation: ${result.explanation}`, 'system');
      
      setCode(result.code);
      setMode(AppMode.ACTIVE);
    } catch (error: any) {
      addLog(error.message, 'error');
      setMode(AppMode.IDLE); // Revert to idle on error
    }
  };

  const handleError = useCallback((error: string) => {
    addLog(`Runtime Error: ${error}`, 'error');
  }, [addLog]);

  const handlePause = () => {
    setMode(AppMode.PAUSED);
    addLog('Simulation frozen. Inspection mode active.', 'system');
  };

  const handleResume = () => {
    setMode(AppMode.ACTIVE);
    addLog('Resuming physics engine.', 'system');
  };

  const handleReset = () => {
    setMode(AppMode.IDLE);
    setCode(null);
    addLog('Memory cleared. Engine reset.', 'system');
  };

  return (
    <div className="relative w-full h-screen bg-axiom-black overflow-hidden font-mono text-axiom-text selection:bg-axiom-cyan selection:text-axiom-black">
      
      {/* 3D Visualizer Layer */}
      <Visualizer 
        mode={mode} 
        codeString={code} 
        onError={handleError} 
      />

      {/* PAUSED STATE OVERLAY (State C Specific) */}
      {mode === AppMode.PAUSED && (
        <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none backdrop-blur-[2px] transition-opacity duration-500">
           {/* The Visualizer renders the Wireframe Sphere, this div just provides the darkening */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-axiom-cyan/20 text-9xl font-bold tracking-widest select-none">
              PAUSED
           </div>
        </div>
      )}

      {/* UI / Terminal Layer */}
      <Terminal 
        mode={mode}
        logs={logs}
        onCompile={handleCompile}
        onReset={handleReset}
        onPause={handlePause}
        onResume={handleResume}
      />

    </div>
  );
}

export default App;
