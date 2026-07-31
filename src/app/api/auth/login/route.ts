import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken, sessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!user || !user.active || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }
  const token = await createToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  })
  const response = NextResponse.json({
    user: { name: user.name, email: user.email, role: user.role },
    redirect: user.role === 'ADMIN' ? '/admin' : user.role === 'VENDOR' ? '/vendor' : '/',
  })
  response.cookies.set(sessionCookie.name, token, sessionCookie.options)
  return response
}
