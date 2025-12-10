import React, { useEffect, useRef } from 'react';
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
  
  // Group Refs - separate containers for managing transitions
  const idleGroupRef = useRef<THREE.Group | null>(null);
  const pausedGroupRef = useRef<THREE.Group | null>(null);
  const simulationGroupRef = useRef<THREE.Group | null>(null);

  // Animation State Refs (for smooth transitions without re-renders)
  const animState = useRef({
    idleOpacity: 1,
    pausedOpacity: 0,
    simScale: 0
  });

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

    // --- STATE B: SIMULATION GROUP ---
    // This group will act as the "scene" for the generated code
    const simulationGroup = new THREE.Group();
    simulationGroup.scale.setScalar(0); // Start hidden/collapsed
    scene.add(simulationGroup);
    simulationGroupRef.current = simulationGroup;

    // --- STATE C: PAUSED GROUP (Wireframe Sphere & Overlay) ---
    const pausedGroup = new THREE.Group();
    pausedGroup.visible = false; // Initially hidden
    
    // Wireframe Sphere
    const wireGeo = new THREE.IcosahedronGeometry(2, 2);
    const wireMat = new THREE.MeshBasicMaterial({ 
      color: 0x00f3ff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0 // Start invisible for fade in
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    pausedGroup.add(wireSphere);
    
    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(1, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00ff9d,
      wireframe: true,
      transparent: true,
      opacity: 0 // Start invisible
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

    // CLEANUP ROUTINE (Mandatory)
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // 1. Clear DOM
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // 2. Destroy Global Variables (to prevent collisions in next run)
      (window as any).scene = null;
      (window as any).camera = null;
      (window as any).renderer = null;

      // 3. Dispose Three.js Memory
      renderer.dispose();
      renderer.forceContextLoss();
      
      // Dispose Scene objects
      scene.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
              if (Array.isArray(object.material)) {
                  object.material.forEach((m: any) => m.dispose());
              } else {
                  object.material.dispose();
              }
          }
      });
    };
  }, []);

  // Handle Code Execution
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !simulationGroupRef.current) return;

    if (mode === AppMode.LOADING || mode === AppMode.IDLE) {
      // Cleanup previous sim if exists
      if (simulationRef.current?.cleanup) {
        try {
            simulationRef.current.cleanup();
        } catch(e) { console.error("Cleanup error", e); }
        simulationRef.current = null;
      }
      
      // Cleanup visual artifacts and memory
      simulationGroupRef.current.clear();
      
      // Helper to clean materials deeply
      const cleanMaterial = (material: any) => {
        material.dispose();
        if (material.map) material.map.dispose();
        if (material.lightMap) material.lightMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.specularMap) material.specularMap.dispose();
        if (material.envMap) material.envMap.dispose();
      };

      simulationGroupRef.current.traverse((object: any) => {
          if (object.isMesh || object.isPoints || object.isLine) {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                  if (object.material.isMaterial) {
                      cleanMaterial(object.material);
                  } else if (Array.isArray(object.material)) {
                      object.material.forEach(cleanMaterial);
                  }
              }
          }
      });
      
      // Reset scale for animation
      animState.current.simScale = 0; 
      simulationGroupRef.current.scale.setScalar(0);
    }

    if (mode === AppMode.ACTIVE && codeString && !simulationRef.current) {
      // Execute new code
      try {
        const createSimulation = new Function('THREE', 'scene', 'camera', 'renderer', codeString);
        
        // Pass simulationGroupRef.current as 'scene'
        const simInterface = createSimulation(THREE, simulationGroupRef.current, cameraRef.current, rendererRef.current);
        
        if (simInterface && typeof simInterface.update === 'function') {
          simulationRef.current = simInterface;
        } else {
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
      const simulationGroup = simulationGroupRef.current;
      const controls = controlsRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      controls.update();

      // --- ANIMATION TRANSITION LOGIC ---
      const lerpFactor = 0.05;

      // 1. STARFIELD (IDLE)
      const targetIdleOpacity = (mode === AppMode.IDLE || mode === AppMode.LOADING) ? 1 : 0;
      animState.current.idleOpacity = THREE.MathUtils.lerp(animState.current.idleOpacity, targetIdleOpacity, lerpFactor);

      if (idleGroup) {
          idleGroup.visible = animState.current.idleOpacity > 0.01;
          if (idleGroup.visible) {
             idleGroup.rotation.y += 0.0005;
             idleGroup.rotation.x += 0.0002;
             const points = idleGroup.children[0] as THREE.Points;
             if (points && points.material) {
                 (points.material as THREE.PointsMaterial).opacity = 0.8 * animState.current.idleOpacity;
             }
          }
      }

      // 2. PAUSED OVERLAY
      const targetPausedOpacity = (mode === AppMode.PAUSED) ? 1 : 0;
      animState.current.pausedOpacity = THREE.MathUtils.lerp(animState.current.pausedOpacity, targetPausedOpacity, lerpFactor);

      if (pausedGroup) {
          pausedGroup.visible = animState.current.pausedOpacity > 0.01;
          if (pausedGroup.visible) {
            pausedGroup.rotation.y -= 0.005;
            pausedGroup.rotation.z += 0.002;
            pausedGroup.children.forEach((child, index) => {
                const maxOp = index === 0 ? 0.5 : 0.3;
                if ((child as THREE.Mesh).material) {
                    ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = maxOp * animState.current.pausedOpacity;
                }
            });
          }
      }

      // 3. SIMULATION SCALE ("Big Bang" Effect)
      const targetSimScale = (mode === AppMode.ACTIVE || mode === AppMode.PAUSED) ? 1 : 0;
      animState.current.simScale = THREE.MathUtils.lerp(animState.current.simScale, targetSimScale, 0.08);

      if (simulationGroup) {
          if (mode === AppMode.ACTIVE) {
              if (simulationRef.current?.update) {
                  try {
                      simulationRef.current.update();
                  } catch(e) {
                      console.error("Simulation Runtime Error", e);
                  }
              }
          }
          
          const s = animState.current.simScale;
          const safeScale = Math.max(0.001, s);
          simulationGroup.scale.set(safeScale, safeScale, safeScale);
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