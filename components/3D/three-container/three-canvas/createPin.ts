import { CylinderGeometry, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { latLonToCartesian } from "../../utils/latLonToCartesian";

export function createPin(
  lat: number,
  lon: number,
  radius: number,
  planet: Mesh,
  height = 1
): Mesh {
  const position = latLonToCartesian(lat, lon, radius, 180);

  const pinGeometry = new CylinderGeometry(0.1, 0.1, height, 16);
  const pinMaterial = new MeshBasicMaterial({ color: 0xff0000 });
  const pin = new Mesh(pinGeometry, pinMaterial);

  pin.position.copy(position);

  pin.lookAt(new Vector3(0, 0, 0)); // Make it point away from the sphere
  pin.rotateX(Math.PI / 2); // Align along the normal

  planet.add(pin);

  return pin;
}
