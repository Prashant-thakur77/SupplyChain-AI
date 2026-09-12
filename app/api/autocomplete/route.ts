// app/api/autocomplete/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const input = searchParams.get('input');

        // Validate input
        if (!input || input.trim().length < 2) {
            return NextResponse.json(
                { error: 'Input is too short. Minimum 2 characters required.' },
                { status: 400 }
            );
        }

        // Call OpenStreetMap Nominatim Autocomplete API
        const osmResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5`,
            {
                method: 'GET',
                // Nominatim requires a valid user agent
                headers: {
                    'User-Agent': 'SupplyChainAI/1.0',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }
        );

        // Handle non-OK responses
        if (!osmResponse.ok) {
            const errorData = await osmResponse.json().catch(() => ({}));
            return NextResponse.json(
                { error: 'Failed to fetch data from OpenStreetMap.', details: errorData },
                { status: osmResponse.status }
            );
        }

        // Parse the JSON response
        const data = await osmResponse.json();

        // Map OSM results to match the expected format { predictions: [ { description, geometry: { location: { lat, lng } } } ] }
        const predictions = data.map((item: any) => ({
            description: item.display_name,
            geometry: {
                location: {
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                }
            }
        }));

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error('Error in autocomplete API route:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
