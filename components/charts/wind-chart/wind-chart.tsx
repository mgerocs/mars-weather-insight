"use client"

import { CompassPoint, SolData } from "@/app/api/mars-weather.type";
import { memo, useContext, useMemo } from "react";
import { PolarGrid, Radar, ResponsiveContainer, RadarChart, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { MarsWeatherDataContext } from "../../dashboard-container/dashboard-container";

export default memo(function WindChart() {

    const data = useContext(MarsWeatherDataContext)

    const tempData = useMemo(() => {
        if (!data) return null;

        const directionCounts: Record<CompassPoint, number> = {
            N: 0, NNE: 0, NE: 0, ENE: 0,
            E: 0, ESE: 0, SE: 0, SSE: 0,
            S: 0, SSW: 0, SW: 0, WSW: 0,
            W: 0, WNW: 0, NW: 0, NNW: 0,
        };

        data.sol_keys.forEach((sol) => {
            const windData = (data[sol] as SolData)?.WD;
            if (windData) {
                Object.entries(windData).forEach(([key, value]) => {
                    if (key !== "most_common") {
                        directionCounts[value.compass_point] += value.ct;
                    }
                })
            }
        });

        return Object.entries(directionCounts).map(([direction, count]) => ({
            direction,
            count,
        }));

    }, [data]);

    if (!tempData) return null;

    console.log(tempData)

    return (
        <ResponsiveContainer width={"100%"} height={"100%"}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={tempData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="direction" />
                <PolarRadiusAxis />
                <Radar dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </RadarChart>
        </ResponsiveContainer>
    );
});