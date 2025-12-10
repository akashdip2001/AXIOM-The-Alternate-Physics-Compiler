import React, { useState, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import Terminal from './components/Terminal';
import { compileSimulation } from './services/geminiService';
import { LogEntry, AppState } from './types';

const INITIAL_CODE = `
// Welcome to AXIOM
// Initializing Empty Void...

const geometry = new THREE.IcosahedronGeometry(1, 1);
const material = new THREE.MeshStandardMaterial({ 
  color: 0xffffff, 
  wireframe: true,
  emissive: 0x444444
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

const light = new THREE.PointLight(0x00ffcc, 2, 100);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

function update(time, delta) {
  sphere.rotation.x += delta * 0.2;
  sphere.rotation.y += delta * 0.1;
  sphere.scale.setScalar(1 + Math.sin(time) * 0.1);
}

function cleanup() {
  scene.remove(sphere);
  scene.remove(light);
  geometry.dispose();
  material.dispose();
}

return { update, cleanup };
`;

const App: React.FC = () => {
  const [simulationCode, setSimulationCode] = useState<string | null>(INITIAL_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([{
    id: 'init',
    timestamp: new Date().toLocaleTimeString(),
    message: 'System Initialized. Awaiting Input.',
    type: 'system'
  }]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'system') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' }),
      message,
      type
    }]);
  }, []);

  const handleCompile = async (prompt: string) => {
    setAppState(AppState.COMPILING);
    addLog(`Compiling query: "${prompt}"...`, 'info');

    try {
      const code = await compileSimulation(prompt);
      setSimulationCode(code);
      setAppState(AppState.RUNNING);
    } catch (error: any) {
      setAppState(AppState.ERROR);
      addLog(error.message || 'Unknown compilation error', 'error');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Visualization Layer */}
      <Visualizer 
        simulationCode={simulationCode} 
        onLog={(msg, type) => addLog(msg, type)}
      />

      {/* Foreground UI Layer */}
      <Terminal 
        logs={logs}
        appState={appState}
        onCompile={handleCompile}
      />
      
    </div>
  );
};

export default App;