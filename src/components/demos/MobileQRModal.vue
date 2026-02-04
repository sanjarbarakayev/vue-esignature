<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import { EIMZOMobile } from "../../core/e-imzo-mobile";

const props = defineProps<{
  /** Whether the modal is visible */
  visible: boolean;
  /** Site/App ID for E-IMZO mobile */
  siteId: string;
  /** Document identifier */
  documentNumber: string;
  /** Content to sign */
  content: string;
  /** Polling endpoint (optional - for server-side signature retrieval) */
  pollEndpoint?: string;
  /** Polling interval in ms */
  pollInterval?: number;
  /** Timeout in ms (default: 5 minutes) */
  timeout?: number;
}>();

const emit = defineEmits<{
  close: [];
  signed: [signature: string, hash: string];
  error: [error: Error];
}>();

const slots = defineSlots<{
  /**
   * Custom QR code renderer slot.
   * Receives the QR code string to render.
   *
   * @example
   * ```vue
   * <MobileQRModal v-bind="props">
   *   <template #qr="{ code, size }">
   *     <QRCode :value="code" :size="size" />
   *   </template>
   * </MobileQRModal>
   * ```
   */
  qr?: (props: { code: string; size: number }) => unknown;
}>();

type ModalState =
  | "generating"
  | "waiting"
  | "checking"
  | "success"
  | "error"
  | "timeout";

const QR_SIZE = 280;

const state = ref<ModalState>("generating");
const qrData = ref<{ hash: string; code: string } | null>(null);
const errorMessage = ref("");
const signature = ref("");

const hasQrSlot = computed(() => !!slots.qr);

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible) {
      await nextTick();
      await initQRCode();
      if (props.pollEndpoint) {
        startPolling();
      }
    } else {
      cleanup();
    }
  }
);

onMounted(async () => {
  if (props.visible) {
    await nextTick();
    await initQRCode();
    if (props.pollEndpoint) {
      startPolling();
    }
  }
});

onUnmounted(() => {
  cleanup();
});

function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

async function initQRCode() {
  state.value = "generating";

  try {
    // Validate that siteId and documentNumber are hex strings
    // E-IMZO mobile expects the entire QR code to be hex-parseable
    if (!isValidHex(props.siteId)) {
      throw new Error(
        `Invalid siteId: must contain only hex characters (0-9, a-f). Got: "${props.siteId.substring(0, 20)}..."`
      );
    }
    if (!isValidHex(props.documentNumber)) {
      throw new Error(
        `Invalid documentNumber: must contain only hex characters (0-9, a-f). Got: "${props.documentNumber.substring(0, 20)}..."`
      );
    }

    // Use the proper E-IMZO mobile QR code format:
    // siteId + docNum + GOSTHash + CRC32
    const result = EIMZOMobile.generateQRCodeData(
      props.siteId,
      props.documentNumber,
      props.content
    );

    if (!result) {
      throw new Error("Failed to generate QR code data: invalid parameters");
    }

    qrData.value = {
      hash: result.textHash,
      code: result.code,
    };

    state.value = "waiting";
  } catch (err) {
    state.value = "error";
    errorMessage.value =
      err instanceof Error ? err.message : "Failed to generate QR code";
    emit("error", err instanceof Error ? err : new Error(String(err)));
  }
}

function startPolling() {
  const interval = props.pollInterval || 3000;
  const timeout = props.timeout || 5 * 60 * 1000;

  pollIntervalId = setInterval(checkForSignature, interval);

  timeoutId = setTimeout(() => {
    if (state.value === "waiting" || state.value === "checking") {
      state.value = "timeout";
      errorMessage.value = "Signing timed out. Please try again.";
      stopPolling();
    }
  }, timeout);
}

function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

async function checkForSignature() {
  if (state.value !== "waiting") return;
  if (!props.pollEndpoint) return;

  state.value = "checking";

  try {
    const response = await fetch(
      `${props.pollEndpoint}/${props.documentNumber}`
    );
    const data = await response.json();

    if (data.signature) {
      state.value = "success";
      signature.value = data.signature;
      stopPolling();
      emit("signed", data.signature, qrData.value?.hash || "");
    } else {
      state.value = "waiting";
    }
  } catch {
    state.value = "waiting";
  }
}

