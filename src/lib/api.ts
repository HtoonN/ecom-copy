import { NextResponse } from 'next/server'
import { readSession } from './auth'
import type { Role } from '@/generated/prisma/enums'

export async function apiSession(role?: Role) {
  const session = await readSession()
  if (!session) return { error: NextResponse.json({ error: 'Please sign in.' }, { status: 401 }) }
  if (role && session.role !== role)
    return { error: NextResponse.json({ error: 'You do not have access.' }, { status: 403 }) }
  return { session }
}

export const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status })
