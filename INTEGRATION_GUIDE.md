# TanStack Query Integration Guide

## Overview

This guide explains how to use the TanStack Query integration with `i18next-http-backend` for enhanced caching, retry logic, and React Native optimizations.

## Quick Start

### 1. Install Dependencies

```bash
npm install i18next-http-backend @tanstack/react-query
# For React Native:
npm install @react-native-netinfo/netinfo
```

### 2. Basic Setup

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18next from 'i18next'
import HttpBackend from 'i18next-http-backend'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3
    }
  }
})

// Initialize i18next with TanStack Query support
i18next.use(HttpBackend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',

    // TanStack Query configuration
    queryClient: queryClient,
    tanstackQuery: {
      enabled: true, // Enable TanStack Query
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3
    }
  }
})
```

### 3. React/React Native App Setup

```jsx
import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

function App() {
  return <QueryClientProvider client={queryClient}>{/* Your app components */}</QueryClientProvider>
}
```

## React Native Optimized Setup

### 1. Install React Native Dependencies

```bash
npm install @react-native-netinfo/netinfo
```

### 2. Use React Native Optimizations

```javascript
import { createReactNativeQueryClient, setupReactNativeQuery } from 'i18next-http-backend/lib/react-native-config'

// Create optimized QueryClient for React Native
const queryClient = createReactNativeQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes for mobile
      cacheTime: 24 * 60 * 60 * 1000 // 24 hours for mobile
    }
  }
})

// Setup React Native optimizations
const cleanup = setupReactNativeQuery(queryClient)

// In your App component
useEffect(() => {
  return cleanup // Cleanup on unmount
}, [])
```

### 3. Configure for React Native

```javascript
i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: 'https://api.example.com/locales/{{lng}}/{{ns}}.json',
      queryClient: queryClient,
      tanstackQuery: {
        enabled: true,
        // Mobile-optimized settings
        staleTime: 15 * 60 * 1000, // 15 minutes
        cacheTime: 24 * 60 * 60 * 1000, // 24 hours
        retry: 2,
        retryDelay: attemptIndex => Math.min(2000 * attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      }
    }
  })
```

## Configuration Options

### TanStack Query Options

```javascript
{
  backend: {
    queryClient: queryClient, // Required: QueryClient instance
    tanstackQuery: {
      enabled: true, // Required: Enable TanStack Query
      staleTime: 5 * 60 * 1000, // Time data is fresh (ms)
      cacheTime: 10 * 60 * 1000, // Time data stays in cache (ms)
      retry: 3, // Number of retry attempts
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Refetch on window focus
      refetchOnReconnect: true, // Refetch on network reconnect
    },
  },
}
```

### Custom Retry Logic

```javascript
{
  backend: {
    tanstackQuery: {
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) return false
        // Retry server errors and network errors up to 3 times
        return failureCount < 3
      },
    },
  },
}
```

### Mobile Application (React Native)

```javascript
{
  backend: {
    tanstackQuery: {
      staleTime: 15 * 60 * 1000, // 15 minutes (longer for mobile)
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours (aggressive caching)
      refetchOnWindowFocus: false, // Not applicable for mobile
      refetchOnReconnect: true, // Important for mobile networks
    },
  },
}
```

## Advanced Usage

### Cache Management

```javascript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// Invalidate all translations
queryClient.invalidateQueries(['i18next'])

// Invalidate specific language/namespace
queryClient.invalidateQueries(['i18next', 'load'])

// Clear all cache
queryClient.clear()
```

### Error Handling

```javascript
{
  backend: {
    tanstackQuery: {
      onError: (error) => {
        console.error('Translation loading failed:', error)
        // Custom error reporting
      },
    },
  },
}
```

### Performance Monitoring

```javascript
import { QueryCache } from '@tanstack/react-query'

const queryCache = new QueryCache({
  onSuccess: (data, query) => {
    if (query.queryKey[0] === 'i18next') {
      console.log('Translation loaded successfully')
    }
  },
  onError: (error, query) => {
    if (query.queryKey[0] === 'i18next') {
      console.error('Translation loading failed:', error)
    }
  }
})

const queryClient = new QueryClient({ queryCache })
```

## Migration from Standard Backend

### 1. Install TanStack Query

```bash
npm install @tanstack/react-query
```

### 2. Create QueryClient

```javascript
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
```

### 3. Update Backend Configuration

```javascript
// Before
{
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
}

// After
{
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    queryClient: queryClient,
    tanstackQuery: {
      enabled: true,
    },
  },
}
```

### 4. Wrap App with Provider

```jsx
import { QueryClientProvider } from '@tanstack/react-query'

function App() {
  return <QueryClientProvider client={queryClient}>{/* Your existing app */}</QueryClientProvider>
}
```

## Best Practices

### 1. Cache Configuration

```javascript
// For production applications
{
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 60 * 60 * 1000, // 1 hour
}

// For development
{
  staleTime: 0, // Always fresh in development
  cacheTime: 5 * 60 * 1000, // 5 minutes
}
```

### 2. Error Handling

```javascript
{
  retry: (failureCount, error) => {
    // Production error handling
    if (process.env.NODE_ENV === 'production') {
      return failureCount < 1 // Less aggressive retries in production
    }
    return failureCount < 3 // More retries in development
  },
}
```

### 3. Network Optimization

```javascript
{
  // For slow networks
  retryDelay: (attemptIndex) => Math.min(3000 * attemptIndex, 30000),

  // For fast networks
  retryDelay: (attemptIndex) => Math.min(1000 * attemptIndex, 10000),
}
```

## Troubleshooting

### Common Issues

1. **"QueryClient not found" error**

   - Ensure `QueryClientProvider` wraps your app
   - Pass `queryClient` to backend options

2. **Translations not caching**

   - Check if `tanstackQuery.enabled` is `true`
   - Verify `queryClient` is provided

3. **Slow initial load**
   - Increase `staleTime` for less frequent refetching
   - Consider preloading critical translations

### Debug Mode

```javascript
{
  debug: __DEV__, // Enable in development
  backend: {
    tanstackQuery: {
      enabled: true,
      // ... options
    },
  },
}
```

## Examples

- [Basic Web Example](./example/web/) - Simple web application
- [React Native Example](./example/react-native/) - Complete React Native setup
- [Advanced Configuration](./example/advanced/) - Complex setup

## API Reference

- [Types](./lib/types.ts) - TypeScript type definitions
- [TanStack Backend](./lib/tanstack-request.ts) - Core implementation
- [React Native Config](./lib/react-native-config.ts) - React Native optimizations
- [Error Handling](./lib/error-handling.ts) - Error processing utilities
