# Signing Documents

Learn how to create PKCS#7 digital signatures with Vue E-Signature.

## Basic Signing

The simplest signing flow:

```ts
import { useESignature } from '@sanjarbarakayev/vue-esignature'

const { install, listKeys, loadKey, signData } = useESignature()

async function signDocument(content: string) {
  // 1. Initialize E-IMZO
  await install()

  // 2. Get certificates
  const certs = await listKeys()

  // 3. Load a certificate (user enters password)
  const { id } = await loadKey(certs[0])

  // 4. Sign the content
  const signature = await signData(id, content)

  return signature
}
```

## Understanding PKCS#7 Signatures

PKCS#7 (Cryptographic Message Syntax) is the standard format for digital signatures. A PKCS#7 signature contains:

- **Signed Content** (optional) - The original data that was signed
- **Digital Signature** - The cryptographic signature
- **Signer Certificate** - The certificate used for signing
- **Timestamp** (optional) - When the signature was created

## Attached vs Detached Signatures

### Attached Signature

The signed content is included in the PKCS#7 structure:

```ts
const { signData } = useESignature()

// Creates attached signature (content included)
const signature = await signData(keyId, documentContent)
```

**Use cases:**
- Simple document signing
- Self-contained signatures
- Email signatures (S/MIME)

### Detached Signature

Only the signature is created; content must be provided separately:

```ts
const { createPkcs7 } = useESignature()

// Create detached signature
const signature = await createPkcs7(keyId, documentContent, true)

// Store both the document and signature separately
saveDocument(documentContent)
saveSignature(signature)
```

**Use cases:**
- Large file signing
- Binary file signing
- When original content should remain unchanged

## Using the Class API

```ts
import { ESignature } from '@sanjarbarakayev/vue-esignature'

const esign = new ESignature()

async function sign() {
  await esign.install()
  const certs = await esign.listAllUserKeys()
  const { id } = await esign.loadKey(certs[0])

  // Create PKCS#7 signature
  const result = await esign.createPkcs7(id, 'Document content')

  // Result can be a string or SignPkcs7Result object
  if (typeof result === 'string') {
    console.log('Signature:', result)
  } else {
    console.log('PKCS7:', result.pkcs7_64)
    console.log('Signature Hex:', result.signature_hex)
    console.log('Signer Serial:', result.signer_serial_number)
  }
}
```

## Signing Multiple Documents

When signing multiple documents, reuse the loaded key:

```ts
const { loadKey, signData } = useESignature()

async function signMultiple(documents: string[]) {
  // Load key once
  const { id } = await loadKey(certificate)

  // Sign all documents
  const signatures = await Promise.all(
    documents.map(doc => signData(id, doc))
  )

  return signatures
}
```

## Handling Signing Errors

Common errors and how to handle them:

```ts
import { getErrorMessage, setLocale } from '@sanjarbarakayev/vue-esignature'

// Set error message language
setLocale('uz') // or 'ru', 'en'

async function safeSigning(keyId: string, content: string) {
  try {
    return await signData(keyId, content)
  } catch (error) {
    const message = (error as Error).message

    if (message.includes('password') || message.includes('BadPadding')) {
      // Wrong password
      throw new Error(getErrorMessage('WRONG_PASSWORD'))
    }

    if (message.includes('WebSocket')) {
      // E-IMZO not running
      throw new Error(getErrorMessage('CAPIWS_CONNECTION'))
    }

    // Other error
    throw error
  }
}
```

## Signing with Timestamp

For legally-compliant signatures, you may need a timestamp:

```ts
// Note: Timestamping requires additional server configuration
// and is handled by the E-IMZO infrastructure
const signature = await esign.createPkcs7(keyId, content)
```

## Appending Signatures

To add another signature to an existing PKCS#7:

```ts
const { appendPkcs7Attached } = useESignature()

// Original document with first signature
const originalPkcs7 = '...'

// Add second signature
const doubleSigned = await appendPkcs7Attached(keyId, originalPkcs7)
```

## Base64 Encoding

Signatures are returned as Base64-encoded strings. To work with them:

```ts
// Decode Base64 signature to binary
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Download signature as file
function downloadSignature(signature: string, filename: string) {
  const blob = new Blob([base64ToArrayBuffer(signature)], {
    type: 'application/pkcs7-signature'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename + '.p7s'
  link.click()
  URL.revokeObjectURL(url)
}
```

## Signing Component Example

A complete signing component:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useESignature } from '@sanjarbarakayev/vue-esignature'
import type { Certificate } from '@sanjarbarakayev/vue-esignature'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  signed: [signature: string]
  error: [error: Error]
}>()

const { loadKey, signData, listKeys } = useESignature()

const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const loading = ref(false)
const step = ref<'select' | 'password' | 'signing' | 'done'>('select')

async function loadCertificates() {
  certificates.value = await listKeys()
}

async function handleSign() {
  if (!selectedCert.value) return

  try {
    step.value = 'password'
    loading.value = true

    const { id } = await loadKey(selectedCert.value)

    step.value = 'signing'
    const signature = await signData(id, props.content)

    step.value = 'done'
    emit('signed', typeof signature === 'string' ? signature : signature.pkcs7_64)
  } catch (error) {
    emit('error', error as Error)
    step.value = 'select'
  } finally {
    loading.value = false
  }
}

// Load certificates on mount
loadCertificates()
</script>

<template>
  <div class="signing-modal">
    <div v-if="step === 'select'">
      <h3>Select Certificate</h3>
      <select v-model="selectedCert">
        <option :value="null">Choose...</option>
        <option v-for="cert in certificates" :key="cert.serialNumber" :value="cert">
          {{ cert.CN }}
        </option>
      </select>
      <button @click="handleSign" :disabled="!selectedCert">
        Continue
      </button>
    </div>

    <div v-else-if="step === 'password'">
      <h3>Enter Password</h3>
      <p>Please enter your certificate password in the E-IMZO dialog.</p>
      <div class="spinner" />
    </div>

    <div v-else-if="step === 'signing'">
      <h3>Signing...</h3>
      <p>Creating digital signature...</p>
      <div class="spinner" />
    </div>

    <div v-else-if="step === 'done'">
      <h3>Success!</h3>
      <p>Document signed successfully.</p>
    </div>
  </div>
</template>
```

## Security Considerations

1. **Never store passwords** - Let E-IMZO handle password prompts
2. **Validate content before signing** - Ensure the content is what the user expects
3. **Show signed content** - Display what will be signed before the operation
4. **Log signing events** - Keep audit trails for compliance
5. **Use HTTPS** - Always use secure connections in production

## Next Steps

- [Hardware Tokens](/guide/hardware-tokens) - Sign with USB tokens and ID cards
- [Mobile Signing](/guide/mobile) - Generate QR codes for mobile signing
- [Error Handling](/guide/error-handling) - Handle errors gracefully
