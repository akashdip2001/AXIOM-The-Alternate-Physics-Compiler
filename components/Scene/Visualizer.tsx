import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { INITIAL_CODE } from '../../constants';

interface VisualizerProps {
  code: string;
  onCodeExecuted?: () => void;
  onError?: (error: string) => void;
}

// Extend window definition to include our animation loop hook
declare global {
  interface Window {
    currentAnimationLoop?: (time: number) => void;
  }
}

export const Visualizer: React.FC<VisualizerProps> = ({ code, onCodeExecuted, onError }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // 1. Initialize Scene (Run Once)
  useEffect(() => {
    if (!mountRef.current) return;

    // -- Setup --
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Add some subtle fog for depth
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 10);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    mountRef.current.appendChild(renderer.domElement);

    // -- Controls --
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;

    // -- Refs --
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // -- Initial Lighting --
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // -- Resize Handler --
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // -- Animation Loop --
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clockRef.current.getElapsedTime();

      // Run dynamic animation code if it exists
      if (typeof window.currentAnimationLoop === 'function') {
        try {
          window.currentAnimationLoop(elapsedTime);
        } catch (e) {
          console.error("Animation Loop Error:", e);
          window.currentAnimationLoop = undefined; // Stop crashing logic
        }
      }

      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      // Dispose logic could go here for thoroughness
    };
  }, []);

  // 2. Execute Dynamic Code
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !code) return;

    const executeCode = () => {
      try {
        // Reset Scene
        const scene = sceneRef.current!;
        
        // Clear existing meshes (keep lights if you want, but better to clear all for total control)
        // We'll keep the base camera/renderer config but clear children
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }

        // Reset animation loop
        window.currentAnimationLoop = undefined;

        // Reset camera a bit if it drifted too far? Optional.
        // cameraRef.current!.position.set(5, 5, 10);
        // controlsRef.current?.reset(); 

        // -- DYNAMIC INJECTION --
        // We wrap the user code in a function with explicit scope
        // This is "safe enough" for a client-side visualization tool, 
        // but never use this for processing sensitive server data.
        const dynamicFunction = new Function(
          'scene', 
          'THREE', 
          'camera', 
          'renderer', 
          code
        );

        dynamicFunction(scene, THREE, cameraRef.current, rendererRef.current);
        
        if (onCodeExecuted) onCodeExecuted();

      } catch (err: any) {
        console.error("AXIOM Runtime Error:", err);
        if (onError) onError(err.message || "Unknown runtime error");
      }
    };

    executeCode();

  }, [code, onCodeExecuted, onError]);

  return (
    <div 
      ref={mountRef} 
      className="absolute top-0 left-0 w-full h-full z-0 bg-black"
    />
  );
};
