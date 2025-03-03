import {
  AmbientLight,
  ColorRepresentation,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PlanetControls } from "../planet/PlanetControls";
import { createPlanet } from "../planet/createPlanet";
import { PlanetParams } from "@/components/3D/types/types";
import { debounce } from "@/components/3D/utils/debounce";

type SceneControlsParams = {
  canvas: HTMLCanvasElement;
  backgroundCanvas: HTMLCanvasElement;
  labelContainer: HTMLDivElement;
  planetParams: PlanetParams;
  onLabelClick: (id: string) => void;
};

export class SceneControls {
  private mouse = new Vector2();

  private canvas: HTMLCanvasElement;
  private backgroundCanvas: HTMLCanvasElement;

  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private labelRenderer: CSS2DRenderer;

  private onLabelClick: (id: string) => void;

  private planet: Mesh;
  private markers: Mesh[];
  private planetControls: PlanetControls;

  constructor({
    canvas,
    backgroundCanvas,
    labelContainer,
    planetParams,
    onLabelClick,
  }: SceneControlsParams) {
    this.canvas = canvas;
    this.backgroundCanvas = backgroundCanvas;
    this.onLabelClick = onLabelClick;

    // SCENE
    this.scene = new Scene();

    // CAMERA
    this.camera = new PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );

    // RENDERER
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;

    // LABEL RENDERER
    this.labelRenderer = new CSS2DRenderer({ element: labelContainer });
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0px";
    this.labelRenderer.domElement.style.left = "0px";
    this.labelRenderer.domElement.style.bottom = "0px";
    this.labelRenderer.domElement.style.right = "0px";

    // SET SIZE
    this.setSize(this.canvas, this.camera, this.renderer, this.labelRenderer);

    // DRAW BACKGROUND
    this.drawBackground();

    // PLANET
    const { planet, markers, updateLabelVisibility } = createPlanet(
      planetParams,
      this.scene
    );

    this.planet = planet;
    this.markers = markers;

    this.planetControls = new PlanetControls({
      planet: this.planet,
      planetRadius: planetParams.geometry.radius,
      camera: this.camera,
      onRotate: () => updateLabelVisibility(this.camera),
      onClick: this.handleClick,
    });

    updateLabelVisibility(this.camera);

    // LIGHTS
    this.addLights(
      planetParams.geometry.radius,
      planetParams.color,
      planetParams.ambientColor
    );

    // EVENT LISTENERS
    this.addEventListeners();

    // LOOP
    this.renderer.setAnimationLoop(this.animate);
  }

  private setSize = (
    canvas: HTMLCanvasElement,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    labelRenderer: CSS2DRenderer
  ) => {
    const width = window.visualViewport?.width || 0;
    const height = window.visualViewport?.height || 0;

    canvas.width = width;
    canvas.height = height;

    this.backgroundCanvas.width = width;
    this.backgroundCanvas.height = height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
  };

  private addLights = (
    planetRadius: number,
    color: ColorRepresentation,
    ambientColor: ColorRepresentation
  ) => {
    const ambientLight = new AmbientLight(ambientColor, 1);

    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(color, 2);
    directionalLight.position.set(
      planetRadius * 2,
      planetRadius,
      planetRadius * 2
    );
    directionalLight.castShadow = true;

    this.scene.add(directionalLight);

    const pointLight = new PointLight(0xffffff, 50, 100);
    pointLight.position.set(
      planetRadius * 0.4,
      planetRadius * 0.4,
      planetRadius * 1.2
    );
    this.scene.add(pointLight);
  };

  private drawBackground = () => {
    const ctx = this.backgroundCanvas.getContext("2d");

    if (!ctx) return;

    const NUM_STARS = 100;

    ctx.fillStyle = "black";
    ctx.fillRect(
      0,
      0,
      this.backgroundCanvas.width,
      this.backgroundCanvas.height
    );

    for (let i = 0; i < NUM_STARS; i++) {
      const x = Math.random() * this.backgroundCanvas.width;
      const y = Math.random() * this.backgroundCanvas.height;
      const size = Math.random() * 2;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  private handleResize = debounce(() => {
    this.setSize(this.canvas, this.camera, this.renderer, this.labelRenderer);
    this.drawBackground();
  });

  private handleClick = (event: MouseEvent | TouchEvent) => {
    const element = event.target as HTMLElement;

    if (element.hasAttribute("data-poi-id")) {
      this.handleLabelClick(element.dataset.poiId ?? "");
      return;
    }

    const canvasBounds = this.renderer.domElement.getBoundingClientRect();

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

    this.mouse.x = ((x - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    this.mouse.y = -((y - canvasBounds.top) / canvasBounds.height) * 2 + 1;
  };

  private handleLabelClick = (id: string) => {
    this.onLabelClick(id);
  };

  private animate = () => {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  private addEventListeners = () => {
    window.addEventListener("resize", this.handleResize);
  };

  private removeEventListeners = () => {
    window.removeEventListener("resize", this.handleResize);
  };

  public showLabels = (ids?: string[]) => {
    this.markers
      .filter((marker) => (ids ? ids.includes(marker.userData.id) : true))
      .forEach((marker) => (marker.visible = true));
  };

  public hideLabels = (ids?: string[]) => {
    this.markers
      .filter((marker) => (ids ? ids.includes(marker.userData.id) : true))
      .forEach((marker) => (marker.visible = false));
  };

  public enablePlanetControls = () => {
    this.planetControls.enable();
  };

  public disablePlanetControls = () => {
    this.planetControls.disable();
  };

  public destroy = () => {
    this.removeEventListeners();
    this.planetControls.disconnect();
    this.renderer.dispose();
  };
}
