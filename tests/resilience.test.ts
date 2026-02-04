/**
 * Resilience Utilities Tests
 *
 * Tests for timeout, retry, and error classification utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyError,
  isTransientError,
  calculateBackoffDelay,
  withTimeout,
  withRetry,
  withResilience,
  createCancellableDelay,
  isTimeoutError,
  isRetryExhaustedError,
  TimeoutError,
  RetryExhaustedError,
  DEFAULT_RESILIENCE_OPTIONS,
} from "../src/utils/resilience";

/**
 * Helper to safely await a promise that may reject after timer advancement.
 * Returns the settled result to prevent unhandled rejection warnings.
 */
async function settleWithTimers<T>(
  createPromise: () => Promise<T>
): Promise<PromiseSettledResult<T>> {
  const promise = createPromise();
  await vi.advanceTimersByTimeAsync(100000);
  const [result] = await Promise.allSettled([promise]);
  return result;
}

describe("Resilience Utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("classifyError", () => {
    it("should classify WebSocket close code 1006 as transient", () => {
      expect(classifyError(1006)).toBe("transient");
    });

    it("should classify WebSocket close code 1001 as transient", () => {
      expect(classifyError(1001)).toBe("transient");
    });

    it("should classify WebSocket close code 1011 as transient", () => {
      expect(classifyError(1011)).toBe("transient");
    });

    it("should classify WebSocket close code 1012 as transient", () => {
      expect(classifyError(1012)).toBe("transient");
    });

    it("should classify WebSocket close code 1013 as transient", () => {
      expect(classifyError(1013)).toBe("transient");
    });

    it("should classify WebSocket close code 1014 as transient", () => {
      expect(classifyError(1014)).toBe("transient");
    });

    it("should classify normal close code 1000 as application", () => {
      expect(classifyError(1000)).toBe("application");
    });

    it("should classify BadPaddingException as application error", () => {
      const error = new Error("BadPaddingException: invalid padding");
      expect(classifyError(error)).toBe("application");
    });

    it("should classify InvalidKeyException as application error", () => {
      const error = new Error("InvalidKeyException: key not found");
      expect(classifyError(error)).toBe("application");
    });

    it("should classify CertificateExpired as application error", () => {
      const error = new Error("CertificateExpired");
      expect(classifyError(error)).toBe("application");
    });

    it("should classify network errors as transient", () => {
      const error = new Error("Network connection failed");
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify connection errors as transient", () => {
      const error = new Error("Connection refused");
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify timeout errors as transient", () => {
      const error = new Error("Request timeout");
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify ECONNREFUSED as transient", () => {
      const error = new Error("ECONNREFUSED");
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify ECONNRESET as transient", () => {
      const error = new Error("ECONNRESET");
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify WebSocket errors as transient", () => {
      const error = new Error("WebSocket closed unexpectedly");
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify TimeoutError as transient", () => {
      const error = new TimeoutError("Operation timed out", 5000);
      expect(classifyError(error)).toBe("transient");
    });

    it("should classify unknown errors as unknown", () => {
      const error = new Error("Something unexpected happened");
      expect(classifyError(error)).toBe("unknown");
    });

    it("should classify non-Error values as unknown", () => {
      expect(classifyError("string error")).toBe("unknown");
      expect(classifyError({ message: "object error" })).toBe("unknown");
      expect(classifyError(null)).toBe("unknown");
      expect(classifyError(undefined)).toBe("unknown");
    });
  });

  describe("isTransientError", () => {
    it("should return true for transient errors", () => {
      expect(isTransientError(1006)).toBe(true);
      expect(isTransientError(new Error("Network error"))).toBe(true);
      expect(isTransientError(new TimeoutError("Timeout", 5000))).toBe(true);
    });

    it("should return false for application errors", () => {
      expect(isTransientError(new Error("BadPaddingException"))).toBe(false);
      expect(isTransientError(new Error("InvalidKeyException"))).toBe(false);
    });

    it("should return true for unknown errors (conservative approach)", () => {
      expect(isTransientError(new Error("Unknown error"))).toBe(true);
    });
  });

  describe("calculateBackoffDelay", () => {
    it("should return base delay for first attempt", () => {
      // Mock Math.random to return 0.5 (no jitter)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const delay = calculateBackoffDelay(1, 1000, 10000, 2);
      expect(delay).toBe(1000);
    });

    it("should double delay for second attempt", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const delay = calculateBackoffDelay(2, 1000, 10000, 2);
      expect(delay).toBe(2000);
    });

    it("should quadruple delay for third attempt", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const delay = calculateBackoffDelay(3, 1000, 10000, 2);
      expect(delay).toBe(4000);
    });

    it("should respect maxDelay", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const delay = calculateBackoffDelay(10, 1000, 10000, 2);
      expect(delay).toBe(10000);
    });

    it("should add jitter to delay", () => {
      // Random = 0 means -25% jitter
      vi.spyOn(Math, "random").mockReturnValue(0);
      const delayLow = calculateBackoffDelay(1, 1000, 10000, 2);

      // Random = 1 means +25% jitter
      vi.spyOn(Math, "random").mockReturnValue(1);
      const delayHigh = calculateBackoffDelay(1, 1000, 10000, 2);

      expect(delayLow).toBeLessThan(1000);
      expect(delayHigh).toBeGreaterThan(1000);
      expect(delayLow).toBeGreaterThanOrEqual(750); // 1000 - 25%
      expect(delayHigh).toBeLessThanOrEqual(1250); // 1000 + 25%
    });

    it("should work with custom multiplier", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const delay = calculateBackoffDelay(2, 1000, 10000, 3);
      expect(delay).toBe(3000); // 1000 * 3^1
    });
  });

  describe("withTimeout", () => {
    it("should resolve if operation completes before timeout", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const promise = withTimeout(operation, { timeout: 5000 });
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe("success");
    });

    it("should reject with TimeoutError if operation times out", async () => {
      const operation = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const result = await settleWithTimers(() =>
        withTimeout(operation, { timeout: 5000 })
      );

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(TimeoutError);
        expect((result.reason as Error).message).toContain("5000ms");
      }
    });

    it("should use custom timeout message", async () => {
      const operation = vi.fn().mockImplementation(
        () => new Promise(() => {})
      );

      const result = await settleWithTimers(() =>
        withTimeout(operation, {
          timeout: 5000,
          timeoutMessage: "Custom timeout message",
        })
      );

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(TimeoutError);
        expect((result.reason as Error).message).toBe("Custom timeout message");
      }
    });

    it("should propagate operation errors", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Operation failed"));

      const result = await settleWithTimers(() =>
        withTimeout(operation, { timeout: 5000 })
      );

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(Error);
        expect((result.reason as Error).message).toBe("Operation failed");
      }
    });

    it("should use default timeout if not specified", async () => {
      const operation = vi.fn().mockImplementation(
        () => new Promise(() => {})
      );

      const result = await settleWithTimers(() => withTimeout(operation));

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(TimeoutError);
      }
    });
  });

  describe("withRetry", () => {
    it("should return result on first successful attempt", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const result = await withRetry(operation, { maxRetries: 3 });

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on transient error", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const resultPromise = withRetry(operation, {
        maxRetries: 3,
        baseDelay: 100,
      });

      // Advance through first retry delay
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on application error", async () => {
      const operation = vi
        .fn()
        .mockRejectedValue(new Error("BadPaddingException"));

      const result = await settleWithTimers(() =>
        withRetry(operation, { maxRetries: 3, baseDelay: 100 })
      );

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(Error);
        expect((result.reason as Error).message).toBe("BadPaddingException");
      }
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should throw RetryExhaustedError after max retries", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await settleWithTimers(() =>
        withRetry(operation, {
          maxRetries: 2,
          baseDelay: 100,
        })
      );

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(RetryExhaustedError);
      }
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should call onRetry callback before each retry", async () => {
      const onRetry = vi.fn();
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const resultPromise = withRetry(operation, {
        maxRetries: 3,
        baseDelay: 100,
        onRetry,
      });

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(500);

      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error), expect.any(Number));
    });

    it("should use custom isRetryable function", async () => {
      const customRetryable = vi.fn().mockReturnValue(true);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Custom error"))
        .mockResolvedValueOnce("success");

      const resultPromise = withRetry(operation, {
        maxRetries: 3,
        baseDelay: 100,
        isRetryable: customRetryable,
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe("success");
      expect(customRetryable).toHaveBeenCalled();
    });
  });

  describe("withResilience", () => {
    it("should combine timeout and retry", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const resultPromise = withResilience(operation, {
        timeout: 5000,
        maxRetries: 3,
        baseDelay: 100,
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should respect enableRetry: false", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await settleWithTimers(() =>
        withResilience(operation, {
          enableRetry: false,
          timeout: 5000,
        })
      );

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(Error);
        expect((result.reason as Error).message).toBe("Network error");
      }
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should respect enableTimeout: false", async () => {
      // This test verifies that disabling timeout works
      const operation = vi.fn().mockResolvedValue("success");

      const result = await withResilience(operation, {
        enableTimeout: false,
        enableRetry: false,
      });

      expect(result).toBe("success");
    });
  });

  describe("createCancellableDelay", () => {
    it("should resolve after delay", async () => {
      const { promise } = createCancellableDelay(1000);
      const resolved = vi.fn();

      promise.then(resolved);

      expect(resolved).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(resolved).toHaveBeenCalled();
    });

    it("should reject when cancelled", async () => {
      const { promise, cancel } = createCancellableDelay(1000);

      cancel();

      const [result] = await Promise.allSettled([promise]);

      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(Error);
        expect((result.reason as Error).message).toBe("Delay cancelled");
      }
    });
  });

  describe("isTimeoutError", () => {
    it("should return true for TimeoutError", () => {
      const error = new TimeoutError("Timeout", 5000);
      expect(isTimeoutError(error)).toBe(true);
    });

    it("should return false for other errors", () => {
      expect(isTimeoutError(new Error("Not a timeout"))).toBe(false);
      expect(isTimeoutError(new RetryExhaustedError("Retry", 3, null))).toBe(
        false
      );
    });
  });

  describe("isRetryExhaustedError", () => {
    it("should return true for RetryExhaustedError", () => {
      const error = new RetryExhaustedError("Retry exhausted", 3, null);
      expect(isRetryExhaustedError(error)).toBe(true);
    });

    it("should return false for other errors", () => {
      expect(isRetryExhaustedError(new Error("Not a retry error"))).toBe(false);
      expect(isRetryExhaustedError(new TimeoutError("Timeout", 5000))).toBe(
        false
      );
    });
  });

  describe("TimeoutError", () => {
    it("should have correct name and timeout property", () => {
      const error = new TimeoutError("Operation timed out", 5000);

      expect(error.name).toBe("TimeoutError");
      expect(error.timeout).toBe(5000);
      expect(error.message).toBe("Operation timed out");
    });
  });

  describe("RetryExhaustedError", () => {
    it("should have correct name, attempts, and lastError properties", () => {
      const lastError = new Error("Last error");
      const error = new RetryExhaustedError(
        "All retries exhausted",
        3,
        lastError
      );

      expect(error.name).toBe("RetryExhaustedError");
      expect(error.attempts).toBe(3);
      expect(error.lastError).toBe(lastError);
      expect(error.message).toBe("All retries exhausted");
    });
  });
});
