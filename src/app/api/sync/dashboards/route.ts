import { NextResponse } from 'next/server';
import { syncDashboards } from '@/lib/datadog-service';
import initializeTracer from '@/lib/datadog-tracer';

// API 라우트의 시작점에서 tracer 초기화
initializeTracer();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 단일 대시보드 생성 요청인 경우
    if (body.dashboardData && body.apiKey && body.appKey && body.apiUrl) {
      const response = await fetch(`${body.apiUrl}/dashboard`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'DD-API-KEY': body.apiKey,
          'DD-APPLICATION-KEY': body.appKey,
        },
        body: JSON.stringify(body.dashboardData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors?.[0] || 'Failed to create dashboard');
      }
      
      return NextResponse.json(data);
    }
    
    // 대시보드 동기화 요청인 경우
    const result = await syncDashboards(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dashboard operation error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}