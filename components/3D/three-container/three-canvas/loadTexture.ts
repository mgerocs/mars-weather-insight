import { Texture, TextureLoader } from "three";

export function loadTexture(
  textureLoader: TextureLoader,
  path: string
): Texture | null {
  return textureLoader.load(
    path,
    () => {},
    () => {},
    () => {
      throw new Error("Failed to load error.");
    }
  );
}
