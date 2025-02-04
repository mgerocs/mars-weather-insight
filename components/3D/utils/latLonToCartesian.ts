import { Vector3 } from "three";

export function latLonToCartesian(
  lat: number,
  lon: number,
  radius: number,
  adjustment = 0
): Vector3 {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lon - 180 + adjustment) * Math.PI) / 180;

  const x = -1 * radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);

  return new Vector3(x, y, z);

  /* const phi = (lat * Math.PI) / 180; // Latitude in radians
  const theta = ((lon + 90) * Math.PI) / 180; // Longitude in radians

  const x = radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta); */

  /* const longitude = (Math.PI / 180) * (0 - lon);
  const latitude = (Math.PI / 180) * (90 - lat);

  const x = radius * Math.sin(latitude) * Math.cos(longitude);
  const y = radius * Math.cos(latitude);
  const z = radius * Math.sin(latitude) * Math.sin(longitude); */

  return new Vector3(x, y, z);
}
