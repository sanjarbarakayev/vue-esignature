/**
 * Mock utilities for CAPIWS WebSocket testing
 */

import type {
  ICAPIWS,
  CAPIWSFunctionDef,
  CAPIWSCallback,
  CAPIWSErrorCallback,
  CAPIWSBaseResponse,
  CAPIWSVersionResponse,
} from "../../src/types";

/**
 * Create a mock CAPIWS instance for testing
 */
export function createMockCAPIWS(
  overrides: Partial<ICAPIWS> = {}
): jest.Mocked<ICAPIWS> {
  return {
    URL: "wss://localhost:64443/service",
    callFunction: vi.fn(),
    version: vi.fn(),
    apidoc: vi.fn(),
    apikey: vi.fn(),
    ...overrides,
  } as jest.Mocked<ICAPIWS>;
}

/**
 * Create a successful version response
 */
export function createVersionResponse(
  major: string = "3",
  minor: string = "37"
): CAPIWSVersionResponse {
  return {
    success: true,
    major,
    minor,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(reason: string): CAPIWSBaseResponse {
  return {
    success: false,
    reason,
  };
}

/**
 * Mock certificate data for testing
 */
export const mockPfxCertificate = {
  type: "pfx" as const,
  serialNumber: "1234567890",
  validFrom: new Date("2024-01-01"),
  validTo: new Date("2025-01-01"),
  CN: "Test User",
  TIN: "123456789",
  PINFL: "12345678901234",
  UID: "test-uid",
  O: "Test Organization",
  T: "Test Title",
  disk: "C:",
  path: "/certificates/",
  name: "test.pfx",
  alias: "Test Certificate",
};

/**
 * Mock FTJC certificate data for testing
 */
export const mockFtjcCertificate = {
  type: "ftjc" as const,
  serialNumber: "9876543210",
  validFrom: new Date("2024-01-01"),
  validTo: new Date("2025-01-01"),
  CN: "Token User",
  TIN: "987654321",
  PINFL: "98765432109876",
  UID: "token-uid",
  O: "Token Organization",
  T: "Token Title",
  cardUID: "CARD-UID-123",
  statusInfo: "Active",
  ownerName: "Token Owner",
  info: "Token certificate info",
};

/**
 * Mock QRCode library for testing
 */
export class MockQRCode {
  element: HTMLElement;
  options: { width?: number; height?: number };
  lastCode: string | null = null;

  constructor(
    element: HTMLElement,
    options: { width?: number; height?: number } = {}
  ) {
    this.element = element;
    this.options = options;
  }

  makeCode(code: string): void {
    this.lastCode = code;
  }

  clear(): void {
    this.lastCode = null;
  }
}

/**
 * Setup global mocks for CAPIWS
 */
export function setupCAPIWSMocks(): void {
  // Mock WebSocket
  (global as unknown as { WebSocket: unknown }).WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/**
 * Cleanup global mocks
 */
export function cleanupCAPIWSMocks(): void {
  delete (global as unknown as { WebSocket?: unknown }).WebSocket;
}
