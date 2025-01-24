"use client"

import { SolData } from "@/app/api/mars-weather.type";
import { memo, useContext, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MarsWeatherDataContext } from "../../dashboard-container/dashboard-container";

export default memo(function TemperatureChart() {

    const data = useContext(MarsWeatherDataContext)

    const tempData = useMemo(() => data ? Object.keys(data)
        .filter((key) => key !== 'sol_keys' && key !== 'validity_checks') // Exclude metadata
        .map((sol) => {
            const solData = data[sol] as SolData;

            return {
                sol: sol,
                avgTemp: solData.AT?.av || null,
                minTemp: solData.AT?.mn || null,
                maxTemp: solData.AT?.mx
            }
        }) : null, [data]);

    if (!tempData) return null;

    return (
        <ResponsiveContainer width={"100%"} height={"100%"}>
            <LineChart
                data={tempData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }
                }
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sol" label={{ value: 'Sol', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgTemp" name="Avg Temp" stroke="#8884d8" />
                <Line type="monotone" dataKey="minTemp" name="Min Temp" stroke="#82ca9d" />
                <Line type="monotone" dataKey="maxTemp" name="Max Temp" stroke="#ff7300" />
            </LineChart>
        </ResponsiveContainer>
    );
});