import { NextResponse } from 'next/server';


const API_URL = `https://api.nasa.gov/insight_weather/?api_key=${process.env.NASA_INSIGHT_WEATHER_API_KEY}&feedtype=json&ver=1.0`

export async function GET() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data);
}