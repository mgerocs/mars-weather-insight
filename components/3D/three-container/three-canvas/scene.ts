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

import { createPin } from "./marker/createMarker";
import { createTextSprite } from "./createTextSprite";
import pois from "../../data/pointsOfInterests.json";
import { createHtmlLabel } from "./marker/createHtmlLabel";
import { debounce } from "../../utils/debounce";
import { latLonToCartesian } from "../../utils/latLonToCartesian";
import { createPlanet } from "./planet/createPlanet";
import { useInactivity } from "./useInactivity";

export function initScene(
  canvas: HTMLCanvasElement,
  labelContainer: HTMLDivElement
) {
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  let rotating = false;

  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      hidePins();
      rotating = true;
    }, 5000);
  }

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

  const labelRenderer = new CSS2DRenderer({ element: labelContainer });
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none"; // Ensures clicks go through
  /*  labelContainer.appendChild(labelRenderer.domElement); */

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

  setSize();

  const { planet, markers, onRotatePlanet } = createPlanet(
    {
      name: "Mars",
      geometry: { radius: planetRadius },
      material: {
        surfaceMap: "textures/mars_color1.jpg",
        normalMap: "textures/mars_normal1.png",
        specularMap: "textures/mars_spec1.png",
      },
      pois,
    },
    scene,
    camera
  );

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

  renderer.setAnimationLoop(animate);

  // resetInactivityTimer();

  // ANIMATION LOOP

  function animate() {
    controls.update();

    if (rotating) {
      rotatePlanet(planet);
    }

    composer.render();

    labelRenderer.render(scene, camera);
  }

  function rotatePlanet(planet: Mesh) {
    planet.rotation.y += 0.01;
  }

  function setSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.setSize(canvas.width, canvas.height);
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();

    labelRenderer.setSize(canvas.width, canvas.height);
  }

  const handlePointerDown = (event: MouseEvent | TouchEvent) => {
    isDragging = true;

    if (event instanceof TouchEvent && event.touches.length > 0) {
      prevMouseX = event.touches[0].clientX;
      prevMouseY = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      prevMouseX = event.clientX;
      prevMouseY = event.clientY;
    }
  };

  const handlePointerMove = (event: MouseEvent | TouchEvent) => {
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

    planet.rotation.y += deltaX * 0.005;
    planet.rotation.x += deltaY * 0.005;

    onRotatePlanet();

    prevMouseX = currentX;
    prevMouseY = currentY;
  };

  const handlePointerUp = (event: MouseEvent | TouchEvent) => {
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
    const intersects = raycaster.intersectObjects(markers);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (clickedObject.name === "hitbox") {
        const id = clickedObject.userData.id;

        if (id) {
          console.log(id);
        }
      }
    }
  }

  function onResize() {
    setSize();
  }

  const handleResize = debounce(onResize);

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "h" || event.key === "H") {
      togglePins();
    }
  };

  const handleUserInteraction = () => {
    showPins();
    rotating = false;
    resetInactivityTimer();
  };

  function hidePins() {
    markers.forEach((marker) => (marker.visible = false));
  }

  function showPins() {
    markers.forEach((marker) => (marker.visible = true));
  }

  function togglePins() {
    markers.forEach((marker) => (marker.visible = !marker.visible));
  }

  addEventListeners();

  function addEventListeners() {
    canvas.addEventListener("mousedown", handlePointerDown);
    canvas.addEventListener("mousemove", handlePointerMove);
    canvas.addEventListener("mouseup", handlePointerUp);

    canvas.addEventListener("touchstart", handlePointerDown);
    canvas.addEventListener("touchmove", handlePointerMove);
    canvas.addEventListener("touchend", handlePointerUp);

    /*  canvas.addEventListener("mousemove", handleUserInteraction);
    canvas.addEventListener("mousedown", handleUserInteraction);
    canvas.addEventListener("keydown", handleUserInteraction);
    canvas.addEventListener("touchstart", handleUserInteraction);
    canvas.addEventListener("wheel", handleUserInteraction); */

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", handleResize);
  }

  function removeEventListeners() {
    canvas.removeEventListener("mousedown", handlePointerDown);
    canvas.removeEventListener("mousemove", handlePointerMove);
    canvas.removeEventListener("mouseup", handlePointerUp);

    canvas.removeEventListener("touchstart", handlePointerDown);
    canvas.removeEventListener("touchmove", handlePointerMove);
    canvas.removeEventListener("touchend", handlePointerUp);

    /*  canvas.removeEventListener("mousemove", handleUserInteraction);
    canvas.removeEventListener("mousedown", handleUserInteraction);
    canvas.removeEventListener("keydown", handleUserInteraction);
    canvas.removeEventListener("touchstart", handleUserInteraction);
    canvas.removeEventListener("wheel", handleUserInteraction); */

    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("resize", handleResize);
  }

  return () => {
    removeEventListeners();
    renderer.dispose();
  };
}
