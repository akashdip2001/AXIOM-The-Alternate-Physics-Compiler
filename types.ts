import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// The shape of the object returned by the generated code
export interface SimulationModule {
  update: (time: number, delta: number) => void;
  cleanup: () => void;
}

// The signature of the function we create from the string
export type GeneratedFunction = (
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  THREE_LIB: typeof THREE
) => SimulationModule;

export type LogEntry = {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
};

export enum AppState {
  IDLE = 'IDLE',
  COMPILING = 'COMPILING',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}