/**
 * React Component for Testing TanStack Query Integration
 *
 * This component provides a visual interface to test and verify
 * that the TanStack Query integration is working correctly.
 */

import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function TanStackVerificationComponent() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [logs, setLogs] = useState([])
  const [networkRequests, setNetworkRequests] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)

  // Add a log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  // Monitor network requests
  useEffect(() => {
    const originalFetch = window.fetch
    let requestCount = 0

    window.fetch = function (...args) {
      const url = args[0]
      if (typeof url === 'string' && (url.includes('locales') || url.includes('translation'))) {
        requestCount++
        setNetworkRequests(requestCount)
        addLog(`Network request #${requestCount}: ${url}`, 'network')
      }
      return originalFetch.apply(this, args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Check if TanStack Query is working
  const checkIntegration = () => {
    addLog('🔍 Checking TanStack Query integration...', 'info')

    // Check if backend has TanStack integration
    const backend = i18n.services?.backendConnector?.backend
    if (backend?.tanstackBackend) {
      addLog('✅ TanStack backend detected', 'success')
    } else {
      addLog('❌ TanStack backend not found', 'error')
    }

    // Check QueryClient
    const cache = queryClient.getQueryCache()
    const allQueries = cache.getAll()
    const i18nextQueries = allQueries.filter(query => query.queryKey[0] === 'i18next')

    addLog(`📋 Total queries in cache: ${allQueries.length}`, 'info')
    addLog(`🔤 i18next queries: ${i18nextQueries.length}`, 'info')

    // Log query details
    i18nextQueries.forEach((query, index) => {
      addLog(`  Query ${index + 1}: ${JSON.stringify(query.queryKey)}`, 'info')
      addLog(`  Status: ${query.state.status}`, 'info')
    })

    if (i18nextQueries.length > 0) {
      addLog('✅ TanStack Query caching detected', 'success')
    } else {
      addLog('⚠️ No cached translation queries found', 'warning')
    }
  }

  // Test language switching and caching
  const testLanguageSwitching = async () => {
    setIsVerifying(true)
    addLog('🔄 Testing language switching and caching...', 'info')

    const startRequests = networkRequests

    try {
      // Switch to different languages
      const languages = ['en', 'de', 'en', 'de', 'en']

      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i]
        addLog(`🌐 Switching to: ${lang}`, 'info')

        const startTime = performance.now()
        await i18n.changeLanguage(lang)
        const endTime = performance.now()

        addLog(`⏱️ Load time: ${(endTime - startTime).toFixed(2)}ms`, 'info')

        // Small delay to see the effect
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const endRequests = networkRequests
      const totalRequests = endRequests - startRequests

      addLog(`📊 Total network requests: ${totalRequests}`, 'info')

      if (totalRequests <= 2) {
        addLog('✅ Excellent caching! Minimal network requests.', 'success')
      } else if (totalRequests <= languages.length) {
        addLog('👍 Good caching detected.', 'success')
      } else {
        addLog('⚠️ Caching may not be working optimally.', 'warning')
      }
    } catch (error) {
      addLog(`❌ Error during testing: ${error.message}`, 'error')
    }

    setIsVerifying(false)
  }

  // Clear cache
  const clearCache = () => {
    queryClient.clear()
    addLog('🗑️ Query cache cleared', 'info')
    setNetworkRequests(0)
  }

  // Invalidate i18next queries
  const invalidateTranslations = () => {
    queryClient.invalidateQueries(['i18next'])
    addLog('🔄 Translation queries invalidated', 'info')
  }

  // Clear logs
  const clearLogs = () => {
    setLogs([])
  }

  const getLogStyle = type => {
    const baseStyle = {
      padding: '4px 8px',
      margin: '2px 0',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' }
      case 'error':
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' }
      case 'warning':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' }
      case 'network':
        return { ...baseStyle, backgroundColor: '#cce7ff', color: '#004085' }
      default:
        return { ...baseStyle, backgroundColor: '#f8f9fa', color: '#495057' }
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔍 TanStack Query Integration Verification</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>📊 Status</h3>
        <p>
          <strong>Current Language:</strong> {i18n.language}
        </p>
        <p>
          <strong>Network Requests:</strong> {networkRequests}
        </p>
        <p>
          <strong>Sample Translation:</strong> {t('hello', 'Hello World')}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🧪 Tests</h3>
        <button
          onClick={checkIntegration}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Integration
        </button>

        <button
          onClick={testLanguageSwitching}
          disabled={isVerifying}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: isVerifying ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isVerifying ? 'not-allowed' : 'pointer'
          }}
        >
          {isVerifying ? 'Testing...' : 'Test Language Switching'}
        </button>

        <button
          onClick={clearCache}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Cache
        </button>

        <button
          onClick={invalidateTranslations}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Invalidate Translations
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🌐 Language Switcher</h3>
        {['en', 'de', 'fr', 'es'].map(lang => (
          <button
            key={lang}
            onClick={() => i18n.changeLanguage(lang)}
            style={{
              padding: '6px 12px',
              margin: '4px',
              backgroundColor: i18n.language === lang ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📝 Logs</h3>
          <button
            onClick={clearLogs}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear Logs
          </button>
        </div>

        <div
          style={{
            height: '300px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '10px',
            backgroundColor: '#f8f9fa'
          }}
        >
          {logs.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
              No logs yet. Click "Check Integration" to start testing.
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={getLogStyle(log.type)}>
                <span style={{ color: '#6c757d' }}>[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4>💡 What to Look For:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>
            <strong>TanStack backend detected:</strong> Confirms integration is active
          </li>
          <li>
            <strong>Cached queries:</strong> Shows translations are being cached
          </li>
          <li>
            <strong>Minimal network requests:</strong> Indicates caching is working
          </li>
          <li>
            <strong>Fast load times:</strong> Cached translations load quickly
          </li>
        </ul>
      </div>
    </div>
  )
}
