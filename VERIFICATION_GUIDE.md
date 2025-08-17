# TanStack Query Integration Verification Guide

This guide provides comprehensive methods to verify that the TanStack Query integration in `i18next-http-backend` is working correctly.

## Quick Verification Checklist

### 1. Integration Status Check

First, verify your integration is properly configured:

```javascript
import i18next from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { QueryClient } from '@tanstack/react-query'

// Create QueryClient
const queryClient = new QueryClient()

// Initialize with TanStack Query
i18next.use(HttpBackend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    queryClient: queryClient, // ✅ Required
    tanstackQuery: {
      enabled: true, // ✅ Must be true
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  }
})
```

### 2. Backend Instance Verification

Check if your backend instance has TanStack integration enabled:

```javascript
// Access the backend instance
const backend = i18next.services.backendConnector.backend

console.log('TanStack Backend:', backend.tanstackBackend) // Should not be null
console.log('Options:', backend.options.tanstackQuery) // Should show your config
console.log('QueryClient:', backend.options.queryClient) // Should be your QueryClient
```

### 3. Runtime Verification Methods

## Method 1: Console Logging

Add logging to verify which backend is being used:

```javascript
// Override the backend's loadUrl method to add logging
const originalLoadUrl = backend.loadUrl.bind(backend)
backend.loadUrl = function (url, callback, languages, namespaces) {
  console.log('🔍 Loading translation:', url)
  console.log('📱 Using TanStack:', !!this.tanstackBackend)

  return originalLoadUrl(url, callback, languages, namespaces)
}
```

## Method 2: Network Monitoring

Monitor network requests to see caching behavior:

```javascript
// Add this before initializing i18next
const originalFetch = window.fetch
let requestCount = 0

window.fetch = function (...args) {
  const url = args[0]
  if (typeof url === 'string' && url.includes('locales')) {
    requestCount++
    console.log(`🌐 Translation request #${requestCount}:`, url)
  }
  return originalFetch.apply(this, args)
}

// Later, check if requests are being cached
setTimeout(() => {
  console.log('📊 Total translation requests:', requestCount)
  // With TanStack Query, this should be minimal due to caching
}, 5000)
```

## Method 3: QueryClient Inspection

Directly inspect the QueryClient cache:

```javascript
import { useQueryClient } from '@tanstack/react-query'

function DebugComponent() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Get all queries in the cache
    const cache = queryClient.getQueryCache()
    console.log('📋 Query Cache:', cache.getAll())

    // Look for i18next queries specifically
    const i18nextQueries = cache.getAll().filter(query => query.queryKey[0] === 'i18next')
    console.log('🔤 Translation Queries:', i18nextQueries)
  }, [queryClient])

  return null
}
```

## Method 4: Performance Testing

Compare load times with and without TanStack Query:

```javascript
// Test without TanStack Query
const performanceTest = async () => {
  const startTime = performance.now()

  // Load a translation
  await i18next.changeLanguage('de')

  const endTime = performance.now()
  console.log(`⏱️ Load time: ${endTime - startTime}ms`)

  // Load same translation again (should be cached)
  const startTime2 = performance.now()
  await i18next.changeLanguage('en')
  await i18next.changeLanguage('de') // Should be cached
  const endTime2 = performance.now()

  console.log(`⚡ Cached load time: ${endTime2 - startTime2}ms`)
}
```

## Method 5: Error Handling Verification

Test retry logic and error handling:

```javascript
// Test with invalid URL to see retry behavior
const testRetryLogic = () => {
  const backend = new HttpBackend(
    {
      interpolator: {
        interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
      }
    },
    {
      loadPath: 'http://invalid-url/{{lng}}/{{ns}}.json',
      queryClient: queryClient,
      tanstackQuery: {
        enabled: true,
        retry: 3,
        retryDelay: 1000
      }
    }
  )

  console.log('🔄 Testing retry logic...')
  backend.read('en', 'test', (err, data) => {
    console.log('❌ Expected error:', err)
    console.log('🔁 Retries should have occurred')
  })
}
```

## Method 6: React DevTools Verification

If using React, install React Query DevTools:

```bash
npm install @tanstack/react-query-devtools
```

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Look for queries with keys starting with `['i18next', ...]` in the DevTools.

## Automated Tests

### Basic Integration Test

```javascript
describe('TanStack Query Integration', () => {
  it('should use TanStack backend when enabled', async () => {
    const queryClient = new QueryClient()
    const backend = new HttpBackend(
      {
        interpolator: {
          interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
        }
      },
      {
        loadPath: 'http://localhost:3000/locales/{{lng}}/{{ns}}.json',
        queryClient: queryClient,
        tanstackQuery: {
          enabled: true
        }
      }
    )

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(backend.tanstackBackend).toBeTruthy()
    expect(backend.options.queryClient).toBe(queryClient)
  })
})
```

### Caching Test

```javascript
it('should cache translation requests', async () => {
  let requestCount = 0
  const originalFetch = global.fetch

  global.fetch = jest.fn((...args) => {
    requestCount++
    return originalFetch(...args)
  })

  // First load
  await i18next.changeLanguage('en')
  const firstRequestCount = requestCount

  // Second load (should use cache)
  await i18next.changeLanguage('en')
  const secondRequestCount = requestCount

  expect(secondRequestCount).toBe(firstRequestCount) // No additional requests

  global.fetch = originalFetch
})
```

### Fallback Test

```javascript
it('should fall back to standard backend when TanStack fails', async () => {
  const backend = new HttpBackend(
    {
      interpolator: {
        interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
      }
    },
    {
      loadPath: 'http://localhost:3000/locales/{{lng}}/{{ns}}.json',
      // No queryClient provided - should fall back
      tanstackQuery: {
        enabled: true
      }
    }
  )

  expect(backend.tanstackBackend).toBeNull()

  // Should still work with fallback
  return new Promise(resolve => {
    backend.read('en', 'test', (err, data) => {
      expect(err).toBeNull()
      expect(data).toBeTruthy()
      resolve()
    })
  })
})
```

## Common Issues and Solutions

### 1. "Cannot find module '@tanstack/react-query'"

```bash
# Install required dependencies
npm install @tanstack/react-query
```

### 2. QueryClient not found

```javascript
// Ensure QueryClient is properly provided
const queryClient = new QueryClient()

