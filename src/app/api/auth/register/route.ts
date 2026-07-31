import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken, sessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()
  if (!name || !email || String(password).length < 8)
    return NextResponse.json(
      { error: 'Enter a name, email and password of at least 8 characters.' },
      { status: 400 },
    )
  if (await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } }))
    return NextResponse.json({ error: 'That email is already registered.' }, { status: 409 })
  const user = await prisma.user.create({
    data: {
      name,
      email: String(email).toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: 'VENDOR',
    },
  })
  await prisma.shop.create({
    data: {
      ownerId: user.id,
      name: `${name}'s shop`,
      slug: `shop-${user.id}`,
      description: 'Welcome to my shop.',
    },
  })
  const token = await createToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  })
  const response = NextResponse.json({ redirect: '/vendor' })
  response.cookies.set(sessionCookie.name, token, sessionCookie.options)
  return response
}
