import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 클라이언트 생성 전에 환경 변수 확인
console.log('AWS Config:', {
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  hasAccessKey: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
});

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  }
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  // debug 모드 활성화
  debug: true,
  // 세션 설정 추가
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("SignIn callback:", { user, account, profile });
      try {
        // 사용자가 이미 존재하는지 확인
        const getResult = await docClient.send(
          new GetCommand({
            TableName: 'hj-dd-hub-login',
            Key: {
              email: user.email,
            },
          })
        );

        // 사용자가 존재하지 않으면 새로 생성
        if (!getResult.Item) {
          await docClient.send(
            new PutCommand({
              TableName: 'hj-dd-hub-login',
              Item: {
                email: user.email,
                isContributor: false,
                createdAt: new Date().toISOString(),
              },
            })
          );
        }

        console.log('SignIn callback - DynamoDB result:', getResult.Item);
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },
    async session({ session, user, token }) {
      console.log("Session callback:", { session, token });
      if (session.user?.email) {
        try {
          const getResult = await docClient.send(
            new GetCommand({
              TableName: 'hj-dd-hub-login',
              Key: {
                email: session.user.email,
              },
            })
          );

          // 명시적으로 boolean 타입으로 변환
          const isContributor = getResult.Item?.isContributor === true;
          
          // session.user에 isContributor 할당
          session.user.isContributor = isContributor;
          
          console.log('Session callback - Raw DynamoDB result:', getResult.Item);
          console.log('Session callback - Processed isContributor:', isContributor);
        } catch (error) {
          console.error('Session error:', error);
          session.user.isContributor = false;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl });
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, user, account, profile }) {
      console.log("JWT callback:", { token, user, account });
      return token;
    },
  },
});

export { handler as GET, handler as POST }; 