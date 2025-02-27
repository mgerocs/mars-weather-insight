import {
  AmbientLight,
  ArrowHelper,
  BoxGeometry,
  Camera,
  Color,
  ColorRepresentation,
  DirectionalLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
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
import { PlanetControls } from "./planet/PlanetControls";

type SceneFunctions = {
  cleanup: () => void;
  showLabels: (ids?: string[]) => void;
  hideLabels: (ids?: string[]) => void;
};

export function initScene(
  canvas: HTMLCanvasElement,
  labelContainer: HTMLDivElement,
  onLabelClick: (id: string) => void
): SceneFunctions {
  const planetRadius = 20;

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
  labelRenderer.domElement.style.left = "0px";
  labelRenderer.domElement.style.bottom = "0px";
  labelRenderer.domElement.style.right = "0px";
  // labelRenderer.domElement.style.pointerEvents = "none"; // Ensures clicks go through
  /*  labelContainer.appendChild(labelRenderer.domElement);*/

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  setSize(canvas, camera, renderer, labelRenderer);

  const { planet, markers, updateLabelVisibility } = createPlanet(
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
    scene
  );

  const planetControls = new PlanetControls({
    planet,
    planetRadius,
    camera,
    onRotate: () => updateLabelVisibility(camera),
    onClick: handleClick,
  });

  updateLabelVisibility(camera);

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
    if (rotating) {
      rotatePlanet(planet);
    }

    composer.render();

    labelRenderer.render(scene, camera);
  }

  function rotatePlanet(planet: Mesh) {
    planet.rotation.y += 0.01;
  }

  function setSize(
    canvas: HTMLCanvasElement,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    labelRenderer: CSS2DRenderer
  ) {
    const width = window.visualViewport?.width || 0;
    const height = window.visualViewport?.height || 0;

    canvas.width = width;
    canvas.height = height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
  }

  // RAYCAST

  function handleLabelClick(id: string) {
    console.log(id);
    markers.forEach((marker) => {
      const color: ColorRepresentation =
        marker.userData.id === id ? "#ff0000" : "#ffffff";

      (marker.material as MeshStandardMaterial).color.set(color);

      onLabelClick(id);
    });
  }

  function handleClick(event: MouseEvent | TouchEvent) {
    const element = event.target as HTMLElement;

    if (element.hasAttribute("data-poi-id")) {
      handleLabelClick(element.dataset.poiId ?? "");
      return;
    }

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
    /*     raycaster.setFromCamera(mouse, camera);

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
    } */
  }

  const handleResize = debounce(() =>
    setSize(canvas, camera, renderer, labelRenderer)
  );

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
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", handleResize);
  }

  function removeEventListeners() {
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("resize", handleResize);
  }

  function cleanup() {
    removeEventListeners();
    planetControls.disconnect();
    renderer.dispose();
  }

  function showLabels(ids?: string[]) {
    markers
      .filter((marker) => (ids ? ids.includes(marker.userData.id) : true))
      .forEach((marker) => (marker.visible = true));
  }

  function hideLabels(ids?: string[]) {
    markers
      .filter((marker) => (ids ? ids.includes(marker.userData.id) : true))
      .forEach((marker) => (marker.visible = false));
  }

  return {
    cleanup,
    showLabels,
    hideLabels,
  };
}
