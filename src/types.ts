/**
 * Vue E-Signature Plugin Type Definitions
 * Types for E-IMZO Electronic Digital Signature (EDS) system
 */

// ============================================================================
// Certificate Types
// ============================================================================

/**
 * Certificate type identifier
 * - 'pfx': Software-based certificate (PFX/PKCS12 file)
 * - 'ftjc': Hardware token certificate (FTJC smart card)
 */
export type CertificateType = "pfx" | "ftjc";

/**
 * Base certificate information shared between PFX and Token certificates
 */
export interface BaseCertificate {
  /** Certificate serial number */
  serialNumber: string;
  /** Certificate validity start date */
  validFrom: Date;
  /** Certificate validity end date */
  validTo: Date;
  /** Common Name - full name of certificate owner */
  CN: string;
  /** Tax Identification Number (INN) */
  TIN: string;
  /** Personal Identification Number (PINFL) */
  PINFL: string;
  /** Unique Identifier */
  UID: string;
  /** Organization name */
  O: string;
  /** Title/Position */
  T: string;
  /** Certificate type */
  type: CertificateType;
}

/**
 * PFX (software-based) certificate information
 */
export interface PfxCertificate extends BaseCertificate {
  type: "pfx";
  /** Disk drive where certificate is stored */
  disk: string;
  /** Path to certificate file */
  path: string;
  /** Certificate file name */
  name: string;
  /** Certificate alias (X.500 name) */
  alias: string;
}

/**
 * FTJC (hardware token) certificate information
 */
export interface FtjcCertificate extends BaseCertificate {
  type: "ftjc";
  /** Unique card identifier */
  cardUID: string;
  /** Status information */
  statusInfo: string;
  /** Owner name */
  ownerName: string;
  /** Certificate info string */
  info: string;
}

/**
 * Union type for all certificate types
 */
export type Certificate = PfxCertificate | FtjcCertificate;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Result of loading a key
 */
export interface LoadKeyResult {
  /** Loaded key identifier (used for signing operations) */
  id: string;
  /** Certificate information */
  cert: Certificate;
}

/**
 * Result of PKCS7 signing operation
 */
export interface SignPkcs7Result {
  /** Base64 encoded PKCS7 signature */
  pkcs7_64: string;
  /** Hexadecimal signature */
  signature_hex: string;
  /** Signer's certificate serial number */
  signer_serial_number: string;
}

/**
 * E-IMZO version information
 */
export interface VersionInfo {
  major: number;
  minor: number;
}

// ============================================================================
// CAPIWS (Crypto API WebSocket) Types
// ============================================================================

/**
 * Function definition for CAPIWS calls
 */
export interface CAPIWSFunctionDef {
  plugin?: string;
  name: string;
  arguments?: (string | string[])[];
}

/**
 * Base response from CAPIWS
 */
export interface CAPIWSBaseResponse {
  success: boolean;
  reason?: string;
}

/**
 * Version response from CAPIWS
 */
export interface CAPIWSVersionResponse extends CAPIWSBaseResponse {
  major?: string;
  minor?: string;
}

/**
 * Load key response from CAPIWS
 */
export interface CAPIWSLoadKeyResponse extends CAPIWSBaseResponse {
  keyId?: string;
}

/**
 * Create PKCS7 response from CAPIWS
 */
export interface CAPIWSPkcs7Response extends CAPIWSBaseResponse {
  pkcs7_64?: string;
}

/**
 * List certificates response from CAPIWS
 */
export interface CAPIWSListCertificatesResponse extends CAPIWSBaseResponse {
  certificates?: Array<{
    disk: string;
    path: string;
    name: string;
    alias: string;
  }>;
}

/**
 * List tokens response from CAPIWS
 */
export interface CAPIWSListTokensResponse extends CAPIWSBaseResponse {
  tokens?: Array<{
    cardUID: string;
    statusInfo: string;
    ownerName: string;
    info: string;
  }>;
}

/**
 * List readers response from CAPIWS
 */
export interface CAPIWSListReadersResponse extends CAPIWSBaseResponse {
  readers?: string[];
}

/**
 * List BAIK tokens response from CAPIWS
 */
export interface CAPIWSListBAIKTokensResponse extends CAPIWSBaseResponse {
  tokens?: string[];
}

