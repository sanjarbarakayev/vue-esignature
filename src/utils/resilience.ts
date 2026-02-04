/**
 * Resilience Utilities for Vue E-Signature
 *
 * Provides timeout handling, retry logic with exponential backoff,
 * and error classification for robust WebSocket communication.
 *
 * @example
 * ```typescript
 * import { withResilience, TimeoutError, RetryExhaustedError } from '@eimzo/vue'
 *
 * // Wrap an operation with timeout and retry
 * const result = await withResilience(
 *   () => fetchData(),
 *   { timeout: 5000, maxRetries: 3 }
 * )
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds between retries (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 10000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Custom function to determine if an error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback fired before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

/**
 * Options for timeout behavior
 */
export interface TimeoutOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom timeout error message */
  timeoutMessage?: string;
}

/**
 * Combined options for resilience wrapper
 */
export interface ResilienceOptions extends RetryOptions, TimeoutOptions {
  /** Enable retry logic (default: true) */
  enableRetry?: boolean;
  /** Enable timeout logic (default: true) */
  enableTimeout?: boolean;
}

/**
 * Error classification types
 */
export type ErrorType = "transient" | "application" | "unknown";

// ============================================================================
// Default Options
// ============================================================================

/**
 * Default resilience configuration
 */
export const DEFAULT_RESILIENCE_OPTIONS: Required<
  Omit<ResilienceOptions, "isRetryable" | "onRetry" | "timeoutMessage">
> = {
  timeout: 30000,
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  enableRetry: true,
  enableTimeout: true,
};

// ============================================================================
// Custom Errors
// ============================================================================

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends Error {
  readonly name = "TimeoutError" as const;
  readonly timeout: number;

  constructor(message: string, timeout: number) {
    super(message);
    this.timeout = timeout;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when all retry attempts are exhausted
 */
export class RetryExhaustedError extends Error {
  readonly name = "RetryExhaustedError" as const;
  readonly attempts: number;
  readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);
    this.attempts = attempts;
    this.lastError = lastError;
    Object.setPrototypeOf(this, RetryExhaustedError.prototype);
  }
}

// ============================================================================
// WebSocket Close Codes (for error classification)
// ============================================================================

/**
 * WebSocket close codes that indicate transient errors (retryable)
 */
const TRANSIENT_WS_CLOSE_CODES = new Set([
  1001, // Going Away - server is shutting down
  1006, // Abnormal Closure - connection was closed abnormally
  1011, // Unexpected Condition - server encountered unexpected condition
  1012, // Service Restart - server is restarting
  1013, // Try Again Later - server is temporarily overloaded
  1014, // Bad Gateway - server acting as gateway received invalid response
]);

/**
 * Error messages that indicate application-level errors (not retryable)
 */
const APPLICATION_ERROR_PATTERNS = [
  "BadPaddingException",
  "InvalidKeyException",
  "CertificateExpired",
  "CertificateNotYetValid",
  "InvalidPassword",
  "KeyNotFound",
  "CertificateRevoked",
];

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classify an error as transient, application, or unknown
 *
 * - Transient errors are typically network/connection issues that may resolve on retry
 * - Application errors are business logic errors that won't resolve on retry
 * - Unknown errors cannot be classified
 *
 * @param error - The error to classify
 * @returns The error classification
 *
 * @example
 * ```typescript
 * const classification = classifyError(error)
 * if (classification === 'transient') {
 *   // Retry the operation
 * }
 * ```
 */
export function classifyError(error: unknown): ErrorType {
  // Handle WebSocket close codes
  if (typeof error === "number") {
    return TRANSIENT_WS_CLOSE_CODES.has(error) ? "transient" : "application";
  }

  // Handle CloseEvent
  if (error instanceof Event && "code" in error) {
    const code = (error as CloseEvent).code;
    return TRANSIENT_WS_CLOSE_CODES.has(code) ? "transient" : "application";
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for application-level errors
    for (const pattern of APPLICATION_ERROR_PATTERNS) {
      if (message.includes(pattern.toLowerCase())) {
        return "application";
      }
    }

    // Check for common transient error patterns
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("socket") ||
      message.includes("websocket")
    ) {
      return "transient";
    }

    // TimeoutError is always transient
    if (error instanceof TimeoutError) {
      return "transient";
    }
  }

  return "unknown";
}

/**
 * Check if an error is transient (retryable)
 *
 * @param error - The error to check
 * @returns True if the error is transient and the operation should be retried
 *
 * @example
 * ```typescript
 * if (isTransientError(error)) {
 *   await retry(operation)
 * } else {
 *   throw error
 * }
 * ```
 */
export function isTransientError(error: unknown): boolean {
  const classification = classifyError(error);
  return classification === "transient" || classification === "unknown";
}

// ============================================================================
// Backoff Calculation
// ============================================================================

