import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user }) {
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

        return true;
      } catch (error) {
        console.error('DynamoDB Error:', error);
        return true; // 에러가 발생해도 로그인은 허용
      }
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          // 사용자의 Contributor 상태 조회
          const getResult = await docClient.send(
            new GetCommand({
              TableName: 'hj-dd-hub-login',
              Key: {
                email: session.user.email,
              },
            })
          );

          // session에 isContributor 정보 추가
          session.user.isContributor = getResult.Item?.isContributor || false;
        } catch (error) {
          console.error('DynamoDB Error:', error);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
});

export { handler as GET, handler as POST }; 