import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, SimulationStatus } from '../types';

interface TerminalProps {
  onCompile: (prompt: string) => void;
  logs: LogEntry[];
  status: SimulationStatus;
}

const Terminal: React.FC<TerminalProps> = ({ onCompile, logs, status }) => {
  const [input, setInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (status === SimulationStatus.GENERATING) return;
    onCompile(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case SimulationStatus.IDLE: return 'text-gray-500';
      case SimulationStatus.GENERATING: return 'text-yellow-400 animate-pulse';
      case SimulationStatus.COMPILING: return 'text-blue-400';
      case SimulationStatus.RUNNING: return 'text-[#00ff9f]';
      case SimulationStatus.ERROR: return 'text-red-500';
      default: return 'text-white';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border-r border-[#222] font-mono p-4 relative overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header */}
      <div className="mb-6 z-10 border-b border-[#333] pb-4">
        <h1 className="text-2xl font-bold tracking-tighter text-white">AXIOM <span className="text-[#00ff9f] text-sm align-middle">// V.1.0</span></h1>
        <div className="flex justify-between items-center mt-2">
           <span className={`text-xs uppercase tracking-widest ${getStatusColor()}`}>
            [{status}]
          </span>
           <span className="text-xs text-gray-600">PHYS_ENGINE_READY</span>
        </div>
      </div>

      {/* Logs Area */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto mb-4 bg-[#111] border border-[#222] p-2 rounded text-sm font-mono shadow-inner"
      >
        {logs.map((log) => (
          <div key={log.id} className="mb-1 break-words">
            <span className="text-gray-600 select-none">[{log.timestamp}]</span>{' '}
            <span className={
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-[#00ff9f]' :
              log.type === 'system' ? 'text-yellow-200 opacity-80' :
              'text-gray-300'
            }>
              {log.type === 'info' ? '>' : log.type === 'error' ? '!' : '#'} {log.message}
            </span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="z-10 bg-[#0a0a0a]">
        <label className="text-xs text-[#00ff9f] uppercase mb-2 block tracking-wider">Parameter Input</label>
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a physical reality... (e.g., 'A universe where time moves backwards for particles')"
            className="w-full bg-[#111] border border-[#333] text-gray-200 p-3 h-32 resize-none focus:outline-none focus:border-[#00ff9f] transition-colors rounded text-sm placeholder-gray-700"
          />
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-600">CTRL+ENTER to submit</div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={status === SimulationStatus.GENERATING || !input.trim()}
          className={`w-full mt-4 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-200 border border-transparent
            ${status === SimulationStatus.GENERATING 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-[#00ff9f] text-black hover:bg-[#00cc80] hover:shadow-[0_0_15px_rgba(0,255,159,0.3)]'
            }
          `}
        >
          {status === SimulationStatus.GENERATING ? 'Processing...' : 'Compile Reality'}
        </button>
      </div>
    </div>
  );
};

export default Terminal;
