import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    key: string;
  };
}

// GET: S3에서 데이터 가져오기
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const s3Key = decodeURIComponent(params.key);
    
    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }

    // S3에서 직접 데이터 가져오기 (공개 접근)
    const response = await fetch(`https://hj-dd-hub.s3.ap-northeast-2.amazonaws.com/${s3Key}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from S3' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get S3 data:', error);
    return NextResponse.json(
      { error: 'Failed to get data from S3' },
      { status: 500 }
    );
  }
}