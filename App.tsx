import React, { useState, useCallback } from 'react';
import Terminal from './components/Terminal';
import Viewport from './components/Viewport';
import { INITIAL_STARFIELD_CODE } from './constants';
import { generateSimulationCode, detectStyle } from './services/geminiService';
import { LogMessage } from './types';
import { v4 as uuidv4 } from 'uuid'; // Using simple random string generator helper below instead of import to save file count

// Helper for ID generation since we want to minimize files
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [code, setCode] = useState<string>(INITIAL_STARFIELD_CODE);
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: generateId(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'AXIOM Core Initialized. Waiting for input...'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: generateId(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      text
    }]);
  }, []);

  const handleCompile = async (prompt: string) => {
    setIsProcessing(true);
    addLog(`Input Received: "${prompt}"`, 'info');
    
    try {
      const style = detectStyle(prompt);
      addLog(`Detected Signature: ${style}`, 'system');
      
      addLog('Compiling Physics Engine...', 'system');
      const generatedCode = await generateSimulationCode(prompt, style);
      
      setCode(generatedCode);
      addLog('Simulation Compiled Successfully.', 'success');
      addLog('Rendering output...', 'system');
      
    } catch (error: any) {
      addLog(`Fatal Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCode(INITIAL_STARFIELD_CODE);
    addLog('System Reset. Reloading Default Matrix.', 'system');
  };

  const handleRuntimeError = useCallback((errorMsg: string) => {
    addLog(`Runtime Error: ${errorMsg}`, 'error');
  }, [addLog]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* 3D Viewport Layer (Background, Z-0) */}
      <Viewport code={code} onError={handleRuntimeError} />

      {/* UI Layer (Overlay, Z-10) */}
      {/* pointer-events-none ensures clicks pass through empty areas to the canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none flex">
        {/* Left Panel: Control Terminal */}
        <div className="w-full md:w-1/3 lg:w-1/4 h-full flex flex-col justify-end md:justify-center p-4">
            <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl h-2/3 md:h-3/4 flex overflow-hidden pointer-events-auto transform transition-all hover:border-white/20">
                <Terminal 
                  onCompile={handleCompile} 
                  onReset={handleReset} 
                  logs={logs}
                  isProcessing={isProcessing}
                />
            </div>
        </div>
        
        {/* Right Area: Empty for 3D viewing, but could hold overlay stats later */}
        <div className="hidden md:block md:w-2/3 lg:w-3/4" />
      </div>
    </div>
  );
};

export default App;
