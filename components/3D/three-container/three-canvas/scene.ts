import {
  AmbientLight,
  ArrowHelper,
  BoxGeometry,
  Camera,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

import { createPin } from "./createPin";
import { createTextSprite } from "./createTextSprite";
import poiData from "../../data/pointsOfInterests.json";
import { createHtmlLabel } from "./createHtmlLabel";
import { debounce } from "../../utils/debounce";
import { latLonToCartesian } from "../../utils/latLonToCartesian";

export function initScene(
  canvas: HTMLCanvasElement,
  labelContainer: HTMLDivElement
) {
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  const raycaster = new Raycaster();
  const mouse = new Vector2();

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    75,
    canvas.width / canvas.height,
    0.1,
    1000
  );

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none"; // Ensures clicks go through
  labelContainer.innerHTML = "";
  labelContainer.appendChild(labelRenderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const planetRadius = 10;

  // SET CAMERA

  const initialZoomDistance = planetRadius * 2.2;

  camera.position.set(0, 0, initialZoomDistance);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = planetRadius * 1.8;
  controls.maxDistance = planetRadius * 4;
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // LOAD TEXTURES

  const textureLoader = new TextureLoader();

  const normalMap = textureLoader.load("textures/mars_normal1.png");
  const specularMap = textureLoader.load("textures/mars_spec1.png");
  const surfaceMap = textureLoader.load("textures/mars_color1.jpg");

  let marsMesh: Mesh;

  setSize();

  let pins: Mesh[] = [];

  function drawContent() {
    // ADD MESH

    pins = [];

    const material = new MeshPhongMaterial({
      map: surfaceMap,
      normalMap,
      specularMap,
      shininess: 30,
      bumpScale: 0.05,
      /*     emissive: new Color(0xf26411), */
      /*     emissiveIntensity: 0.03, */
    });

    const marsGeometry = new SphereGeometry(planetRadius, 64, 64);
    marsMesh = new Mesh(marsGeometry, material);
    marsMesh.position.set(0, 0, 0);
    marsMesh.castShadow = true;
    marsMesh.receiveShadow = true;
    scene.add(marsMesh);

    // ADD PINS

    poiData.forEach((poi) => {
      const pinHeight = 1;
      const pin = createPin(
        poi.lat,
        poi.lon,
        planetRadius,
        marsMesh,
        pinHeight
      );

      pin.userData.id = poi.id;

      // const label = createTextSprite(poi.name);

      const label = createHtmlLabel(poi.name);

      if (label) {
        label.position.set(0, -1 * pinHeight * 1.2, 0); // Move it slightly above the pin
        pin.add(label); // Attach the label to the pin so it moves with it
      }

      pins.push(pin);
    });

    updateLabelsVisibility();

    // ADD LIGHT

    const directionalLight = new DirectionalLight(0xfe9d7b, 3);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;

    const shadow = directionalLight.shadow;

    shadow.mapSize.width = 2048;
    shadow.mapSize.height = 2048;

    const d = 50;

    shadow.camera.left = -d;
    shadow.camera.right = d;
    shadow.camera.top = d;
    shadow.camera.bottom = -d;

    shadow.camera.far = 3500;
    shadow.bias = -0.0001;

    scene.add(directionalLight);

    /*   const pointLight = new PointLight(0xfff5f2, 10, 100);
pointLight.position.set(20, 20, 20);
scene.add(pointLight); */
  }

  drawContent();

  renderer.setAnimationLoop(animate);

  // ANIMATION LOOP

  function animate() {
    controls.update();

    composer.render();

    labelRenderer.render(scene, camera);
  }

  function rotateObject(mesh: Mesh, deltaX: number, deltaY: number) {
    mesh.rotation.y += deltaX / 100;
    mesh.rotation.x += deltaY / 100;
  }

  function setSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.setSize(canvas.width, canvas.height);
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();

    labelRenderer.setSize(canvas.width, canvas.height);
  }

  // Function to visualize the ray direction from the camera to the pin
  function visualizeRayDirection(camera: Camera, pin: Object3D) {
    const rayDirection = new Vector3();

    // Get the world position of the pin and camera
    const pinWorldPosition = new Vector3();
    pin.getWorldPosition(pinWorldPosition);

    const cameraWorldPosition = new Vector3();
    camera.getWorldPosition(cameraWorldPosition);

    // Compute the direction from the camera to the pin
    rayDirection.subVectors(pinWorldPosition, cameraWorldPosition).normalize();

    // Create an ArrowHelper to visualize the ray
    const arrowHelper = new ArrowHelper(
      rayDirection,
      cameraWorldPosition,
      10,
      0xffff00
    ); // Length is 10 (adjustable)
    scene.add(arrowHelper);
  }

  function checkIfVisible(
    el: Object3D,
    camera: Camera,
    raycaster: Raycaster,
    occlude: Object3D[]
  ) {
    // Get world position of the element (in this case, the pin)
    const elPos = new Vector3();
    el.getWorldPosition(elPos); // Get world position instead of using matrixWorld

    // Project the world position to screen space
    const screenPos = elPos.clone().project(camera);

    // Create a Vector2 for screenPos (because raycaster.setFromCamera expects Vector2)
    const screenPos2D = new Vector2(screenPos.x, screenPos.y);

    raycaster.setFromCamera(screenPos2D, camera); // Set raycaster

    const intersects = raycaster.intersectObjects(occlude, true);
    if (intersects.length) {
      const intersectionDistance = intersects[0].distance;
      const pointDistance = elPos.distanceTo(raycaster.ray.origin);

      return pointDistance < intersectionDistance;
    }

    return true;
  }

  function checkIfObstructed(
    pin: Object3D,
    camera: Camera,
    planet: Mesh
  ): boolean {
    const raycaster = new Raycaster();
    const direction = new Vector3();

    // Get the world position of the pin
    const pinWorldPosition = new Vector3();
    pin.getWorldPosition(pinWorldPosition);

    // Get the world position of the camera
    const cameraWorldPosition = new Vector3();
    camera.getWorldPosition(cameraWorldPosition);

    // Compute direction from camera to pin
    direction.subVectors(pinWorldPosition, cameraWorldPosition).normalize();

    // Set raycaster origin at camera and cast towards pin
    raycaster.set(cameraWorldPosition, direction);

    // Find intersections with the planet
    const intersects = raycaster.intersectObject(planet, true);

    // Log the intersection results for debugging
    if (intersects.length > 0) {
      const intersectionDistance = intersects[0].distance;
      const pinDistance = pinWorldPosition.distanceTo(cameraWorldPosition);

      /*   console.log(`Intersection Distance: ${intersectionDistance}`);
      console.log(`Pin Distance: ${pinDistance}`); */

      return intersectionDistance < pinDistance; // True if planet is blocking the pin
    }

    return false; // No intersection, pin is visible
  }

  function isBehind() {
    // Get world positions of the planet and the pin
    const planetWorldPos = new Vector3();
    marsMesh.getWorldPosition(planetWorldPos);

    const pinWorldPos = new Vector3();
    pins[0].getWorldPosition(pinWorldPos);

    // Get the direction vectors from the camera to the planet and to the pin
    const cameraToPlanet = new Vector3()
      .subVectors(planetWorldPos, camera.position)
      .normalize();
    const cameraToPin = new Vector3()
      .subVectors(pinWorldPos, camera.position)
      .normalize();

    // Compute the dot product to check if the pin is behind the planet
    const dotProduct = cameraToPlanet.dot(cameraToPin);

    // If the dot product is negative, the pin is behind the planet
    return dotProduct < 0;
  }

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

  function updateLabelsVisibility() {
    pins.forEach((pin) => {
      const isBehind = isObjectBehind(pin, marsMesh, camera);

      pin.children.forEach((child) => {
        if (child instanceof CSS2DObject) {
          child.visible = !isBehind;
        }
      });
    });
  }

  const onPointerDown = (event: MouseEvent | TouchEvent) => {
    isDragging = true;

    if (event instanceof TouchEvent && event.touches.length > 0) {
      prevMouseX = event.touches[0].clientX;
      prevMouseY = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      prevMouseX = event.clientX;
      prevMouseY = event.clientY;
    }
  };

  const onPointerMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    let currentX: number;
    let currentY: number;

    if (event instanceof TouchEvent && event.touches.length > 0) {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      currentX = event.clientX;
      currentY = event.clientY;
    } else {
      return;
    }

    const deltaX = currentX - prevMouseX;
    const deltaY = currentY - prevMouseY;

    marsMesh.rotation.y += deltaX * 0.005;
    marsMesh.rotation.x += deltaY * 0.005;

    updateLabelsVisibility();

    prevMouseX = currentX;
    prevMouseY = currentY;
  };

  const onPointerUp = (event: MouseEvent | TouchEvent) => {
    isDragging = false;
    handleClick(event);
  };

  // RAYCAST

  function handleClick(event: MouseEvent | TouchEvent) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    const canvasBounds = renderer.domElement.getBoundingClientRect();

    let x: number;
    let y: number;

    if (event instanceof TouchEvent && event.touches.length > 0) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      x = event.clientX;
      y = event.clientY;
    } else {
      return;
    }

    mouse.x = ((x - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((y - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    // Cast a ray from the camera through the mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get intersected objects
    const intersects = raycaster.intersectObjects(marsMesh.children);

    if (intersects.length > 0) {
      const clickedPin = intersects[0].object;
      const poiId = clickedPin.userData.id;

      const poi = poiData.find((poi) => poi.id === poiId);

      if (poi) {
        console.log("Clicked: " + poi.name);
      }

      // Example: Change pin color
      // clickedObject.material.color.set(0x00ff00);
    }
  }

  function onResize() {
    setSize();
  }

  const handleResize = debounce(onResize);

  addEventListeners();

  function addEventListeners() {
    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("mouseup", onPointerUp);

    canvas.addEventListener("touchstart", onPointerDown);
    canvas.addEventListener("touchmove", onPointerMove);
    canvas.addEventListener("touchend", onPointerUp);

    window.addEventListener("resize", handleResize);
  }

  function removeEventListeners() {
    canvas.removeEventListener("mousedown", onPointerDown);
    canvas.removeEventListener("mousemove", onPointerMove);
    canvas.removeEventListener("mouseup", onPointerUp);

    canvas.removeEventListener("touchstart", onPointerDown);
    canvas.removeEventListener("touchmove", onPointerMove);
    canvas.removeEventListener("touchend", onPointerUp);

    window.removeEventListener("resize", handleResize);
  }

  return () => {
    removeEventListeners();
    renderer.dispose();
  };
}
