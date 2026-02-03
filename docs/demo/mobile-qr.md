# Mobile QR Signing Demo

The `MobileQRModal` component generates QR codes for signing documents with the E-IMZO mobile app.

<LiveMobileQR />

## How It Works

1. **Generate QR** - Creates a QR code containing document hash and signing request
2. **Scan with app** - User scans QR code with E-IMZO mobile app
3. **Sign on phone** - User enters PIN and confirms signature on mobile
4. **Receive signature** - Signature is sent back to the web application

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MobileQRModal } from '@sanjarbarakayev/vue-esignature'

const showModal = ref(false)
const documentContent = ref('Document to sign...')

function handleSigned(signature: string, hash: string) {
  console.log('Signature received:', signature)
  showModal.value = false
}
</script>

<template>
  <button @click="showModal = true">
    Sign with Mobile
  </button>

  <MobileQRModal
    :visible="showModal"
    site-id="YOUR_SITE_ID"
    document-number="DOC-2024-001"
    :content="documentContent"
    :poll-endpoint="/api/signatures"
    @close="showModal = false"
    @signed="handleSigned"
    @error="handleError"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | required | Show/hide the modal |
| `siteId` | `string` | required | Your E-IMZO site identifier |
| `documentNumber` | `string` | required | Unique document identifier |
| `content` | `string` | required | Document content to sign |
| `pollEndpoint` | `string` | - | API endpoint to poll for signature |
| `pollInterval` | `number` | `3000` | Polling interval in ms |
| `timeout` | `number` | `300000` | Timeout in ms (5 minutes) |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | - | Modal closed |
| `signed` | `(signature: string, hash: string)` | Signature received |
| `error` | `Error` | Error occurred |

## Server Integration

For full functionality, you need a server endpoint to receive signatures from E-IMZO:

```typescript
// Express.js example
app.get('/api/signatures/:documentNumber', async (req, res) => {
  const signature = await db.signatures.findOne({
    documentNumber: req.params.documentNumber
  })
  res.json({ signature: signature?.pkcs7 || null })
})

// E-IMZO callback endpoint
app.post('/api/eimzo/callback', async (req, res) => {
  const { documentNumber, signature, hash } = req.body
  await db.signatures.create({ documentNumber, signature, hash })
  res.json({ success: true })
})
```

## Mobile App Instructions

The modal displays step-by-step instructions for users:

1. Open **E-IMZO** app on your phone
2. Tap **"Scan QR Code"**
3. Point your camera at the QR code
4. Enter your PIN and confirm
