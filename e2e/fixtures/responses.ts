/**
 * Mock CAPIWS response factories for E2E testing
 */

import {
  mockPfxCertificatesRaw,
  mockFtjcTokensRaw,
  mockIdCardReaders,
  mockBaikTokens,
  mockCkcDevices,
  type MockPfxCertificateRaw,
  type MockFtjcTokenRaw,
} from "./certificates";

/**
 * Base response interface
 */
interface BaseResponse {
  success: boolean;
  reason?: string;
}

/**
 * Version response
 */
interface VersionResponse extends BaseResponse {
  major?: string;
  minor?: string;
}

/**
 * List certificates response
 */
interface ListCertificatesResponse extends BaseResponse {
  certificates?: MockPfxCertificateRaw[];
}

/**
 * List tokens response
 */
interface ListTokensResponse extends BaseResponse {
  tokens?: MockFtjcTokenRaw[];
}

/**
 * List readers response
 */
interface ListReadersResponse extends BaseResponse {
  readers?: string[];
}

/**
 * List BAIK tokens response
 */
interface ListBaikTokensResponse extends BaseResponse {
  tokens?: string[];
}

/**
 * List CKC devices response
 */
interface ListCkcResponse extends BaseResponse {
  devices?: string[];
}

/**
 * Load key response
 */
interface LoadKeyResponse extends BaseResponse {
  keyId?: string;
}

/**
 * PKCS7 response
 */
interface Pkcs7Response extends BaseResponse {
  pkcs7_64?: string;
}

/**
 * Create version response
 */
export function createVersionResponse(
  major = "4",
  minor = "86"
): VersionResponse {
  return { success: true, major, minor };
}

/**
 * Create API key response
 */
export function createApiKeyResponse(success = true): BaseResponse {
  return success ? { success: true } : { success: false, reason: "API_KEY_INVALID" };
}

/**
 * Create list certificates response
 */
export function createListCertificatesResponse(
  includeCertificates = true
): ListCertificatesResponse {
  return includeCertificates
    ? { success: true, certificates: mockPfxCertificatesRaw }
    : { success: true, certificates: [] };
}

/**
 * Create list tokens response
 */
export function createListTokensResponse(
  includeTokens = true
): ListTokensResponse {
  return includeTokens
    ? { success: true, tokens: mockFtjcTokensRaw }
    : { success: true, tokens: [] };
}

/**
 * Create list readers response (ID Card)
 */
export function createListReadersResponse(
  pluggedIn = false
): ListReadersResponse {
  return pluggedIn
    ? { success: true, readers: mockIdCardReaders }
    : { success: true, readers: [] };
}

/**
 * Create list BAIK tokens response
 */
export function createListBaikTokensResponse(
  pluggedIn = false
): ListBaikTokensResponse {
  return pluggedIn
    ? { success: true, tokens: mockBaikTokens }
    : { success: true, tokens: [] };
}

/**
 * Create list CKC devices response
 */
export function createListCkcResponse(pluggedIn = false): ListCkcResponse {
  return pluggedIn
    ? { success: true, devices: mockCkcDevices }
    : { success: true, devices: [] };
}

/**
 * Create load key response
 */
export function createLoadKeyResponse(
  success = true,
  keyId = "mock-key-id-12345"
): LoadKeyResponse {
  return success
    ? { success: true, keyId }
    : { success: false, reason: "LOAD_KEY_FAILED" };
}

/**
 * Create verify password response
 */
export function createVerifyPasswordResponse(correct = true): BaseResponse {
  return correct
    ? { success: true }
    : { success: false, reason: "WRONG_PASSWORD" };
}

/**
 * Create PKCS7 signature response
 */
export function createPkcs7Response(success = true): Pkcs7Response {
  if (success) {
    // Mock base64 encoded PKCS7 signature
    const mockSignature =
      "MIIBkQYJKoZIhvcNAQcCoIIBgjCCAX4CAQExDzANBglghkgBZQMEAgEFADALBgkq" +
      "hkiG9w0BBwGgggEBMIH+AgEBMIGfMIGYMQswCQYDVQQGEwJVWjEPMA0GA1UECAwG" +
      "VGFzaGtlbnQxDzANBgNVBAcMBlRhc2hrZW50MRQwEgYDVQQKDAtFeGFtcGxlIExM" +
      "QzEMMAoGA1UECwwDRGV2MRQwEgYDVQQDDAtUZXN0IFNpZ25lcjEdMBsGCSqGSIb3" +
      "DQEJARYOdGVzdEBleGFtcGxlLmNvbQIBATANBglghkgBZQMEAgEFADBBMA0GCWCG" +
      "SAFlAwQCAQUABDAUvpmz9I7X+vqcYqKIBWt5IxZG+v1Lk9oFHNHPKFy6DYqVq1w1" +
      "kRXPtWC9VZQ=";
    return { success: true, pkcs7_64: mockSignature };
  }
  return { success: false, reason: "PKCS7_CREATION_FAILED" };
}

/**
 * Create error response
 */
export function createErrorResponse(reason: string): BaseResponse {
  return { success: false, reason };
}

/**
 * Type for all possible response types
 */
export type MockResponse =
  | BaseResponse
  | VersionResponse
  | ListCertificatesResponse
  | ListTokensResponse
  | ListReadersResponse
  | ListBaikTokensResponse
  | ListCkcResponse
  | LoadKeyResponse
  | Pkcs7Response;
