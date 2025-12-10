import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, RefreshCw, AlertCircle, CheckCircle2, Command } from 'lucide-react';
import { LogEntry, AppState } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  appState: AppState;
  onCompile: (prompt: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ logs, appState, onCompile }) => {
  const [input, setInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || appState === AppState.COMPILING) return;
    onCompile(input);
    setInput('');
  };

  return (
    // MAIN CONTAINER: pointer-events-none ensures clicks pass through to the 3D scene
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-sm shadow-2xl">
          <h1 className="text-white font-['Fira_Code'] font-bold text-xl tracking-tighter flex items-center gap-3">
            <TerminalIcon className="w-5 h-5 text-emerald-400" />
            AXIOM <span className="text-white/40 text-sm font-normal">v3.1.0</span>
          </h1>
          <p className="text-white/40 text-xs font-mono mt-1 ml-8">
            ALTERNATE PHYSICS COMPILER
          </p>
        </div>
        
        {/* STATUS INDICATOR */}
        <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            appState === AppState.COMPILING ? 'bg-amber-400 animate-pulse' :
            appState === AppState.ERROR ? 'bg-red-500' :
            appState === AppState.RUNNING ? 'bg-emerald-500' : 'bg-blue-500'
          }`} />
          <span className="text-white/70 text-xs font-mono font-bold">
            {appState}
          </span>
        </div>
      </div>

      {/* BOTTOM PANEL: CONTROLS & LOGS */}
      <div className="flex flex-col md:flex-row gap-6 items-end">
        
        {/* LOG WINDOW */}
        <div className="pointer-events-auto w-full md:w-1/3 h-48 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm flex flex-col overflow-hidden shadow-2xl order-2 md:order-1 transition-all hover:border-white/20">
          <div className="bg-white/5 px-3 py-1 flex items-center justify-between border-b border-white/5">
            <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider">Syslog</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>
          <div ref={logContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
            {logs.length === 0 && (
              <div className="text-white/20 italic">Awaiting input stream...</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                <span className={`${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'system' ? 'text-blue-400' : 'text-white/80'
                }`}>
                  {log.type === 'error' && 'ERR: '}
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* INPUT TERMINAL */}
        <div className="pointer-events-auto w-full md:w-2/3 bg-black/90 backdrop-blur-xl border border-white/20 rounded-sm p-1 shadow-2xl order-1 md:order-2">
          <form onSubmit={handleSubmit} className="flex gap-2 p-1">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Command className="w-4 h-4 text-white/50" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe a physical system (e.g., 'A binary black hole system with accretion disks')"
                className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                disabled={appState === AppState.COMPILING}
              />
            </div>
            <button
              type="submit"
              disabled={appState === AppState.COMPILING}
              className={`px-6 rounded-sm font-bold text-sm tracking-wide uppercase transition-all flex items-center gap-2 ${
                appState === AppState.COMPILING
                  ? 'bg-amber-500/20 text-amber-500 cursor-not-allowed border border-amber-500/50'
                  : 'bg-white text-black hover:bg-emerald-400 hover:text-black border border-white'
              }`}
            >
              {appState === AppState.COMPILING ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Proc
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Compile
                </>
              )}
            </button>
          </form>
          <div className="px-2 pb-1 pt-2 flex justify-between items-center">
             <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
               Gemini 2.5 Flash Engine Connected
             </span>
             <span className="text-[10px] text-white/30 font-mono">
               Press Enter to Execute
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;