import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ViewportProps {
  code: string;
  onError: (error: string) => void;
}

const Viewport: React.FC<ViewportProps> = ({ code, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number>(0);
  const updateFnRef = useRef<((time: number) => void) | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.02); // Add depth
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth weighted movement
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = (time: number) => {
      requestRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) controlsRef.current.update();

      // Execute dynamic update function if it exists
      if (updateFnRef.current) {
        try {
          // Pass elapsed time in seconds
          updateFnRef.current((time - startTimeRef.current) * 0.001);
        } catch (e) {
          // Do not log in loop, just stop update to prevent spam
          updateFnRef.current = null;
          console.error("Runtime Animation Error:", e);
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    startTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Execute Code when `code` prop changes
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !code) return;

    try {
      // 1. Clean Scene (managed inside the generated code mostly, but safety check here)
      // Note: We expect the generated code to handle scene clearing as per prompt instructions.

      // 2. Prepare Sandbox
      // We use the Function constructor to create a scoped execution environment.
      // We pass THREE global, and the instances.
      const sandbox = new Function(
        'scene', 
        'camera', 
        'renderer', 
        'THREE', 
        code
      );

      // 3. Execute
      const result = sandbox(sceneRef.current, cameraRef.current, rendererRef.current, THREE);

      // 4. Store Update Function
      if (typeof result === 'function') {
        updateFnRef.current = result;
        // Reset time for new simulation
        startTimeRef.current = performance.now();
      } else {
        updateFnRef.current = null;
      }

    } catch (err: any) {
      console.error("Compilation Error:", err);
      onError(err.message || "Unknown compilation error");
    }
  }, [code, onError]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-auto" />;
};

export default Viewport;