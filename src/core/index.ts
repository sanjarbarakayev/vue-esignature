/**
 * Core module exports
 */

export { ESignature, default } from "./eimzo";
export { CAPIWS } from "./capiws";
export { EIMZOClient } from "./client";

// Crypto utilities
export { CRC32, crc32, crc32Hex } from "./crc32";
export {
  GostHash,
  SignedAttributeHash,
  Utf8,
  gosthash,
  gosthashHex,
  GOST_TEST_VECTORS,
} from "./gost-hash";
export type { SignedAttributeHashResult } from "./gost-hash";

// Mobile QR code support
export { EIMZOMobile } from "./e-imzo-mobile";
export type {
  IQRCode,
  IQRCodeConstructor,
  EIMZOMobileOptions,
  QRCodeResult,
} from "./e-imzo-mobile";
