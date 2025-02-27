import { MathUtils, Mesh, PerspectiveCamera, Vector3 } from "three";
import { debounce } from "../../../utils/debounce";

type ZoomSettings = {
  initial: number;
  min: number;
  max: number;
};

type PlanetControlsParams = {
  planet: Mesh;
  planetRadius: number;
  camera: PerspectiveCamera;
  onRotate?: () => void;
  onClick?: (event: MouseEvent | TouchEvent) => void;
};

export class PlanetControls {
  private isEnabled = true;

  private planet: Mesh;
  private planetRadius: number;
  private camera: PerspectiveCamera;
  private onRotate: (() => void) | undefined;
  private onClick: ((event: MouseEvent | TouchEvent) => void) | undefined;

  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private animationFrameId: number | null = null;

  private zoomSettings: ZoomSettings;

  private cameraDistance = 0;
  private initialPinchDistance: number | null = null;

  private direction = new Vector3();

  constructor({
    planet,
    planetRadius,
    camera,
    onRotate,
    onClick,
  }: PlanetControlsParams) {
    this.planet = planet;
    this.planetRadius = planetRadius;
    this.camera = camera;
    this.onRotate = onRotate;
    this.onClick = onClick;

    this.zoomSettings = this.updateZoomSettings(this.planetRadius);

    this.updateCameraDistance(this.zoomSettings.initial);
    this.updateCameraPosition();

    this.addEventListeners();
  }

  private handlePointerDown = (event: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;

    this.isDragging = true;
    cancelAnimationFrame(this.animationFrameId!);

    if (event instanceof TouchEvent && event.touches.length > 0) {
      this.prevMouseX = event.touches[0].clientX;
      this.prevMouseY = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      this.prevMouseX = event.clientX;
      this.prevMouseY = event.clientY;
    }
  };

  private handlePointerMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;

    if (!this.isDragging) return;

    event.preventDefault();

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

    const deltaX = currentX - this.prevMouseX;
    const deltaY = currentY - this.prevMouseY;

    this.planet.rotation.y += deltaX * 0.005;
    this.planet.rotation.x += deltaY * 0.005;

    this.velocityX = deltaX * 0.005;
    this.velocityY = deltaY * 0.005;

    this.prevMouseX = currentX;
    this.prevMouseY = currentY;

    if (this.onRotate) this.onRotate();
  };

  private handlePointerUp = (event: MouseEvent | TouchEvent) => {
    if (!this.isEnabled) return;

    this.isDragging = false;
    if (this.onClick) this.onClick(event);
    this.applyInertia();
  };

  private handleScrollZoom = (event: WheelEvent) => {
    if (!this.isEnabled) return;

    event.preventDefault(); // Prevent page scroll

    const zoomFactor = event.deltaY * 0.01; // Adjust sensitivity

    this.updateCameraDistance(this.cameraDistance + zoomFactor);
    this.updateCameraPosition();
  };

  private handleTouchZoom = (event: TouchEvent) => {
    if (!this.isEnabled) return;

    if (event.touches.length !== 2) return;

    event.preventDefault();

    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.initialPinchDistance !== null) {
      this.updateCameraDistance(
        this.cameraDistance + (this.initialPinchDistance - distance) * 0.002
      );
      this.updateCameraPosition();
    }

    this.initialPinchDistance = distance;
  };

  private handleResize = () => {
    this.zoomSettings = this.updateZoomSettings(this.planetRadius);

    this.updateCameraDistance(this.zoomSettings.initial);
    this.updateCameraPosition();
  };

  private resetPinchDistance = () => {
    this.initialPinchDistance = null;
  };

  private updateCameraDistance = (distance: number) => {
    this.cameraDistance = MathUtils.clamp(
      distance,
      this.zoomSettings.min,
      this.zoomSettings.max
    );
  };

  private updateCameraPosition = () => {
    this.camera.getWorldDirection(this.direction);
    this.camera.position.copy(
      this.direction.multiplyScalar(-this.cameraDistance)
    );
    this.camera.lookAt(this.planet.position);
  };

  private applyInertia = () => {
    if (Math.abs(this.velocityX) < 0.0001 && Math.abs(this.velocityY) < 0.0001)
      return;

    this.planet.rotation.y += this.velocityX;
    this.planet.rotation.x += this.velocityY;

    // Gradually reduce velocity
    this.velocityX *= 0.95;
    this.velocityY *= 0.95;

    if (this.onRotate) this.onRotate();

    this.animationFrameId = requestAnimationFrame(this.applyInertia);
  };

  private updateZoomSettings(planetRadius: number): ZoomSettings {
    const width = window.visualViewport?.width || 0;

    if (width <= 375) {
      return {
        initial: planetRadius * 3,
        min: planetRadius * 3,
        max: planetRadius * 5,
      };
    }

    return {
      initial: planetRadius * 2.2,
      min: planetRadius * 2,
      max: planetRadius * 5,
    };
  }

  private addEventListeners = () => {
    window.addEventListener("mousedown", this.handlePointerDown);
    window.addEventListener("mousemove", this.handlePointerMove);
    window.addEventListener("mouseup", this.handlePointerUp);

    window.addEventListener("touchstart", this.handlePointerDown);
    window.addEventListener("touchmove", this.handlePointerMove, {
      passive: false,
    });
    window.addEventListener("touchend", this.handlePointerUp);

    window.addEventListener("wheel", this.handleScrollZoom, { passive: false });
    window.addEventListener("touchmove", this.handleTouchZoom, {
      passive: false,
    });
    window.addEventListener("touchend", this.resetPinchDistance);

    window.addEventListener("resize", debounce(this.handleResize));
  };

  private removeEventListeners = () => {
    window.removeEventListener("mousedown", this.handlePointerDown);
    window.removeEventListener("mousemove", this.handlePointerMove);
    window.removeEventListener("mouseup", this.handlePointerUp);

    window.removeEventListener("touchstart", this.handlePointerDown);
    window.removeEventListener("touchmove", this.handlePointerMove);
    window.removeEventListener("touchend", this.handlePointerUp);

    window.removeEventListener("wheel", this.handleScrollZoom);
    window.removeEventListener("touchmove", this.handleTouchZoom);
    window.removeEventListener("touchend", this.resetPinchDistance);

    window.removeEventListener("resize", this.handleResize);
  };

  public enable = () => {
    this.isEnabled = true;
  };

  public disable = () => {
    this.isEnabled = false;
  };

  public disconnect = () => {
    this.removeEventListeners();
  };
}
