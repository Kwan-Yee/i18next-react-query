/**
 * Type definitions for i18next-http-backend with TanStack Query integration
 */

export interface I18nextError extends Error {
  url?: string
  status?: number
  retry?: boolean
}

export interface TanStackQueryOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number | boolean
  retryDelay?: number | ((attemptIndex: number) => number)
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
}

export interface I18nextRequestOptions {
  loadPath?: string
  addPath?: string
  customHeaders?: Record<string, string> | (() => Record<string, string>)
  queryStringParams?: Record<string, string>
  requestOptions?: RequestInit | ((payload: any) => RequestInit)
  crossDomain?: boolean
  withCredentials?: boolean
  parse?: (data: string, languages?: string | string[], namespaces?: string | string[]) => any
  stringify?: (payload: any) => string
  tanstackQuery?: TanStackQueryOptions
}

export interface I18nextResponse {
  status: number
  data: any
}

export type RequestCallback = (error: any | undefined | null, response: I18nextResponse | undefined | null) => void
