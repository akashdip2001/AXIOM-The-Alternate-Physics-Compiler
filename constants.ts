// The default "Abstract Starfield" code loaded on start/reset.
// This code is executed inside a Function constructor with access to: scene, camera, renderer, THREE.
export const INITIAL_STARFIELD_CODE = `
// Clear existing scene
while(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
}

// Camera Setup
camera.position.set(0, 0, 40);
camera.lookAt(0, 0, 0);

// 1. Particle System (Stars)
const particlesGeometry = new THREE.BufferGeometry();
const count = 3000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

const color1 = new THREE.Color('#4fd1c5'); // Cyan/Teal
const color2 = new THREE.Color('#9f7aea'); // Purple

for(let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Additive Blending for "Cosmic" look
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// 2. Grid (Subtle floor)
const gridHelper = new THREE.GridHelper(100, 100, 0x333333, 0x111111);
gridHelper.position.y = -10;
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// 3. Floating Geometric Core (Abstract)
const coreGeo = new THREE.IcosahedronGeometry(2, 0);
const coreMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const core = new THREE.Mesh(coreGeo, coreMat);
scene.add(core);

// Animation Loop Function
return function update(time) {
    // Rotate particles slowly
    particles.rotation.y = time * 0.05;
    particles.rotation.z = time * 0.02;

    // Pulse the core
    const scale = 1 + Math.sin(time * 2) * 0.1;
    core.scale.set(scale, scale, scale);
    core.rotation.x = time * 0.5;
    core.rotation.y = time * 0.5;
};
`;

export const SCIENTIFIC_KEYWORDS = [
  "black hole", "solar system", "planet", "galaxy", "universe", "star",
  "nebula", "gravity", "orbit", "cosmos", "event horizon", "accretion"
];

export const CYBER_KEYWORDS = [
  "pendulum", "cube", "system", "experiment", "object", "lever", 
  "mechanism", "geometric", "array", "grid", "data", "matrix"
];
