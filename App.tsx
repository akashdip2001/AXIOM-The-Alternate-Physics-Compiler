import React, { useState, useCallback, useEffect } from 'react';
import { Visualizer } from './components/Scene/Visualizer';
import { Terminal } from './components/UI/Terminal';
import { Button } from './components/UI/Button';
import { LogMessage, LogType } from './types';
import { generatePhysicsCode } from './services/geminiService';
import { INITIAL_CODE } from './constants';
import { Play, RotateCw } from 'lucide-react';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [inputValue, setInputValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Add a log message
  const addLog = useCallback((type: LogType, message: string) => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // Initial greeting
  useEffect(() => {
    addLog(LogType.SYSTEM, "AXIOM Kernel initialized.");
    addLog(LogType.INFO, "Rendering engine online: Three.js r" + React.version); // React version placeholder
    addLog(LogType.INFO, "Awaiting instructions...");
  }, [addLog]);

  const handleCompile = async () => {
    if (!inputValue.trim() || isProcessing) return;

    setIsProcessing(true);
    addLog(LogType.SYSTEM, `Compiling: "${inputValue}"`);

    try {
      const generatedCode = await generatePhysicsCode(inputValue);
      
      addLog(LogType.SUCCESS, "Code generation successful.");
      addLog(LogType.INFO, "Injecting runtime logic...");
      
      setCode(generatedCode);
      // Success log for runtime execution happens in Visualizer callback
      setInputValue(''); // Clear input on success
      
    } catch (error: any) {
      addLog(LogType.ERROR, `Compilation failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleRuntimeSuccess = useCallback(() => {
    addLog(LogType.SUCCESS, "Simulation running.");
    setIsProcessing(false);
  }, [addLog]);

  const handleRuntimeError = useCallback((error: string) => {
    addLog(LogType.ERROR, `Runtime Exception: ${error}`);
    setIsProcessing(false);
  }, [addLog]);

  const handleReset = () => {
    setCode(INITIAL_CODE);
    addLog(LogType.SYSTEM, "System reset to default state.");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* 3D Layer (Z-0) */}
      <Visualizer 
        code={code} 
        onCodeExecuted={handleRuntimeSuccess}
        onError={handleRuntimeError}
      />

      {/* UI Overlay Layer (Z-10) */}
      {/* pointer-events-none ensures clicks pass through to the canvas where there are no UI elements */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
        
        {/* Top Bar: Logo & Reset */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-white mix-blend-difference mb-1">AXIOM</h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase opacity-70">Alternate Physics Compiler</p>
          </div>
          
          <Button variant="secondary" onClick={handleReset} icon={<RotateCw size={14} />}>
            Reset
          </Button>
        </div>

        {/* Bottom Bar: Terminal & Action */}
        <div className="flex flex-col md:flex-row items-end gap-6 pointer-events-auto">
          
          {/* Terminal Component */}
          <Terminal 
            logs={logs}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleCompile}
            isProcessing={isProcessing}
          />

          {/* Compile Button (Mobile: Full width, Desktop: Auto) */}
          <div className="w-full md:w-auto">
            <Button 
              variant="primary" 
              onClick={handleCompile} 
              isLoading={isProcessing}
              disabled={!inputValue.trim()}
              className="w-full md:w-auto h-14 md:h-auto shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              icon={<Play size={16} fill="currentColor" />}
            >
              Compile Reality
            </Button>
          </div>

        </div>
      </div>

      {/* Aesthetic Overlays (Optional Vignette/Grain) */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};

export default App;
