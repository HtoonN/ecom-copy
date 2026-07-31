export const tabSlug = (tab: string) => tab.toLowerCase().replace(/\s+/g, '-')

export function resolveTab(
  value: string | string[] | undefined,
  tabs: readonly string[],
  fallback: string,
) {
  const slug = Array.isArray(value) ? value[0] : value
  return tabs.find((tab) => tabSlug(tab) === slug) || fallback
}
