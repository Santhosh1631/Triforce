import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x333333, 1));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;
controls.enablePan = false;
controls.enableZoom = false;

// Avatar loading
const loader = new GLTFLoader();
let avatar;
let mouthMesh;
let mouthIndex = -1;

camera.position.set(0, 1, 2);

loader.load(
  "/static/models/modelkc.glb",
  (gltf) => {
    avatar = gltf.scene;
    avatar.scale.set(2, 2, 1);
    avatar.position.set(0, -1.5, 0);
    scene.add(avatar);

    avatar.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const mouthKey = Object.keys(child.morphTargetDictionary).find(k =>
          k.toLowerCase().includes("mouthopen") || k.toLowerCase().includes("open")
        );
        if (mouthKey) {
          mouthMesh = child;
          mouthIndex = child.morphTargetDictionary[mouthKey];
        }
      }
    });
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
  (error) => console.error("An error occurred:", error)
);

// Mouth movement
let mouthInterval = null;

export function startMouthMovement() {
  if (!mouthMesh || mouthIndex === -1) return;

  clearInterval(mouthInterval);
  mouthInterval = setInterval(() => {
    const value = Math.random(); // Simulate lip movement
    mouthMesh.morphTargetInfluences[mouthIndex] = value;
  }, 100);
}

export function stopMouthMovement() {
  if (mouthInterval) {
    clearInterval(mouthInterval);
    mouthInterval = null;
    if (mouthMesh && mouthIndex !== -1) {
      mouthMesh.morphTargetInfluences[mouthIndex] = 0;
    }
  }
}

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
