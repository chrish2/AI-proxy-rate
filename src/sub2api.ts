import { ProxyPlatform } from './types'
import type { ModelRate, ProxyConfig } from './types'

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}

const asNumber = (value: unknown) => typeof value === 'number' ? value : undefined

const sub2ApiGroupsUrl = (baseUrl: string) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return new URL(`/api/v1/groups/available?timezone=${encodeURIComponent(timezone)}`, baseUrl).toString()
}

export const fetchSub2ApiRates = async (proxy: ProxyConfig): Promise<ModelRate[]> => {
  if (proxy.platform !== ProxyPlatform.Sub2Api) return []

  const response = await fetch('/__middlerates/sub2api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub2ApiGroupsUrl(proxy.baseUrl), accessToken: proxy.authToken }),
  })
  const body: unknown = await response.json()
  const root = asRecord(body)
  if (!response.ok || root.code !== 0) {
    throw new Error(typeof root.message === 'string' ? root.message || `Request failed (${response.status})` : `Request failed (${response.status})`)
  }

  const groups = Array.isArray(root.data) ? root.data : []
  return groups.map((entry, index) => {
    const group = asRecord(entry)
    const id = String(group.id ?? index)
    return {
      id,
      model: typeof group.name === 'string' ? group.name.trim() : `Group ${index + 1}`,
      description: typeof group.description === 'string' ? group.description.trim() : undefined,
      group: typeof group.platform === 'string' ? group.platform : undefined,
      ratio: asNumber(group.rate_multiplier),
    }
  })
}
