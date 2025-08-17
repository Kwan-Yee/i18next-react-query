import { QueryClient } from "@tanstack/react-query";

/**
 * React Native specific configuration and optimizations for TanStack Query
 * Handles app state changes, network connectivity, and platform-specific behaviors
 */

// Type definitions for React Native modules (optional dependencies)
interface AppStateStatus {
  (status: "active" | "background" | "inactive"): void;
}

interface NetInfoState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

interface AppStateModule {
  addEventListener(type: "change", handler: (status: string) => void): void;
  removeEventListener(type: "change", handler: (status: string) => void): void;
  currentState: string;
}

interface NetInfoModule {
  addEventListener(listener: (state: NetInfoState) => void): () => void;
}

interface PlatformModule {
  OS: "ios" | "android" | "web" | "windows" | "macos";
}

/**
 * Setup TanStack Query optimizations for React Native
 * @param queryClient - The QueryClient instance to configure
 * @returns Cleanup function to remove event listeners
 */
export const setupReactNativeQuery = (
  queryClient: QueryClient
): (() => void) => {
  const cleanupFunctions: Array<() => void> = [];

  try {
    // Dynamically import React Native modules if available
    const setupAppStateHandling = async () => {
      try {
        // Try to import React Native modules
        const { AppState } = await import("react-native");
        const { focusManager } = await import("@tanstack/react-query");
        const Platform = (await import("react-native")).Platform;

        // Handle app state changes for proper focus management
        const onAppStateChange = (status: string) => {
          if (Platform.OS !== "web") {
            focusManager.setFocused(status === "active");
          }
        };

        // Add listener
        AppState.addEventListener("change", onAppStateChange);

        // Return cleanup function
        cleanupFunctions.push(() => {
          AppState.removeEventListener("change", onAppStateChange);
        });
      } catch (error) {
        // React Native not available - this is fine for non-RN environments
        console.debug(
          "React Native AppState not available, skipping app state handling"
        );
      }
    };

    const setupNetworkHandling = async () => {
      try {
        // Try to import NetInfo
        const NetInfo = await import("@react-native-netinfo/netinfo");
        const { onlineManager } = await import("@tanstack/react-query");

        // Handle network state changes
        const unsubscribe = NetInfo.default.addEventListener(
          (state: NetInfoState) => {
            onlineManager.setOnline(!!state.isConnected);
          }
        );

        cleanupFunctions.push(unsubscribe);
      } catch (error) {
        // NetInfo not available - fall back to navigator.onLine if available
        try {
          const { onlineManager } = await import("@tanstack/react-query");

          if (typeof navigator !== "undefined" && "onLine" in navigator) {
            const updateOnlineStatus = () => {
              onlineManager.setOnline(navigator.onLine);
            };

            window.addEventListener("online", updateOnlineStatus);
            window.addEventListener("offline", updateOnlineStatus);

            cleanupFunctions.push(() => {
              window.removeEventListener("online", updateOnlineStatus);
              window.removeEventListener("offline", updateOnlineStatus);
            });
          }
        } catch (fallbackError) {
          console.debug("Network state management not available");
        }
      }
    };

    // Setup handlers
    setupAppStateHandling();
    setupNetworkHandling();
  } catch (error) {
    console.debug(
      "Some React Native optimizations could not be applied:",
      error
    );
  }

  // Return master cleanup function
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
};

/**
 * Create a QueryClient with React Native optimized defaults
 * @param customOptions - Custom options to override defaults
 * @returns Configured QueryClient instance
 */
export const createReactNativeQueryClient = (
  customOptions: any = {}
): QueryClient => {
  const defaultOptions = {
    defaultOptions: {
      queries: {
        // Longer stale time for mobile - reduce network requests
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Longer cache time for mobile - better offline experience
        cacheTime: 10 * 60 * 1000, // 10 minutes

        // Retry configuration optimized for mobile networks
        retry: (failureCount: number, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for network/server errors
          return failureCount < 3;
        },

        // Exponential backoff for retries
        retryDelay: (attemptIndex: number) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),

        // Don't refetch on window focus by default (mobile apps don't have window focus)
        refetchOnWindowFocus: false,

        // Refetch on reconnect is good for mobile
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: (query: any) => {
          return query.state.dataUpdatedAt === 0;
        },
      },
      mutations: {
        // Retry mutations more conservatively
        retry: 1,
        retryDelay: 1000,
      },
    },

    // Configure logger for React Native (avoid console.log in production)
    logger: {
      log: (...args: any[]) => {
        if (__DEV__) {
          console.log(...args);
        }
      },
      warn: (...args: any[]) => {
        if (__DEV__) {
          console.warn(...args);
        }
      },
      error: (...args: any[]) => {
        console.error(...args);
      },
    },
  };

  // Deep merge custom options with defaults
  const mergedOptions = {
    ...defaultOptions,
    ...customOptions,
    defaultOptions: {
      ...defaultOptions.defaultOptions,
      ...customOptions.defaultOptions,
      queries: {
        ...defaultOptions.defaultOptions.queries,
        ...customOptions.defaultOptions?.queries,
      },
      mutations: {
        ...defaultOptions.defaultOptions.mutations,
        ...customOptions.defaultOptions?.mutations,
      },
    },
  };

  return new QueryClient(mergedOptions);
};

/**
 * React Native specific query configuration for i18next
 */
export const reactNativeI18nextQueryConfig = {
  // Cache translations longer on mobile
  staleTime: 15 * 60 * 1000, // 15 minutes
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours

  // Don't refetch translations on app focus
  refetchOnWindowFocus: false,

  // Do refetch on network reconnection
  refetchOnReconnect: true,

  // Retry network errors but not client errors
  retry: (failureCount: number, error: any) => {
    if (error?.status >= 400 && error?.status < 500) return false;
    return failureCount < 2;
  },

  // Conservative retry delay for mobile
  retryDelay: (attemptIndex: number) => Math.min(2000 * attemptIndex, 10000),
};

/**
 * Check if running in React Native environment
 */
export const isReactNative = (): boolean => {
  try {
    return (
      typeof navigator !== "undefined" && navigator.product === "ReactNative"
    );
  } catch {
    return false;
  }
};

/**
 * Get platform-specific cache configuration
 */
export const getPlatformCacheConfig = () => {
  if (isReactNative()) {
    return {
      // More aggressive caching for mobile
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    };
  } else {
    return {
      // Standard web caching
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    };
  }
};
