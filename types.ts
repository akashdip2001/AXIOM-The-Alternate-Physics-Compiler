export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
}

export interface SimulationConfig {
  code: string;
  timestamp: number;
}

export enum SimulationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPILING = 'COMPILING',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}
