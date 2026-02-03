/**
 * E-IMZO Detector Tests
 *
 * Tests for the E-IMZO detection utility.
 * Uses mocked WebSocket to simulate E-IMZO connection scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectEIMZO,
  isEIMZOAvailable,
  getEIMZODownloadUrl,
  getEIMZOWebSocketUrl,
} from "../src/utils/eimzo-detector";

describe("eimzo-detector", () => {
  let originalWebSocket: typeof WebSocket;
  let originalLocation: Location;

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    originalLocation = window.location;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function mockLocation(protocol: string) {
    Object.defineProperty(window, "location", {
      value: { protocol },
      writable: true,
    });
  }

  function createMockWebSocket(options: {
    shouldOpen?: boolean;
    shouldError?: boolean;
    shouldClose?: boolean;
    responseData?: unknown;
    responseDelay?: number;
  }) {
    const {
      shouldOpen = true,
      shouldError = false,
      shouldClose = false,
      responseData = { success: true },
      responseDelay = 0,
    } = options;

    return vi.fn().mockImplementation((url: string) => {
      const ws = {
        url,
        readyState: 0,
        onopen: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onclose: null as ((event: CloseEvent) => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        send: vi.fn().mockImplementation(() => {
          if (ws.onmessage && shouldOpen && !shouldError) {
            setTimeout(() => {
              ws.onmessage?.({
                data: JSON.stringify(responseData),
              } as MessageEvent);
            }, responseDelay);
          }
        }),
        close: vi.fn().mockImplementation(() => {
          ws.readyState = 3;
        }),
      };

      setTimeout(() => {
        if (shouldError) {
          ws.readyState = 3;
          ws.onerror?.({} as Event);
        } else if (shouldClose) {
          ws.readyState = 3;
          ws.onclose?.({} as CloseEvent);
        } else if (shouldOpen) {
          ws.readyState = 1;
          ws.onopen?.({} as Event);
        }
      }, 0);

      return ws;
    });
  }

  describe("detectEIMZO", () => {
    it("should return browserSupported false when WebSocket is not available", async () => {
      const originalWS = globalThis.WebSocket;
      // @ts-expect-error - intentionally deleting for test
      delete globalThis.WebSocket;

      const result = await detectEIMZO();

      expect(result).toEqual({
        isInstalled: false,
        isRunning: false,
        port: null,
        browserSupported: false,
      });

      globalThis.WebSocket = originalWS;
    });

    it("should detect E-IMZO when WebSocket connects successfully on HTTP", async () => {
      mockLocation("http:");
      globalThis.WebSocket = createMockWebSocket({
        shouldOpen: true,
        responseData: { success: true },
      });

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: true,
        isRunning: true,
        port: 64646,
        browserSupported: true,
      });
    });

    it("should detect E-IMZO when WebSocket connects successfully on HTTPS", async () => {
      mockLocation("https:");
      globalThis.WebSocket = createMockWebSocket({
        shouldOpen: true,
        responseData: { success: true },
      });

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: true,
        isRunning: true,
        port: 64443,
        browserSupported: true,
      });
    });

    it("should return not running when WebSocket connection fails", async () => {
      mockLocation("http:");
      globalThis.WebSocket = createMockWebSocket({
        shouldError: true,
      });

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: false,
        isRunning: false,
        port: null,
        browserSupported: true,
      });
    });

    it("should return not running when WebSocket closes", async () => {
      mockLocation("http:");
      globalThis.WebSocket = createMockWebSocket({
        shouldClose: true,
      });

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: false,
        isRunning: false,
        port: null,
        browserSupported: true,
      });
    });

    it("should return not running when connection times out", async () => {
      mockLocation("http:");
      globalThis.WebSocket = vi
        .fn()
        .mockImplementation(() => ({
          readyState: 0,
          onopen: null,
          onerror: null,
          onclose: null,
          onmessage: null,
          send: vi.fn(),
          close: vi.fn(),
        }));

      const resultPromise = detectEIMZO();
      await vi.advanceTimersByTimeAsync(2500);
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: false,
        isRunning: false,
        port: null,
        browserSupported: true,
      });
    });

    it("should handle WebSocket constructor throwing", async () => {
      mockLocation("http:");
      globalThis.WebSocket = vi.fn().mockImplementation(() => {
        throw new Error("WebSocket not supported");
      });

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: false,
        isRunning: false,
        port: null,
        browserSupported: true,
      });
    });

    it("should handle response with success: false", async () => {
      mockLocation("http:");
      globalThis.WebSocket = createMockWebSocket({
        shouldOpen: true,
        responseData: { success: false },
      });

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: false,
        isRunning: false,
        port: null,
        browserSupported: true,
      });
    });

    it("should handle invalid JSON response", async () => {
      mockLocation("http:");
      const MockWS = vi.fn().mockImplementation((url: string) => {
        const ws = {
          url,
          readyState: 0,
          onopen: null as ((event: Event) => void) | null,
          onerror: null as ((event: Event) => void) | null,
          onclose: null as ((event: CloseEvent) => void) | null,
          onmessage: null as ((event: MessageEvent) => void) | null,
          send: vi.fn().mockImplementation(() => {
            setTimeout(() => {
              ws.onmessage?.({
                data: "not valid json",
              } as MessageEvent);
            }, 0);
          }),
          close: vi.fn(),
        };

        setTimeout(() => {
          ws.readyState = 1;
          ws.onopen?.({} as Event);
        }, 0);

        return ws;
      });
      globalThis.WebSocket = MockWS;

      const resultPromise = detectEIMZO();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        isInstalled: true,
        isRunning: true,
        port: 64646,
        browserSupported: true,
      });
    });

  });

  describe("isEIMZOAvailable", () => {
    it("should return true when E-IMZO is running", async () => {
      mockLocation("http:");
      globalThis.WebSocket = createMockWebSocket({
        shouldOpen: true,
        responseData: { success: true },
      });

      const resultPromise = isEIMZOAvailable();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe(true);
    });

    it("should return false when E-IMZO is not running", async () => {
      mockLocation("http:");
      globalThis.WebSocket = createMockWebSocket({
        shouldError: true,
      });

      const resultPromise = isEIMZOAvailable();
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe(false);
    });
  });

  describe("getEIMZODownloadUrl", () => {
    it("should return the correct download URL", () => {
      const url = getEIMZODownloadUrl();
      expect(url).toBe("https://e-imzo.soliq.uz/download/");
    });
  });

  describe("getEIMZOWebSocketUrl", () => {
    it("should return ws URL on HTTP context", () => {
      mockLocation("http:");
      const url = getEIMZOWebSocketUrl();
      expect(url).toBe("ws://127.0.0.1:64646/service/cryptapi");
    });

    it("should return wss URL on HTTPS context", () => {
      mockLocation("https:");
      const url = getEIMZOWebSocketUrl();
      expect(url).toBe("wss://127.0.0.1:64443/service/cryptapi");
    });
  });
});
