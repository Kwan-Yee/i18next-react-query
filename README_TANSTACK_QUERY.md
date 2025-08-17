# TanStack Query Integration for i18next-http-backend

This document describes the TanStack Query integration added to `i18next-http-backend`, providing enhanced caching, retry logic, and React Native optimizations.

## Implementation Status

🔧 **Current Status**: Foundation Complete  
✅ TypeScript interfaces and types created  
✅ TanStack Query request backend implemented  
✅ Error handling with i18next compatibility  
✅ React Native configuration utilities  
✅ Updated TypeScript definitions  
✅ Basic integration tests

**Note**: The full integration is available as separate modules to maintain backward compatibility. The core package includes the foundation and will support the full TanStack Query integration when explicitly enabled.

## Features

- ✅ **Advanced Caching**: Intelligent caching with configurable stale time and cache time
- ✅ **Retry Logic**: Smart retry mechanisms with exponential backoff
- ✅ **React Native Optimized**: App state awareness and network handling
- ✅ **TypeScript Support**: Full TypeScript support with strict typing
- ✅ **Backward Compatible**: Optional feature that falls back to standard implementation
- ✅ **Performance**: Reduced network requests and faster app startup

## Installation

```bash
npm install @tanstack/react-query
# For React Native, also install:
npm install @react-native-netinfo/netinfo
```

## Basic Usage

### 1. Setup QueryClient

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createReactNativeQueryClient } from "i18next-http-backend/lib/react-native-config";

// For React Native (recommended)
const queryClient = createReactNativeQueryClient();

// Or create manually with custom options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
    },
  },
});
```

### 2. Configure i18next Backend

```typescript
import i18next from "i18next";
import HttpBackend from "i18next-http-backend";

