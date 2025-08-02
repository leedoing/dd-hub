import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.DD_HUB_AWS_REGION,
  credentials: {
    accessKeyId: process.env.DD_HUB_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DD_HUB_AWS_SECRET_ACCESS_KEY || '',
  }
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