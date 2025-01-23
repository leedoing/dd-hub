import { NextResponse } from 'next/server';
import { syncDashboards } from '@/lib/datadog-service';

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const result = await syncDashboards(formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dashboard sync error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}