/**
 * List CKC devices response from CAPIWS
 */
export interface CAPIWSListCKCResponse extends CAPIWSBaseResponse {
  devices?: string[];
}

/**
 * USB/BAIK sign response from CAPIWS
 */
export interface CAPIWSSignResponse extends CAPIWSBaseResponse {
  pkcs7_64?: string;
}

/**
 * CAPIWS callback function type
 */
export type CAPIWSCallback<T = CAPIWSBaseResponse> = (
  event: MessageEvent,
  data: T
) => void;

/**
 * CAPIWS error callback function type
 */
export type CAPIWSErrorCallback = (error: unknown) => void;

/**
 * CAPIWS interface
 */
export interface ICAPIWS {
  URL: string;
  callFunction: <T extends CAPIWSBaseResponse>(
    funcDef: CAPIWSFunctionDef,
    callback: CAPIWSCallback<T>,
    error: CAPIWSErrorCallback
  ) => void;
  version: (
    callback: CAPIWSCallback<CAPIWSVersionResponse>,
    error: CAPIWSErrorCallback
  ) => void;
  apidoc: (
    callback: CAPIWSCallback<CAPIWSBaseResponse>,
    error: CAPIWSErrorCallback
  ) => void;
  apikey: (
    domainAndKey: string[],
    callback: CAPIWSCallback<CAPIWSBaseResponse>,
    error: CAPIWSErrorCallback
  ) => void;
}

// ============================================================================
// EIMZOClient Types
// ============================================================================

/**
 * Success callback for version check
 */
export type VersionSuccessCallback = (major: string, minor: string) => void;

/**
 * Generic fail callback
 */
export type FailCallback = (error: unknown, reason: string | null) => void;

/**
 * Success callback for boolean results (like isPluggedIn checks)
 */
export type BooleanSuccessCallback = (result: boolean) => void;

/**
 * Success callback for void results
 */
export type VoidSuccessCallback = () => void;

/**
 * Success callback for loading key
 */
export type LoadKeySuccessCallback = (keyId: string) => void;

/**
 * Success callback for creating PKCS7
 */
export type Pkcs7SuccessCallback = (pkcs7: string) => void;

/**
 * Item ID generator function for listing certificates
 */
export type ItemIdGenerator = (cert: Certificate, index: string) => string;

/**
 * Item UI generator function for listing certificates
 */
export type ItemUiGenerator = (id: string, cert: Certificate) => Certificate;

/**
 * Success callback for listing all user keys
 */
export type ListAllUserKeysSuccessCallback = (
  items: Certificate[],
  firstId: string | null
) => void;

/**
 * EIMZOClient interface
 */
export interface IEIMZOClient {
  NEW_API: boolean;
  NEW_API2: boolean;
  NEW_API3: boolean;
  API_KEYS: string[];
  checkVersion: (success: VersionSuccessCallback, fail: FailCallback) => void;
  installApiKeys: (success: VoidSuccessCallback, fail: FailCallback) => void;
  listAllUserKeys: (
    itemIdGen: ItemIdGenerator,
    itemUiGen: ItemUiGenerator,
    success: ListAllUserKeysSuccessCallback,
    fail: FailCallback
  ) => void;
  idCardIsPLuggedIn: (
    success: BooleanSuccessCallback,
    fail: FailCallback
  ) => void;
  isBAIKTokenPLuggedIn: (
    success: BooleanSuccessCallback,
    fail: FailCallback
  ) => void;
  isCKCPLuggedIn: (success: BooleanSuccessCallback, fail: FailCallback) => void;
  loadKey: (
    itemObject: Certificate,
    success: LoadKeySuccessCallback,
    fail: FailCallback,
    verifyPassword?: boolean
  ) => void;
  changeKeyPassword: (
    itemObject: Certificate,
    success: VoidSuccessCallback,
    fail: FailCallback
  ) => void;
  createPkcs7: (
    id: string,
    data: string,
    timestamper: null,
    success: Pkcs7SuccessCallback,
    fail: FailCallback,
    detached?: boolean,
    isDataBase64Encoded?: boolean
  ) => void;
}

// ============================================================================
// Base64 Types
// ============================================================================

/**
 * Base64 utility interface
 */
