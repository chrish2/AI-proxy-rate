import { ProxyPlatform } from './types'
import type { ModelRate, ProxyConfig } from './types'

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const asNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)

const rateFrom = (data: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const rate = asNumber(data[key])
    if (rate !== undefined) return rate
  }
  return undefined
}

const parseNewApiGroupRates = (data: Record<string, unknown>): ModelRate[] =>
  Object.entries(data).flatMap(([name, value]) => {
    const group = asRecord(value)
    if (typeof group.desc !== 'string' && typeof group.ratio !== 'number') return []
    return [{
      id: name,
      model: name,
      description: typeof group.desc === 'string' ? group.desc : undefined,
      ratio: asNumber(group.ratio),
    }]
  })

const newApiGroupsUrl = (baseUrl: string) => new URL('/api/user/self/groups', baseUrl).toString()

export const fetchNewApiRates = async (proxy: ProxyConfig): Promise<ModelRate[]> => {
  if (proxy.platform !== ProxyPlatform.NewApi) return []

  const response = await fetch('/__middlerates/newapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: newApiGroupsUrl(proxy.baseUrl),
      userId: proxy.userId,
      sessionCookie: proxy.authToken,
    }),
  })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)

  const body: unknown = await response.json()
  const root = asRecord(body)
  if (root.success === false) throw new Error(typeof root.message === 'string' ? root.message || 'NewAPI rejected the request' : 'NewAPI rejected the request')
  const groupRates = asRecord(root.data)
  const parsedGroups = parseNewApiGroupRates(groupRates)
  if (parsedGroups.length > 0) return parsedGroups
  const list = Array.isArray(body) ? body : Array.isArray(root.data) ? root.data : Array.isArray(root.models) ? root.models : []

  return list.map((entry, index) => {
    if (typeof entry === 'string') return { id: entry, model: entry }
    const model = asRecord(entry)
    const name = String(model.id ?? model.model ?? model.name ?? `Model ${index + 1}`)
    return {
      id: name,
      model: name,
      group: typeof model.group === 'string' ? model.group : undefined,
      inputRate: rateFrom(model, ['input_rate', 'inputPrice', 'input_price', 'input']),
      outputRate: rateFrom(model, ['output_rate', 'outputPrice', 'output_price', 'output']),
    }
  })
}
