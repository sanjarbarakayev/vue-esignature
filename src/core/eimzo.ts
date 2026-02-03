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
 */

import { EIMZOClient } from "./client";
import type {
  Certificate,
  LoadKeyResult,
  SignPkcs7Result,
  VersionInfo,
} from "../types";
import { EIMZO_VERSION } from "../types";
import { getErrorMessage } from "../i18n";

/**
 * Main E-Signature service class providing Promise-based API
 */
export class ESignature {
  private _loadedKey: Certificate | null = null;

  apiKeys: string[] = [
    "localhost",
    "96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B",
    "127.0.0.1",
    "A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F",
  ];

  get loadedKey(): Certificate | null {
    return this._loadedKey;
  }

  set loadedKey(value: Certificate | null) {
    this._loadedKey = value;
  }

  /**
   * Check E-IMZO application version
   */
  async checkVersion(): Promise<VersionInfo> {
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Check if ID card (USB token) is plugged in
   */
  async isIDCardPlugged(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      EIMZOClient.idCardIsPLuggedIn(resolve, reject);
    });
  }

  /**
   * Check if BAIK token is plugged in
   */
  async isBAIKTokenPlugged(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      EIMZOClient.isBAIKTokenPLuggedIn(resolve, reject);
    });
  }

  /**
   * Check if CKC device is plugged in
   */
  async isCKCPlugged(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      EIMZOClient.isCKCPLuggedIn(resolve, reject);
    });
  }

  /**
   * Change password for a certificate key
   */
  async changeKeyPassword(cert: Certificate): Promise<void> {
    return new Promise((resolve, reject) => {
      EIMZOClient.changeKeyPassword(cert, resolve, reject);
    });
  }

  /**
   * Install API keys for domain authorization
   */
  async installApiKeys(): Promise<void> {
    return new Promise((resolve, reject) => {
      EIMZOClient.installApiKeys(resolve, () => {
        reject(new Error(getErrorMessage("CAPIWS_CONNECTION")));
      });
    });
  }

  /**
   * List all available user certificates
   */
  async listAllUserKeys(): Promise<Certificate[]> {
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Load a certificate key for signing operations
   */
  async loadKey(cert: Certificate): Promise<LoadKeyResult> {
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Create PKCS7 digital signature
   */
  async createPkcs7(
    keyId: string,
    content: string
  ): Promise<SignPkcs7Result | string> {
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Append signature to existing PKCS7 (attached mode)
   */
  async appendPkcs7Attached(
    keyId: string,
    content: string
  ): Promise<SignPkcs7Result | string> {
    return new Promise((resolve, reject) => {
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
    });
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
   */
  async signWithUSB(content: string): Promise<string> {
    // Use "idcard" as keyId - this is the correct approach per E-IMZO API
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Sign data using BAIK token
   * Uses special keyId "baikey" with createPkcs7
   */
  async signWithBAIK(content: string): Promise<string> {
    // Use "baikey" as keyId - this is the correct approach per E-IMZO API
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Sign data using CKC device
   * Uses special keyId "ckc" with createPkcs7
   */
  async signWithCKC(content: string): Promise<string> {
    // Use "ckc" as keyId - this is the correct approach per E-IMZO API
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Initialize the E-IMZO service
   */
  async install(): Promise<void> {
    await this.checkVersion();
    EIMZOClient.API_KEYS = this.apiKeys;
    await this.installApiKeys();
  }
}

// Export for backwards compatibility
export default ESignature;
