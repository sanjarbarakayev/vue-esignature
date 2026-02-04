# Complete Vue Component Example

A production-ready, reusable digital signing component.

## ESignatureWidget Component

```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  useESignature,
  setLocale,
  getErrorMessage,
  type SupportedLocale
} from '@eimzo/vue'
import type { Certificate } from '@eimzo/vue'

// Props
const props = withDefaults(defineProps<{
  content: string
  documentTitle?: string
  locale?: SupportedLocale
  showPreview?: boolean
  allowMultiple?: boolean
}>(), {
  documentTitle: 'Document',
  locale: 'en',
  showPreview: true,
  allowMultiple: false
})

// Emits
const emit = defineEmits<{
  signed: [signature: string, certificate: Certificate]
  error: [error: Error]
  cancel: []
}>()

// Set locale
watch(() => props.locale, (newLocale) => {
  setLocale(newLocale)
}, { immediate: true })

// Composable
const {
  install,
  listKeys,
  loadKey,
  signData,
  isIDCardPlugged,
  isBAIKTokenPlugged,
  signWithUSB,
  signWithBAIK,
  isInstalled,
  isLoading,
  error
} = useESignature()

// State
type Step = 'init' | 'select' | 'confirm' | 'password' | 'signing' | 'success' | 'error'
const step = ref<Step>('init')
const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const signature = ref('')
const hardwareAvailable = ref({ idCard: false, baik: false })
const signingMethod = ref<'certificate' | 'idcard' | 'baik'>('certificate')

// Computed
const canSign = computed(() => {
  if (signingMethod.value === 'certificate') {
    return selectedCert.value !== null
  }
  return hardwareAvailable.value.idCard || hardwareAvailable.value.baik
})

const stepTitle = computed(() => {
  const titles: Record<Step, string> = {
    init: 'Initializing...',
    select: 'Select Certificate',
    confirm: 'Confirm Signing',
    password: 'Enter Password',
    signing: 'Signing...',
    success: 'Signed Successfully',
    error: 'Error'
  }
  return titles[step.value]
})

// Initialize
onMounted(async () => {
  try {
    await install()
    await detectHardware()
    certificates.value = await listKeys()
    step.value = 'select'
  } catch (err) {
    step.value = 'error'
    emit('error', err as Error)
  }
})

async function detectHardware() {
  const [idCard, baik] = await Promise.all([
    isIDCardPlugged().catch(() => false),
    isBAIKTokenPlugged().catch(() => false)
  ])
  hardwareAvailable.value = { idCard, baik }
}

function selectCertificate(cert: Certificate) {
  selectedCert.value = cert
  signingMethod.value = 'certificate'
}

function useHardware(type: 'idcard' | 'baik') {
  signingMethod.value = type
  selectedCert.value = null
}

function goToConfirm() {
  if (!canSign.value) return
  step.value = 'confirm'
}

function goBack() {
  step.value = 'select'
}

async function performSigning() {
  try {
    step.value = signingMethod.value === 'certificate' ? 'password' : 'signing'

    let sig: string

    if (signingMethod.value === 'idcard') {
      sig = await signWithUSB(props.content)
    } else if (signingMethod.value === 'baik') {
      sig = await signWithBAIK(props.content)
    } else if (selectedCert.value) {
      const { id } = await loadKey(selectedCert.value)
      step.value = 'signing'
      const result = await signData(id, props.content)
      sig = typeof result === 'string' ? result : result.pkcs7_64
    } else {
      throw new Error('No signing method selected')
    }

    signature.value = sig
    step.value = 'success'
    emit('signed', sig, selectedCert.value!)
  } catch (err) {
    step.value = 'error'
    emit('error', err as Error)
  }
}

function reset() {
  step.value = 'select'
  selectedCert.value = null
  signature.value = ''
}

function cancel() {
  emit('cancel')
}

function downloadSignature() {
  if (!signature.value) return
  const blob = new Blob([atob(signature.value)], { type: 'application/pkcs7-signature' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.documentTitle.replace(/\s+/g, '_')}.p7s`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="esignature-widget">
    <!-- Header -->
    <div class="widget-header">
      <h2>{{ stepTitle }}</h2>
      <button v-if="step !== 'init'" class="close-btn" @click="cancel">
        ×
      </button>
    </div>

    <!-- Step: Init -->
    <div v-if="step === 'init'" class="step-content">
      <div class="loading-spinner">
        <div class="spinner" />
        <p>Connecting to E-IMZO...</p>
      </div>
    </div>

    <!-- Step: Select -->
    <div v-else-if="step === 'select'" class="step-content">
      <!-- Hardware options -->
      <div v-if="hardwareAvailable.idCard || hardwareAvailable.baik" class="hardware-section">
        <h3>Hardware Tokens</h3>
        <div class="hardware-options">
          <button
            v-if="hardwareAvailable.idCard"
            class="hardware-btn"
            :class="{ selected: signingMethod === 'idcard' }"
            @click="useHardware('idcard')"
          >
            <span class="icon">💳</span>
            <span class="label">ID Card</span>
          </button>
          <button
            v-if="hardwareAvailable.baik"
            class="hardware-btn"
            :class="{ selected: signingMethod === 'baik' }"
            @click="useHardware('baik')"
          >
            <span class="icon">🔑</span>
            <span class="label">BAIK Token</span>
          </button>
        </div>
      </div>

      <!-- Certificate list -->
      <div class="certificates-section">
        <h3>Certificates</h3>
        <div v-if="certificates.length === 0" class="empty">
          No certificates found
        </div>
        <div v-else class="cert-list">
          <div
            v-for="cert in certificates"
            :key="cert.serialNumber"
            class="cert-item"
            :class="{ selected: selectedCert?.serialNumber === cert.serialNumber }"
            @click="selectCertificate(cert)"
          >
            <span class="cert-icon">{{ cert.type === 'pfx' ? '📄' : '💳' }}</span>
            <div class="cert-info">
              <div class="cert-name">{{ cert.CN }}</div>
              <div class="cert-org">{{ cert.O || 'Individual' }}</div>
            </div>
            <span class="cert-type">{{ cert.type.toUpperCase() }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn secondary" @click="cancel">Cancel</button>
        <button class="btn primary" :disabled="!canSign" @click="goToConfirm">
          Continue
        </button>
      </div>
    </div>

    <!-- Step: Confirm -->
    <div v-else-if="step === 'confirm'" class="step-content">
      <div class="confirm-section">
        <h3>You are about to sign:</h3>
        <div class="document-preview">
          <div class="doc-title">{{ documentTitle }}</div>
          <div v-if="showPreview" class="doc-content">
            {{ content.substring(0, 200) }}{{ content.length > 200 ? '...' : '' }}
          </div>
        </div>

        <div class="signing-with">
          <strong>Signing with:</strong>
          <span v-if="signingMethod === 'idcard'">ID Card</span>
          <span v-else-if="signingMethod === 'baik'">BAIK Token</span>
          <span v-else-if="selectedCert">{{ selectedCert.CN }}</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn secondary" @click="goBack">Back</button>
        <button class="btn primary" @click="performSigning">
          Sign Document
        </button>
      </div>
    </div>

    <!-- Step: Password -->
    <div v-else-if="step === 'password'" class="step-content">
      <div class="password-section">
        <div class="icon-large">🔐</div>
        <p>Please enter your certificate password in the E-IMZO dialog.</p>
        <div class="spinner" />
      </div>
    </div>

    <!-- Step: Signing -->
    <div v-else-if="step === 'signing'" class="step-content">
      <div class="signing-section">
        <div class="spinner large" />
        <p>Creating digital signature...</p>
      </div>
    </div>

    <!-- Step: Success -->
    <div v-else-if="step === 'success'" class="step-content">
      <div class="success-section">
        <div class="icon-large">✅</div>
        <h3>Document Signed!</h3>
        <p>Your digital signature has been created successfully.</p>

        <div v-if="selectedCert" class="signed-by">
          Signed by: <strong>{{ selectedCert.CN }}</strong>
        </div>

        <div class="signature-preview">
          <label>Signature (Base64):</label>
          <textarea readonly :value="signature" rows="4" />
        </div>

        <div class="actions">
          <button class="btn secondary" @click="downloadSignature">
            Download .p7s
          </button>
          <button v-if="allowMultiple" class="btn secondary" @click="reset">
            Sign Another
          </button>
          <button class="btn primary" @click="cancel">Done</button>
        </div>
      </div>
    </div>

    <!-- Step: Error -->
    <div v-else-if="step === 'error'" class="step-content">
      <div class="error-section">
        <div class="icon-large">❌</div>
        <h3>Signing Failed</h3>
        <p class="error-message">{{ error?.message }}</p>

        <div class="actions">
          <button class="btn secondary" @click="cancel">Cancel</button>
          <button class="btn primary" @click="reset">Try Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.esignature-widget {
  font-family: system-ui, sans-serif;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  max-width: 480px;
  width: 100%;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.widget-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.step-content {
  padding: 24px;
}

.loading-spinner, .signing-section, .password-section {
  text-align: center;
  padding: 32px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #eee;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.spinner.large {
  width: 48px;
  height: 48px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hardware-section, .certificates-section {
  margin-bottom: 24px;
}

.hardware-section h3, .certificates-section h3 {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px;
}

.hardware-options {
  display: flex;
  gap: 12px;
}

.hardware-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}

.hardware-btn.selected {
  border-color: #3498db;
  background: #ebf5fb;
}

.hardware-btn .icon {
  font-size: 28px;
}

.hardware-btn .label {
  font-size: 13px;
  font-weight: 500;
}

.cert-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.cert-item:last-child {
  border-bottom: none;
}

.cert-item:hover {
  background: #f9f9f9;
}

.cert-item.selected {
  background: #ebf5fb;
}

.cert-icon {
  font-size: 24px;
}

.cert-info {
  flex: 1;
  min-width: 0;
}

.cert-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cert-org {
  font-size: 12px;
  color: #666;
}

.cert-type {
  font-size: 11px;
  padding: 2px 6px;
  background: #eee;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn.primary {
  background: #3498db;
  color: white;
}

.btn.primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn.secondary {
  background: #ecf0f1;
  color: #333;
}

.confirm-section, .success-section, .error-section {
  text-align: center;
}

.document-preview {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  text-align: left;
}

.doc-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.doc-content {
  font-size: 13px;
  color: #666;
}

.signing-with {
  font-size: 14px;
  color: #666;
}

.icon-large {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-section h3, .error-section h3 {
  margin: 0 0 8px;
}

.signed-by {
  font-size: 14px;
  color: #666;
  margin: 16px 0;
}

.signature-preview {
  margin: 16px 0;
  text-align: left;
}

.signature-preview label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.signature-preview textarea {
  width: 100%;
  font-family: monospace;
  font-size: 11px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
}

.error-message {
  color: #e74c3c;
  background: #fdeaea;
  padding: 12px;
  border-radius: 8px;
}

.empty {
  text-align: center;
  padding: 24px;
  color: #999;
}
</style>
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ESignatureWidget from './ESignatureWidget.vue'
import type { Certificate } from '@eimzo/vue'

const showWidget = ref(false)
const documentContent = ref('Contract terms and conditions...')

function handleSigned(signature: string, certificate: Certificate) {
  console.log('Signed by:', certificate.CN)
  console.log('Signature:', signature.substring(0, 50) + '...')

  // Send to server
  saveSignature(signature)

  showWidget.value = false
}

function handleError(error: Error) {
  console.error('Signing failed:', error.message)
}
</script>

<template>
  <div class="app">
    <button @click="showWidget = true">
      Sign Document
    </button>

    <div v-if="showWidget" class="modal-overlay">
      <ESignatureWidget
        :content="documentContent"
        document-title="Employment Contract"
        locale="en"
        :show-preview="true"
        :allow-multiple="false"
        @signed="handleSigned"
        @error="handleError"
        @cancel="showWidget = false"
      />
    </div>
  </div>
</template>
```

## Features

- **Multi-step wizard** - Clear progression through signing process
- **Hardware support** - Detects and supports ID cards and BAIK tokens
- **Certificate selection** - Browse and select from available certificates
- **Preview** - Shows document content before signing
- **Download** - Save signature as .p7s file
- **Localization** - Supports multiple languages
- **Error handling** - Graceful error display and retry

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | Required | Document content to sign |
| `documentTitle` | `string` | `'Document'` | Title shown in confirmation |
| `locale` | `SupportedLocale` | `'en'` | Language for messages |
| `showPreview` | `boolean` | `true` | Show content preview |
| `allowMultiple` | `boolean` | `false` | Allow signing multiple documents |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `signed` | `(signature: string, certificate: Certificate)` | Signing successful |
| `error` | `(error: Error)` | Signing failed |
| `cancel` | - | User cancelled |
