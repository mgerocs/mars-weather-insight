"use client";

import dynamic from "next/dynamic";
import styles from "./ThreeContainer.module.scss";
import { memo, Suspense } from "react";
import Loader from "@/components/loader/Loader";

const ThreeCanvasDynamic = dynamic(
  () => import("@/components/3D/three-container/three-canvas/ThreeCanvas"),
  {
    ssr: false,
    loading: () => <Loader />,
  }
);

export default memo(function ThreeContainer() {
  return (
    <div className={styles.contentWrapper}>
      <Suspense fallback={<Loader />}>
        <ThreeCanvasDynamic />
      </Suspense>
    </div>
  );
});
