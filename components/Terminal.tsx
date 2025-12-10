import React, { useState, useEffect, useRef } from 'react';
import { LogMessage } from '../types';

interface TerminalProps {
  onCompile: (prompt: string) => void;
  onReset: () => void;
  logs: LogMessage[];
  isProcessing: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ onCompile, onReset, logs, isProcessing }) => {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onCompile(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 text-white font-mono select-none pointer-events-auto">
      {/* Header */}
      <div className="mb-6 animate-pulse">
        <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          AXIOM
        </h1>
        <div className="text-xs text-cyan-500/70 mt-1 uppercase tracking-widest">
          Alternate Physics Compiler v4.0
        </div>
      </div>

      {/* Logs Display */}
      <div className="flex-grow mb-4 overflow-y-auto bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4 text-sm shadow-inner">
        {logs.length === 0 && (
          <div className="text-gray-500 italic">System ready. Awaiting input...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="mb-2 break-words">
            <span className="opacity-50 text-xs mr-2">[{log.timestamp}]</span>
            <span className={
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'system' ? 'text-yellow-400' :
              'text-cyan-200'
            }>
              {log.type === 'system' && '> '}
              {log.text}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a physical system (e.g., 'A binary star system' or 'A chaotic double pendulum')..."
            className="relative w-full bg-black/80 text-cyan-50 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none h-24 text-sm"
            disabled={isProcessing}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className={`flex-1 py-3 rounded-lg font-bold tracking-wider text-sm transition-all duration-300 transform 
              ${isProcessing 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20 text-cyan-400 hover:text-white border border-cyan-500/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] active:scale-95'
              }`}
          >
            {isProcessing ? 'COMPILING...' : 'COMPILE SIMULATION'}
          </button>
          
          <button
            type="button"
            onClick={onReset}
            disabled={isProcessing}
            className="px-6 py-3 rounded-lg font-bold text-sm bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40 hover:text-red-200 transition-all active:scale-95"
          >
            RESET
          </button>
        </div>
      </form>
    </div>
  );
};

export default Terminal;
