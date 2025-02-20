import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { dashboardData, apiKey, appKey, apiUrl } = await request.json();

    console.log('Creating dashboard with URL:', `${apiUrl}/dashboard`);

    const response = await fetch(`${apiUrl}/dashboard`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
      },
      body: JSON.stringify(dashboardData),
    });

    const responseText = await response.text();
    console.log('Datadog API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return NextResponse.json(
        { error: 'Invalid response from Datadog API' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorMessage = data.errors?.[0] || 'Failed to create dashboard';
      console.error('Datadog API error:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create dashboard' },
      { status: 500 }
    );
  }
} 