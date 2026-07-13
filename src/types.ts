export const ProxyPlatform = {
  NewApi: 'newapi',
  Sub2Api: 'sub2api',
} as const
export type ProxyPlatform = (typeof ProxyPlatform)[keyof typeof ProxyPlatform]

export const ProxyAuthMode = {
  SessionCookie: 'session-cookie',
  BearerToken: 'bearer-token',
} as const
export type ProxyAuthMode = (typeof ProxyAuthMode)[keyof typeof ProxyAuthMode]

export const ProxyStatus = {
  Idle: 'idle',
  Checking: 'checking',
  Ready: 'ready',
  Error: 'error',
} as const
export type ProxyStatus = (typeof ProxyStatus)[keyof typeof ProxyStatus]

export interface ProxyConfig {
  id: string
  name: string
  platform: ProxyPlatform
  baseUrl: string
  userId: string
  authToken: string
  authMode: ProxyAuthMode
  createdAt: string
}

export interface ModelRate {
  id: string
  model: string
  description?: string
  ratio?: number
  inputRate?: number
  outputRate?: number
  group?: string
}

export interface ProxySnapshot {
  proxyId: string
  status: ProxyStatus
  checkedAt?: string
  models: ModelRate[]
  message?: string
}