/**
 * Calculate the delay before the next retry attempt using exponential backoff
 *
 * @param attempt - Current attempt number (1-based)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @param multiplier - Backoff multiplier
 * @returns Delay in milliseconds with jitter
 *
 * @example
 * ```typescript
 * const delay = calculateBackoffDelay(1, 1000, 10000, 2) // ~1000ms
 * const delay2 = calculateBackoffDelay(2, 1000, 10000, 2) // ~2000ms
 * const delay3 = calculateBackoffDelay(3, 1000, 10000, 2) // ~4000ms
 * ```
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  // Calculate exponential delay: baseDelay * multiplier^(attempt-1)
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt - 1);

  // Clamp to maxDelay
  const clampedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = 0.25;
  const jitterRange = clampedDelay * jitter;
  const randomJitter = Math.random() * jitterRange * 2 - jitterRange;

  return Math.max(0, Math.floor(clampedDelay + randomJitter));
}

// ============================================================================
// Timeout Wrapper
// ============================================================================

/**
 * Wrap a Promise with a timeout
 *
 * @param operation - The async operation to wrap
 * @param options - Timeout options
 * @returns Promise that resolves with the operation result or rejects with TimeoutError
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   () => fetch('/api/data'),
 *   { timeout: 5000, timeoutMessage: 'API call timed out' }
 * )
 * ```
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const timeout = options.timeout ?? DEFAULT_RESILIENCE_OPTIONS.timeout;
  const timeoutMessage =
    options.timeoutMessage ?? `Operation timed out after ${timeout}ms`;

  return new Promise<T>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let completed = false;

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new TimeoutError(timeoutMessage, timeout));
      }
    }, timeout);

    // Run the operation
    operation()
      .then((result) => {
        if (!completed) {
          completed = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          resolve(result);
        }
      })
      .catch((error) => {
        if (!completed) {
          completed = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          reject(error);
        }
      });
  });
}

// ============================================================================
// Retry Wrapper
// ============================================================================

/**
 * Wrap an operation with retry logic and exponential backoff
 *
 * @param operation - The async operation to retry
 * @param options - Retry options
 * @returns Promise that resolves with the operation result or rejects with RetryExhaustedError
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => connectToServer(),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms due to: ${error}`)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_RESILIENCE_OPTIONS.maxRetries;
  const baseDelay = options.baseDelay ?? DEFAULT_RESILIENCE_OPTIONS.baseDelay;
  const maxDelay = options.maxDelay ?? DEFAULT_RESILIENCE_OPTIONS.maxDelay;
  const backoffMultiplier =
    options.backoffMultiplier ?? DEFAULT_RESILIENCE_OPTIONS.backoffMultiplier;
  const isRetryableFn = options.isRetryable ?? isTransientError;
  const onRetry = options.onRetry;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this was the last attempt
      if (attempt > maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableFn(error)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateBackoffDelay(
        attempt,
        baseDelay,
        maxDelay,
        backoffMultiplier
      );

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt, error, delay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new RetryExhaustedError(
    `Operation failed after ${maxRetries + 1} attempts`,
    maxRetries + 1,
    lastError
  );
}

// ============================================================================
// Combined Resilience Wrapper
// ============================================================================

/**
 * Wrap an operation with both timeout and retry logic
 *
 * @param operation - The async operation to wrap
 * @param options - Combined resilience options
 * @returns Promise that resolves with the operation result
 *
 * @example
 * ```typescript
 * const result = await withResilience(
 *   () => signDocument(data),
 *   {
 *     timeout: 30000,
 *     maxRetries: 3,
 *     onRetry: (attempt, error) => {
 *       console.log(`Signing attempt ${attempt} failed, retrying...`)
 *     }
 *   }
 * )
 * ```
 */
export async function withResilience<T>(
  operation: () => Promise<T>,
  options: ResilienceOptions = {}
): Promise<T> {
  const enableRetry = options.enableRetry ?? DEFAULT_RESILIENCE_OPTIONS.enableRetry;
  const enableTimeout =
    options.enableTimeout ?? DEFAULT_RESILIENCE_OPTIONS.enableTimeout;

  // Build the operation with optional timeout
  const operationWithTimeout = enableTimeout
    ? () =>
        withTimeout(operation, {
          timeout: options.timeout,
          timeoutMessage: options.timeoutMessage,
        })
    : operation;

  // Wrap with optional retry
  if (enableRetry) {
    return withRetry(operationWithTimeout, {
      maxRetries: options.maxRetries,
      baseDelay: options.baseDelay,
      maxDelay: options.maxDelay,
      backoffMultiplier: options.backoffMultiplier,
      isRetryable: options.isRetryable,
      onRetry: options.onRetry,
    });
  }

  return operationWithTimeout();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a cancellable delay promise
 *
 * @param ms - Delay in milliseconds
 * @returns Object with promise and cancel function
 *
 * @example
 * ```typescript
 * const { promise, cancel } = createCancellableDelay(5000)
 * // Later: cancel() to abort the delay
 * await promise
 * ```
 */
export function createCancellableDelay(ms: number): {
  promise: Promise<void>;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let rejectFn: ((reason: Error) => void) | null = null;

  const promise = new Promise<void>((resolve, reject) => {
    rejectFn = reject;
    timeoutId = setTimeout(resolve, ms);
  });

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (rejectFn) {
      rejectFn(new Error("Delay cancelled"));
    }
  };

  return { promise, cancel };
}

/**
 * Check if an error is a TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Check if an error is a RetryExhaustedError
 */
export function isRetryExhaustedError(
  error: unknown
): error is RetryExhaustedError {
  return error instanceof RetryExhaustedError;
}
