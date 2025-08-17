/**
 * Query key factory for i18next TanStack Query integration
 * Centralized query key definitions for consistent caching
 */

export const queryKeys = {
  all: ['i18next'] as const,
  load: (url: string) => ['i18next', 'load', url] as const,
  create: (url: string, payload?: any) => ['i18next', 'save', url, payload] as const
}
