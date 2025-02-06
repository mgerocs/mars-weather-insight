import {
  AmbientLight,
  Box3,
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

  const ambientLight = new AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Middle mesh (stationary in the center)
  const middleGeometry = new BoxGeometry(2, 2, 2);
  const middleMaterial = new MeshPhongMaterial({ color: 0x00ff00 });
  const middleMesh = new Mesh(middleGeometry, middleMaterial);
  middleMesh.position.set(0, 0, 0);
  middleMesh.userData.id = "MIDDLE";
  scene.add(middleMesh);

  // Front mesh (closer to the camera)
  const frontGeometry = new BoxGeometry(1, 1, 1);
  const frontMaterial = new MeshPhongMaterial({ color: 0x0000ff });
  const frontMesh = new Mesh(frontGeometry, frontMaterial);
  frontMesh.position.set(0, 0, 3);
  frontMesh.userData.id = "FRONT";
  middleMesh.add(frontMesh);

  // Back mesh (behind the middle mesh but still partially visible)
  const backGeometry = new BoxGeometry(1, 1, 1);
  const backMaterial = new MeshPhongMaterial({ color: 0xff0000 });
  const backMesh = new Mesh(backGeometry, backMaterial);
  backMesh.position.set(0, 0, -3);
  backMesh.userData.id = "BACK";
  middleMesh.add(backMesh);

  // Camera setup
  camera.position.z = 10;

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
    // console.log(isObjectBehind(backMesh, middleMesh, camera));
    console.log(isObjectVisible2(backMesh, camera, raycaster, [middleMesh]));
    //  console.log(isObjectVisible(backMesh, camera, [middleMesh]));
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

  // Function to check if the "behind" cube is visible from the camera
  function isObjectVisible2(
    target: Object3D,
    camera: Camera,
    raycaster: Raycaster,
    occluders: Object3D[]
  ): boolean {
    // Get the world position of the target object
    const targetPosition = new Vector3();
    target.getWorldPosition(targetPosition);
    targetPosition.z -= 0.5;

    const direction = targetPosition.clone().sub(camera.position).normalize();

    // Cast a ray from the camera to the target object
    raycaster.set(camera.position, direction);

    // Check for intersections with occluders (middle cube)
    const intersects = raycaster.intersectObjects(occluders, true);

    /* console.log(
      intersects.map((intersect) => ({
        id: intersect.object.userData.id,
        distance: intersect.distance,
        cameraDistanceToTarget: camera.position.distanceTo(targetPosition),
      }))
    ); */

   /*  console.log(
      "Intersection Point for BACK:",
      intersects.find((i) => i.object.userData.id === "BACK")?.point
    );
    console.log("Expected Target Position:", targetPosition); */

    if (intersects.length > 0) {
      // Get the first intersection distance
      const intersectionDistance = intersects[0].distance;
      const targetDistance = camera.position.distanceTo(targetPosition);

      // The target is visible if it's closer than the first intersection point
      return targetDistance < intersectionDistance;
    }

    return true; // If no intersections, target is visible
  }

  function isObjectVisible(
    object: Object3D,
    camera: Camera,
    occluders: Object3D[]
  ): boolean {
    const raycaster = new Raycaster();
    const objectWorldPosition = new Vector3().setFromMatrixPosition(
      object.matrixWorld
    );

    // Set raycaster origin at camera position
    raycaster.ray.origin.copy(camera.position);

    // Set ray direction towards the object
    raycaster.ray.direction
      .copy(objectWorldPosition)
      .sub(camera.position)
      .normalize();

    for (const occluder of occluders) {
      if (occluder === object) continue; // Skip self

      // Create a bounding box around the occluder
      const bbox = new Box3().setFromObject(occluder);

      // Check if ray intersects with the bounding box
      if (raycaster.ray.intersectBox(bbox, new Vector3())) {
        return false; // Object is obstructed
      }
    }

    return true; // Object is visible
  }

  return () => {};
}
