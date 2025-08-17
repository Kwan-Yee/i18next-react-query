/**
 * Example React Native app demonstrating i18next-http-backend with TanStack Query
 * This example shows how to set up the backend with React Native optimizations
 */

import { QueryClientProvider } from '@tanstack/react-query'
import i18next from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { createReactNativeQueryClient, setupReactNativeQuery } from 'i18next-http-backend/lib/react-native-config'
import React, { useEffect } from 'react'
import { initReactI18next, useTranslation } from 'react-i18next'
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native'

// Create QueryClient optimized for React Native
const queryClient = createReactNativeQueryClient({
  defaultOptions: {
    queries: {
      // More aggressive caching for mobile
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
})

// Initialize i18next with TanStack Query backend
i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: __DEV__,
    
    backend: {
      // Your translation server endpoint
      loadPath: 'https://your-api.com/locales/{{lng}}/{{ns}}.json',
      
      // Enable TanStack Query
      queryClient: queryClient,
      tanstackQuery: {
        enabled: true,
        staleTime: 15 * 60 * 1000, // 15 minutes for translations
        cacheTime: 24 * 60 * 60 * 1000, // 24 hours
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(2000 * attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      
      // Custom headers for authentication if needed
      customHeaders: () => ({
        'Authorization': 'Bearer your-token-here',
        'Accept': 'application/json',
      }),
      
      // Query string parameters
      queryStringParams: {
        version: '1.0.0',
      },
    },
    
    interpolation: {
      escapeValue: false,
    },
  })

// Setup React Native optimizations
const cleanupRNOptimizations = setupReactNativeQuery(queryClient)

const TranslationExample: React.FC = () => {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcome', 'Welcome')}</Text>
      <Text style={styles.subtitle}>{t('description', 'This is a React Native app with i18next and TanStack Query')}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="English"
          onPress={() => changeLanguage('en')}
        />
        <Button
          title="Español"
          onPress={() => changeLanguage('es')}
        />
        <Button
          title="Français"
          onPress={() => changeLanguage('fr')}
        />
      </View>
      
      <Text style={styles.currentLang}>
        {t('currentLanguage', 'Current language: {{lng}}', { lng: i18n.language })}
      </Text>
    </View>
  )
}

const App: React.FC = () => {
  useEffect(() => {
    // Cleanup function for React Native optimizations
    return cleanupRNOptimizations
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.safeArea}>
        <TranslationExample />
      </SafeAreaView>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  currentLang: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
})

export default App
