<!--
  EXAMPLE COMPONENT - Not included in npm package

  This is a reference implementation showing how to build UI with the core API.
  Copy and customize for your project.

  Source: https://github.com/sanjarbarakayev/vue-esignature/tree/main/examples/components
-->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  useESignature,
  setLocale,
  getErrorMessage,
  type Certificate,
  type SupportedLocale,
} from "@eimzo/vue";
import InstallPrompt from "./InstallPrompt.vue";
import CertificateSelector from "./CertificateSelector.vue";

const props = withDefaults(
  defineProps<{
    content: string;
    documentTitle?: string;
    locale?: SupportedLocale;
    showPreview?: boolean;
    allowMultiple?: boolean;
    compact?: boolean;
  }>(),
  {
    documentTitle: "Document",
    locale: "en",
    showPreview: true,
    allowMultiple: false,
    compact: false,
  }
);

const emit = defineEmits<{
  signed: [signature: string, certificate: Certificate];
  error: [error: Error];
  cancel: [];
}>();

watch(
  () => props.locale,
  (newLocale) => {
    setLocale(newLocale);
  },
  { immediate: true }
);

const {
  install,
  listKeys,
  loadKey,
  signData,
  checkUSBToken,
  checkBAIKToken,
  signWithUSB,
  signWithBAIK,
  error: composableError,
} = useESignature();

type Step =
  | "install"
  | "init"
  | "select"
  | "confirm"
  | "password"
  | "signing"
  | "success"
  | "error";

const step = ref<Step>("install");
const certificates = ref<Certificate[]>([]);
const selectedCert = ref<Certificate | null>(null);
const signature = ref("");
const errorMessage = ref("");
const hardwareAvailable = ref({ idCard: false, baik: false });
const signingMethod = ref<"certificate" | "idcard" | "baik">("certificate");
const eimzoInstalled = ref(false);

const canSign = computed(() => {
  if (signingMethod.value === "certificate") {
    return selectedCert.value !== null;
  }
  return hardwareAvailable.value.idCard || hardwareAvailable.value.baik;
});

const currentStepIndex = computed(() => {
  const steps: Step[] = ["select", "confirm", "password", "signing", "success"];
  const idx = steps.indexOf(step.value);
  return idx >= 0 ? idx : 0;
});

function handleInstallDetected() {
  eimzoInstalled.value = true;
  initialize();
}

async function initialize() {
  step.value = "init";
  try {
    await install();
    await detectHardware();
    certificates.value = await listKeys();
    step.value = "select";
  } catch (err) {
    step.value = "error";
    errorMessage.value =
      err instanceof Error
        ? getErrorMessage("ERIIMZO_NOT_INSTALLED")
        : String(err);
    emit("error", err as Error);
  }
}

async function detectHardware() {
  const [idCard, baik] = await Promise.all([
    checkUSBToken().catch(() => false),
    checkBAIKToken().catch(() => false),
  ]);
  hardwareAvailable.value = { idCard, baik };
}

function selectCertificate(cert: Certificate) {
  selectedCert.value = cert;
  signingMethod.value = "certificate";
}

function useHardware(type: "idcard" | "baik") {
  signingMethod.value = type;
  selectedCert.value = null;
}

function goToConfirm() {
  if (!canSign.value) return;
  step.value = "confirm";
}

function goBack() {
  step.value = "select";
}

async function performSigning() {
  try {
    step.value = signingMethod.value === "certificate" ? "password" : "signing";
    let sig: string;

    if (signingMethod.value === "idcard") {
      sig = await signWithUSB(props.content);
    } else if (signingMethod.value === "baik") {
      sig = await signWithBAIK(props.content);
    } else if (selectedCert.value) {
      const { id } = await loadKey(selectedCert.value);
      step.value = "signing";
      const result = await signData(props.content, id);
      sig = typeof result === "string" ? result : result.pkcs7_64;
    } else {
      throw new Error("No signing method selected");
    }

    signature.value = sig;
    step.value = "success";
    emit("signed", sig, selectedCert.value!);
  } catch (err) {
    step.value = "error";
    errorMessage.value = err instanceof Error ? err.message : String(err);
    emit("error", err as Error);
  }
}

function reset() {
  step.value = "select";
  selectedCert.value = null;
  signature.value = "";
  errorMessage.value = "";
}

function cancel() {
  emit("cancel");
}

function copyToClipboard() {
  if (!signature.value) return;
  window.navigator.clipboard.writeText(signature.value).catch(() => {
    errorMessage.value = "Failed to copy to clipboard";
  });
}

