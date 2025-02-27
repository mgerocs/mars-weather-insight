"use client";

import dynamic from "next/dynamic";
import styles from "./ThreeContainer.module.scss";
import { memo, Suspense } from "react";

const ThreeCanvasDynamic = dynamic(
  () => import("@/components/3D/three-container/three-canvas/ThreeCanvas"),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

export default memo(function ThreeContainer() {
  return (
    <div className={styles.contentWrapper}>
      <Suspense fallback={<p>Loading...</p>}>
        <ThreeCanvasDynamic />
      </Suspense>
    </div>
  );
});
