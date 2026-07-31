import { NextResponse } from 'next/server'
import { apiSession, fail } from '@/lib/api'
import { scrapeLazadaProduct } from '@/lib/lazada'
import { scrapeShopeeProduct } from '@/lib/shopee'

export async function POST(request: Request) {
  const auth = await apiSession('VENDOR')
  if (auth.error) return auth.error
  try {
    const body = await request.json()
    const preview =
      body.marketplace === 'lazada'
        ? await scrapeLazadaProduct(body.url)
        : await scrapeShopeeProduct(body.url)
    return NextResponse.json(preview)
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Could not import this product.', 422)
  }
}