function downloadSignature() {
  if (!signature.value) return;
  try {
    const binaryString = atob(signature.value);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/pkcs7-signature" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${props.documentTitle.replace(/\s+/g, "_")}.p7s`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    errorMessage.value = "Failed to download signature";
  }
}

defineExpose({
  step,
  certificates,
  selectedCert,
  signature,
  reset,
  initialize,
});
</script>

<template>
  <div class="esign-widget" :class="{ compact }">
    <!-- Header -->
    <header class="widget-header">
      <div class="header-left">
        <div class="header-icon" :class="{ success: step === 'success', error: step === 'error' }">
          <svg v-if="step === 'success'" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="step === 'error'" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <svg v-else viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="header-text">
          <h2 v-if="step === 'install'">Connect to E-IMZO</h2>
          <h2 v-else-if="step === 'init'">Connecting...</h2>
          <h2 v-else-if="step === 'select'">Select Certificate</h2>
          <h2 v-else-if="step === 'confirm'">Review & Sign</h2>
          <h2 v-else-if="step === 'password'">Enter Password</h2>
          <h2 v-else-if="step === 'signing'">Signing...</h2>
          <h2 v-else-if="step === 'success'">Signed Successfully</h2>
          <h2 v-else-if="step === 'error'">Signing Failed</h2>
        </div>
      </div>
      <button
        v-if="!['init', 'install'].includes(step)"
        class="close-btn"
        @click="cancel"
        aria-label="Close"
      >
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </header>

    <!-- Progress Steps -->
    <div v-if="!['install', 'init', 'error'].includes(step)" class="progress-steps">
      <div class="step-item" :class="{ active: currentStepIndex >= 0, current: step === 'select' }">
        <span class="step-num">1</span>
        <span class="step-label">Select</span>
      </div>
      <div class="step-line" :class="{ active: currentStepIndex >= 1 }"></div>
      <div class="step-item" :class="{ active: currentStepIndex >= 1, current: step === 'confirm' }">
        <span class="step-num">2</span>
        <span class="step-label">Review</span>
      </div>
      <div class="step-line" :class="{ active: currentStepIndex >= 2 }"></div>
      <div class="step-item" :class="{ active: currentStepIndex >= 4, current: ['password', 'signing', 'success'].includes(step) }">
        <span class="step-num">3</span>
        <span class="step-label">Sign</span>
      </div>
    </div>

    <!-- Content -->
    <main class="widget-content">
      <Transition name="fade" mode="out-in">
        <!-- Install Step -->
        <div v-if="step === 'install'" key="install" class="step-install">
          <InstallPrompt :compact="compact" @detected="handleInstallDetected" />
        </div>

        <!-- Init Step -->
        <div v-else-if="step === 'init'" key="init" class="step-loading">
          <div class="loader"></div>
          <p>Establishing secure connection...</p>
        </div>

        <!-- Select Step -->
        <div v-else-if="step === 'select'" key="select" class="step-select">
          <!-- Hardware Tokens -->
          <div v-if="hardwareAvailable.idCard || hardwareAvailable.baik" class="section">
            <h3 class="section-title">Hardware Tokens</h3>
            <div class="hardware-options">
              <button
                v-if="hardwareAvailable.idCard"
                class="hardware-btn"
                :class="{ selected: signingMethod === 'idcard' }"
                @click="useHardware('idcard')"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
                <span>ID Card</span>
              </button>
              <button
                v-if="hardwareAvailable.baik"
                class="hardware-btn"
                :class="{ selected: signingMethod === 'baik' }"
                @click="useHardware('baik')"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd" />
                </svg>
                <span>BAIK Token</span>
              </button>
            </div>
          </div>

          <!-- Certificates -->
          <div class="section">
            <h3 class="section-title">Certificates</h3>
            <CertificateSelector
              :certificates="certificates"
              v-model="selectedCert"
              :compact="compact"
              @select="selectCertificate"
            />
          </div>

          <footer class="step-footer">
            <button class="btn btn-secondary" @click="cancel">Cancel</button>
            <button class="btn btn-primary" :disabled="!canSign" @click="goToConfirm">
              Continue
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </footer>
        </div>

        <!-- Confirm Step -->
        <div v-else-if="step === 'confirm'" key="confirm" class="step-confirm">
          <div class="confirm-card">
            <div class="confirm-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="confirm-details">
              <h4>{{ documentTitle }}</h4>
              <p v-if="showPreview" class="preview-text">
                {{ content.substring(0, 120) }}{{ content.length > 120 ? "..." : "" }}
              </p>
            </div>
          </div>

          <div class="signer-info">
            <span class="signer-label">Signing as</span>
            <div class="signer-row">
              <div class="signer-avatar">
                {{ signingMethod === 'certificate' && selectedCert ? selectedCert.CN.charAt(0) : '?' }}
              </div>
              <div class="signer-text">
                <strong>
                  {{ signingMethod === 'idcard' ? 'ID Card' :
                     signingMethod === 'baik' ? 'BAIK Token' :
                     selectedCert?.CN }}
                </strong>
                <span v-if="selectedCert && signingMethod === 'certificate'">{{ selectedCert.O || 'Individual' }}</span>
              </div>
            </div>
          </div>

          <footer class="step-footer">
            <button class="btn btn-secondary" @click="goBack">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Back
            </button>
            <button class="btn btn-primary" @click="performSigning">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Sign Document
            </button>
          </footer>
        </div>

        <!-- Password Step -->
        <div v-else-if="step === 'password'" key="password" class="step-loading">
          <div class="lock-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <p>Please enter your certificate password<br/>in the E-IMZO dialog window.</p>
          <div class="dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Signing Step -->
        <div v-else-if="step === 'signing'" key="signing" class="step-loading">
          <div class="loader"></div>
          <p>Creating your digital signature...</p>
        </div>

        <!-- Success Step -->
        <div v-else-if="step === 'success'" key="success" class="step-success">
          <div class="success-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <h3>Document Signed</h3>
          <p v-if="selectedCert">Signed by <strong>{{ selectedCert.CN }}</strong></p>

          <div v-if="!compact" class="signature-preview">
            <div class="sig-label">
              <span>Signature</span>
              <button class="copy-btn" @click="copyToClipboard" title="Copy to clipboard">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
            <code>{{ signature.substring(0, 64) }}...</code>
          </div>

          <footer class="step-footer success-footer">
            <button class="btn btn-secondary" @click="downloadSignature">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              Download .p7s
            </button>
            <button v-if="allowMultiple" class="btn btn-secondary" @click="reset">Sign Another</button>
            <button class="btn btn-primary" @click="cancel">Done</button>
          </footer>
        </div>

        <!-- Error Step -->
        <div v-else-if="step === 'error'" key="error" class="step-error">
          <div class="error-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <h3>Something went wrong</h3>
          <p class="error-text">{{ errorMessage || composableError }}</p>

          <footer class="step-footer">
            <button class="btn btn-secondary" @click="cancel">Cancel</button>
            <button class="btn btn-primary" @click="reset">Try Again</button>
          </footer>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
