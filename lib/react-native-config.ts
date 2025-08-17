import { QueryClient } from '@tanstack/react-query'

/**
 * React Native configuration and optimizations for TanStack Query
 * Handles app state changes and network connectivity for React Native applications
 */

// Global declarations for React Native environment
declare global {
  var __DEV__: boolean | undefined
}

// Type definitions for React Native modules (now required dependencies)
interface AppStateModule {
  addEventListener(type: 'change', handler: (status: string) => void): void
  removeEventListener(type: 'change', handler: (status: string) => void): void
  currentState: string
}

interface PlatformModule {
  OS: 'ios' | 'android'
}

interface NetInfoState {
  isConnected: boolean | null
  isInternetReachable: boolean | null
  type: string
}

interface NetInfoModule {
  addEventListener(listener: (state: NetInfoState) => void): () => void
}

/**
 * Setup TanStack Query optimizations for React Native
 * @param queryClient - The QueryClient instance to configure
 * @returns Cleanup function to remove event listeners
 */
export const setupReactNativeQuery = (queryClient: QueryClient): (() => void) => {
  const cleanupFunctions: Array<() => void> = []

  // Setup handlers
  const setupAppStateHandling = async () => {
    const { AppState, Platform } = (await import('react-native' as any)) as {
      AppState: AppStateModule
      Platform: PlatformModule
    }
    const { focusManager } = await import('@tanstack/react-query')

    // Handle app state changes for proper focus management
    const onAppStateChange = (status: string) => {
      focusManager.setFocused(status === 'active')
    }

    // Add listener
    AppState.addEventListener('change', onAppStateChange)

    // Return cleanup function
    cleanupFunctions.push(() => {
      AppState.removeEventListener('change', onAppStateChange)
    })
  }

  const setupNetworkHandling = async () => {
    const NetInfo = (await import('@react-native-netinfo/netinfo' as any)) as {
      default: NetInfoModule
    }
    const { onlineManager } = await import('@tanstack/react-query')

    // Handle network state changes
    const unsubscribe = NetInfo.default.addEventListener(state => {
      onlineManager.setOnline(!!state.isConnected)
    })

    cleanupFunctions.push(unsubscribe)
  }

  setupAppStateHandling()
  setupNetworkHandling()

  // Return master cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}

/**
 * Create a QueryClient with React Native optimized defaults
 * @param customOptions - Custom options to override defaults
 * @returns Configured QueryClient instance
 */
export const createReactNativeQueryClient = (customOptions: any = {}): QueryClient => {
  const defaultOptions = {
    defaultOptions: {
      queries: {
        // Longer stale time for React Native - reduce network requests
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Longer cache time for React Native - better offline experience
        cacheTime: 10 * 60 * 1000, // 10 minutes

        // Retry configuration optimized for React Native
        retry: (failureCount: number, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 3 times for network/server errors
          return failureCount < 3
        },

        // Exponential backoff for retries
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Don't refetch on window focus (React Native doesn't have window focus)
        refetchOnWindowFocus: false,

        // Refetch on reconnect is good for React Native
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: (query: any) => {
          return query.state.dataUpdatedAt === 0
        }
      },
      mutations: {
        // Retry mutations more conservatively
        retry: 1,
        retryDelay: 1000
      }
    },

    // Configure logger for React Native (avoid console.log in production)
    logger: {
      log: (...args: any[]) => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(...args)
        }
      },
      warn: (...args: any[]) => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(...args)
        }
      },
      error: (...args: any[]) => {
        console.error(...args)
      }
    }
  }

  // Deep merge custom options with defaults
  const mergedOptions = {
    ...defaultOptions,
    ...customOptions,
    defaultOptions: {
      ...defaultOptions.defaultOptions,
      ...customOptions.defaultOptions,
      queries: {
        ...defaultOptions.defaultOptions.queries,
        ...customOptions.defaultOptions?.queries
      },
      mutations: {
        ...defaultOptions.defaultOptions.mutations,
        ...customOptions.defaultOptions?.mutations
      }
    }
  }

  return new QueryClient(mergedOptions)
}

/**
 * React Native specific query configuration for i18next
 */
export const reactNativeI18nextQueryConfig = {
  // Cache translations longer on mobile
  staleTime: 15 * 60 * 1000, // 15 minutes
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours

  // Don't refetch translations on app focus (React Native doesn't have window focus)
  refetchOnWindowFocus: false,

  // Do refetch on network reconnection
  refetchOnReconnect: true,

  // Retry network errors but not client errors
  retry: (failureCount: number, error: any) => {
    if (error?.status >= 400 && error?.status < 500) return false
    return failureCount < 2
  },

  // Conservative retry delay for mobile
  retryDelay: (attemptIndex: number) => Math.min(2000 * attemptIndex, 10000)
}

/**
 * Check if running in React Native environment
 * Since this package is React Native-only, this always returns true
 */
export const isReactNative = (): boolean => {
  return true
}

/**
 * Get React Native cache configuration
 * Optimized for mobile usage patterns
 */
export const getPlatformCacheConfig = () => {
  return {
    // Aggressive caching for mobile
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 24 * 60 * 60 * 1000 // 24 hours
  }
}
