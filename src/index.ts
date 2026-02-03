/**
 * Vue E-Signature - Electronic Digital Signature Plugin for Vue 3
 *
 * This plugin provides integration with E-IMZO digital signature system
 * used in Uzbekistan for electronic document signing.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // Install the plugin
 * import { createApp } from 'vue'
 * import { VueESignature } from '@sanjarbarakayev/vue-esignature'
 *
 * const app = createApp(App)
 * app.use(VueESignature)
 * app.mount('#app')
 *
 * // Use the composable in components
 * import { useESignature } from '@sanjarbarakayev/vue-esignature'
 *
 * const { install, listKeys, loadKey, signData } = useESignature()
 * ```
 */

// Vue Plugin
export { VueESignature, ESIGNATURE_INJECTION_KEY } from "./plugin";
export { default } from "./plugin";

// Composable
export { useESignature } from "./composable";
export type { UseESignatureReturn } from "./composable";

// Core ESignature class
export { ESignature } from "./core/eimzo";

// Low-level modules (for advanced usage)
export { CAPIWS } from "./core/capiws";
export { EIMZOClient } from "./core/client";

// Crypto utilities
export { CRC32, crc32, crc32Hex } from "./core/crc32";
export {
  GostHash,
  SignedAttributeHash,
  Utf8,
  gosthash,
  gosthashHex,
  GOST_TEST_VECTORS,
} from "./core/gost-hash";
export type { SignedAttributeHashResult } from "./core/gost-hash";

// Mobile QR code support
export { EIMZOMobile } from "./core/e-imzo-mobile";
export type {
  IQRCode,
  IQRCodeConstructor,
  EIMZOMobileOptions,
  QRCodeResult,
} from "./core/e-imzo-mobile";

// I18n
export {
  i18n,
  setLocale,
  getLocale,
  getErrorMessage,
  getSupportedLocales,
  isLocaleSupported,
  detectAndSetBrowserLocale,
} from "./i18n";
export type { SupportedLocale, ErrorMessageKey } from "./i18n";

// Types
export type {
  // Certificate types
  Certificate,
  CertificateType,
  BaseCertificate,
  PfxCertificate,
  FtjcCertificate,

  // API result types
  LoadKeyResult,
  SignPkcs7Result,
  VersionInfo,

  // CAPIWS types
  ICAPIWS,
  CAPIWSFunctionDef,
  CAPIWSCallback,
  CAPIWSErrorCallback,
  CAPIWSBaseResponse,
  CAPIWSVersionResponse,
  CAPIWSLoadKeyResponse,
  CAPIWSPkcs7Response,
  CAPIWSListCertificatesResponse,
  CAPIWSListTokensResponse,
  CAPIWSListReadersResponse,
  CAPIWSSignResponse,

  // Client types
  IEIMZOClient,
  ItemIdGenerator,
  ItemUiGenerator,

  // Plugin options
  ESignaturePluginOptions,
  ApiKeyPair,

  // Base64 types
  IBase64,

  // CRC32 types
  ICRC32,

  // GOST types
  IGostHash,
  GostTestVector,

  // Mobile types
  EIMZOMobileOptions as EIMZOMobileOptionsType,
  QRCodeResult as QRCodeResultType,

  // I18n types (re-export from types.ts for backwards compatibility)
  SupportedLocale as SupportedLocaleType,
  ErrorMessageKey as ErrorMessageKeyType,
} from "./types";

// Error messages and version constants
export { ERROR_MESSAGES, EIMZO_VERSION } from "./types";

// Detection utility
export {
  detectEIMZO,
  getEIMZODownloadUrl,
  isEIMZOAvailable,
  getEIMZOWebSocketUrl,
} from "./utils/eimzo-detector";
export type { EIMZOStatus } from "./utils/eimzo-detector";

// Demo Components
export { default as StatusIndicator } from "./components/demos/StatusIndicator.vue";
export { default as InstallPrompt } from "./components/demos/InstallPrompt.vue";
export { default as CertificateSelector } from "./components/demos/CertificateSelector.vue";
export { default as MobileQRModal } from "./components/demos/MobileQRModal.vue";
export { default as ESignatureWidget } from "./components/demos/ESignatureWidget.vue";
