"use client";

import { MarsWeatherApiResponse } from "@/app/api/mars-weather.type";
import dynamic from "next/dynamic";
import { createContext } from "react";

import styles from "./DashboardContainer.module.scss";
import Loader from "@/components/loader/Loader";

export const MarsWeatherDataContext = createContext<
  MarsWeatherApiResponse | undefined
>(undefined);

const TemperatureChartDynamic = dynamic(
  () =>
    import("@/components/dashboard/charts/temperature-chart/temperature-chart"),
  {
    ssr: false,
    loading: () => <Loader />,
  }
);

const WindChartDynamic = dynamic(
  () => import("@/components/dashboard/charts/wind-chart/wind-chart"),
  {
    ssr: false,
    loading: () => <Loader />,
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
          <div className={styles.chartContainer}>
            <h3>Temperature</h3>
            <div className={styles.chartWrapper}>
              <TemperatureChartDynamic />
            </div>
          </div>
          <div className={styles.chartContainer}>
            <h3>Wind</h3>
            <div className={styles.chartWrapper}>
              <WindChartDynamic />
            </div>
          </div>
          <div></div>
        </div>
      </>
    </MarsWeatherDataContext.Provider>
  );
}
