import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GeneratedFunction, SimulationModule } from '../types';

interface VisualizerProps {
  simulationCode: string | null;
  onLog: (message: string, type: 'info' | 'success' | 'error') => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ simulationCode, onLog }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number>(0);
  const simulationRef = useRef<SimulationModule | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // 1. Initialize Three.js Environment (Run once)
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls (OrbitControls with critical damping settings)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Default Lighting (can be overridden by script, but good to have baseline)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    // Resize Handler
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const time = clockRef.current.getElapsedTime();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Run Simulation Update
      if (simulationRef.current && simulationRef.current.update) {
        try {
          simulationRef.current.update(time, delta);
        } catch (e) {
          console.error("Runtime Simulation Error:", e);
          // Stop simulation to prevent log flood
          simulationRef.current = null;
          onLog("Runtime Error: Simulation stopped due to physics crash.", "error");
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle New Simulation Code
  useEffect(() => {
    if (!simulationCode || !sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) return;

    // Cleanup previous simulation
    if (simulationRef.current) {
      try {
        simulationRef.current.cleanup();
      } catch (e) {
        console.warn("Cleanup failed:", e);
      }
      simulationRef.current = null;
    }

    // Clear Scene (Keep camera/lights if desired, but usually safer to wipe objects)
    // We keep the camera and controls, but remove meshes.
    // We filter specifically to avoid removing the base helper lights if we wanted to keep them, 
    // but for "Compiler" mode, we usually want a clean slate.
    const objectsToRemove: THREE.Object3D[] = [];
    sceneRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.Light).isLight || (child as THREE.Line).isLine) {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach((obj) => sceneRef.current?.remove(obj));

    // Reset Camera slightly if needed, or keep user position? Keeping user position is better UX.
    
    try {
      // DANGEROUS: Construct function from string.
      // In a real production app, this would be sandboxed in a worker or iframe.
      // For this specific requested app, 'new Function' is the implementation vector.
      const constructSimulation = new Function(
        'scene', 
        'camera', 
        'renderer', 
        'controls', 
        'THREE', 
        simulationCode
      ) as GeneratedFunction;

      const simModule = constructSimulation(
        sceneRef.current,
        cameraRef.current,
        rendererRef.current,
        controlsRef.current,
        THREE
      );

      simulationRef.current = simModule;
      onLog("Simulation compiled and injected successfully.", "success");

    } catch (err: any) {
      onLog(`Compilation Error: ${err.message}`, "error");
      console.error(err);
    }

  }, [simulationCode, onLog]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 bg-black"
      // Explicitly ensuring no pointer events blocking here is handled by parent,
      // but the canvas itself handles events for OrbitControls.
    />
  );
};

export default Visualizer;