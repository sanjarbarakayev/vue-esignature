/**
 * E-IMZO Mobile QR Code Generator
 *
 * TypeScript implementation for generating E-IMZO mobile signing QR codes.
 * Uses dependency injection for the QRCode library to avoid bundling it.
 *
 * @example
 * ```typescript
 * import { EIMZOMobile } from '@eimzo/vue'
 * import QRCode from 'qrcode' // User provides their own QRCode library
 *
 * const mobile = new EIMZOMobile('site123', document.getElementById('qr'), QRCode)
 * const [textHash, code] = mobile.makeQRCode('doc001', 'Document content')
 * ```
 */

import { CRC32 } from "./crc32";
import { GostHash } from "./gost-hash";

/**
 * QRCode library interface
 *
 * Any QRCode library that implements this interface can be used.
 * Popular options include 'qrcode' and 'qrcode.js'.
 */
export interface IQRCode {
  /**
   * Generate and display a QR code
   * @param code - The data to encode in the QR code
   */
  makeCode(code: string): void;

  /**
   * Clear the current QR code (optional)
   */
  clear?(): void;
}

/**
 * QRCode constructor interface
 *
 * Represents a QRCode library constructor that creates IQRCode instances.
 */
export interface IQRCodeConstructor {
  new (
    element: HTMLElement,
    options?: { width?: number; height?: number }
  ): IQRCode;
}

/**
 * Configuration options for EIMZOMobile
 */
export interface EIMZOMobileOptions {
  /** Width of the QR code in pixels */
  width?: number;
  /** Height of the QR code in pixels */
  height?: number;
}

/**
 * Result of QR code generation
 */
export interface QRCodeResult {
  /** GOST hash of the document text */
  textHash: string;
  /** Full QR code content (siteId + docNum + textHash + crc32) */
  code: string;
}

/**
 * E-IMZO Mobile QR Code Generator
 *
 * Generates QR codes for E-IMZO mobile signing workflow.
 * The QR code contains site ID, document number, text hash, and CRC32 checksum.
 */
export class EIMZOMobile {
  private readonly siteId: string;
  private readonly qrcode: IQRCode;

  /**
   * Create a new EIMZOMobile instance
   *
   * @param siteId - Site identifier registered with E-IMZO
   * @param element - HTML element to render the QR code into
   * @param QRCodeLib - QRCode library constructor (dependency injection)
   * @param options - Optional configuration for QR code dimensions
   *
   * @example
   * ```typescript
   * import QRCode from 'qrcode.js'
   *
   * const mobile = new EIMZOMobile(
   *   'SITE123',
   *   document.getElementById('qrcode')!,
   *   QRCode,
   *   { width: 256, height: 256 }
   * )
   * ```
   */
  constructor(
    siteId: string,
    element: HTMLElement,
    QRCodeLib: IQRCodeConstructor,
    options: EIMZOMobileOptions = {}
  ) {
    this.siteId = siteId;
    this.qrcode = new QRCodeLib(element, {
      width: options.width ?? 300,
      height: options.height ?? 300,
    });
  }

  /**
   * Generate a QR code for document signing
   *
   * @param docNum - Document number/identifier
   * @param text - Document text content to be signed
   * @returns Tuple of [textHash, fullCode] or null if parameters are invalid
   *
   * @example
   * ```typescript
   * const result = mobile.makeQRCode('DOC-2024-001', 'Contract content here...')
   * if (result) {
   *   const [textHash, code] = result
   *   console.log('Text hash:', textHash)
   *   console.log('QR code content:', code)
   * }
   * ```
   */
  makeQRCode(docNum: string, text: string): [string, string] | null {
    if (!this.siteId || !docNum || !text) {
      return null;
    }

    const hasher = new GostHash();
    const textHash = hasher.gosthash(text);

    const codeWithoutCrc = this.siteId + docNum + textHash;
    const crcer = new CRC32();
    const crc32 = crcer.calcHex(codeWithoutCrc);
    const fullCode = codeWithoutCrc + crc32;

    this.qrcode.makeCode(fullCode);

    return [textHash, fullCode];
  }

  /**
   * Generate QR code data without rendering
   *
   * Useful when you want to generate the QR code content without
   * immediately rendering it to the DOM.
   *
   * @param docNum - Document number/identifier
   * @param text - Document text content to be signed
   * @returns QRCodeResult with textHash and code, or null if parameters are invalid
   */
  static generateQRCodeData(
    siteId: string,
    docNum: string,
    text: string
  ): QRCodeResult | null {
    if (!siteId || !docNum || !text) {
      return null;
    }

    const hasher = new GostHash();
    const textHash = hasher.gosthash(text);

    const codeWithoutCrc = siteId + docNum + textHash;
    const crcer = new CRC32();
    const crc32 = crcer.calcHex(codeWithoutCrc);
    const fullCode = codeWithoutCrc + crc32;

    return {
      textHash,
      code: fullCode,
    };
  }

  /**
   * Clear the current QR code
   */
  clear(): void {
    if (this.qrcode.clear) {
      this.qrcode.clear();
    }
  }
}

export default EIMZOMobile;
