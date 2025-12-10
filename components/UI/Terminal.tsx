import React, { useEffect, useRef, useState } from 'react';
import { LogMessage, LogType } from '../../types';
import { Terminal as TerminalIcon, Command, Cpu, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface TerminalProps {
  logs: LogMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ 
  logs, 
  inputValue, 
  onInputChange, 
  onSubmit, 
  isProcessing 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case LogType.ERROR: return <AlertCircle size={14} className="text-red-500" />;
      case LogType.SUCCESS: return <CheckCircle size={14} className="text-green-500" />;
      case LogType.WARNING: return <Activity size={14} className="text-yellow-500" />;
      case LogType.SYSTEM: return <Cpu size={14} className="text-blue-400" />;
      default: return <span className="w-3.5 h-3.5 block bg-gray-600 rounded-full text-[8px] flex items-center justify-center">i</span>;
    }
  };

  const getLogColor = (type: LogType) => {
    switch (type) {
      case LogType.ERROR: return 'text-red-400';
      case LogType.SUCCESS: return 'text-green-400';
      case LogType.WARNING: return 'text-yellow-400';
      case LogType.SYSTEM: return 'text-blue-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className={`glass-panel w-full max-w-md flex flex-col transition-all duration-300 ${isFocused ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-white/60" />
          <span className="text-xs font-mono font-bold tracking-wider text-white/80">AXIOM_KERNEL v2.5</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
      </div>

      {/* Logs Area */}
      <div 
        ref={scrollRef}
        className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-black/20"
      >
        {logs.length === 0 && (
          <div className="text-gray-600 italic text-center mt-20">System ready. Awaiting input protocol...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-gray-600 select-none min-w-[60px]">{log.timestamp}</span>
            <div className="mt-0.5">{getLogIcon(log.type)}</div>
            <span className={`${getLogColor(log.type)} break-words flex-1`}>{log.message}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="relative border-t border-white/10 bg-black/40 p-4">
        <div className="flex gap-3">
          <div className="pt-2">
            <Command size={16} className={`text-white/40 transition-colors ${isFocused ? 'text-white/90' : ''}`} />
          </div>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe a physical phenomenon..."
            className="w-full bg-transparent border-none text-white font-mono text-sm focus:ring-0 resize-none h-12 py-1 placeholder-gray-600 focus:outline-none"
            spellCheck={false}
            disabled={isProcessing}
          />
        </div>
        
        {/* Helper Hint */}
        <div className="absolute bottom-2 right-4 text-[10px] text-gray-600 font-mono pointer-events-none">
          {isProcessing ? 'COMPILING...' : 'PRESS ENTER TO COMPILE'}
        </div>
      </div>
    </div>
  );
};
