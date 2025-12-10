export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
}

export interface CompilationResult {
  code: string;
  success: boolean;
  error?: string;
}

export interface SimulationConfig {
  prompt: string;
  generatedCode: string | null;
  status: 'idle' | 'compiling' | 'active' | 'error';
}