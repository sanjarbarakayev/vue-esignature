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
 * import { VueESignature } from 'vue-esignature'
 *
 * const app = createApp(App)
 * app.use(VueESignature)
 * app.mount('#app')
 *
 * // Use the composable in components
 * import { useESignature } from 'vue-esignature'
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
} from "./types";

// Error messages and version constants
export { ERROR_MESSAGES, EIMZO_VERSION } from "./types";
