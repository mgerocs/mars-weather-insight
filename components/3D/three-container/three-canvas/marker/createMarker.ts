import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { latLonToCartesian } from "../../../utils/latLonToCartesian";
import { createHtmlLabel } from "./createHtmlLabel";

export function createMarker(
  id: string,
  name: string,
  lat: number,
  lon: number,
  radius: number,
  planet: Mesh,
  height = 1
): Group {
  const position = latLonToCartesian(lat, lon, radius, 180);

  const pinGeometry = new CylinderGeometry(0.1, 0.1, height, 16);
  const pinMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const pin = new Mesh(pinGeometry, pinMaterial);
  pin.name = "pin";

  pin.position.copy(position);
  pin.lookAt(new Vector3(0, 0, 0)); // Make it point away from the sphere
  pin.rotateX(Math.PI / 2); // Align along the normal

  const label = createHtmlLabel(name);

  if (label) {
    label.position.set(0, -0.5 * height, 0);
  }

  pin.add(label);

  const hitboxGeometry = new SphereGeometry(height * 0.5);
  const hitboxMaterial = new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
  });
  const hitbox = new Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.name = "hitbox";
  // SET THE POI ID ON THE HITBOX
  hitbox.userData.id = id;

  hitbox.position.copy(pin.position);

  const marker = new Group();
  marker.add(pin);
  marker.add(hitbox);

  planet.add(marker);

  return marker;
}
