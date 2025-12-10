export interface LogMessage {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'system';
  text: string;
}

export enum RenderStyle {
  SCIENTIFIC = 'SCIENTIFIC',
  CYBER = 'CYBER',
}

export interface SimulationConfig {
  code: string;
  style: RenderStyle;
}
