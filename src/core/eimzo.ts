/**
 * ESignature - Main Electronic Digital Signature Service Class
 *
 * This class provides a high-level Promise-based API for interacting with
 * the E-IMZO digital signature system used in Uzbekistan.
 *
 * @example
 * ```typescript
 * import { ESignature } from '@sanjarbarakayev/vue-esignature'
 *
 * const signer = new ESignature()
 *
 * // Initialize the service
 * await signer.install()
 *
 * // List available certificates
 * const certs = await signer.listAllUserKeys()
 *
 * // Load a key and sign data
 * const { id } = await signer.loadKey(selectedCert)
 * const signature = await signer.createPkcs7(id, 'data to sign')
 * ```
 *
 * @example
 * ```typescript
 * // With resilience options
 * const signer = new ESignature({
 *   timeout: 15000,
 *   enableRetry: true,
 *   maxRetries: 3,
 *   onRetry: (operation, attempt, error) => {
 *     console.log(`${operation} failed (attempt ${attempt}): ${error.message}`)
 *   }
 * })
 * ```
 */

import { EIMZOClient } from "./client";
import type {
  Certificate,
  LoadKeyResult,
  SignPkcs7Result,
  VersionInfo,
  ESignatureOptions,
  ResilienceOptions,
} from "../types";
import { EIMZO_VERSION } from "../types";
import { getErrorMessage } from "../i18n";
import {
  withResilience,
  isTransientError,
  TimeoutError,
  RetryExhaustedError,
} from "../utils/resilience";

/**
 * Default resilience options for ESignature operations
 */
const DEFAULT_ESIGNATURE_OPTIONS: Required<
  Omit<ESignatureOptions, "onRetry">
> = {
  timeout: 30000,
  enableRetry: true,
  maxRetries: 3,
};

/**
 * Main E-Signature service class providing Promise-based API
 */
export class ESignature {
  private _loadedKey: Certificate | null = null;
  private readonly options: ESignatureOptions;

  apiKeys: string[] = [
    "localhost",
    "96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B",
    "127.0.0.1",
    "A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F",
  ];

  /**
   * Create a new ESignature instance
   *
   * @param options - Optional configuration for resilience behavior
   */
  constructor(options: ESignatureOptions = {}) {
    this.options = { ...DEFAULT_ESIGNATURE_OPTIONS, ...options };
  }

  get loadedKey(): Certificate | null {
    return this._loadedKey;
  }

  set loadedKey(value: Certificate | null) {
    this._loadedKey = value;
  }

  /**
   * Execute an operation with resilience (timeout + retry)
   *
   * @param operationName - Name of the operation (for logging/callbacks)
   * @param operation - The async operation to execute
   * @param overrideOptions - Optional override for resilience options
   * @returns Promise that resolves with the operation result
   *
   * @internal
   */
  private async executeWithResilience<T>(
    operationName: string,
    operation: () => Promise<T>,
    overrideOptions?: Partial<ResilienceOptions>
  ): Promise<T> {
    const resilienceOptions: ResilienceOptions = {
      timeout: overrideOptions?.timeout ?? this.options.timeout,
      enableRetry: overrideOptions?.enableRetry ?? this.options.enableRetry,
      maxRetries: overrideOptions?.maxRetries ?? this.options.maxRetries,
      enableTimeout: overrideOptions?.enableTimeout ?? true,
      isRetryable: overrideOptions?.isRetryable ?? isTransientError,
      onRetry: (attempt, error, delay) => {
        if (this.options.onRetry && error instanceof Error) {
          this.options.onRetry(operationName, attempt, error);
        }
        if (overrideOptions?.onRetry) {
          overrideOptions.onRetry(attempt, error, delay);
        }
      },
    };

    try {
      return await withResilience(operation, resilienceOptions);
    } catch (error) {
      // Wrap resilience errors with user-friendly messages
      if (error instanceof TimeoutError) {
        throw new Error(getErrorMessage("OPERATION_TIMEOUT"));
      }
      if (error instanceof RetryExhaustedError) {
        throw new Error(getErrorMessage("RETRY_EXHAUSTED"));
      }
      throw error;
    }
  }

