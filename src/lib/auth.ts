import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

// Simple hash function for passwords using Node's crypto module
function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'roastmysite-salt-2024').digest('hex')
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password sign-in
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('No account found with this email')
        }

        const isValid = verifyPassword(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          role: user.role,
        }
      }
    }),
    // Firebase Google provider - receives verified Google user data from Firebase Auth popup
    CredentialsProvider({
      id: 'firebase-google',
      name: 'firebase-google',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' },
        image: { label: 'Image', type: 'text' },
        uid: { label: 'Firebase UID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.uid) {
          throw new Error('Invalid Google sign-in attempt')
        }

        const email = credentials.email
        const name = credentials.name || email.split('@')[0]
        const image = credentials.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128`
        const firebaseUid = credentials.uid

        // Try to find existing user
        let user = await db.user.findUnique({
          where: { email }
        })

        if (user) {
          // User exists - ensure Google account is linked
          const existingAccount = await db.account.findFirst({
            where: { userId: user.id, provider: 'google' }
          })

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: user.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: firebaseUid,
              }
            })
          } else {
            // Update the provider account ID to match Firebase UID
            await db.account.update({
              where: { id: existingAccount.id },
              data: { providerAccountId: firebaseUid }
            })
          }

          // Update user image from Google profile if available
          if (image && user.image !== image) {
            await db.user.update({
              where: { id: user.id },
              data: { image }
            })
          }

          // Update name if it was previously auto-generated
          if (name && (!user.name || user.name === email.split('@')[0])) {
            await db.user.update({
              where: { id: user.id },
              data: { name }
            })
          }

          // Re-fetch user to get updated data
          user = await db.user.findUnique({
            where: { email }
          })

          return {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            image: user!.image,
            plan: user!.plan,
            role: user!.role,
          }
        }

        // Create new user via Google sign-in
        user = await db.user.create({
          data: {
            email,
            name,
            plan: 'free',
            image,
            emailVerified: new Date(),
          }
        })

        // Create Google account link
        await db.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: firebaseUid,
          }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          role: user.role,
        }
      }
    }),
    // Server-side Google OAuth provider - handles redirect-based OAuth flow
    CredentialsProvider({
      id: 'google-oauth',
      name: 'google-oauth',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' },
        image: { label: 'Image', type: 'text' },
        sub: { label: 'Google Sub', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.sub) {
          throw new Error('Invalid Google OAuth sign-in attempt')
        }

        const email = credentials.email
        const name = credentials.name || email.split('@')[0]
        const image = credentials.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128`
        const googleSub = credentials.sub

        // Try to find existing user
        let user = await db.user.findUnique({
          where: { email }
        })

        if (user) {
          const existingAccount = await db.account.findFirst({
            where: { userId: user.id, provider: 'google' }
          })

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: user.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: googleSub,
              }
            })
          } else {
            await db.account.update({
              where: { id: existingAccount.id },
              data: { providerAccountId: googleSub }
            })
          }

          if (image && user.image !== image) {
            await db.user.update({
              where: { id: user.id },
              data: { image }
            })
          }

          if (name && (!user.name || user.name === email.split('@')[0])) {
            await db.user.update({
              where: { id: user.id },
              data: { name }
            })
          }

          user = await db.user.findUnique({
            where: { email }
          })

          return {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            image: user!.image,
            plan: user!.plan,
            role: user!.role,
          }
        }

        // Create new user
        user = await db.user.create({
          data: {
            email,
            name,
            plan: 'free',
            image,
            emailVerified: new Date(),
          }
        })

        await db.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleSub,
          }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: string }).plan || 'free'
        token.role = (user as { role?: string }).role || 'user'
        token.name = user.name
      }

      // When update() is called with new data (e.g. profile name change),
      // apply the new name immediately from the session parameter
      if (trigger === 'update' && session?.name) {
        token.name = session.name as string
      }

      // Always refresh plan and role from DB when session is updated
      // (e.g. after plan upgrade) or when token.plan is missing
      if (token.id && (trigger === 'update' || !token.plan)) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, name: true, role: true }
        })
        if (dbUser) {
          token.plan = dbUser.plan
          token.role = dbUser.role
          // Only override name from DB if we didn't just set it from session data
          if (!session?.name) {
            token.name = dbUser.name
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.role = token.role as string
        // Ensure name is always synced from the JWT token
        if (token.name) {
          session.user.name = token.name as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'roastmysite-dev-secret-key-2024',
}

export { hashPassword, verifyPassword }
