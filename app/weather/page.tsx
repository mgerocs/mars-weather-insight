import { DashboardContainer } from "@/components/dashboard/dashboard-container/DashboardContainer";
import { MarsWeatherApiResponse } from "../api/mars-weather.type";

export default async function Weather() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api`);

  if (!response.ok) {
    return <div>Something went wrong.</div>;
  }

  const initialdata = (await response.json()) as MarsWeatherApiResponse;

  if (!initialdata) return null;

  return <DashboardContainer data={initialdata} />;
}
