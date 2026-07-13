import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProxyAuthMode, ProxyPlatform } from './types'
import type { ProxyConfig } from './types'

type ProxyInput = Omit<ProxyConfig, 'id' | 'createdAt'>

interface ProxyStore {
  proxies: ProxyConfig[]
  addProxy: (proxy: ProxyInput) => void
  updateProxy: (id: string, proxy: ProxyInput) => void
  deleteProxy: (id: string) => void
}

const createId = () => crypto.randomUUID()

export const useProxyStore = create<ProxyStore>()(
  persist(
    (set) => ({
      proxies: [],
      addProxy: (proxy) =>
        set((state) => ({
          proxies: [...state.proxies, { ...proxy, id: createId(), createdAt: new Date().toISOString() }],
        })),
      updateProxy: (id, proxy) =>
        set((state) => ({
          proxies: state.proxies.map((item) => (item.id === id ? { ...item, ...proxy } : item)),
        })),
      deleteProxy: (id) => set((state) => ({ proxies: state.proxies.filter((item) => item.id !== id) })),
    }),
    {
      name: 'middle-rates-proxies',
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as { proxies?: Array<Record<string, unknown>> }
        return {
          ...state,
          proxies: (state.proxies ?? []).map(({ token, sessionCookie, authToken, authMode, endpoint, baseUrl, ...proxy }) => {
            const savedUrl = typeof baseUrl === 'string' ? baseUrl : typeof endpoint === 'string' ? endpoint : ''
            let normalizedBaseUrl = savedUrl
            try { normalizedBaseUrl = new URL(savedUrl).origin } catch { /* Preserve invalid legacy values for user correction. */ }
            return {
              ...proxy,
              baseUrl: normalizedBaseUrl,
              authToken: typeof authToken === 'string' ? authToken : typeof sessionCookie === 'string' ? sessionCookie : typeof token === 'string' ? token : '',
              authMode: authMode === ProxyAuthMode.BearerToken || authMode === ProxyAuthMode.SessionCookie
                ? authMode
                : proxy.platform === ProxyPlatform.Sub2Api ? ProxyAuthMode.BearerToken : ProxyAuthMode.SessionCookie,
            }
          }),
        }
      },
    },
  ),
)

export const EMPTY_PROXY_INPUT: ProxyInput = {
  name: '',
  platform: ProxyPlatform.NewApi,
  baseUrl: '',
  userId: '',
  authToken: '',
  authMode: ProxyAuthMode.SessionCookie,
}