export interface IBase64 {
  VERSION: string;
  atob: (a: string) => string;
  btoa: (b: string) => string;
  fromBase64: (a: string) => string;
  toBase64: (u: string, urisafe?: boolean) => string;
  utob: (u: string) => string;
  encode: (u: string, urisafe?: boolean) => string;
  encodeURI: (u: string) => string;
  btou: (b: string) => string;
  decode: (a: string) => string;
  noConflict: () => IBase64;
  extendString?: () => void;
}

// ============================================================================
// Plugin Options
// ============================================================================

/**
 * API key pair for domain authorization
 */
export interface ApiKeyPair {
  domain: string;
  key: string;
}

/**
 * E-Signature plugin configuration options
 */
export interface ESignaturePluginOptions {
  /** Additional API keys for domain authorization */
  apiKeys?: ApiKeyPair[];
  /** Auto-install on Vue plugin registration */
  autoInstall?: boolean;
}

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  CAPIWS_CONNECTION:
    "Ошибка соединения с E-IMZO. Возможно у вас не установлен модуль E-IMZO или Браузер E-IMZO.",
  BROWSER_WS:
    "Браузер не поддерживает технологию WebSocket. Установите последнюю версию браузера.",
  UPDATE_APP:
    'ВНИМАНИЕ !!! Установите новую версию приложения E-IMZO или Браузера E-IMZO.<br /><a href="https://e-imzo.soliq.uz/download/" role="button">Скачать ПО E-IMZO</a>',
  WRONG_PASSWORD: "Пароль неверный.",
  VERSION_UNDEFINED: "E-IMZO Version is undefined",
  INSTALL_NEW_VERSION: "Please install new version of E-IMZO",
} as const;

/**
 * E-IMZO version requirements
 */
export const EIMZO_VERSION = {
  MAJOR: 3,
  MINOR: 37,
} as const;

// ============================================================================
// Global Type Augmentations
// ============================================================================

// ============================================================================
// CRC32 Types
// ============================================================================

/**
 * CRC32 calculator interface
 */
export interface ICRC32 {
  calc(str: string): string;
  calcHex(hexStr: string): string;
}

// ============================================================================
// GOST Hash Types
// ============================================================================

/**
 * GOST R 34.11-94 hash function interface
 */
export interface IGostHash {
  gosthash(value: string): string;
  gosthashHex(hex: string): string;
  toHex(str: string): string;
}

/**
 * Result of signed attribute hash calculation
 */
export interface SignedAttributeHashResult {
  utcTime: string;
  signedAttributesHash: string;
  textHash: string;
}

/**
 * GOST test vector
 */
export interface GostTestVector {
  hash: string;
  text: string;
}

// ============================================================================
// E-IMZO Mobile Types
// ============================================================================

/**
 * QRCode library interface for dependency injection
 */
export interface IQRCode {
  makeCode(code: string): void;
  clear?(): void;
}

/**
 * QRCode constructor interface
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
  width?: number;
  height?: number;
}

/**
 * Result of QR code generation
 */
export interface QRCodeResult {
  textHash: string;
  code: string;
}

// ============================================================================
// I18n Types
// ============================================================================

/**
 * Supported locales for error messages
 */
export type SupportedLocale = "en" | "ru" | "uz";

/**
 * Error message keys
 */
export type ErrorMessageKey =
  | "ERIIMZO_NOT_INSTALLED"
  | "ERIIMZO_CRYPTO_API_ERROR"
  | "ERIIMZO_CERT_NOT_FOUND"
  | "ERIIMZO_WRONG_PASSWORD"
  | "ERIIMZO_NO_READER"
  | "ERIIMZO_CARD_NOT_FOUND"
  | "CAPIWS_CONNECTION"
  | "BROWSER_WS"
  | "UPDATE_APP"
  | "WRONG_PASSWORD"
  | "VERSION_UNDEFINED"
  | "INSTALL_NEW_VERSION"
  | "SIGNING_ERROR"
  | "KEY_LOAD_ERROR"
  | "CERTIFICATE_EXPIRED"
  | "CERTIFICATE_NOT_YET_VALID";

// ============================================================================
// Global Type Augmentations
// ============================================================================

declare global {
  interface Window {
    Base64: IBase64;
    EIMZOEXT?: ICAPIWS;
  }
}