/* Light mode (default) */
.esign-widget {
  --w-bg: #ffffff;
  --w-bg-subtle: #f8fafc;
  --w-bg-hover: #f1f5f9;
  --w-border: #e2e8f0;
  --w-text: #1e293b;
  --w-text-secondary: #64748b;
  --w-text-muted: #94a3b8;
  --w-accent: #0ea5e9;
  --w-accent-hover: #0284c7;
  --w-accent-light: #e0f2fe;
  --w-success: #10b981;
  --w-success-light: #d1fae5;
  --w-danger: #ef4444;
  --w-danger-light: #fee2e2;
  --w-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --w-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);

  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--w-bg);
  border: 1px solid var(--w-border);
  border-radius: 12px;
  width: 100%;
  color: var(--w-text);
  overflow: hidden;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .esign-widget {
    --w-bg: #1e293b;
    --w-bg-subtle: #0f172a;
    --w-bg-hover: #334155;
    --w-border: #334155;
    --w-text: #f1f5f9;
    --w-text-secondary: #94a3b8;
    --w-text-muted: #64748b;
    --w-accent-light: rgba(14, 165, 233, 0.15);
    --w-success-light: rgba(16, 185, 129, 0.15);
    --w-danger-light: rgba(239, 68, 68, 0.15);
    --w-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    --w-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}

/* VitePress dark mode */
:global(.dark) .esign-widget {
  --w-bg: #1e293b;
  --w-bg-subtle: #0f172a;
  --w-bg-hover: #334155;
  --w-border: #334155;
  --w-text: #f1f5f9;
  --w-text-secondary: #94a3b8;
  --w-text-muted: #64748b;
  --w-accent-light: rgba(14, 165, 233, 0.15);
  --w-success-light: rgba(16, 185, 129, 0.15);
  --w-danger-light: rgba(239, 68, 68, 0.15);
  --w-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --w-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.esign-widget.compact {
  /* Compact mode styling */
}

/* Header */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--w-border);
  background: var(--w-bg-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-accent-light);
  border-radius: 10px;
  color: var(--w-accent);
}

.header-icon.success {
  background: var(--w-success-light);
  color: var(--w-success);
}

.header-icon.error {
  background: var(--w-danger-light);
  color: var(--w-danger);
}

