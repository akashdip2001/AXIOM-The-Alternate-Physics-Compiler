import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimulationStatus } from '../types';

interface ThreeViewportProps {
  code: string | null;
  status: SimulationStatus;
  onError: (error: string) => void;
  onSuccess: () => void;
}

const ThreeViewport: React.FC<ThreeViewportProps> = ({ code, status, onError, onSuccess }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const frameIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Initialize Three.js Environment
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup basic Three.js components
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Grid Helper (Default State)
    const gridHelper = new THREE.GridHelper(50, 50, 0x222222, 0x111111);
    scene.add(gridHelper);

    // Initial references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !camera.current || !renderer.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    
    // We need to bind the resize listener to window for flexibility
    window.addEventListener('resize', handleResize);

    // Basic loop for default state
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Handle Dynamic Code Injection
  useEffect(() => {
    if (!code || !sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    // 1. Cleanup previous simulation
    if (cleanupRef.current) {
      try {
        cleanupRef.current();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
      cleanupRef.current = null;
    }

    // Reset Scene (Keep camera/renderer, but clear objects)
    // We keep the grid helper if we want, or clear everything. Let's clear everything for a fresh start.
    const scene = sceneRef.current;
    while(scene.children.length > 0){ 
        // @ts-ignore - dispose if available
        if(scene.children[0].geometry) scene.children[0].geometry.dispose();
        // @ts-ignore
        if(scene.children[0].material) scene.children[0].material.dispose();
        scene.remove(scene.children[0]); 
    }

    // Re-add basic environment if needed, or let the script handle it.
    // Let's add a subtle ambient light so it's not pitch black if they forget lights.
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    timeRef.current = 0;

    try {
      // 2. Compile Function
      // We pass the THREE namespace so the code can use new THREE.Mesh(), etc.
      // We wrap in a function constructor.
      const runSimulation = new Function(
        'scene', 'camera', 'renderer', 'THREE',
        code
      );

      // 3. Execute Setup
      const result = runSimulation(scene, cameraRef.current, rendererRef.current, THREE);

      // 4. Validate Result
      if (!result || typeof result.update !== 'function') {
        throw new Error("Generated code did not return an 'update' function.");
      }

      cleanupRef.current = result.cleanup || null;
      onSuccess();

      // 5. Override Animation Loop for custom update logic
      cancelAnimationFrame(frameIdRef.current);
      const customAnimate = () => {
        frameIdRef.current = requestAnimationFrame(customAnimate);
        
        const dt = 0.016; // approximate delta time
        timeRef.current += dt;

        // Run the generated update function
        try {
          result.update(timeRef.current);
        } catch (err: any) {
          cancelAnimationFrame(frameIdRef.current);
          onError(`Runtime Error: ${err.message}`);
        }

        if (controlsRef.current) controlsRef.current.update();
        rendererRef.current?.render(scene, cameraRef.current!);
      };
      customAnimate();

    } catch (err: any) {
      onError(`Compilation Error: ${err.message}`);
    }

  }, [code]); // Re-run when code changes

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#050505]">
      {/* Overlay UI elements could go here */}
      {status === SimulationStatus.IDLE && (
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-30">
           <div className="text-6xl text-[#00ff9f] mb-4 font-mono animate-pulse">AXIOM</div>
           <div className="text-sm font-mono text-gray-400">WAITING FOR INPUT STREAM...</div>
         </div>
      )}
      {status === SimulationStatus.GENERATING && (
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
           <div className="text-xl font-mono text-[#00ff9f] animate-bounce">INTERFACING WITH NEURAL NET...</div>
         </div>
      )}
    </div>
  );
};

export default ThreeViewport;
