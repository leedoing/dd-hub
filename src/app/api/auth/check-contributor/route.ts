import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

const client = new DynamoDBClient({
  region: process.env.DD_HUB_AWS_REGION || "ap-northeast-2",
  credentials: fromNodeProviderChain(), // Amplify IAM Role 자동 인식
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: 'hj-dd-hub-login',
        Key: { email },
      })
    );

    return Response.json({
      isContributor: result.Item?.isContributor === true
    });
  } catch (error) {
    console.error('Failed to check contributor status:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 