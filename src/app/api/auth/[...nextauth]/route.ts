import { authOptions } from '@/lib/auth.js'
import NextAuth from 'next-auth/next'

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
