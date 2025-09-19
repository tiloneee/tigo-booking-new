import NextAuth from "next-auth"
import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          // Call your tigo-server login endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            // Extract error message from backend
            const errorData = await response.json()
            
            // Handle specific HTTP status codes and backend error messages
            if (response.status === 401) {
              throw new Error(errorData.message || "Invalid credentials")
            }
            
            throw new Error(errorData.message || "Authentication failed")
          }

          const data = await response.json()

          if (data.access_token && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: `${data.user.first_name} ${data.user.last_name}`,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              roles: data.user.roles || [],
            }
          }

          throw new Error("Invalid response from server")
        } catch (error) {
          console.error('Login error:', error)
          // Re-throw the error so NextAuth can handle it properly
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken
        session.refreshToken = token.refreshToken
        session.roles = token.roles
        session.user.id = token.sub as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 