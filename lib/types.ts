import { QueryClient } from "@tanstack/react-query";

// Core types for TanStack Query integration with i18next
export interface I18nextRequestOptions {
  loadPath?:
    | string
    | ((lngs: string[], namespaces: string[]) => string | Promise<string>);
  addPath?: string | ((lng: string, namespace: string) => string);
  parse?: (
    data: string,
    languages?: string | string[],
    namespaces?: string | string[]
  ) => any;
  parsePayload?: (
    namespace: string,
    key: string,
    fallbackValue?: string
  ) => any;
  parseLoadPayload?: (
    languages: string[],
    namespaces: string[]
  ) => any | undefined;
  crossDomain?: boolean;
  withCredentials?: boolean;
  queryStringParams?: Record<string, string>;
  customHeaders?: Record<string, string> | (() => Record<string, string>);
  requestOptions?: RequestInit | ((payload: any) => RequestInit);
  reloadInterval?: false | number;
  stringify?: (payload: any) => string;

  // TanStack Query specific options
  queryClient?: QueryClient;
  tanstackQuery?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: number | boolean;
    retryDelay?: number | ((attemptIndex: number) => number);
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
  };
}

export interface I18nextResponse {
  status: number;
  data: any;
}

export interface I18nextError extends Error {
  status?: number;
  retry?: boolean;
  url?: string;
}

export interface RequestCallback {
  (
    error: any | undefined | null,
    response: I18nextResponse | undefined | null
  ): void;
}

// Query key factory for consistent cache keys
export const queryKeys = {
  all: ["i18next"] as const,
  loads: () => [...queryKeys.all, "load"] as const,
  load: (url: string, payload?: any) =>
    [...queryKeys.loads(), url, payload] as const,
  creates: () => [...queryKeys.all, "create"] as const,
  create: (url: string, payload: any) =>
    [...queryKeys.creates(), url, payload] as const,
};

// Type guards
export function isQueryClientAvailable(
  options: I18nextRequestOptions
): options is I18nextRequestOptions & { queryClient: QueryClient } {
  return !!(options.queryClient && options.tanstackQuery?.enabled !== false);
}

export function isTanstackQueryEnabled(
  options: I18nextRequestOptions
): boolean {
  return !!(options.tanstackQuery?.enabled && options.queryClient);
}
