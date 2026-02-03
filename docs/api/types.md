# Types Reference

Complete TypeScript type definitions for Vue E-Signature.

## Import

```ts
import type {
  // Certificates
  Certificate,
  CertificateType,
  BaseCertificate,
  PfxCertificate,
  FtjcCertificate,

  // API Results
  LoadKeyResult,
  SignPkcs7Result,
  VersionInfo,

  // CAPIWS
  ICAPIWS,
  CAPIWSCallback,
  CAPIWSErrorCallback,

  // Client
  IEIMZOClient,
  ItemIdGenerator,
  ItemUiGenerator,

  // Plugin
  ESignaturePluginOptions,
  ApiKeyPair,

  // Crypto
  ICRC32,
  IGostHash,
  SignedAttributeHashResult,
  GostTestVector,

  // Mobile
  IQRCode,
  IQRCodeConstructor,
  EIMZOMobileOptions,
  QRCodeResult,

  // i18n
  SupportedLocale,
  ErrorMessageKey,

  // Base64
  IBase64
} from '@sanjarbarakayev/vue-esignature'
```

## Certificate Types

### CertificateType

```ts
type CertificateType = 'pfx' | 'ftjc'
```

### BaseCertificate

```ts
interface BaseCertificate {
  serialNumber: string
  validFrom: Date
  validTo: Date
  CN: string        // Common Name (full name)
  TIN: string       // Tax Identification Number
  PINFL: string     // Personal ID Number
  UID: string       // Unique Identifier
  O: string         // Organization
  T: string         // Title/Position
  type: CertificateType
}
```

### PfxCertificate

```ts
interface PfxCertificate extends BaseCertificate {
  type: 'pfx'
  disk: string      // Drive letter (e.g., "C:")
  path: string      // File path
  name: string      // File name
  alias: string     // Certificate alias
}
```

### FtjcCertificate

```ts
interface FtjcCertificate extends BaseCertificate {
  type: 'ftjc'
  cardUID: string   // Card unique identifier
  statusInfo: string
  ownerName: string
  info: string
}
```

### Certificate

```ts
type Certificate = PfxCertificate | FtjcCertificate
```

## API Response Types

### LoadKeyResult

```ts
interface LoadKeyResult {
  id: string        // Key ID for signing
  cert: Certificate // Loaded certificate
}
```

### SignPkcs7Result

```ts
interface SignPkcs7Result {
  pkcs7_64: string            // Base64 PKCS#7 signature
  signature_hex: string        // Hex signature
  signer_serial_number: string // Signer's certificate serial
}
```

### VersionInfo

```ts
interface VersionInfo {
  major: number
  minor: number
}
```

## CAPIWS Types

### ICAPIWS

```ts
interface ICAPIWS {
  URL: string
  callFunction: <T extends CAPIWSBaseResponse>(
    funcDef: CAPIWSFunctionDef,
    callback: CAPIWSCallback<T>,
    error: CAPIWSErrorCallback
  ) => void
  version: (
    callback: CAPIWSCallback<CAPIWSVersionResponse>,
    error: CAPIWSErrorCallback
  ) => void
  apidoc: (
    callback: CAPIWSCallback<CAPIWSBaseResponse>,
    error: CAPIWSErrorCallback
  ) => void
  apikey: (
    domainAndKey: string[],
    callback: CAPIWSCallback<CAPIWSBaseResponse>,
    error: CAPIWSErrorCallback
  ) => void
}
```

### CAPIWSCallback

```ts
type CAPIWSCallback<T = CAPIWSBaseResponse> = (
  event: MessageEvent,
  data: T
) => void
```

### CAPIWSErrorCallback

```ts
type CAPIWSErrorCallback = (error: unknown) => void
```

### CAPIWSBaseResponse

```ts
interface CAPIWSBaseResponse {
  success: boolean
  reason?: string
}
```

## Plugin Types

### ESignaturePluginOptions

```ts
interface ESignaturePluginOptions {
  apiKeys?: ApiKeyPair[]
  autoInstall?: boolean
}
```

### ApiKeyPair

```ts
interface ApiKeyPair {
  domain: string
  key: string
}
```

## Crypto Types

### ICRC32

```ts
interface ICRC32 {
  calc(str: string): string
  calcHex(hexStr: string): string
}
```

### IGostHash

```ts
interface IGostHash {
  gosthash(value: string): string
  gosthashHex(hex: string): string
  toHex(str: string): string
}
```

### SignedAttributeHashResult

```ts
interface SignedAttributeHashResult {
  utcTime: string              // YYMMDDhhmmssZ format
  signedAttributesHash: string // 64-char hex
  textHash: string             // 64-char hex
}
```

### GostTestVector

```ts
interface GostTestVector {
  hash: string
  text: string
}
```

## Mobile Types

### IQRCode

```ts
interface IQRCode {
  makeCode(code: string): void
  clear?(): void
}
```

### IQRCodeConstructor

```ts
interface IQRCodeConstructor {
  new (
    element: HTMLElement,
    options?: { width?: number; height?: number }
  ): IQRCode
}
```

### EIMZOMobileOptions

```ts
interface EIMZOMobileOptions {
  width?: number
  height?: number
}
```

### QRCodeResult

```ts
interface QRCodeResult {
  textHash: string
  code: string
}
```

## i18n Types

### SupportedLocale

```ts
type SupportedLocale = 'en' | 'ru' | 'uz'
```

### ErrorMessageKey

```ts
type ErrorMessageKey =
  | 'ERIIMZO_NOT_INSTALLED'
  | 'ERIIMZO_CRYPTO_API_ERROR'
  | 'ERIIMZO_CERT_NOT_FOUND'
  | 'ERIIMZO_WRONG_PASSWORD'
  | 'ERIIMZO_NO_READER'
  | 'ERIIMZO_CARD_NOT_FOUND'
  | 'CAPIWS_CONNECTION'
  | 'BROWSER_WS'
  | 'UPDATE_APP'
  | 'WRONG_PASSWORD'
  | 'VERSION_UNDEFINED'
  | 'INSTALL_NEW_VERSION'
  | 'SIGNING_ERROR'
  | 'KEY_LOAD_ERROR'
  | 'CERTIFICATE_EXPIRED'
  | 'CERTIFICATE_NOT_YET_VALID'
```

## Type Guards

### isPfxCertificate

```ts
function isPfxCertificate(cert: Certificate): cert is PfxCertificate {
  return cert.type === 'pfx'
}
```

### isFtjcCertificate

```ts
function isFtjcCertificate(cert: Certificate): cert is FtjcCertificate {
  return cert.type === 'ftjc'
}
```

### isSignPkcs7Result

```ts
function isSignPkcs7Result(value: unknown): value is SignPkcs7Result {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pkcs7_64' in value
  )
}
```

## Global Augmentation

Window interface augmentation:

```ts
declare global {
  interface Window {
    Base64: IBase64
    EIMZOEXT?: ICAPIWS
  }
}
```

## See Also

- [TypeScript Guide](/guide/typescript)
- [API Overview](/api/)