.header-icon svg {
  width: 20px;
  height: 20px;
}

.header-text h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--w-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--w-bg-hover);
  color: var(--w-text);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--w-border);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-bg-hover);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--w-text-muted);
  transition: all 0.2s ease;
}

.step-item.active .step-num {
  background: var(--w-accent-light);
  color: var(--w-accent);
}

.step-item.current .step-num {
  background: var(--w-accent);
  color: white;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--w-text-muted);
  transition: color 0.2s ease;
}

.step-item.active .step-label {
  color: var(--w-text-secondary);
}

.step-item.current .step-label {
  color: var(--w-text);
}

.step-line {
  width: 40px;
  height: 2px;
  background: var(--w-border);
  margin: 0 8px;
  transition: background 0.2s ease;
}

.step-line.active {
  background: var(--w-accent);
}

/* Content */
.widget-content {
  padding: 20px;
  min-height: 280px;
}

/* Section */
.section {
  margin-bottom: 20px;
}

.section:last-of-type {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--w-text-muted);
}

/* Hardware Options */
.hardware-options {
  display: flex;
  gap: 10px;
}

.hardware-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--w-bg);
  border: 1px solid var(--w-border);
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--w-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.hardware-btn:hover {
  border-color: var(--w-accent);
  color: var(--w-text);
}

.hardware-btn.selected {
  background: var(--w-accent-light);
  border-color: var(--w-accent);
  color: var(--w-accent);
}

.hardware-btn svg {
  width: 18px;
  height: 18px;
}

/* Footer */
.step-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid var(--w-border);
}

.success-footer {
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-primary {
  background: var(--w-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--w-accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--w-bg-subtle);
  border: 1px solid var(--w-border);
  color: var(--w-text);
}

.btn-secondary:hover {
  background: var(--w-bg-hover);
}

/* Loading State */
.step-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.step-loading p {
  margin: 16px 0 0;
  font-size: 14px;
  color: var(--w-text-secondary);
  line-height: 1.5;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid var(--w-border);
  border-top-color: var(--w-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lock-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-accent-light);
  border-radius: 14px;
  color: var(--w-accent);
}

.lock-icon svg {
  width: 28px;
  height: 28px;
}

.dots {
  display: flex;
  gap: 6px;
  margin-top: 16px;
}

.dots span {
  width: 8px;
  height: 8px;
  background: var(--w-accent);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Confirm Step */
.step-confirm {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.confirm-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: var(--w-bg-subtle);
  border: 1px solid var(--w-border);
  border-radius: 10px;
}

.confirm-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-bg);
  border-radius: 10px;
  color: var(--w-text-muted);
}

.confirm-icon svg {
  width: 20px;
  height: 20px;
}

.confirm-details h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.preview-text {
  margin: 0;
  font-size: 13px;
  color: var(--w-text-secondary);
  line-height: 1.4;
}

.signer-info {
  padding: 14px 16px;
  background: var(--w-accent-light);
  border-radius: 10px;
}

.signer-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--w-accent);
}

.signer-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.signer-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-accent);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.signer-text {
  display: flex;
  flex-direction: column;
}

.signer-text strong {
  font-size: 14px;
  font-weight: 600;
}

.signer-text span {
  font-size: 12px;
  color: var(--w-text-secondary);
}

/* Success Step */
.step-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-success-light);
  border-radius: 50%;
  color: var(--w-success);
  margin-bottom: 16px;
}

.success-icon svg {
  width: 28px;
  height: 28px;
}

.step-success h3 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.step-success p {
  margin: 0;
  font-size: 14px;
  color: var(--w-text-secondary);
}

.signature-preview {
  width: 100%;
  margin-top: 20px;
  padding: 12px 14px;
  background: var(--w-bg-subtle);
  border: 1px solid var(--w-border);
  border-radius: 8px;
  text-align: left;
}

.sig-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--w-text-muted);
}

.copy-btn {
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--w-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  background: var(--w-bg-hover);
  color: var(--w-text);
}

.copy-btn svg {
  width: 14px;
  height: 14px;
  display: block;
}

.signature-preview code {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 11px;
  color: var(--w-text-secondary);
  word-break: break-all;
  line-height: 1.4;
}

/* Error Step */
.step-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.error-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-danger-light);
  border-radius: 50%;
  color: var(--w-danger);
  margin-bottom: 16px;
}

.error-icon svg {
  width: 28px;
  height: 28px;
}

.step-error h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.error-text {
  margin: 0;
  padding: 10px 14px;
  background: var(--w-danger-light);
  border-radius: 8px;
  font-size: 13px;
  color: var(--w-danger);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
