/**
 * Vue Composable for E-Signature Electronic Digital Signature
 *
 * Provides reactive access to E-IMZO functionality in Vue components
 * using the Composition API.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useESignature } from '@sanjarbarakayev/vue-esignature'
 *
 * const { signer, isInstalled, install, listKeys, signData } = useESignature()
 *
 * onMounted(async () => {
 *   await install()
 *   const certs = await listKeys()
 * })
 * </script>
 * ```
 */

import { inject, ref, readonly, type Ref, type DeepReadonly } from "vue";
import { ESignature } from "./core/eimzo";
import { ESIGNATURE_INJECTION_KEY } from "./plugin";
import type { Certificate, LoadKeyResult, SignPkcs7Result } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface UseESignatureReturn {
  /** E-Signature service instance */
  signer: ESignature;

  /** Whether E-IMZO is installed and initialized */
  isInstalled: DeepReadonly<Ref<boolean>>;

  /** Whether an operation is in progress */
  isLoading: DeepReadonly<Ref<boolean>>;

  /** Current error message (if any) */
  error: DeepReadonly<Ref<string | null>>;

  /** List of available certificates */
  certificates: DeepReadonly<Ref<Certificate[]>>;

  /** Currently loaded certificate */
  loadedCert: DeepReadonly<Ref<Certificate | null>>;

  /** Currently loaded key ID (for signing) */
  loadedKeyId: DeepReadonly<Ref<string | null>>;

  /** Initialize E-IMZO service */
  install: () => Promise<boolean>;

  /** List all available certificates */
  listKeys: () => Promise<Certificate[]>;

  /** Load a certificate key for signing */
  loadKey: (cert: Certificate) => Promise<LoadKeyResult>;

  /** Sign data with the loaded key */
  signData: (data: string, keyId?: string) => Promise<SignPkcs7Result | string>;

  /** Sign data with USB token */
  signWithUSB: (data: string) => Promise<string>;

  /** Sign data with BAIK token */
  signWithBAIK: (data: string) => Promise<string>;

  /** Sign data with CKC device */
  signWithCKC: (data: string) => Promise<string>;

  /** Check if USB token is connected */
  checkUSBToken: () => Promise<boolean>;

  /** Check if BAIK token is connected */
  checkBAIKToken: () => Promise<boolean>;

  /** Check if CKC device is connected */
  checkCKCDevice: () => Promise<boolean>;

  /** Clear error state */
  clearError: () => void;

  /** Reset all state */
  reset: () => void;
}

// ============================================================================
// Composable Implementation
// ============================================================================

/**
 * Vue composable for E-Signature digital signature operations
 */
export const useESignature = (): UseESignatureReturn => {
  let signer = inject(ESIGNATURE_INJECTION_KEY, null);

  if (!signer) {
    signer = new ESignature();
  }

  const isInstalled = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const certificates = ref<Certificate[]>([]);
  const loadedCert = ref<Certificate | null>(null);
  const loadedKeyId = ref<string | null>(null);

  const install = async (): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      await signer!.install();
      isInstalled.value = true;
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      isInstalled.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const listKeys = async (): Promise<Certificate[]> => {
    isLoading.value = true;
    error.value = null;

    try {
      const certs = await signer!.listAllUserKeys();
      certificates.value = certs;
      return certs;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const loadKey = async (cert: Certificate): Promise<LoadKeyResult> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await signer!.loadKey(cert);
      loadedCert.value = cert;
      loadedKeyId.value = result.id;
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signData = async (
    data: string,
    keyId?: string
  ): Promise<SignPkcs7Result | string> => {
    const id = keyId || loadedKeyId.value;

    if (!id) {
      throw new Error("No key loaded. Call loadKey() first or provide keyId.");
    }

    isLoading.value = true;
    error.value = null;

    try {
      return await signer!.createPkcs7(id, data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signWithUSB = async (data: string): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      return await signer!.signWithUSB(data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signWithBAIK = async (data: string): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      return await signer!.signWithBAIK(data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signWithCKC = async (data: string): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      return await signer!.signWithCKC(data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const checkUSBToken = async (): Promise<boolean> => {
    try {
      return await signer!.isIDCardPlugged();
    } catch {
      return false;
    }
  };

  const checkBAIKToken = async (): Promise<boolean> => {
    try {
      return await signer!.isBAIKTokenPlugged();
    } catch {
      return false;
    }
  };

  const checkCKCDevice = async (): Promise<boolean> => {
    try {
      return await signer!.isCKCPlugged();
    } catch {
      return false;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  const reset = (): void => {
    isInstalled.value = false;
    isLoading.value = false;
    error.value = null;
    certificates.value = [];
    loadedCert.value = null;
    loadedKeyId.value = null;
  };

  return {
    signer: signer!,
    isInstalled: readonly(isInstalled),
    isLoading: readonly(isLoading),
    error: readonly(error),
    certificates: readonly(certificates),
    loadedCert: readonly(loadedCert),
    loadedKeyId: readonly(loadedKeyId),
    install,
    listKeys,
    loadKey,
    signData,
    signWithUSB,
    signWithBAIK,
    signWithCKC,
    checkUSBToken,
    checkBAIKToken,
    checkCKCDevice,
    clearError,
    reset,
  };
};
