import type { I18nextError } from "./types.js";

/**
 * Error handler that maintains compatibility with i18next's existing error handling patterns
 * while leveraging TanStack Query's retry mechanisms
 */
export class I18nextErrorHandler {
  /**
   * Transform various error types into i18next-compatible error format
   * @param error - The original error from fetch or TanStack Query
   * @param url - The URL that was being requested
   * @returns Transformed error with retry indication
   */
  static transformError(error: any, url: string): I18nextError {
    const i18nextError = new Error() as I18nextError;
    i18nextError.url = url;

    // Handle Response-like errors (fetch API)
    if (error?.response || error?.status) {
      const status = error.response?.status || error.status;
      i18nextError.status = status;

      if (status >= 500 && status < 600) {
        i18nextError.message = `failed loading ${url}; status code: ${status}`;
        i18nextError.retry = true;
        return i18nextError;
      }

      if (status >= 400 && status < 500) {
        i18nextError.message = `failed loading ${url}; status code: ${status}`;
        i18nextError.retry = false;
        return i18nextError;
      }
    }

    // Handle network errors and other fetch errors
    if (error?.message) {
      const errorMessage = error.message.toLowerCase();
      const networkErrorTerms = [
        "failed",
        "fetch",
        "network",
        "load",
        "timeout",
        "abort",
      ];

      const isNetworkError = networkErrorTerms.some((term) =>
        errorMessage.includes(term)
      );

      if (isNetworkError) {
        i18nextError.message = `failed loading ${url}: ${error.message}`;
        i18nextError.retry = true;
        return i18nextError;
      }
    }

    // Handle parsing errors
    if (error?.name === "SyntaxError" || error?.message?.includes("JSON")) {
      i18nextError.message = `failed parsing ${url} to json`;
      i18nextError.retry = false;
      return i18nextError;
    }

    // Default error handling
    i18nextError.message = error?.message || "Unknown error occurred";
    i18nextError.retry = false;

    return i18nextError;
  }

  /**
   * Determine if an error should trigger a retry based on i18next conventions
   * @param error - The error to evaluate
   * @returns Whether the operation should be retried
   */
  static shouldRetry(error: I18nextError): boolean {
    return error.retry === true;
  }

  /**
   * Calculate retry delay with exponential backoff, matching i18next patterns
   * @param attemptIndex - The current retry attempt (0-based)
   * @returns Delay in milliseconds
   */
  static getRetryDelay(attemptIndex: number): number {
    // Exponential backoff: 1s, 2s, 4s, capped at 30s
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  }

  /**
   * Check if error indicates the resource should be retried later vs failed permanently
   * This is used by i18next's backend connector for retry logic
   * @param error - The error to check
   * @returns Object with retry flag and processed error
   */
  static processForCallback(error: I18nextError): {
    error: any;
    retry: boolean;
  } {
    if (!error) {
      return { error: null, retry: false };
    }

    // Network errors should be retried
    if (error.retry === true) {
      return { error: error.message, retry: true };
    }

    // Client errors (4xx) should not be retried
    if (error.status && error.status >= 400 && error.status < 500) {
      return { error: error.message, retry: false };
    }

    // Server errors (5xx) should be retried
    if (error.status && error.status >= 500 && error.status < 600) {
      return { error: error.message, retry: true };
    }

    // Default: don't retry unless explicitly marked
    return { error: error.message, retry: false };
  }
}
