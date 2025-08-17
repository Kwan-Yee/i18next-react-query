# React Native Example with TanStack Query

This example demonstrates how to use `i18next-http-backend` with TanStack Query in a React Native application.

## Features

- ✅ TanStack Query integration for advanced caching
- ✅ React Native optimizations (app state, network handling)
- ✅ TypeScript support with strict typing
- ✅ Offline-first approach with intelligent caching
- ✅ Automatic retry logic for network failures
- ✅ Background refetching when network reconnects

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Install iOS dependencies (iOS only):**
   ```bash
   cd ios && pod install
   ```

3. **Update the API endpoint:**
   - Open `App.tsx`
   - Change `loadPath` to your translation API endpoint

## Configuration

### Basic Setup

```typescript
import { QueryClient } from '@tanstack/react-query'
import HttpBackend from 'i18next-http-backend'
import { createReactNativeQueryClient } from 'i18next-http-backend/lib/react-native-config'

// Create optimized QueryClient for React Native
const queryClient = createReactNativeQueryClient()

i18next
  .use(HttpBackend)
  .init({
    backend: {
      loadPath: 'https://your-api.com/locales/{{lng}}/{{ns}}.json',
      queryClient: queryClient,
      tanstackQuery: {
        enabled: true,
        staleTime: 15 * 60 * 1000, // 15 minutes
        cacheTime: 24 * 60 * 60 * 1000, // 24 hours
        retry: 2,
        refetchOnReconnect: true,
      },
    },
  })
```

### Advanced Configuration

```typescript
import { setupReactNativeQuery } from 'i18next-http-backend/lib/react-native-config'

const queryClient = createReactNativeQueryClient({
  defaultOptions: {
    queries: {
      // Custom cache configuration
      staleTime: 10 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => {
        // Custom retry logic
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

// Setup React Native optimizations
const cleanup = setupReactNativeQuery(queryClient)

// Don't forget to cleanup
useEffect(() => cleanup, [])
```

## Key Benefits

### 1. **Enhanced Caching**
- Translations are cached for 24 hours by default
- Stale-while-revalidate strategy
- Background updates when possible

### 2. **Network Resilience**
- Automatic retry on network failures
- Intelligent exponential backoff
- Works seamlessly offline

### 3. **React Native Optimizations**
- App state awareness (refetch on app focus)
- Network state handling with NetInfo
- Memory efficient caching

### 4. **Performance**
- Reduced network requests
- Faster app startup with cached translations
- Background updates don't block UI

## Usage Examples

### Basic Translation

```typescript
const { t } = useTranslation()

return (
  <Text>{t('welcome', 'Welcome to our app!')}</Text>
)
```

### Language Switching

```typescript
const { i18n } = useTranslation()

const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng) // Will use cache if available
}
```

### Programmatic Cache Management

```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// Force refresh all translations
const refreshTranslations = () => {
  queryClient.invalidateQueries(['i18next'])
}

// Clear translation cache
const clearCache = () => {
  queryClient.removeQueries(['i18next'])
}
```

## Troubleshooting

### Common Issues

1. **Network errors on startup:**
   - Ensure your API endpoint is accessible
   - Check CORS configuration if testing on simulator

2. **Translations not updating:**
   - Check `staleTime` configuration
   - Use `queryClient.invalidateQueries(['i18next'])` to force refresh

3. **App crashes on language change:**
   - Ensure all translation keys have fallbacks
   - Check network connectivity

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
i18next.init({
  debug: __DEV__, // Enable in development
  backend: {
    // ... your config
  },
})
```

## Best Practices

1. **Cache Configuration:**
   ```typescript
   tanstackQuery: {
     staleTime: 15 * 60 * 1000, // 15 minutes
     cacheTime: 24 * 60 * 60 * 1000, // 24 hours
     retry: 2,
   }
   ```

2. **Error Handling:**
   ```typescript
   // Provide fallback translations
   t('key', 'Default text if translation fails')
   ```

3. **Performance:**
   ```typescript
   // Preload important languages
   i18next.init({
     preload: ['en', 'es'], // Languages to cache immediately
   })
   ```

## Running the Example

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```
