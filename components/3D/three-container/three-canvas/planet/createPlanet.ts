import {
  Group,
  Mesh,
  MeshPhongMaterial,
  Scene,
  SphereGeometry,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { PlanetParams } from "../../../types/types";
import { createMarker } from "../marker/createMarker";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { Camera } from "@react-three/fiber";

const PIN_HEIGHT = 1;

export function createPlanet(
  planet: PlanetParams,
  scene: Scene,
  camera: Camera
): {
  planet: Mesh;
  markers: Group[];
  onRotatePlanet: () => void;
} {
  const pinWorldPos = new Vector3();
  const planetWorldPos = new Vector3();

  const textureLoader = new TextureLoader();

  let surfaceMap: Texture | null = null;
  let normalMap: Texture | null = null;
  let specularMap: Texture | null = null;

  surfaceMap = textureLoader.load(planet.material.surfaceMap);

  if (planet.material.normalMap) {
    normalMap = textureLoader.load(planet.material.normalMap);
  }

  if (planet.material.specularMap) {
    specularMap = textureLoader.load(planet.material.specularMap);
  }

  const material = new MeshPhongMaterial({
    map: surfaceMap,
    normalMap,
    specularMap,
    shininess: planet.material.shininess || 30,
    bumpScale: planet.material.bumpScale || 0.05,
  });

  const geometry = new SphereGeometry(planet.geometry.radius, 64, 64);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData.name = planet.name;

  planet.pois.forEach((poi) =>
    createMarker(
      poi.id,
      poi.name,
      poi.lat,
      poi.lon,
      planet.geometry.radius,
      mesh,
      PIN_HEIGHT
    )
  );

  const markers = mesh.children.filter((child) => child instanceof Group);

  const updateLabelVisibility = () => {
    mesh.getWorldPosition(planetWorldPos);

    markers.forEach((marker) => {
      const pin = marker.children.find((child) => child.name === "pin");

      if (!pin) return;

      pin.getWorldPosition(pinWorldPos);

      const screenPos1 = pinWorldPos.clone().project(camera);
      const screenPos2 = planetWorldPos.clone().project(camera);

      const isBehind = screenPos1.z > screenPos2.z;

      pin.children.forEach((child) => {
        if (child instanceof CSS2DObject) {
          child.visible = !isBehind;
        }
      });
    });
  };

  scene.add(mesh);

  updateLabelVisibility();

  return {
    planet: mesh,
    markers,
    onRotatePlanet: updateLabelVisibility,
  };
}
