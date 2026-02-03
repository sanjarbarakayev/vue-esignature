# Mobile QR Signing Example

Generate QR codes for E-IMZO mobile app signing workflow.

## MobileSigningModal Component

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EIMZOMobile } from '@sanjarbarakayev/vue-esignature'
import QRCode from 'qrcode.js'

const props = defineProps<{
  siteId: string
  documentNumber: string
  content: string
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  signed: [signature: string]
}>()

const qrContainer = ref<HTMLElement | null>(null)
const mobile = ref<EIMZOMobile | null>(null)
const qrData = ref<{ hash: string; code: string } | null>(null)
const status = ref<'generating' | 'waiting' | 'checking' | 'success' | 'error'>('generating')
const errorMessage = ref('')

let pollInterval: ReturnType<typeof setInterval> | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null

// Initialize QR code when visible
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    initQRCode()
    startPolling()
  } else {
    cleanup()
  }
})

onMounted(() => {
  if (props.visible) {
    initQRCode()
    startPolling()
  }
})

onUnmounted(() => {
  cleanup()
})

function initQRCode() {
  if (!qrContainer.value) return

  status.value = 'generating'

  try {
    mobile.value = new EIMZOMobile(
      props.siteId,
      qrContainer.value,
      QRCode,
      { width: 280, height: 280 }
    )

    const result = mobile.value.makeQRCode(props.documentNumber, props.content)

    if (result) {
      qrData.value = {
        hash: result[0],
        code: result[1]
      }
      status.value = 'waiting'
    } else {
      status.value = 'error'
      errorMessage.value = 'Failed to generate QR code'
    }
  } catch (err) {
    status.value = 'error'
    errorMessage.value = (err as Error).message
  }
}

function startPolling() {
  // Poll server for signature
  pollInterval = setInterval(checkForSignature, 3000)

  // Timeout after 5 minutes
  timeoutId = setTimeout(() => {
    if (status.value === 'waiting') {
      status.value = 'error'
      errorMessage.value = 'Signing timed out. Please try again.'
      stopPolling()
    }
  }, 5 * 60 * 1000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

async function checkForSignature() {
  if (status.value !== 'waiting') return

  status.value = 'checking'

  try {
    // Replace with your actual API endpoint
    const response = await fetch(`/api/signatures/${props.documentNumber}`)
    const data = await response.json()

    if (data.signature) {
      status.value = 'success'
      stopPolling()
      emit('signed', data.signature)
    } else {
      status.value = 'waiting'
    }
  } catch {
    status.value = 'waiting'
  }
}

function regenerateQR() {
  if (mobile.value) {
    mobile.value.clear()
  }
  initQRCode()
}

function cleanup() {
  stopPolling()
  if (mobile.value) {
    mobile.value.clear()
  }
  qrData.value = null
  status.value = 'generating'
}

function close() {
  cleanup()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <button class="close-btn" @click="close">&times;</button>

          <h2>Sign with Mobile</h2>

          <!-- Error state -->
          <div v-if="status === 'error'" class="error-state">
            <div class="error-icon">❌</div>
            <p>{{ errorMessage }}</p>
            <button @click="regenerateQR" class="retry-btn">
              Try Again
            </button>
          </div>

          <!-- Success state -->
          <div v-else-if="status === 'success'" class="success-state">
            <div class="success-icon">✅</div>
            <h3>Signed Successfully!</h3>
            <p>The document has been signed.</p>
            <button @click="close" class="done-btn">Done</button>
          </div>

          <!-- QR code state -->
          <div v-else class="qr-state">
            <div ref="qrContainer" class="qr-container" />

            <div class="status-indicator">
              <div v-if="status === 'generating'" class="status generating">
                <div class="spinner" />
                <span>Generating QR code...</span>
              </div>
              <div v-else-if="status === 'waiting'" class="status waiting">
                <div class="pulse" />
                <span>Waiting for signature...</span>
              </div>
              <div v-else-if="status === 'checking'" class="status checking">
                <div class="spinner" />
                <span>Checking...</span>
              </div>
            </div>

            <div class="instructions">
              <h4>How to sign:</h4>
              <ol>
                <li>Open <strong>E-IMZO</strong> app on your phone</li>
                <li>Tap <strong>"Scan QR Code"</strong></li>
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
                <code>{{ qrData.hash.substring(0, 16) }}...{{ qrData.hash.substring(48) }}</code>
              </p>
            </div>

            <button @click="regenerateQR" class="refresh-btn">
              🔄 Regenerate QR Code
            </button>
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
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

h2 {
  margin: 0 0 24px;
  text-align: center;
  color: #333;
}

.qr-container {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-indicator {
  text-align: center;
  margin-bottom: 16px;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pulse {
  width: 12px;
  height: 12px;
  background: #27ae60;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.instructions {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.instructions h4 {
  margin: 0 0 8px;
  font-size: 14px;
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
}

.instructions li {
  margin: 6px 0;
}

.doc-info {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.doc-info p {
  margin: 4px 0;
}

.hash code {
  font-size: 11px;
  background: #eee;
  padding: 2px 4px;
  border-radius: 2px;
}

.refresh-btn {
  width: 100%;
  padding: 10px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.error-state, .success-state {
  text-align: center;
  padding: 24px;
}

.error-icon, .success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn, .done-btn {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import MobileSigningModal from './MobileSigningModal.vue'

const showModal = ref(false)
const documentContent = ref('Contract terms and conditions...')

function handleSigned(signature: string) {
  console.log('Signature received:', signature)
  showModal.value = false
}
</script>

<template>
  <button @click="showModal = true">
    Sign with Mobile
  </button>

  <MobileSigningModal
    :visible="showModal"
    site-id="YOUR_SITE_ID"
    document-number="DOC-2024-001"
    :content="documentContent"
    @close="showModal = false"
    @signed="handleSigned"
  />
</template>
```

## Server-Side API

Create an endpoint to receive signatures from E-IMZO:

```ts
// /api/signatures/:documentNumber (GET)
app.get('/api/signatures/:documentNumber', async (req, res) => {
  const { documentNumber } = req.params

  const signature = await db.signatures.findOne({ documentNumber })

  res.json({
    signature: signature?.pkcs7 || null
  })
})

// E-IMZO callback endpoint
app.post('/api/eimzo/callback', async (req, res) => {
  const { documentNumber, signature, hash } = req.body

  // Verify signature
  // Store in database
  await db.signatures.create({
    documentNumber,
    pkcs7: signature,
    hash,
    signedAt: new Date()
  })

  res.json({ success: true })
})
```

## Features

- **Auto-polling** - Checks for signature every 3 seconds
- **Timeout** - Fails after 5 minutes
- **Regeneration** - Can recreate QR code
- **Status indicators** - Visual feedback for each state
- **Teleport** - Modal renders at document root
- **Cleanup** - Proper resource cleanup on close

## Next Steps

- [Vue Component](/examples/vue-component) - Complete signing component
