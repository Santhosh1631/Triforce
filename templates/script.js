import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Create a Three.JS Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Alpha allows a transparent background
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x333333, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Orbit controls (keep the scene static)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false; // Prevent rotation
controls.enablePan = false;    // Prevent panning
controls.enableZoom = false;   // Prevent zooming
controls.update();


// Load the .glb file
const loader = new GLTFLoader();
let avatar;
camera.position.set(0, 1.5, 3); // Closer and centered

loader.load(
    "models/model 3.glb",
    function (gltf) {
        avatar = gltf.scene;

        // Scale and position the avatar
        avatar.scale.set(2.5, 2.5, 2.5); // Adjust size
        avatar.position.set(0, -1, 0);   // Centered vertically and horizontally
        scene.add(avatar);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
        console.error("An error occurred:", error);
    }
);


// Resize handling
window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render the scene
function animate() {
    requestAnimationFrame(animate);

    // Render the scene
    renderer.render(scene, camera);
}

animate();