async function regenerateQR() {
  stopPolling();
  await initQRCode();
  if (props.pollEndpoint) {
    startPolling();
  }
}

function cleanup() {
  stopPolling();
  qrData.value = null;
  signature.value = "";
  errorMessage.value = "";
  state.value = "generating";
}

function close() {
  cleanup();
  emit("close");
}

function simulateSuccess() {
  state.value = "success";
  signature.value = "SIMULATED_SIGNATURE_BASE64_DATA";
  stopPolling();
  emit("signed", signature.value, qrData.value?.hash || "");
}

defineExpose({
  regenerateQR,
  state,
  qrData,
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="close">
        <div class="modal-content" role="dialog" aria-modal="true">
          <button
            class="close-btn"
            @click="close"
            aria-label="Close"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h2>Sign with Mobile</h2>

          <!-- Error/Timeout state -->
          <div
            v-if="state === 'error' || state === 'timeout'"
            class="state-content error-state"
          >
            <div class="icon error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3>{{ state === "timeout" ? "Timed Out" : "Error" }}</h3>
            <p>{{ errorMessage }}</p>
            <button class="btn primary" @click="regenerateQR">Try Again</button>
          </div>

          <!-- Success state -->
          <div v-else-if="state === 'success'" class="state-content success-state">
            <div class="icon success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3>Signed Successfully!</h3>
            <p>The document has been signed via mobile.</p>
            <button class="btn primary" @click="close">Done</button>
          </div>

          <!-- QR code state -->
          <div v-else class="state-content qr-state">
            <div class="qr-container">
              <!-- User-provided QR renderer via slot -->
              <template v-if="hasQrSlot && qrData">
                <slot name="qr" :code="qrData.code" :size="QR_SIZE" />
              </template>

              <!-- Fallback: show code for manual QR generation -->
              <template v-else-if="qrData && !hasQrSlot">
                <div class="qr-fallback">
                  <div class="qr-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <p class="qr-hint">
                    Provide a QR renderer via the <code>#qr</code> slot
                  </p>
                  <div class="qr-code-display">
                    <span class="qr-code-label">QR Data:</span>
                    <code class="qr-code-value">{{ qrData.code.substring(0, 32) }}...</code>
                  </div>
                </div>
              </template>

              <div v-if="state === 'generating'" class="qr-loading">
                <div class="spinner"></div>
              </div>
            </div>

            <div class="status-indicator">
              <div v-if="state === 'generating'" class="status generating">
                <div class="spinner small"></div>
                <span>Generating QR code...</span>
              </div>
              <div v-else-if="state === 'waiting'" class="status waiting">
                <div class="pulse"></div>
                <span>Waiting for signature...</span>
              </div>
              <div v-else-if="state === 'checking'" class="status checking">
                <div class="spinner small"></div>
                <span>Checking...</span>
              </div>
            </div>

            <div class="instructions">
              <h4>How to sign:</h4>
              <ol>
                <li>
                  Open <strong>E-IMZO</strong> app on your phone
                </li>
                <li>
                  Tap <strong>"Scan QR Code"</strong>
                </li>
                <li>Point your camera at this QR code</li>
                <li>Enter your PIN and confirm</li>
              </ol>
            </div>

            <div v-if="qrData" class="doc-info">
              <p>
                <strong>Document:</strong> {{ documentNumber }}
              </p>
              <p class="hash">
                <strong>Hash:</strong>
                <code
                  >{{ qrData.hash.substring(0, 12) }}...{{
                    qrData.hash.substring(52)
                  }}</code
                >
              </p>
            </div>

            <div class="actions">
              <button class="btn secondary" @click="regenerateQR">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Regenerate
              </button>
              <button
                v-if="!pollEndpoint"
                class="btn primary"
                @click="simulateSuccess"
              >
                Simulate Success
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--eimzo-space-md, 16px);
}

