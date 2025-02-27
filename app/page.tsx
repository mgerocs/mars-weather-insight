import ThreeContainer from "@/components/3D/three-container/ThreeContainer";
import { MarsWeatherApiResponse } from "./api/mars-weather.type";
import { DashboardContainer } from "@/components/dashboard/dashboard-container/DashboardContainer";

export default async function Home() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api`);

  if (!response.ok) {
    return <div>Something went wrong.</div>;
  }

  const initialdata = (await response.json()) as MarsWeatherApiResponse;

  return (
    <>
      {/*  <h1>Mars Weather - Temperature Trends</h1>
        {initialdata && <DashboardContainer data={initialdata} />} */}
      <ThreeContainer />
    </>
  );
}
