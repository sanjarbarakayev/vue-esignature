/**
 * Vue Plugin for E-Signature Electronic Digital Signature
 *
 * This plugin provides Vue 3 integration for E-IMZO digital signature functionality.
 *
 * @example
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue'
 * import { VueESignature } from 'vue-esignature'
 *
 * const app = createApp(App)
 * app.use(VueESignature)
 * app.mount('#app')
 * ```
 */

import { ESignature } from "./core/eimzo";
import type { App, InjectionKey } from "vue";
import type { ESignaturePluginOptions } from "./types";

// ============================================================================
// Injection Key for provide/inject pattern
// ============================================================================

/**
 * Injection key for E-Signature instance
 * Use this with inject() in composition API
 */
export const ESIGNATURE_INJECTION_KEY: InjectionKey<ESignature> =
  Symbol("esignature");

// ============================================================================
// Vue Plugin
// ============================================================================

/**
 * Vue plugin for E-Signature integration
 *
 * @example
 * ```typescript
 * // Basic usage
 * app.use(VueESignature)
 *
 * // With custom API keys
 * app.use(VueESignature, {
 *   apiKeys: [
 *     { domain: 'myapp.example.com', key: 'API_KEY_HERE' }
 *   ]
 * })
 * ```
 */
export const VueESignature = {
  install(app: App, options?: ESignaturePluginOptions): void {
    const signer = new ESignature();

    if (options?.apiKeys) {
      for (const { domain, key } of options.apiKeys) {
        signer.addApiKey(domain, key);
      }
    }

    app.provide(ESIGNATURE_INJECTION_KEY, signer);
    app.config.globalProperties.$esignature = signer;
  },
};

// ============================================================================
// Type Augmentation for Vue
// ============================================================================

declare module "vue" {
  interface ComponentCustomProperties {
    /** E-Signature digital signature service instance */
    $esignature: ESignature;
  }
}

export default VueESignature;