i18next.use(HttpBackend).init({
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",

    // Enable TanStack Query
    queryClient: queryClient,
    tanstackQuery: {
      enabled: true,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnReconnect: true,
    },
  },
});
```

### 3. Wrap Your App (React/React Native)

```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```

## Configuration Options

### `tanstackQuery` Options

| Option                 | Type                 | Default             | Description                        |
| ---------------------- | -------------------- | ------------------- | ---------------------------------- |
| `enabled`              | `boolean`            | `false`             | Enable TanStack Query for requests |
| `staleTime`            | `number`             | `300000`            | Time data is considered fresh (ms) |
| `cacheTime`            | `number`             | `600000`            | Time data stays in cache (ms)      |
| `retry`                | `number \| boolean`  | `3`                 | Number of retry attempts           |
| `retryDelay`           | `number \| function` | Exponential backoff | Delay between retries              |
| `refetchOnWindowFocus` | `boolean`            | `false`             | Refetch when window gains focus    |
| `refetchOnReconnect`   | `boolean`            | `true`              | Refetch when network reconnects    |

### Full Configuration Example

```typescript
{
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',

    // TanStack Query configuration
    queryClient: queryClient,
    tanstackQuery: {
      enabled: true,
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },

    // Standard options still work
    customHeaders: {
      'Authorization': 'Bearer token',
    },
    queryStringParams: {
      version: '1.0.0',
    },
  },
}
```

## React Native Setup

### 1. Install Dependencies

```bash
npm install @tanstack/react-query @react-native-netinfo/netinfo
```

### 2. Setup with React Native Optimizations

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createReactNativeQueryClient,
  setupReactNativeQuery,
} from "i18next-http-backend/lib/react-native-config";

// Create optimized QueryClient
const queryClient = createReactNativeQueryClient();

// Setup React Native optimizations
const cleanup = setupReactNativeQuery(queryClient);

function App() {
  useEffect(() => {
    // Cleanup on unmount
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

### 3. Configure i18next for React Native

```typescript
i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: "https://api.example.com/locales/{{lng}}/{{ns}}.json",
      queryClient: queryClient,
      tanstackQuery: {
        enabled: true,
        // Mobile-optimized settings
        staleTime: 15 * 60 * 1000, // 15 minutes
        cacheTime: 24 * 60 * 60 * 1000, // 24 hours
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(2000 * attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
```

## Advanced Usage

### Cache Management

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate all translation queries
queryClient.invalidateQueries(["i18next"]);

// Invalidate specific language/namespace
queryClient.invalidateQueries(["i18next", "load", "url-pattern"]);

// Clear all cache
queryClient.clear();

// Get cached data
const cachedData = queryClient.getQueryData(["i18next", "load", "url"]);
```

### Custom Error Handling

```typescript
{
  backend: {
    tanstackQuery: {
      retry: (failureCount, error) => {
        // Custom retry logic
        if (error?.status === 404) return false // Don't retry 404s
        if (error?.status >= 500) return failureCount < 5 // Retry server errors
        return failureCount < 2 // Default retry
      },
      onError: (error) => {
        // Custom error handling
        console.error('Translation loading failed:', error)
      },
    },
  },
}
```

### Performance Monitoring

```typescript
import { QueryCache } from "@tanstack/react-query";

const queryCache = new QueryCache({
  onSuccess: (data, query) => {
    if (query.queryKey[0] === "i18next") {
      console.log("Translation loaded:", query.queryKey);
    }
  },
  onError: (error, query) => {
    if (query.queryKey[0] === "i18next") {
      console.error("Translation failed:", query.queryKey, error);
    }
  },
});

const queryClient = new QueryClient({ queryCache });
```

## Migration Guide

### From Standard Backend

1. **Install TanStack Query**:

   ```bash
   npm install @tanstack/react-query
   ```

2. **Add QueryClient**:

   ```typescript
   const queryClient = new QueryClient();
   ```

3. **Update Backend Configuration**:

   ```typescript
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

4. **Wrap App with Provider**:
   ```typescript
   <QueryClientProvider client={queryClient}>
     <App />
   </QueryClientProvider>
   ```

### Gradual Migration

You can enable TanStack Query gradually:

```typescript
// Start with TanStack Query disabled
{
  backend: {
    queryClient: queryClient,
    tanstackQuery: {
      enabled: false, // Start disabled
    },
  },
}

// Enable for specific environments
{
  backend: {
    tanstackQuery: {
      enabled: process.env.NODE_ENV === 'production',
    },
  },
}
```

## Best Practices

### 1. Cache Configuration

```typescript
// For mobile apps
{
  staleTime: 15 * 60 * 1000, // 15 minutes
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours
}

// For web apps
{
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
}
```

### 2. Error Handling

```typescript
{
  retry: (failureCount, error) => {
    // Don't retry client errors
    if (error?.status >= 400 && error?.status < 500) return false
    // Retry server errors and network errors
    return failureCount < 3
  },
}
```

### 3. Network Optimization

```typescript
// For React Native
{
  refetchOnWindowFocus: false, // Mobile apps don't have window focus
  refetchOnReconnect: true, // Refetch when network comes back
}

// For web apps
{
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  refetchOnReconnect: true,
}
```

## Troubleshooting

### Common Issues

1. **"QueryClient not found" error**:

   - Ensure `QueryClientProvider` wraps your app
   - Pass `queryClient` to backend options

2. **Translations not updating**:

   - Check `staleTime` configuration
   - Use `queryClient.invalidateQueries(['i18next'])` to force refresh

3. **High memory usage**:

   - Reduce `cacheTime`
   - Use `queryClient.clear()` periodically

4. **Slow initial load**:
   - Increase `staleTime` for less frequent refetching
   - Consider preloading critical translations

### Debug Mode

```typescript
// Enable detailed logging
{
  backend: {
    tanstackQuery: {
      enabled: true,
      // ... other options
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
```

## Examples

- [React Native Example](./example/react-native/) - Complete React Native setup
- [Basic Web Example](./example/web/) - Simple web application
- [Advanced Configuration](./example/advanced/) - Complex setup with custom options

## API Reference

For detailed API documentation, see:

- [Types](./lib/types.ts) - TypeScript type definitions
- [TanStack Backend](./lib/tanstack-request.ts) - Core implementation
- [React Native Config](./lib/react-native-config.ts) - React Native optimizations
