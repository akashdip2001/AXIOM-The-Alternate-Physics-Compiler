export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM'
}

export interface LogMessage {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
}

export interface GenerationResult {
  code: string;
  explanation?: string;
}
