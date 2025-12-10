import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Cpu, Play, AlertCircle, Sparkles } from 'lucide-react';
import { LogEntry, LogType } from '../types';

interface TerminalProps {
  onCompile: (prompt: string) => void;
  logs: LogEntry[];
  isCompiling: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ onCompile, logs, isCompiling }) => {
  const [input, setInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isCompiling) return;
    onCompile(input);
  };

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-axiom-black/80 backdrop-blur-xl border-r border-white/10 relative z-10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/40">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded bg-axiom-cyan/10 flex items-center justify-center border border-axiom-cyan/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Cpu className="w-5 h-5 text-axiom-cyan" />
          </div>
          <h1 className="text-xl font-bold font-sans tracking-wider text-white">
            AXIOM <span className="text-axiom-cyan text-sm font-mono font-normal">v2.5.0</span>
          </h1>
        </div>
        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Reality Compiler Interface</p>
      </div>

      {/* Logs Area */}
      <div className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-3 min-h-0">
        <div className="text-gray-500 opacity-50 mb-4">
          // System initialized...<br/>
          // Waiting for input stream...
        </div>
        
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`
              animate-[fadeIn_0.3s_ease-out] border-l-2 pl-3 py-1
              ${log.type === LogType.INFO && 'border-blue-500/50 text-blue-200'}
              ${log.type === LogType.SUCCESS && 'border-green-500/50 text-green-200'}
              ${log.type === LogType.WARNING && 'border-yellow-500/50 text-yellow-200'}
              ${log.type === LogType.ERROR && 'border-red-500/50 text-red-200'}
              ${log.type === LogType.SYSTEM && 'border-axiom-cyan/50 text-axiom-cyan'}
            `}
          >
            <span className="opacity-50 text-[10px] mr-2 block mb-1">{log.timestamp}</span>
            <span className="leading-relaxed">{log.message}</span>
          </div>
        ))}
        
        {isCompiling && (
           <div className="animate-pulse flex items-center space-x-2 text-axiom-cyan mt-4">
             <Sparkles className="w-4 h-4 animate-spin" />
             <span>Synthesizing Reality Matrix...</span>
           </div>
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-black/60 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-axiom-cyan to-axiom-magenta rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the universe to simulate... (e.g., 'A swirling vortex of neon particles trapped in a glass sphere')"
              className="relative w-full bg-black border border-white/10 rounded-lg p-4 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-axiom-cyan/50 focus:ring-1 focus:ring-axiom-cyan/50 transition-all resize-none h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isCompiling || !input.trim()}
            className={`
              relative overflow-hidden group w-full py-4 rounded-lg font-mono font-bold tracking-widest uppercase transition-all duration-300
              ${isCompiling || !input.trim() 
                ? 'bg-gray-900 text-gray-500 cursor-not-allowed border border-white/5' 
                : 'bg-white/5 text-white hover:bg-axiom-cyan/10 border border-white/10 hover:border-axiom-cyan hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]'}
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              {isCompiling ? (
                 <Cpu className="w-5 h-5 animate-bounce" />
              ) : (
                 <TerminalIcon className="w-5 h-5 group-hover:text-axiom-cyan transition-colors" />
              )}
              <span className="group-hover:text-axiom-cyan transition-colors">
                {isCompiling ? 'Compiling...' : 'Compile Reality'}
              </span>
            </div>
            {/* Liquid effect bar */}
            {!isCompiling && input.trim() && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-axiom-cyan w-0 group-hover:w-full transition-all duration-500 ease-out" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};