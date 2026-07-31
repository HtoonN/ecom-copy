export function recordProductView(productId: number) {
  return fetch('/api/products/views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
    keepalive: true,
  }).catch(() => undefined)
}
