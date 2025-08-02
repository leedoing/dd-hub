import { NextRequest, NextResponse } from 'next/server';

interface DashboardResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// POST: Datadog 대시보드 생성
export async function POST(request: NextRequest) {
  try {
    const { dashboardData, apiKey, appKey, apiUrl } = await request.json();
    
    if (!dashboardData || !apiKey || !appKey || !apiUrl) {
      return NextResponse.json({
        success: false,
        error: 'Dashboard data, API key, App key, and API URL are required'
      }, { status: 400 });
    }

    console.log('Creating dashboard with Datadog API...');

    // Datadog API 호출
    const response = await fetch(`${apiUrl}/api/v1/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
      },
      body: JSON.stringify(dashboardData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Datadog API error:', responseData);
      return NextResponse.json({
        success: false,
        error: responseData.errors?.join(', ') || 'Failed to create dashboard'
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}