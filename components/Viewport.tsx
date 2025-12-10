import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LogEntry, LogType } from '../types';
import { Maximize2, RotateCcw } from 'lucide-react';

interface ViewportProps {
  code: string | null;
  onError: (error: string) => void;
  onSuccess: () => void;
}

export const Viewport: React.FC<ViewportProps> = ({ code, onError, onSuccess }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);
  const userUpdateRef = useRef<((time: number) => void) | null>(null);
  
  // Stats
  const [fps, setFps] = useState(0);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  // Initialize Base Three.js Environment
  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 2;
    cameraRef.current = camera;

    // RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // RESIZE HANDLER
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    const animate = (time: number) => {
      requestRef.current = requestAnimationFrame(animate);
      
      // FPS Counter
      frameCountRef.current++;
      if (time - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }

      controls.update();

      // Execute User Code Update Function
      if (userUpdateRef.current) {
        try {
          userUpdateRef.current(time);
        } catch (e) {
           // If runtime error occurs in update loop, stop it to prevent crash loop
           console.error("Runtime Error:", e);
           userUpdateRef.current = null; 
        }
      }

      renderer.render(scene, camera);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle Dynamic Code Injection
  useEffect(() => {
    if (!code || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const scene = sceneRef.current;
    
    // CLEANUP PREVIOUS SCENE
    // We keep the camera and renderer, but clear the scene children
    while(scene.children.length > 0){ 
        const object = scene.children[0];
        scene.remove(object); 
        // Best effort memory cleanup
        if ((object as any).geometry) (object as any).geometry.dispose();
        if ((object as any).material) {
             if (Array.isArray((object as any).material)) {
                 (object as any).material.forEach((m: any) => m.dispose());
             } else {
                 (object as any).material.dispose();
             }
        }
    }
    userUpdateRef.current = null;

    // INJECT NEW CODE
    try {
      // Create a safe-ish function wrapper
      // We pass the THREE namespace so the AI can use new THREE.Vector3(), etc.
      const createSimulation = new Function(
        'scene', 'camera', 'renderer', 'THREE', 
        code
      );

      const result = createSimulation(scene, cameraRef.current, rendererRef.current, THREE);
      
      // If the code returns an object with an update function, use it
      if (result && typeof result.update === 'function') {
        userUpdateRef.current = result.update;
      }
      
      onSuccess();

    } catch (err: any) {
      console.error("Compilation failed:", err);
      onError(err.message || "Unknown Runtime Error");
    }
    
  }, [code, onError, onSuccess]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Background Grid for depth */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #333 1px, transparent 0)`,
            backgroundSize: '40px 40px'
        }}
      />
      
      {/* 3D Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* Viewport HUD */}
      <div className="absolute top-6 right-6 flex flex-col items-end pointer-events-none select-none">
        <div className="flex items-center space-x-4 mb-2">
            <div className="px-3 py-1 bg-black/60 border border-axiom-cyan/30 rounded backdrop-blur text-xs font-mono text-axiom-cyan">
                FPS: {fps}
            </div>
            <div className="px-3 py-1 bg-black/60 border border-white/10 rounded backdrop-blur text-xs font-mono text-gray-400">
                WEBGL 2.0
            </div>
        </div>
        
        {/* Decorative elements */}
        <div className="w-32 h-32 border-r-2 border-t-2 border-white/5 rounded-tr-3xl absolute -top-4 -right-4" />
      </div>

      {/* Reset Camera (Overlay Button) */}
      <button 
        onClick={() => {
            if(cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(0, 2, 10);
                controlsRef.current.reset();
            }
        }}
        className="absolute bottom-6 right-6 p-3 bg-black/50 hover:bg-axiom-cyan/20 border border-white/10 hover:border-axiom-cyan rounded-full transition-all duration-300 text-white hover:text-axiom-cyan z-20 group"
        title="Reset View"
      >
        <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
      </button>

      {/* Initial/Empty State Placeholder */}
      {!code && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full border border-white/5 animate-[pulse_3s_ease-in-out_infinite] mx-auto mb-4 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-axiom-cyan/5 blur-xl" />
            </div>
            <p className="font-mono text-gray-600 tracking-[0.2em] text-sm">WAITING FOR COMPILATION...</p>
          </div>
        </div>
      )}
    </div>
  );
};