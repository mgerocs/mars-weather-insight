"use client";

import { MarsWeatherApiResponse } from "@/app/api/mars-weather.type";
import dynamic from "next/dynamic";
import { createContext } from "react";

import styles from "./DashboardContainer.module.scss";

export const MarsWeatherDataContext = createContext<
  MarsWeatherApiResponse | undefined
>(undefined);

const TemperatureChartDynamic = dynamic(
  () =>
    import("@/components/dashboard/charts/temperature-chart/temperature-chart"),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

const WindChartDynamic = dynamic(
  () => import("@/components/dashboard/charts/wind-chart/wind-chart"),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

type DashboardContainerProps = {
  data: MarsWeatherApiResponse;
};

export function DashboardContainer({ data }: DashboardContainerProps) {
  return (
    <MarsWeatherDataContext.Provider value={data}>
      <>
        <div className={styles.dashboardContainer}>
          <div>
            <TemperatureChartDynamic />
          </div>
          <div>
            <WindChartDynamic />
          </div>
          <div></div>
        </div>
      </>
    </MarsWeatherDataContext.Provider>
  );
}
