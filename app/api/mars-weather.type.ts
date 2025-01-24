export type CompassPoint =
    | "N"
    | "NNE"
    | "NE"
    | "ENE"
    | "E"
    | "ESE"
    | "SE"
    | "SSE"
    | "S"
    | "SSW"
    | "SW"
    | "WSW"
    | "W"
    | "WNW"
    | "NW"
    | "NNW";

interface CompassData {
    compass_degrees: number; // Wind direction in degrees (0–360)
    compass_point: CompassPoint; // Cardinal direction as a string
    ct: number; // Count of measurements
}

interface WindData {
    [key: string]: CompassData;
}

interface TemperatureData {
    av: number; // Average temperature (°C)
    ct: number;
    mn: number; // Minimum temperature (°C)
    mx: number; // Maximum temperature (°C)
}

interface HorizontalWindSpeedData {
    av: number; // Average temperature (°C)
    ct: number;
    mn: number; // Minimum temperature (°C)
    mx: number; // Maximum temperature (°C)
}

export interface SolData {
    AT?: TemperatureData; // Air temperature data
    WD?: WindData; // Wind direction data
    HWS?: HorizontalWindSpeedData; // Horizonatal wind speed data
    First_UTC: string; // First observation timestamp
    Last_UTC: string; // Last observation timestamp
    Month_ordinal: number;
    Season: string;
    Northern_season: string,
    Southern_season: string;
}

export interface MarsWeatherApiResponse {
    sol_keys: string[]; // List of Sol IDs (e.g., ["1000", "1001"])
    validity_checks: Record<string, unknown>; // Metadata for validity checks
    [sol: string]: SolData | string[] | Record<string, unknown>; // Sol data or metadata
}
