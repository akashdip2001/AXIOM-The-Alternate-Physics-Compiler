import React, { useState, useCallback } from 'react';
import Terminal from './components/Terminal';
import ThreeViewport from './components/ThreeViewport';
import { generateSimulationCode } from './services/geminiService';
import { LogEntry, SimulationStatus } from './types';

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'init', timestamp: new Date().toLocaleTimeString(), message: 'System initialized. Awaiting input.', type: 'system' }
  ]);
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  }, []);

  const handleCompile = async (prompt: string) => {
    if (!process.env.API_KEY) {
      addLog('API Key not found in environment. Please configure process.env.API_KEY.', 'error');
      setStatus(SimulationStatus.ERROR);
      return;
    }

    setStatus(SimulationStatus.GENERATING);
    addLog(`Processing input: "${prompt}"`, 'info');
    addLog('Connecting to Gemini 3.0 Pro...', 'system');

    try {
      const code = await generateSimulationCode(prompt);
      
      addLog('Code generation successful.', 'success');
      addLog('Compiling physics engine...', 'system');
      
      setStatus(SimulationStatus.COMPILING);
      setSimulationCode(code); // This triggers the useEffect in ThreeViewport
      
    } catch (error: any) {
      setStatus(SimulationStatus.ERROR);
      addLog(error.message || 'Unknown error occurred', 'error');
    }
  };

  const handleSimulationError = (error: string) => {
    setStatus(SimulationStatus.ERROR);
    addLog(error, 'error');
  };

  const handleSimulationSuccess = () => {
    setStatus(SimulationStatus.RUNNING);
    addLog('Simulation running. Render loop active.', 'success');
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Left Panel: 30% width */}
      <div className="w-[30%] min-w-[350px] h-full">
        <Terminal 
          onCompile={handleCompile} 
          logs={logs}
          status={status}
        />
      </div>

      {/* Right Panel: 70% width */}
      <div className="w-[70%] h-full relative">
        <ThreeViewport 
          code={simulationCode}
          status={status}
          onError={handleSimulationError}
          onSuccess={handleSimulationSuccess}
        />
        
        {/* Overlay Decoration */}
        <div className="absolute top-4 right-4 text-[#00ff9f] opacity-50 font-mono text-xs pointer-events-none">
          VIEWPORT_ACTIVE
          <br/>
          RENDERER: WEBGL2
        </div>
      </div>
    </div>
  );
};

export default App;
