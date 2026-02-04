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
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * // With connection state monitoring
 * import { useESignature } from '@sanjarbarakayev/vue-esignature'
 *
 * const {
 *   connectionState,
 *   retryInfo,
 *   reconnect,
 *   cancelRetry
 * } = useESignature({
 *   autoReconnect: true,
 *   onRetry: (op, attempt, error) => {
 *     console.log(`Retrying ${op} (attempt ${attempt})`)
 *   }
 * })
 * </script>
 * ```
 */

import { inject, ref, readonly, type Ref, type DeepReadonly } from "vue";
import { ESignature } from "./core/eimzo";
import { ESIGNATURE_INJECTION_KEY } from "./plugin";
import type {
  Certificate,
  LoadKeyResult,
  SignPkcs7Result,
  ConnectionState,
  RetryInfo,
  ESignatureOptions,
} from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useESignature composable
 */
export interface UseESignatureOptions extends ESignatureOptions {
  /** Automatically attempt to reconnect on connection loss (default: true) */
  autoReconnect?: boolean;
  /** Interval in ms for health checks, 0 to disable (default: 0) */
  healthCheckInterval?: number;
}

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

  /** Current connection state */
  connectionState: DeepReadonly<Ref<ConnectionState>>;

  /** Information about ongoing retry operation */
  retryInfo: DeepReadonly<Ref<RetryInfo | null>>;

  /** Count of consecutive failures */
  failureCount: DeepReadonly<Ref<number>>;

  /** Time of last successful operation */
  lastSuccessTime: DeepReadonly<Ref<Date | null>>;

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

  /** Manually attempt to reconnect to E-IMZO */
  reconnect: () => Promise<boolean>;

  /** Cancel any pending retry operation */
  cancelRetry: () => void;
}

// ============================================================================
// Composable Implementation
// ============================================================================

/**
 * Default options for the composable
 */
const DEFAULT_COMPOSABLE_OPTIONS: Required<
  Omit<UseESignatureOptions, "onRetry">
> = {
  timeout: 30000,
  enableRetry: true,
  maxRetries: 3,
  autoReconnect: true,
  healthCheckInterval: 0,
};

/**
 * Vue composable for E-Signature digital signature operations
 *
 * @param options - Optional configuration for the composable
 */
export const useESignature = (
  options: UseESignatureOptions = {}
): UseESignatureReturn => {
  const mergedOptions = { ...DEFAULT_COMPOSABLE_OPTIONS, ...options };

  let signer = inject(ESIGNATURE_INJECTION_KEY, null);

  if (!signer) {
    signer = new ESignature({
      timeout: mergedOptions.timeout,
      enableRetry: mergedOptions.enableRetry,
      maxRetries: mergedOptions.maxRetries,
      onRetry: (operation, attempt, err) => {
        // Update retry info
        retryInfo.value = {
          operation,
          attempt,
          maxAttempts: mergedOptions.maxRetries + 1,
          nextRetryIn: null,
          error: err.message,
        };
        connectionState.value = "retrying";

        // Call user's onRetry callback
        if (options.onRetry) {
          options.onRetry(operation, attempt, err);
        }
      },
    });
  }

  const isInstalled = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const certificates = ref<Certificate[]>([]);
  const loadedCert = ref<Certificate | null>(null);
  const loadedKeyId = ref<string | null>(null);

  // Connection state tracking
  const connectionState = ref<ConnectionState>("disconnected");
  const retryInfo = ref<RetryInfo | null>(null);
  const failureCount = ref(0);
  const lastSuccessTime = ref<Date | null>(null);

  // Internal state for retry cancellation
  let pendingCancelDelay: (() => void) | null = null;

  /**
   * Track a successful operation
   */
  const trackSuccess = () => {
    failureCount.value = 0;
    lastSuccessTime.value = new Date();
    connectionState.value = "connected";
    retryInfo.value = null;
  };

  /**
   * Track a failed operation
   */
  const trackFailure = (err: unknown) => {
    failureCount.value += 1;
    error.value = err instanceof Error ? err.message : String(err);
    connectionState.value = "error";
  };

  const install = async (): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;
    connectionState.value = "connecting";

    try {
      await signer!.install();
      isInstalled.value = true;
      trackSuccess();
      return true;
    } catch (e) {
      trackFailure(e);
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
      trackSuccess();
      return certs;
    } catch (e) {
      trackFailure(e);
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
      trackSuccess();
      return result;
    } catch (e) {
      trackFailure(e);
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
      const result = await signer!.createPkcs7(id, data);
      trackSuccess();
      return result;
    } catch (e) {
      trackFailure(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signWithUSB = async (data: string): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await signer!.signWithUSB(data);
      trackSuccess();
      return result;
    } catch (e) {
      trackFailure(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signWithBAIK = async (data: string): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await signer!.signWithBAIK(data);
      trackSuccess();
      return result;
    } catch (e) {
      trackFailure(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const signWithCKC = async (data: string): Promise<string> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await signer!.signWithCKC(data);
      trackSuccess();
      return result;
    } catch (e) {
      trackFailure(e);
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
    connectionState.value = "disconnected";
    retryInfo.value = null;
    failureCount.value = 0;
    lastSuccessTime.value = null;
    cancelRetry();
  };

  /**
   * Manually attempt to reconnect to E-IMZO
   */
  const reconnect = async (): Promise<boolean> => {
    // Cancel any pending retry
    cancelRetry();

    // Reset error state
    error.value = null;
    connectionState.value = "connecting";

    try {
      // Try to check version as a connectivity test
      await signer!.checkVersion();
      trackSuccess();
      return true;
    } catch (e) {
      trackFailure(e);
      return false;
    }
  };

  /**
   * Cancel any pending retry operation
   */
  const cancelRetry = (): void => {
    if (pendingCancelDelay) {
      pendingCancelDelay();
      pendingCancelDelay = null;
    }
    retryInfo.value = null;
    if (connectionState.value === "retrying") {
      connectionState.value = "error";
    }
  };

  return {
    signer: signer!,
    isInstalled: readonly(isInstalled),
    isLoading: readonly(isLoading),
    error: readonly(error),
    certificates: readonly(certificates),
    loadedCert: readonly(loadedCert),
    loadedKeyId: readonly(loadedKeyId),
    connectionState: readonly(connectionState),
    retryInfo: readonly(retryInfo),
    failureCount: readonly(failureCount),
    lastSuccessTime: readonly(lastSuccessTime),
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
    reconnect,
    cancelRetry,
  };
};
