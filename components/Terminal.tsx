import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, RefreshCw, StopCircle, ArrowRight, Loader2 } from 'lucide-react';
import { AppMode, TerminalLog } from '../types';

interface TerminalProps {
  mode: AppMode;
  logs: TerminalLog[];
  onCompile: (prompt: string) => void;
  onReset: () => void;
  onPause: () => void;
  onResume: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ mode, logs, onCompile, onReset, onPause, onResume }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Focus input on load and reset
  useEffect(() => {
    if (mode === AppMode.IDLE || mode === AppMode.PAUSED) {
        inputRef.current?.focus();
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCompile(input);
    setInput('');
  };

  const isSimulating = mode === AppMode.ACTIVE;
  const isPaused = mode === AppMode.PAUSED;
  const isLoading = mode === AppMode.LOADING;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center justify-end pointer-events-none z-20 h-screen">
      
      {/* Logs Display (Visible in IDLE and PAUSED, optional in ACTIVE if errors) */}
      {(mode !== AppMode.ACTIVE) && (
        <div 
            ref={scrollRef}
            className="w-full max-w-2xl mb-4 max-h-[30vh] overflow-y-auto pointer-events-auto bg-axiom-black/80 backdrop-blur-md border border-axiom-border rounded-lg p-4 font-mono text-xs sm:text-sm shadow-2xl transition-all duration-500 ease-in-out"
        >
            {logs.map((log) => (
            <div key={log.id} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-axiom-green' : 
                log.type === 'system' ? 'text-axiom-cyan' : 'text-gray-400'
            }`}>
                <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span>{log.message}</span>
            </div>
            ))}
            {logs.length === 0 && <div className="text-gray-600 italic">Ready for input...</div>}
        </div>
      )}

      {/* Control Bar / Input Area */}
      <div className="w-full max-w-2xl pointer-events-auto flex items-center gap-3">
        
        {/* Main Input Form */}
        <form 
            onSubmit={handleSubmit}
            className={`flex-1 flex items-center bg-axiom-black/90 backdrop-blur-xl border ${
                isLoading ? 'border-axiom-cyan animate-pulse' : 'border-axiom-border'
            } rounded-lg overflow-hidden shadow-2xl transition-all duration-300 group focus-within:border-axiom-cyan`}
        >
          <div className="px-4 text-axiom-cyan">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TerminalIcon className="w-5 h-5" />}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
                mode === AppMode.ACTIVE ? "Simulation running..." :
                mode === AppMode.PAUSED ? "Enter new prompt to reset..." :
                "Enter physics concept (e.g. 'Double Slit Experiment')..."
            }
            className="flex-1 bg-transparent border-none text-axiom-text py-4 px-2 focus:ring-0 focus:outline-none font-mono placeholder-gray-600"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="px-6 py-4 bg-axiom-glass hover:bg-axiom-border text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "GENERATING..." : "COMPILE"}
          </button>
        </form>

        {/* Action Buttons */}
        {isSimulating && (
            <button
                onClick={onPause}
                className="bg-axiom-black/90 border border-axiom-border hover:border-axiom-cyan text-white p-4 rounded-lg shadow-lg hover:shadow-axiom-cyan/20 transition-all duration-300 group"
                title="Pause / Inspect"
            >
                <StopCircle className="w-5 h-5 group-hover:text-axiom-cyan" />
            </button>
        )}

        {(isPaused) && (
             <button
                onClick={onResume}
                className="bg-axiom-black/90 border border-axiom-border hover:border-axiom-green text-white p-4 rounded-lg shadow-lg hover:shadow-axiom-green/20 transition-all duration-300 group"
                title="Resume Simulation"
            >
                <Play className="w-5 h-5 group-hover:text-axiom-green" />
            </button>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="mt-2 text-gray-600 text-xs font-mono uppercase tracking-widest">
        AXIOM ENGINE v2.5 // {mode} MODE
      </div>
    </div>
  );
};

export default Terminal;
