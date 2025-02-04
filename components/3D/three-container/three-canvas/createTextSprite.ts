import { Sprite, SpriteMaterial, CanvasTexture } from "three";

export function createTextSprite(
  text: string,
  fontSize = 50,
  textColor = "white"
) {
  // Create a canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  // Set canvas size
  canvas.width = 256;
  canvas.height = 128;

  // Set text properties
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw text in the center
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Convert canvas to texture
  const texture = new CanvasTexture(canvas);
  const material = new SpriteMaterial({ map: texture, transparent: true });

  // Create the sprite
  const sprite = new Sprite(material);
  sprite.scale.set(3, 1.5, 1); // Adjust scale to make it readable

  return sprite;
}
