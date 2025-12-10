export enum AppMode {
  IDLE = 'IDLE',       // State A: Starfield
  ACTIVE = 'ACTIVE',   // State B: Simulation Running
  PAUSED = 'PAUSED',   // State C: Frozen Sim + Wireframe Overlay
  LOADING = 'LOADING'  // Processing Gemini Request
}

export interface SimulationCode {
  code: string;
  explanation: string;
}

export interface TerminalLog {
  id: string;
  type: 'info' | 'success' | 'error' | 'system';
  message: string;
  timestamp: number;
}
