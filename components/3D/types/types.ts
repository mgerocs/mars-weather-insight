import { ColorRepresentation } from "three";

export type POI = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
};

export type GeometryParams = {
  radius: number;
};

export type MaterialParams = {
  surfaceMap: string;
  normalMap?: string;
  specularMap?: string;
  shininess?: number;
  bumpScale?: number;
};

export type PlanetParams = {
  name: string;
  geometry: GeometryParams;
  material: MaterialParams;
  color: ColorRepresentation;
  ambientColor: ColorRepresentation;
  pois: POI[];
};
