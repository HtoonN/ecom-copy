export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { prisma } = await import('@/lib/prisma')
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✓ Database connected successfully')
  } catch (error) {
    console.error('✗ Database connection failed', error)
  }
}
