import {
  BoxGeometry,
  Camera,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function initScene(
  canvas: HTMLCanvasElement,
  labelContainer: HTMLDivElement
) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);
  camera.aspect = canvas.width / canvas.height;

  const controls = new OrbitControls(camera, renderer.domElement);

  // Create a basic directional light
  const light = new DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10).normalize();
  scene.add(light);

  // Middle mesh (stationary in the center)
  const middleGeometry = new BoxGeometry(2, 2, 2);
  const middleMaterial = new MeshPhongMaterial({ color: 0x00ff00 });
  const middleMesh = new Mesh(middleGeometry, middleMaterial);
  middleMesh.position.set(-1, 0, -5);
  middleMesh.userData.id = "MIDDLE";
  scene.add(middleMesh);

  // Front mesh (closer to the camera)
  const frontGeometry = new BoxGeometry(1, 1, 1);
  const frontMaterial = new MeshPhongMaterial({ color: 0x0000ff });
  const frontMesh = new Mesh(frontGeometry, frontMaterial);
  frontMesh.position.set(0, 0, -2);
  frontMesh.userData.id = "FRONT";
  middleMesh.add(frontMesh);

  // Back mesh (behind the middle mesh but still partially visible)
  const backGeometry = new BoxGeometry(1, 1, 1);
  const backMaterial = new MeshPhongMaterial({ color: 0xff0000 });
  const backMesh = new Mesh(backGeometry, backMaterial);
  backMesh.position.set(-3, 0, -8);
  backMesh.userData.id = "BACK";
  middleMesh.add(backMesh);

  // Camera setup
  camera.position.z = 5;

  // Raycaster setup
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  // Basic event listener for mouse clicks
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects([
      middleMesh,
      frontMesh,
      backMesh,
    ]);

    if (intersects.length > 0) {
      console.log("Intersected object:", intersects[0].object.userData.id);
    }
  });

  // Render the scene
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    console.log(isObjectBehind(backMesh, middleMesh, camera));
    renderer.render(scene, camera);
  }

  animate();

  function isObjectBehind(obj1: Object3D, obj2: Object3D, camera: Camera) {
    const obj1WorldPos = new Vector3();
    const obj2WorldPos = new Vector3();

    obj1.getWorldPosition(obj1WorldPos); // Get world position of the first object
    obj2.getWorldPosition(obj2WorldPos); // Get world position of the second object

    // Project both positions into screen space
    const screenPos1 = obj1WorldPos.clone().project(camera);
    const screenPos2 = obj2WorldPos.clone().project(camera);

    // Compare the z positions to determine if obj2 is behind obj1
    return screenPos1.z > screenPos2.z;
  }

  return () => {};
}
