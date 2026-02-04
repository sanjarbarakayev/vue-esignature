# Mobile Signing (QR)

Vue E-Signature supports mobile signing through QR codes. Users can scan a QR code with the E-IMZO mobile app to sign documents on their phone.

## How It Works

1. **Generate QR Code** - Create a QR code containing document hash and metadata
2. **User Scans** - User scans the QR code with E-IMZO mobile app
3. **Mobile Signing** - User authenticates and signs on their phone
4. **Signature Received** - Your application receives the signature

## Setting Up Mobile Signing

### 1. Install QR Code Library

Vue E-Signature uses dependency injection for the QR code library. Install your preferred library:

::: code-group

```bash [qrcode.js]
npm install qrcode.js
```

```bash [qrcode]
npm install qrcode
```

:::

### 2. Create EIMZOMobile Instance

```ts
import { EIMZOMobile } from '@eimzo/vue'
import QRCode from 'qrcode.js' // or your preferred library

// Get your site ID from E-IMZO registration
const SITE_ID = 'YOUR_SITE_ID'

// Create instance with QR code element and library
const qrElement = document.getElementById('qrcode')!
const mobile = new EIMZOMobile(SITE_ID, qrElement, QRCode, {
  width: 256,
  height: 256
})
```

### 3. Generate QR Code

```ts
// Generate QR code for document signing
const documentNumber = 'DOC-2024-001'
const documentContent = 'Contract content to be signed...'

const result = mobile.makeQRCode(documentNumber, documentContent)

if (result) {
  const [textHash, qrCodeData] = result
  console.log('Document hash:', textHash)
  console.log('QR code data:', qrCodeData)
}
```

## QRCode Library Interface

Your QR code library must implement this interface:

```ts
interface IQRCode {
  makeCode(data: string): void
  clear?(): void
}

interface IQRCodeConstructor {
  new (element: HTMLElement, options?: {
    width?: number
    height?: number
  }): IQRCode
}
```

### Using qrcode.js

```ts
import QRCode from 'qrcode.js'

const mobile = new EIMZOMobile(SITE_ID, element, QRCode)
```

### Using a Custom Wrapper

If your library has a different interface, create a wrapper:

```ts
import QRCodeLib from 'some-qrcode-library'

class QRCodeWrapper {
  private instance: any

  constructor(element: HTMLElement, options?: { width?: number; height?: number }) {
    this.instance = new QRCodeLib(element, {
      width: options?.width ?? 256,
      height: options?.height ?? 256
    })
  }

  makeCode(data: string): void {
    this.instance.generateCode(data)
  }

  clear(): void {
    this.instance.clearCode()
  }
}

const mobile = new EIMZOMobile(SITE_ID, element, QRCodeWrapper)
```

## Complete Mobile Signing Component

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { EIMZOMobile } from '@eimzo/vue'
import QRCode from 'qrcode.js'

const props = defineProps<{
  siteId: string
  documentNumber: string
  content: string
}>()

const emit = defineEmits<{
  generated: [hash: string, code: string]
}>()

const qrContainer = ref<HTMLElement | null>(null)
const textHash = ref<string | null>(null)
const qrCode = ref<string | null>(null)
const error = ref<string | null>(null)

let mobile: EIMZOMobile | null = null

onMounted(() => {
  if (!qrContainer.value) return

  try {
    mobile = new EIMZOMobile(
      props.siteId,
      qrContainer.value,
      QRCode,
      { width: 300, height: 300 }
    )

    generateQRCode()
  } catch (err) {
    error.value = (err as Error).message
  }
})

function generateQRCode() {
  if (!mobile) return

  const result = mobile.makeQRCode(props.documentNumber, props.content)

  if (result) {
    [textHash.value, qrCode.value] = result
    emit('generated', textHash.value, qrCode.value)
  } else {
    error.value = 'Failed to generate QR code. Check your parameters.'
  }
}

function refresh() {
  if (mobile) {
    mobile.clear()
  }
  generateQRCode()
}

onUnmounted(() => {
  if (mobile) {
    mobile.clear()
  }
})
</script>

<template>
  <div class="mobile-signing">
    <h3>Sign with Mobile</h3>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div class="qr-section">
      <div ref="qrContainer" class="qr-container" />

      <div class="instructions">
        <ol>
          <li>Open E-IMZO mobile app</li>
          <li>Tap "Scan QR Code"</li>
          <li>Point camera at this code</li>
          <li>Confirm and sign</li>
        </ol>
      </div>
    </div>

    <div v-if="textHash" class="hash-info">
      <label>Document Hash:</label>
      <code>{{ textHash.substring(0, 16) }}...{{ textHash.substring(48) }}</code>
    </div>

    <div class="actions">
      <button @click="refresh">
        Regenerate QR Code
      </button>
    </div>
  </div>
</template>

<style scoped>
.mobile-signing {
  text-align: center;
  padding: 20px;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
}

.qr-container {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.instructions {
  text-align: left;
}

.instructions ol {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  margin: 8px 0;
}

.hash-info {
  margin: 16px 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.hash-info code {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.error {
  color: #e74c3c;
  padding: 12px;
  background: #fdeaea;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
```

## Static QR Code Generation

Generate QR code data without rendering:

```ts
import { EIMZOMobile } from '@eimzo/vue'

// Generate data only (for server-side or custom rendering)
const result = EIMZOMobile.generateQRCodeData(
  'SITE_ID',
  'DOC-001',
  'Document content'
)

if (result) {
  console.log('Text hash:', result.textHash)
  console.log('QR code data:', result.code)

  // Use your own QR rendering
  renderCustomQR(result.code)
}
```

## QR Code Data Structure

The QR code contains:

```
[SITE_ID][DOC_NUMBER][GOST_HASH][CRC32]
```

- **SITE_ID** - Your registered site identifier
- **DOC_NUMBER** - Document number/identifier
- **GOST_HASH** - GOST R 34.11-94 hash of document content (64 hex chars)
- **CRC32** - CRC32 checksum for validation (8 hex chars)

## Polling for Signature

After generating the QR code, poll your backend for the signature:

```vue
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  documentNumber: string
}>()

const emit = defineEmits<{
  signed: [signature: string]
}>()

const polling = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function checkSignature() {
  try {
    const response = await fetch(`/api/signatures/${props.documentNumber}`)
    const data = await response.json()

    if (data.signature) {
      stopPolling()
      emit('signed', data.signature)
    }
  } catch (error) {
    console.error('Failed to check signature:', error)
  }
}

function startPolling() {
  polling.value = true
  pollInterval = setInterval(checkSignature, 3000) // Check every 3 seconds
}

function stopPolling() {
  polling.value = false
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Start polling when component mounts
startPolling()

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="polling-status">
    <div v-if="polling" class="waiting">
      <div class="spinner" />
      <p>Waiting for mobile signature...</p>
    </div>
  </div>
</template>
```

## Site Registration

To use mobile signing in production:

1. Register at [e-imzo.uz](https://e-imzo.uz)
2. Obtain your Site ID
3. Configure your backend to receive signatures
4. Use your Site ID in the `EIMZOMobile` constructor

## Best Practices

1. **Show clear instructions** - Guide users through the mobile signing process
2. **Implement timeout** - Don't poll forever; set a reasonable timeout
3. **Handle errors gracefully** - Network issues can occur during polling
4. **Provide alternative** - Offer desktop signing as a fallback
5. **Validate signatures** - Verify signatures on your backend

## Next Steps

- [Internationalization](/guide/i18n) - Localize error messages
- [Error Handling](/guide/error-handling) - Handle mobile signing errors
