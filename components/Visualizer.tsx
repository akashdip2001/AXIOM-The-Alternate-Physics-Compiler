import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppMode } from '../types';
import { STARFIELD_COUNT } from '../constants';

interface VisualizerProps {
  mode: AppMode;
  codeString: string | null;
  onError: (error: string) => void;
}

interface SimulationInterface {
  update?: () => void;
  cleanup?: () => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ mode, codeString, onError }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);

  // Logic Refs
  const simulationRef = useRef<SimulationInterface | null>(null);
  const idleGroupRef = useRef<THREE.Group | null>(null);
  const pausedGroupRef = useRef<THREE.Group | null>(null);
  const overlayPlaneRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js
  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // --- STATE A: IDLE GROUP (Starfield) ---
    const idleGroup = new THREE.Group();
    const starGeo = new THREE.BufferGeometry();
    const starCount = STARFIELD_COUNT;
    const posArray = new Float32Array(starCount * 3);
    
    for(let i = 0; i < starCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50; 
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const starMesh = new THREE.Points(starGeo, starMat);
    idleGroup.add(starMesh);
    scene.add(idleGroup);
    idleGroupRef.current = idleGroup;

    // --- STATE C: PAUSED GROUP (Wireframe Sphere & Overlay) ---
    const pausedGroup = new THREE.Group();
    pausedGroup.visible = false;
    
    // Dark Overlay (Plane covering camera view)
    // Note: We'll manually position this in front of camera each frame or just put it in the group
    // Ideally, for the "dark layer", we can just use a fullscreen quad, but let's use a big sphere surrounding the center for simplicity in scene space, 
    // or better, a UI HTML overlay. The prompt asks for "Overlay a semi-transparent dark layer... Render on top: An abstract, rotating Wireframe Sphere".
    // Let's do the Sphere in Three.js and the Dark Layer in CSS/HTML to avoid depth sorting issues with the frozen scene.
    // So `pausedGroup` only contains the Wireframe Sphere.
    
    const wireGeo = new THREE.IcosahedronGeometry(2, 2);
    const wireMat = new THREE.MeshBasicMaterial({ 
      color: 0x00f3ff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.5 
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    pausedGroup.add(wireSphere);
    
    // Add an inner glowing core for aesthetics
    const coreGeo = new THREE.IcosahedronGeometry(1, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ff9d,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    pausedGroup.add(coreSphere);

    scene.add(pausedGroup);
    pausedGroupRef.current = pausedGroup;


    // RESIZE HANDLER
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose other resources as needed
    };
  }, []);

  // Handle Code Execution (State A -> B or C -> B)
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    if (mode === AppMode.LOADING || mode === AppMode.IDLE) {
      // Cleanup previous sim if exists
      if (simulationRef.current?.cleanup) {
        try {
            simulationRef.current.cleanup();
        } catch(e) { console.error("Cleanup error", e); }
        simulationRef.current = null;
      }
    }

    if (mode === AppMode.ACTIVE && codeString && !simulationRef.current) {
      // Execute new code
      try {
        const createSimulation = new Function('THREE', 'scene', 'camera', 'renderer', codeString);
        const simInterface = createSimulation(THREE, sceneRef.current, cameraRef.current, rendererRef.current);
        
        if (simInterface && typeof simInterface.update === 'function') {
          simulationRef.current = simInterface;
        } else {
            // Fallback if no interface returned but code ran
           simulationRef.current = { update: () => {}, cleanup: () => {} };
        }
      } catch (err: any) {
        onError(err.message || "Failed to execute simulation code");
      }
    }
  }, [mode, codeString, onError]);

  // Animation Loop
  useEffect(() => {
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) return;

      const idleGroup = idleGroupRef.current;
      const pausedGroup = pausedGroupRef.current;
      const controls = controlsRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      controls.update();

      // State Machine Logic for Visuals
      if (mode === AppMode.IDLE || mode === AppMode.LOADING) {
        if (idleGroup) {
            idleGroup.visible = true;
            idleGroup.rotation.y += 0.0005;
            idleGroup.rotation.x += 0.0002;
        }
        if (pausedGroup) pausedGroup.visible = false;
        
      } else if (mode === AppMode.ACTIVE) {
        if (idleGroup) idleGroup.visible = false;
        if (pausedGroup) pausedGroup.visible = false;

        // Run generated physics
        if (simulationRef.current?.update) {
            try {
                simulationRef.current.update();
            } catch(e) {
                console.error("Simulation Runtime Error", e);
            }
        }

      } else if (mode === AppMode.PAUSED) {
        if (idleGroup) idleGroup.visible = false;
        if (pausedGroup) {
            pausedGroup.visible = true;
            // Rotate the wireframe sphere
            pausedGroup.rotation.y -= 0.005;
            pausedGroup.rotation.z += 0.002;
            
            // Note: We do NOT call simulationRef.current.update() here, creating the "Freeze" effect.
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [mode]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default Visualizer;
