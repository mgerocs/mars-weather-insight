import { memo, useEffect, useRef } from "react";
import { initScene } from "./scene";
//import { initScene } from "./testScene";

export default memo(function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const labelContainerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error("No root canvas found.");
    }

    if (!labelContainerRef.current) {
      throw new Error("No label container found.");
    }

    const canvasElement = canvasRef.current;
    const labelContainerElement = labelContainerRef.current;

    const cleanup = initScene(canvasElement, labelContainerElement);

    return () => {
      cleanup();
    };
  }, []);

  return (
    <>
      <div ref={labelContainerRef} id="label-container"></div>
      <canvas ref={canvasRef} id="root-canvas"></canvas>
    </>
  );
});
