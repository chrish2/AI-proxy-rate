import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import App, { TablePage } from './App.tsx'
import './index.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } })
const rootRoute = createRootRoute()
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: App })
const tableRoute = createRoute({ getParentRoute: () => rootRoute, path: '/table', component: TablePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, tableRoute]) })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }

createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></StrictMode>)
