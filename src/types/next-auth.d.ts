import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      email?: string | null
      name?: string | null
      image?: string | null
      isContributor?: boolean
    }
  }
  
  interface User {
    email?: string | null
    name?: string | null
    image?: string | null
    isContributor?: boolean
  }
} 