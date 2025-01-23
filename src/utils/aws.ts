import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadDashboard(dashboardData: any, metadata: any) {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  const s3Key = `dashboards/${id}.json`;

  // S3에 JSON 파일 업로드
  try {
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
      },
    }));

    return { id, s3Key };
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload dashboard');
  }
}

interface DashboardData {
  id: string;
  title: string;
  description: string;
  target: string;
  language: string;
  contributor: string;
  s3Key: string;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export async function getDashboards(): Promise<DashboardData[]> {
  try {
    if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not found');
    }

    const command = new ScanCommand({
      TableName: 'hj-dd-hub',
    });

    const response = await dynamoClient.send(command);
    
    if (!response.Items) {
      return [];
    }

    // DynamoDB 형식을 일반 객체로 변환하고 타입 캐스팅
    return response.Items.map(item => {
      const unmarshalled = unmarshall(item);
      return {
        ...unmarshalled,
        downloads: Number(unmarshalled.downloads), // 숫자로 변환
      } as DashboardData;
    });
  } catch (error) {
    console.error('Failed to fetch dashboards:', error);
    throw new Error('Failed to fetch dashboards');
  }
}

export async function downloadDashboard(s3Key: string, title: string) {
  try {
    const response = await fetch(`https://hj-dd-hub.s3.ap-northeast-2.amazonaws.com/${s3Key}`);
    if (!response.ok) throw new Error('Failed to download dashboard');
    
    const data = await response.json();
    
    // JSON 파일로 다운로드 (파일명을 title로 설정)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 파일명을 title로 설정하고 특수문자 제거
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download dashboard');
  }
}

export async function deleteDashboard(id: string, s3Key: string) {
  try {
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

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error('Failed to delete dashboard');
  }
}

// S3에서 대시보드 데이터 가져오기
export async function getDashboardData(s3Key: string) {
  try {
    const response = await fetch(`https://hj-dd-hub.s3.ap-northeast-2.amazonaws.com/${s3Key}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return await response.json();
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    throw new Error('Failed to get dashboard data from S3');
  }
}

interface DashboardResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export const createDatadogDashboard = async (
  dashboardData: Record<string, unknown>,
  apiKey: string,
  appKey: string,
  apiUrl: string
): Promise<DashboardResponse> => {
  try {
    console.log('Sending request to create dashboard');

    const response = await fetch('/api/datadog/create-dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dashboardData,
        apiKey,
        appKey,
        apiUrl,
      }),
    });

    const responseText = await response.text();
    console.log('API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create dashboard');
    }

    return data;
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    throw error;
  }
};