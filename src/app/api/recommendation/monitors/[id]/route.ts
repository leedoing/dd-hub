import { NextRequest, NextResponse } from 'next/server';
import { getMonitorData, deleteMonitor } from '@/utils/aws';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // S3에서 모니터 데이터 가져오기
    const monitorData = await getMonitorData(`monitors/${params.id}.json`);
    return NextResponse.json(monitorData);
  } catch (error) {
    console.error('Error fetching monitor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitor data' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // S3와 DynamoDB에서 모니터 삭제
    await deleteMonitor(params.id, `monitors/${params.id}.json`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete monitor' },
      { status: 500 }
    );
  }
} 