  /**
   * Check E-IMZO application version
   *
   * @param options - Optional resilience options override
   */
  async checkVersion(
    options?: Partial<ResilienceOptions>
  ): Promise<VersionInfo> {
    return this.executeWithResilience(
      "checkVersion",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.checkVersion(
            (major: string, minor: string) => {
              const newVersion = EIMZO_VERSION.MAJOR * 100 + EIMZO_VERSION.MINOR;
              const installedVersion = parseInt(major) * 100 + parseInt(minor);

              if (installedVersion < newVersion) {
                reject(new Error(getErrorMessage("UPDATE_APP")));
              } else {
                resolve({ major: parseInt(major), minor: parseInt(minor) });
              }
            },
            (_error: unknown, message: string | null) => {
              reject(new Error(message || getErrorMessage("CAPIWS_CONNECTION")));
            }
          );
        }),
      options
    );
  }

  /**
   * Check if ID card (USB token) is plugged in
   *
   * @param options - Optional resilience options override
   */
  async isIDCardPlugged(
    options?: Partial<ResilienceOptions>
  ): Promise<boolean> {
    return this.executeWithResilience(
      "isIDCardPlugged",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.idCardIsPLuggedIn(resolve, reject);
        }),
      options
    );
  }

  /**
   * Check if BAIK token is plugged in
   *
   * @param options - Optional resilience options override
   */
  async isBAIKTokenPlugged(
    options?: Partial<ResilienceOptions>
  ): Promise<boolean> {
    return this.executeWithResilience(
      "isBAIKTokenPlugged",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.isBAIKTokenPLuggedIn(resolve, reject);
        }),
      options
    );
  }

  /**
   * Check if CKC device is plugged in
   *
   * @param options - Optional resilience options override
   */
  async isCKCPlugged(
    options?: Partial<ResilienceOptions>
  ): Promise<boolean> {
    return this.executeWithResilience(
      "isCKCPlugged",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.isCKCPLuggedIn(resolve, reject);
        }),
      options
    );
  }

  /**
   * Change password for a certificate key
   *
   * @param options - Optional resilience options override
   */
  async changeKeyPassword(
    cert: Certificate,
    options?: Partial<ResilienceOptions>
  ): Promise<void> {
    return this.executeWithResilience(
      "changeKeyPassword",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.changeKeyPassword(cert, resolve, reject);
        }),
      options
    );
  }

  /**
   * Install API keys for domain authorization
   *
   * @param options - Optional resilience options override
   */
  async installApiKeys(
    options?: Partial<ResilienceOptions>
  ): Promise<void> {
    return this.executeWithResilience(
      "installApiKeys",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.installApiKeys(resolve, () => {
            reject(new Error(getErrorMessage("CAPIWS_CONNECTION")));
          });
        }),
      options
    );
  }

  /**
   * List all available user certificates
   *
   * @param options - Optional resilience options override
   */
  async listAllUserKeys(
    options?: Partial<ResilienceOptions>
  ): Promise<Certificate[]> {
    return this.executeWithResilience(
      "listAllUserKeys",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.listAllUserKeys(
            (cert: Certificate, index: string) =>
              `cert-${cert.serialNumber}-${index}`,
            (_index: string, cert: Certificate) => cert,
            (items: Certificate[]) => {
              resolve(items);
            },
            (error: unknown, reason: string | null) => {
              reject(new Error(reason || String(error)));
            }
          );
        }),
      options
    );
  }

  /**
   * Load a certificate key for signing operations
   *
   * @param options - Optional resilience options override
   */
  async loadKey(
    cert: Certificate,
    options?: Partial<ResilienceOptions>
  ): Promise<LoadKeyResult> {
    return this.executeWithResilience(
      "loadKey",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.loadKey(
            cert,
            (id: string) => {
              this._loadedKey = cert;
              resolve({ cert, id });
            },
            (_e: unknown, r: string | null) => {
              if (r) {
                if (r.indexOf("BadPaddingException") !== -1) {
                  reject(new Error(getErrorMessage("WRONG_PASSWORD")));
                } else {
                  reject(new Error(r));
                }
              } else {
                reject(new Error(getErrorMessage("BROWSER_WS")));
              }
            }
          );
        }),
      // Don't retry password errors
      { ...options, isRetryable: (error) => {
        if (error instanceof Error && error.message.includes(getErrorMessage("WRONG_PASSWORD"))) {
          return false;
        }
        return options?.isRetryable ? options.isRetryable(error) : isTransientError(error);
      }}
    );
  }

  /**
   * Create PKCS7 digital signature
   *
   * @param options - Optional resilience options override
   */
  async createPkcs7(
    keyId: string,
    content: string,
    options?: Partial<ResilienceOptions>
  ): Promise<SignPkcs7Result | string> {
    return this.executeWithResilience(
      "createPkcs7",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.createPkcs7(
            keyId,
            content,
            null,
            resolve,
            (_e: unknown, r: string | null) => {
              if (r) {
                if (r.indexOf("BadPaddingException") !== -1) {
                  reject(new Error(getErrorMessage("WRONG_PASSWORD")));
                } else {
                  reject(new Error(r));
                }
              } else {
                reject(new Error(getErrorMessage("BROWSER_WS")));
              }
            }
          );
        }),
      // Don't retry password errors
      { ...options, isRetryable: (error) => {
        if (error instanceof Error && error.message.includes(getErrorMessage("WRONG_PASSWORD"))) {
          return false;
        }
        return options?.isRetryable ? options.isRetryable(error) : isTransientError(error);
      }}
    );
  }

  /**
   * Append signature to existing PKCS7 (attached mode)
   *
   * @param options - Optional resilience options override
   */
  async appendPkcs7Attached(
    keyId: string,
    content: string,
    options?: Partial<ResilienceOptions>
  ): Promise<SignPkcs7Result | string> {
    return this.executeWithResilience(
      "appendPkcs7Attached",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.createPkcs7(
            keyId,
            content,
            null,
            resolve,
            (_e: unknown, r: string | null) => {
              if (r) {
                if (r.indexOf("BadPaddingException") !== -1) {
                  reject(new Error(getErrorMessage("WRONG_PASSWORD")));
                } else {
                  reject(new Error(r));
                }
              } else {
                reject(new Error(getErrorMessage("BROWSER_WS")));
              }
            }
          );
        }),
      // Don't retry password errors
      { ...options, isRetryable: (error) => {
        if (error instanceof Error && error.message.includes(getErrorMessage("WRONG_PASSWORD"))) {
          return false;
        }
        return options?.isRetryable ? options.isRetryable(error) : isTransientError(error);
      }}
    );
  }

  /**
   * Add an API key for a domain
   */
  addApiKey(domain: string, key: string): void {
    if (!this.apiKeys.includes(domain)) {
      this.apiKeys.push(domain, key);
    }
  }

  /**
   * Sign data using USB token (ID card)
   * Uses special keyId "idcard" with createPkcs7
   *
   * @param options - Optional resilience options override
   */
  async signWithUSB(
    content: string,
    options?: Partial<ResilienceOptions>
  ): Promise<string> {
    return this.executeWithResilience(
      "signWithUSB",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.createPkcs7(
            "idcard",
            content,
            null,
            (pkcs7: string) => resolve(pkcs7),
            (_e: unknown, r: string | null) => {
              if (r) {
                if (r.indexOf("BadPaddingException") !== -1) {
                  reject(new Error(getErrorMessage("WRONG_PASSWORD")));
                } else {
                  reject(new Error(r));
                }
              } else {
                reject(new Error(getErrorMessage("BROWSER_WS")));
              }
            }
          );
        }),
      // Don't retry password errors
      { ...options, isRetryable: (error) => {
        if (error instanceof Error && error.message.includes(getErrorMessage("WRONG_PASSWORD"))) {
          return false;
        }
        return options?.isRetryable ? options.isRetryable(error) : isTransientError(error);
      }}
    );
  }

  /**
   * Sign data using BAIK token
   * Uses special keyId "baikey" with createPkcs7
   *
   * @param options - Optional resilience options override
   */
  async signWithBAIK(
    content: string,
    options?: Partial<ResilienceOptions>
  ): Promise<string> {
    return this.executeWithResilience(
      "signWithBAIK",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.createPkcs7(
            "baikey",
            content,
            null,
            (pkcs7: string) => resolve(pkcs7),
            (_e: unknown, r: string | null) => {
              if (r) {
                if (r.indexOf("BadPaddingException") !== -1) {
                  reject(new Error(getErrorMessage("WRONG_PASSWORD")));
                } else {
                  reject(new Error(r));
                }
              } else {
                reject(new Error(getErrorMessage("BROWSER_WS")));
              }
            }
          );
        }),
      // Don't retry password errors
      { ...options, isRetryable: (error) => {
        if (error instanceof Error && error.message.includes(getErrorMessage("WRONG_PASSWORD"))) {
          return false;
        }
        return options?.isRetryable ? options.isRetryable(error) : isTransientError(error);
      }}
    );
  }

  /**
   * Sign data using CKC device
   * Uses special keyId "ckc" with createPkcs7
   *
   * @param options - Optional resilience options override
   */
  async signWithCKC(
    content: string,
    options?: Partial<ResilienceOptions>
  ): Promise<string> {
    return this.executeWithResilience(
      "signWithCKC",
      () =>
        new Promise((resolve, reject) => {
          EIMZOClient.createPkcs7(
            "ckc",
            content,
            null,
            (pkcs7: string) => resolve(pkcs7),
            (_e: unknown, r: string | null) => {
              if (r) {
                if (r.indexOf("BadPaddingException") !== -1) {
                  reject(new Error(getErrorMessage("WRONG_PASSWORD")));
                } else {
                  reject(new Error(r));
                }
              } else {
                reject(new Error(getErrorMessage("BROWSER_WS")));
              }
            }
          );
        }),
      // Don't retry password errors
      { ...options, isRetryable: (error) => {
        if (error instanceof Error && error.message.includes(getErrorMessage("WRONG_PASSWORD"))) {
          return false;
        }
        return options?.isRetryable ? options.isRetryable(error) : isTransientError(error);
      }}
    );
  }

  /**
   * Initialize the E-IMZO service
   *
   * @param options - Optional resilience options override
   */
  async install(options?: Partial<ResilienceOptions>): Promise<void> {
    await this.checkVersion(options);
    EIMZOClient.API_KEYS = this.apiKeys;
    await this.installApiKeys(options);
  }

  /**
   * Get the current resilience configuration
   */
  getOptions(): ESignatureOptions {
    return { ...this.options };
  }
}

// Export for backwards compatibility
export default ESignature;
