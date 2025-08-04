import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// AWS 클라이언트 설정 (서버 사이드) - Amplify IAM Role 사용
const region = process.env.DD_HUB_AWS_REGION || "ap-northeast-2";

console.log('Dashboard API AWS Config (IAM Role):', {
  region: region,
  usingIAMRole: true,
  credentialProvider: 'fromNodeProviderChain'
});

const awsConfig = {
  region: region,
  credentials: fromNodeProviderChain(), // Amplify IAM Role 자동 인식
};

const s3Client = new S3Client(awsConfig);
const dynamoClient = new DynamoDBClient(awsConfig);

// GET: 대시보드 목록 조회
export async function GET() {
  try {

    const command = new ScanCommand({
      TableName: 'hj-dd-hub',
    });

    const response = await dynamoClient.send(command);
    
    if (!response.Items) {
      return NextResponse.json([]);
    }

    // DynamoDB 형식을 일반 객체로 변환
    const dashboards = response.Items.map(item => {
      const unmarshalled = unmarshall(item);
      return {
        ...unmarshalled,
        downloads: Number(unmarshalled.downloads), // 숫자로 변환
        sharedUrl: unmarshalled.sharedUrl,
      };
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error('Failed to fetch dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

// POST: 대시보드 업로드
export async function POST(request: NextRequest) {
  try {
    const { dashboardData, metadata } = await request.json();
    
    if (!dashboardData || !metadata) {
      return NextResponse.json(
        { error: 'Dashboard data and metadata are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const s3Key = `dashboards/${id}.json`;

    // S3에 JSON 파일 업로드
    await s3Client.send(new PutObjectCommand({
      Bucket: 'hj-dd-hub',
      Key: s3Key,
      Body: JSON.stringify(dashboardData),
      ContentType: 'application/json',
    }));

    // DynamoDB에 메타데이터 저장
    await dynamoClient.send(new PutItemCommand({
      TableName: 'hj-dd-hub',
      Item: {
        id: { S: id },
        title: { S: metadata.title },
        description: { S: metadata.description },
        target: { S: metadata.target },
        language: { S: metadata.language },
        contributor: { S: metadata.contributor },
        createdAt: { S: timestamp },
        updatedAt: { S: timestamp },
        s3Key: { S: s3Key },
        downloads: { N: '0' },
        sharedUrl: metadata.sharedUrl ? { S: metadata.sharedUrl } : { NULL: true },
      },
    }));

    return NextResponse.json({ id, s3Key });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload dashboard' },
      { status: 500 }
    );
  }
}

// DELETE: 대시보드 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const s3Key = searchParams.get('s3Key');
    
    if (!id || !s3Key) {
      return NextResponse.json(
        { error: 'ID and s3Key are required' },
        { status: 400 }
      );
    }

    // S3에서 파일 삭제
    await s3Client.send(new DeleteObjectCommand({
      Bucket: 'hj-dd-hub',
      Key: s3Key,
    }));

    // DynamoDB에서 항목 삭제
    await dynamoClient.send(new DeleteItemCommand({
      TableName: 'hj-dd-hub',
      Key: {
        id: { S: id }
      }
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}