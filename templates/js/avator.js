import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Create a Three.JS Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60, // Slightly smaller FOV for a slight zoom
    window.innerWidth / window.innerHeight,
    0.1,
    10 // Reduce far distance to cut off parts of the avatar that are too far away
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
camera.position.set(0, 1, 2); // Move the camera closer to zoom in (without reducing the avatar size)

loader.load(
    "models/modelkc.glb", // Adjust the path as needed
    function (gltf) {
        avatar = gltf.scene;

        avatar.scale.set(2, 2, 1); // Keep the avatar's scale unchanged (do not reduce size)
        avatar.position.set(0, -1.5, 0); // Move the avatar lower so only the legs are visible

        // Optional: Focus the camera on the legs by adjusting position and angle
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
