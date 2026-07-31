import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@/generated/prisma/client'
import { databaseConfig } from '@/lib/database-config'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const adapter = new PrismaMariaDb(databaseConfig())
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
