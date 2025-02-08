import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import "./label.css";

export function createHtmlLabel(id: string, name: string): CSS2DObject {
  const div = document.createElement("div");
  div.id = `poi-label-${id}`;
  div.className = "poi-label";
  div.textContent = name;
  div.setAttribute("data-poi-id", id);
  const label = new CSS2DObject(div);
  label.center.set(0, 1);

  return label;
}
