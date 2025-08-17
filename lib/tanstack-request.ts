import { QueryClient } from "@tanstack/react-query";
import { I18nextErrorHandler } from "./error-handling.js";
import type {
  I18nextError,
  I18nextRequestOptions,
  I18nextResponse,
  RequestCallback,
  queryKeys,
} from "./types.js";

/**
 * TanStack Query-powered backend for i18next HTTP requests
 * Provides caching, retry logic, and React Native optimizations
 */
export class TanStackI18nextBackend {
  private queryClient: QueryClient;
  private options: I18nextRequestOptions;

  constructor(queryClient: QueryClient, options: I18nextRequestOptions = {}) {
    this.queryClient = queryClient;
    this.options = {
      // Default TanStack Query options optimized for i18next
      tanstackQuery: {
        enabled: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        retryDelay: I18nextErrorHandler.getRetryDelay,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      ...options,
    };
  }

  /**
   * Add query string parameters to URL
   */
  private addQueryString(url: string, params?: Record<string, string>): string {
    if (!params || typeof params !== "object") return url;

    const queryString = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");

    if (!queryString) return url;

    return url + (url.includes("?") ? "&" : "?") + queryString;
  }

  /**
   * Build fetch options from i18next configuration
   */
  private buildFetchOptions(payload?: any): RequestInit {
    const headers: Record<string, string> = {};

    // Add custom headers
    const customHeaders =
      typeof this.options.customHeaders === "function"
        ? this.options.customHeaders()
        : this.options.customHeaders;

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    // Add Node.js User-Agent if in Node environment
    if (
      typeof window === "undefined" &&
      typeof global !== "undefined" &&
      typeof global.process !== "undefined" &&
      global.process.versions?.node
    ) {
      headers[
        "User-Agent"
      ] = `i18next-http-backend (node/${global.process.version}; ${global.process.platform} ${global.process.arch})`;
    }

    // Set content type for POST requests
    if (payload) {
      headers["Content-Type"] = "application/json";
    }

    // Get base request options
    const requestOptions =
      typeof this.options.requestOptions === "function"
        ? this.options.requestOptions(payload)
        : this.options.requestOptions || {};

    return {
      method: payload ? "POST" : "GET",
      headers: {
        ...headers,
        ...requestOptions.headers,
      },
      body: payload
        ? (this.options.stringify || JSON.stringify)(payload)
        : undefined,
      credentials: this.options.withCredentials ? "include" : "same-origin",
      mode: this.options.crossDomain ? "cors" : "same-origin",
      ...requestOptions,
    };
  }

  /**
   * Create a query function for TanStack Query
   */
  private createQueryFn = (url: string, payload?: any) => {
    return async (): Promise<I18nextResponse> => {
      try {
        // Add query string parameters
        const finalUrl = this.addQueryString(
          url,
          this.options.queryStringParams
        );

        // Build fetch options
        const fetchOptions = this.buildFetchOptions(payload);

        // Make the request
        const response = await fetch(finalUrl, fetchOptions);

        if (!response.ok) {
          const error = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          ) as I18nextError;
          error.status = response.status;
          throw error;
        }

        // Get response data
        const textData = await response.text();

        // Parse the response
        let parsedData;
        try {
          if (this.options.parse && typeof textData === "string") {
            parsedData = this.options.parse(textData);
          } else {
            parsedData = textData ? JSON.parse(textData) : {};
          }
        } catch (parseError) {
          const error = new Error(
            `Failed to parse response from ${url}`
          ) as I18nextError;
          error.name = "SyntaxError";
          throw error;
        }

        return {
          status: response.status,
          data: parsedData,
        };
      } catch (error) {
        throw I18nextErrorHandler.transformError(error, url);
      }
    };
  };

  /**
   * Perform a request using TanStack Query with i18next-compatible callback
   */
  async requestWithCallback(
    options: I18nextRequestOptions,
    url: string,
    payload: any,
    callback: RequestCallback
  ): Promise<void> {
    try {
      const response = await this.request(options, url, payload);
      callback(null, response);
    } catch (error) {
      const processedError = I18nextErrorHandler.processForCallback(
        error as I18nextError
      );
      callback(
        processedError.error,
        processedError.retry ? ({ status: 0 } as I18nextResponse) : null
      );
    }
  }

  /**
   * Perform a request using TanStack Query (Promise-based)
   */
  async request(
    options: I18nextRequestOptions,
    url: string,
    payload?: any
  ): Promise<I18nextResponse> {
    // Merge options for this request
    const mergedOptions = { ...this.options, ...options };

    // Create query key
    const queryKey = payload
      ? (queryKeys as any).create(url, payload)
      : (queryKeys as any).load(url, payload);

    // Configure query options
    const queryOptions = {
      queryKey,
      queryFn: this.createQueryFn(url, payload),
      staleTime: mergedOptions.tanstackQuery?.staleTime,
      cacheTime: mergedOptions.tanstackQuery?.cacheTime,
      retry: (failureCount: number, error: I18nextError) => {
        const maxRetries =
          typeof mergedOptions.tanstackQuery?.retry === "number"
            ? mergedOptions.tanstackQuery.retry
            : 3;

        if (failureCount >= maxRetries) return false;
        return I18nextErrorHandler.shouldRetry(error);
      },
      retryDelay:
        mergedOptions.tanstackQuery?.retryDelay ||
        I18nextErrorHandler.getRetryDelay,
      refetchOnWindowFocus:
        mergedOptions.tanstackQuery?.refetchOnWindowFocus ?? false,
      refetchOnReconnect:
        mergedOptions.tanstackQuery?.refetchOnReconnect ?? true,
    };

    try {
      if (payload) {
        // For mutations (POST requests), use fetchQuery directly
        return await this.queryClient.fetchQuery(queryOptions);
      } else {
        // For queries (GET requests), use the standard query
        return await this.queryClient.fetchQuery(queryOptions);
      }
    } catch (error) {
      throw I18nextErrorHandler.transformError(error, url);
    }
  }

  /**
   * Invalidate cached queries for a specific pattern
   */
  invalidateQueries(urlPattern?: string): Promise<void> {
    if (urlPattern) {
      return this.queryClient.invalidateQueries({
        predicate: (query) => {
          const [, , url] = query.queryKey;
          return typeof url === "string" && url.includes(urlPattern);
        },
      });
    }

    return this.queryClient.invalidateQueries({
      queryKey: (queryKeys as any).all,
    });
  }

  /**
   * Clear all cached queries
   */
  clearCache(): void {
    this.queryClient.clear();
  }

  /**
   * Get cached data for a specific query
   */
  getCachedData(url: string, payload?: any): I18nextResponse | undefined {
    const queryKey = payload
      ? (queryKeys as any).create(url, payload)
      : (queryKeys as any).load(url, payload);

    return this.queryClient.getQueryData(queryKey);
  }
}
