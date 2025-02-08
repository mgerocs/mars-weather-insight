import { CylinderGeometry, Mesh, MeshBasicMaterial, Vector3 } from "three";
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
): Mesh {
  const position = latLonToCartesian(lat, lon, radius, 180);

  const pinGeometry = new CylinderGeometry(0.05, 0.05, height, 16);
  const pinMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const pin = new Mesh(pinGeometry, pinMaterial);
  pin.name = "pin";
  pin.userData.id = id;

  pin.position.copy(position);
  pin.lookAt(new Vector3(0, 0, 0)); // Make it point away from the sphere
  pin.rotateX(Math.PI / 2); // Align along the normal

  const label = createHtmlLabel(id, name);

  if (label) {
    label.position.set(0, -0.5 * height, 0);
  }

  pin.add(label);

  planet.add(pin);

  return pin;
}
