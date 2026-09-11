// Fire-and-forget so the click handler stays synchronous — window.open must run
// in the same tick as the click or the browser blocks it as a popup.
export function recordProductClickOut(productId: number, marketplace: string | null) {
  return fetch('/api/products/clickouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, marketplace }),
    keepalive: true,
  }).catch(() => undefined)
}
