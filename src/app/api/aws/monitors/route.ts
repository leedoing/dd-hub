import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// AWS 클라이언트 설정 (서버 사이드) - Amplify IAM Role 사용
const region = process.env.DD_HUB_AWS_REGION || "ap-northeast-2";

console.log('Monitor API AWS Config (IAM Role):', {
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

// GET: 모니터 목록 조회
export async function GET() {
  try {

    const command = new ScanCommand({
      TableName: 'hj-dd-hub-monitors',
    });

    const response = await dynamoClient.send(command);
    
    if (!response.Items) {
      return NextResponse.json([]);
    }

    // DynamoDB 형식을 일반 객체로 변환
    const monitors = response.Items.map(item => {
      const unmarshalled = unmarshall(item);
      return {
        ...unmarshalled,
        options: JSON.parse(unmarshalled.options || '{}'),
      };
    });

    return NextResponse.json(monitors);
  } catch (error) {
    console.error('Failed to fetch monitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitors' },
      { status: 500 }
    );
  }
}

// POST: 모니터 업로드
export async function POST(request: NextRequest) {
  try {
    const { monitorData, metadata } = await request.json();
    
    if (!monitorData || !metadata) {
      return NextResponse.json(
        { error: 'Monitor data and metadata are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const s3Key = `monitors/${id}.json`;

    // S3에 JSON 파일 업로드
    await s3Client.send(new PutObjectCommand({
      Bucket: 'hj-dd-hub',
      Key: s3Key,
      Body: JSON.stringify(monitorData),
      ContentType: 'application/json',
    }));

    // DynamoDB에 메타데이터 저장
    const item: any = {
      id: { S: id },
      name: { S: metadata.name },
      type: { S: monitorData.type || 'unknown' },
      query: { S: monitorData.query || '' },
      message: { S: monitorData.message || '' },
      options: { S: JSON.stringify(monitorData.options || {}) },
      contributor: { S: metadata.contributor },
      createdAt: { S: timestamp },
      updatedAt: { S: timestamp },
      s3Key: { S: s3Key },
    };

    // language와 target 추가
    if (metadata.language) {
      item.language = { S: metadata.language };
    }
    
    if (metadata.target) {
      item.target = { S: metadata.target };
    }

    // tags 처리
    if (Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      const stringTags = metadata.tags.map((tag: any) => String(tag));
      item.tags = { SS: stringTags };
    } else {
      item.tags = { SS: ['untagged'] };
    }

    // priority 처리
    if (metadata.priority !== null && metadata.priority !== undefined) {
      if (typeof metadata.priority === 'number') {
        item.priority = { N: metadata.priority.toString() };
      } else {
        item.priority = { S: metadata.priority.toString() };
      }
    } else {
      item.priority = { NULL: true };
    }

    await dynamoClient.send(new PutItemCommand({
      TableName: 'hj-dd-hub-monitors',
      Item: item,
    }));

    return NextResponse.json({ id, s3Key });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload monitor' },
      { status: 500 }
    );
  }
}

// DELETE: 모니터 삭제
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
      TableName: 'hj-dd-hub-monitors',
      Key: {
        id: { S: id }
      }
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete monitor' },
      { status: 500 }
    );
  }
}