.modal-content {
  position: relative;
  background: var(--eimzo-bg, #fff);
  border-radius: var(--eimzo-radius-lg, 12px);
  padding: var(--eimzo-space-lg, 24px);
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  font-family: var(
    --eimzo-font-family,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif
  );
}

.close-btn {
  position: absolute;
  top: var(--eimzo-space-sm, 8px);
  right: var(--eimzo-space-sm, 8px);
  width: 32px;
  height: 32px;
  border: none;
  background: var(--eimzo-bg-secondary, #f5f5f5);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--eimzo-transition-fast, 0.15s ease);
}

.close-btn:hover {
  background: var(--eimzo-border, #eee);
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: var(--eimzo-text-secondary, #666);
}

h2 {
  margin: 0 0 var(--eimzo-space-lg, 24px);
  text-align: center;
  color: var(--eimzo-text, #333);
  font-size: 20px;
}

.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--eimzo-space-md, 16px);
}

.icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon svg {
  width: 32px;
  height: 32px;
}

.success-icon {
  background: var(--eimzo-success-light, #d4edda);
  color: var(--eimzo-success, #27ae60);
}

.error-icon {
  background: var(--eimzo-danger-light, #f8d7da);
  color: var(--eimzo-danger, #e74c3c);
}

h3 {
  margin: 0;
  font-size: 18px;
  color: var(--eimzo-text, #333);
}

.state-content p {
  margin: 0;
  color: var(--eimzo-text-secondary, #666);
  text-align: center;
}

.qr-container {
  position: relative;
  display: flex;
  justify-content: center;
  padding: var(--eimzo-space-md, 16px);
  background: var(--eimzo-bg-tertiary, #fafafa);
  border-radius: var(--eimzo-radius, 8px);
  min-height: 200px;
  min-width: 280px;
}

.qr-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  text-align: center;
}

.qr-placeholder {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--eimzo-bg-secondary, #f0f0f0);
  border-radius: 12px;
  color: var(--eimzo-text-muted, #999);
}

.qr-placeholder svg {
  width: 36px;
  height: 36px;
}

.qr-hint {
  font-size: 13px;
  color: var(--eimzo-text-muted, #999);
  margin: 0;
}

.qr-hint code {
  background: var(--eimzo-bg-secondary, #f0f0f0);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.qr-code-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 240px;
}

.qr-code-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--eimzo-text-muted, #999);
  text-transform: uppercase;
}

.qr-code-value {
  font-size: 10px;
  font-family: var(--eimzo-font-mono, monospace);
  background: var(--eimzo-bg-secondary, #f0f0f0);
  padding: 8px;
  border-radius: 6px;
  word-break: break-all;
  color: var(--eimzo-text-secondary, #666);
}

.qr-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--eimzo-bg-tertiary, #fafafa);
}

.status-indicator {
  text-align: center;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--eimzo-space-sm, 8px);
  color: var(--eimzo-text-secondary, #666);
  font-size: 14px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--eimzo-border, #eee);
  border-top-color: var(--eimzo-primary, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pulse {
  width: 12px;
  height: 12px;
  background: var(--eimzo-success, #27ae60);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.instructions {
  background: var(--eimzo-bg-secondary, #f5f5f5);
  padding: var(--eimzo-space-md, 16px);
  border-radius: var(--eimzo-radius, 8px);
  width: 100%;
}

.instructions h4 {
  margin: 0 0 var(--eimzo-space-sm, 8px);
  font-size: 14px;
  color: var(--eimzo-text, #333);
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--eimzo-text-secondary, #666);
}

.instructions li {
  margin: 6px 0;
}

.doc-info {
  font-size: 13px;
  color: var(--eimzo-text-secondary, #666);
  width: 100%;
}

.doc-info p {
  margin: 4px 0;
  text-align: left;
}

.hash code {
  font-size: 11px;
  font-family: var(
    --eimzo-font-mono,
    "SF Mono",
    Monaco,
    "Cascadia Code",
    monospace
  );
  background: var(--eimzo-bg-secondary, #f5f5f5);
  padding: 2px 4px;
  border-radius: 2px;
}

.actions {
  display: flex;
  gap: var(--eimzo-space-sm, 8px);
  width: 100%;
}

.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--eimzo-space-sm, 8px);
  padding: 10px 16px;
  border: none;
  border-radius: var(--eimzo-radius, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--eimzo-transition, 0.2s ease);
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn.primary {
  background: var(--eimzo-primary, #3498db);
  color: #fff;
}

.btn.primary:hover {
  background: var(--eimzo-primary-hover, #2980b9);
}

.btn.secondary {
  background: var(--eimzo-bg-secondary, #f5f5f5);
  color: var(--eimzo-text, #333);
}

.btn.secondary:hover {
  background: var(--eimzo-border, #eee);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