// Pass it to backend options
{
  backend: {
    queryClient: queryClient, // ⚠️ Don't forget this
    tanstackQuery: { enabled: true }
  }
}
```

### 3. Translations not caching

```javascript
// Check your staleTime and cacheTime settings
{
  tanstackQuery: {
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  }
}
```

### 4. Memory issues

```javascript
// Reduce cache time or clear cache periodically
queryClient.clear() // Clear all cache
queryClient.invalidateQueries(['i18next']) // Clear only i18next cache
```

## Visual Verification

### Browser DevTools

1. Open Network tab
2. Load your app
3. Change languages multiple times
4. With TanStack Query: Subsequent language changes should show no network requests
5. Without TanStack Query: Each language change triggers new requests

### React Query DevTools

1. Install and add ReactQueryDevtools
2. Open the devtools panel
3. Look for queries with keys like `['i18next', 'load', 'your-url']`
4. Check query status: loading → success → cached

## Performance Benchmarks

Create a simple benchmark:

```javascript
const benchmark = async () => {
  console.log('🏁 Starting benchmark...')

  // Test initial load
  const start1 = performance.now()
  await i18next.changeLanguage('en')
  const end1 = performance.now()
  console.log(`📊 Initial load: ${end1 - start1}ms`)

  // Test cached load
  const start2 = performance.now()
  await i18next.changeLanguage('de')
  await i18next.changeLanguage('en') // Should be cached
  const end2 = performance.now()
  console.log(`⚡ Cached load: ${end2 - start2}ms`)

  // Test multiple rapid changes
  const start3 = performance.now()
  for (let i = 0; i < 10; i++) {
    await i18next.changeLanguage(i % 2 === 0 ? 'en' : 'de')
  }
  const end3 = performance.now()
  console.log(`🔄 10 rapid changes: ${end3 - start3}ms`)
}
```

## Summary Checklist

✅ **Backend Configuration**

- [ ] QueryClient is created and passed to backend options
- [ ] `tanstackQuery.enabled` is set to `true`
- [ ] QueryClientProvider wraps your app (React/React Native)

✅ **Runtime Verification**

- [ ] `backend.tanstackBackend` is not null
- [ ] Console shows TanStack backend is being used
- [ ] Network requests are reduced due to caching
- [ ] React Query DevTools shows i18next queries

✅ **Functional Testing**

- [ ] Translations load correctly
- [ ] Language changes work as expected
- [ ] Caching improves performance
- [ ] Error handling works properly
- [ ] Fallback works when TanStack fails

✅ **Performance Verification**

- [ ] Initial load time is reasonable
- [ ] Subsequent loads are faster (cached)
- [ ] Memory usage is acceptable
- [ ] No memory leaks detected

If all checks pass, your TanStack Query integration is working correctly! 🎉
