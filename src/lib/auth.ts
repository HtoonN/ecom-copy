import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'

const COOKIE = 'northstar_session'
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-secret')
export type Session = { userId: number; role: Role; name: string; email: string }
export async function createToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}
export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null

  let session: Session
  try {
    session = (await jwtVerify(token, secret)).payload as Session
  } catch {
    return null
  }

  if (
    !Number.isInteger(session.userId) ||
    typeof session.email !== 'string' ||
    typeof session.role !== 'string'
  )
    return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  if (
    !user?.active ||
    user.email.toLowerCase() !== session.email.toLowerCase() ||
    user.role !== session.role
  )
    return null

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}
export async function requireRole(role?: Role) {
  const session = await readSession()
  if (!session) redirect('/login')
  if (role && session.role !== role) redirect('/dashboard')
  return session
}
export const sessionCookie = {
  name: COOKIE,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  },
}
