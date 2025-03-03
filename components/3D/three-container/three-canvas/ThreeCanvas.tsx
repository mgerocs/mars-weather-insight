import { memo, useContext, useEffect, useRef, useState } from "react";

import styles from "./ThreeCanvas.module.scss";

import pois from "../../data/pointsOfInterests.json";
import { SceneControls } from "./scene/SceneControls";
import { AppContext, AppContextType } from "@/app/context";

const FADE_DURATION = 300;

type Poi = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
};

export default memo(function ThreeCanvas() {
  const sceneControlsRef = useRef<SceneControls>(null!);

  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null!);
  const labelContainerRef = useRef<HTMLDivElement>(null!);

  const { isNavExpanded } = useContext(AppContext) as AppContextType;

  useEffect(() => {
    if (!sceneControlsRef.current) return;

    if (!isNavExpanded) {
      sceneControlsRef.current.enablePlanetControls();
    } else {
      sceneControlsRef.current.disablePlanetControls();
    }
  }, [isNavExpanded]);

  const [poi, setPoi] = useState<Poi | undefined>(undefined);
  const [isInfoEnabled, setInfoEnabled] = useState(false);

  const handleLabelClick = (id: string) => {
    const poi = pois.find((poi) => poi.id === id);

    setPoi(poi);

    if (sceneControlsRef.current) {
      sceneControlsRef.current.disablePlanetControls();
      sceneControlsRef.current.hideLabels();
    }

    setTimeout(() => setInfoEnabled(true), FADE_DURATION);
  };

  const handleCloseInfo = () => {
    if (!isInfoEnabled) return;

    setPoi(undefined);

    if (sceneControlsRef.current) {
      sceneControlsRef.current.enablePlanetControls();
      sceneControlsRef.current.showLabels();
    }

    setInfoEnabled(false);
  };

  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error("No root canvas found.");
    }

    if (!backgroundCanvasRef.current) {
      throw new Error("No background canvas found.");
    }

    if (!labelContainerRef.current) {
      throw new Error("No label container found.");
    }

    const canvasElement = canvasRef.current;
    const backgroundCanvasElement = backgroundCanvasRef.current;
    const labelContainerElement = labelContainerRef.current;

    sceneControlsRef.current = new SceneControls({
      canvas: canvasElement,
      backgroundCanvas: backgroundCanvasElement,
      labelContainer: labelContainerElement,
      planetParams: {
        name: "Mars",
        geometry: { radius: 20 },
        material: {
          surfaceMap: "textures/mars_color1.jpg",
          normalMap: "textures/mars_normal1.png",
          specularMap: "textures/mars_spec1.png",
        },
        color: 0xfe9d7b,
        ambientColor: 0x451804,
        pois,
      },
      onLabelClick: handleLabelClick,
    });

    return () => {
      if (sceneControlsRef.current) {
        sceneControlsRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className={styles.contentContainer}>
      <div className={styles.canvasContainer}>
        <div
          ref={labelContainerRef}
          id="label-container"
          className={styles.layer}
        ></div>
        <canvas
          ref={backgroundCanvasRef}
          id="background-canvas"
          className={styles.layer}
        ></canvas>
        <canvas
          ref={canvasRef}
          id="root-canvas"
          className={styles.layer}
        ></canvas>
      </div>
      <div
        className={`${styles.infoContainer} ${
          !!poi ? styles.info : styles.canvas
        }`}
        style={{ transitionDuration: `${FADE_DURATION}ms` }}
      >
        {poi && (
          <div className={styles.text}>
            <h1>{poi.name}</h1>
            <p>{poi.description}</p>
            <button onClick={handleCloseInfo}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
});
