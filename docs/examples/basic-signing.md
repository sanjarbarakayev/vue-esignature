# Basic Signing Example

The simplest implementation of digital signing with Vue E-Signature.

## Complete Code

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature, setLocale } from '@sanjarbarakayev/vue-esignature'
import type { Certificate } from '@sanjarbarakayev/vue-esignature'

// Set language (optional)
setLocale('en')

// Get composable methods
const { install, listKeys, loadKey, signData, isInstalled, isLoading, error } = useESignature()

// Reactive state
const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const documentContent = ref('This is the document content to be signed.')
const signature = ref('')

// Initialize on mount
onMounted(async () => {
  try {
    await install()
    certificates.value = await listKeys()
  } catch (err) {
    console.error('Failed to initialize:', err)
  }
})

// Sign handler
async function handleSign() {
  if (!selectedCert.value) {
    alert('Please select a certificate')
    return
  }

  try {
    // Load key (prompts for password)
    const { id } = await loadKey(selectedCert.value)

    // Create signature
    const result = await signData(id, documentContent.value)
    signature.value = typeof result === 'string' ? result : result.pkcs7_64

    alert('Document signed successfully!')
  } catch (err) {
    alert('Signing failed: ' + (err as Error).message)
  }
}

// Download signature as file
function downloadSignature() {
  if (!signature.value) return

  const blob = new Blob([atob(signature.value)], {
    type: 'application/pkcs7-signature'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'signature.p7s'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="signing-demo">
    <h1>Digital Signature Demo</h1>

    <!-- Error display -->
    <div v-if="error" class="error-box">
      <strong>Error:</strong> {{ error.message }}
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>

    <!-- E-IMZO not installed -->
    <div v-else-if="!isInstalled" class="not-installed">
      <h2>E-IMZO Not Available</h2>
      <p>Please install E-IMZO to use digital signatures.</p>
      <a
        href="https://e-imzo.soliq.uz/download/"
        target="_blank"
        class="download-btn"
      >
        Download E-IMZO
      </a>
    </div>

    <!-- Main interface -->
    <div v-else class="main-content">
      <!-- Certificate selector -->
      <div class="form-group">
        <label for="certificate">Select Certificate:</label>
        <select id="certificate" v-model="selectedCert">
          <option :value="null">-- Choose a certificate --</option>
          <option
            v-for="cert in certificates"
            :key="cert.serialNumber"
            :value="cert"
          >
            {{ cert.CN }} ({{ cert.type.toUpperCase() }})
          </option>
        </select>
      </div>

      <!-- Certificate info -->
      <div v-if="selectedCert" class="cert-info">
        <h3>Certificate Information</h3>
        <table>
          <tr>
            <th>Name:</th>
            <td>{{ selectedCert.CN }}</td>
          </tr>
          <tr>
            <th>Organization:</th>
            <td>{{ selectedCert.O || 'N/A' }}</td>
          </tr>
          <tr>
            <th>TIN:</th>
            <td>{{ selectedCert.TIN }}</td>
          </tr>
          <tr>
            <th>Valid Until:</th>
            <td>{{ selectedCert.validTo.toLocaleDateString() }}</td>
          </tr>
          <tr>
            <th>Type:</th>
            <td>{{ selectedCert.type === 'pfx' ? 'Software (PFX)' : 'Hardware Token' }}</td>
          </tr>
        </table>
      </div>

      <!-- Document content -->
      <div class="form-group">
        <label for="content">Document Content:</label>
        <textarea
          id="content"
          v-model="documentContent"
          rows="6"
          placeholder="Enter document content to sign..."
        ></textarea>
      </div>

      <!-- Sign button -->
      <button
        @click="handleSign"
        :disabled="!selectedCert || isLoading"
        class="sign-btn"
      >
        {{ isLoading ? 'Signing...' : 'Sign Document' }}
      </button>

      <!-- Signature result -->
      <div v-if="signature" class="signature-result">
        <h3>Signature (Base64 PKCS#7)</h3>
        <textarea readonly :value="signature" rows="8"></textarea>
        <button @click="downloadSignature" class="download-btn">
          Download .p7s
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signing-demo {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
  font-family: system-ui, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 24px;
}

.error-box {
  background: #fee;
  border: 1px solid #f99;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #c00;
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #eee;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.not-installed {
  text-align: center;
  padding: 32px;
  background: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

select, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

select:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
}

.cert-info {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.cert-info h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.cert-info table {
  width: 100%;
  font-size: 14px;
}

.cert-info th {
  text-align: left;
  padding: 4px 8px 4px 0;
  color: #666;
  width: 120px;
}

.cert-info td {
  padding: 4px 0;
}

.sign-btn {
  width: 100%;
  padding: 14px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.sign-btn:hover:not(:disabled) {
  background: #219a52;
}

.sign-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.signature-result {
  margin-top: 24px;
  padding: 16px;
  background: #e8f5e9;
  border-radius: 8px;
}

.signature-result h3 {
  margin: 0 0 12px;
  color: #2e7d32;
}

.signature-result textarea {
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 12px;
}

.download-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
}

.download-btn:hover {
  background: #2980b9;
}
</style>
```

## Step-by-Step Breakdown

### 1. Import and Setup

```ts
import { useESignature, setLocale } from '@sanjarbarakayev/vue-esignature'
import type { Certificate } from '@sanjarbarakayev/vue-esignature'

setLocale('en') // Optional: set language

const { install, listKeys, loadKey, signData, isInstalled, isLoading, error } = useESignature()
```

### 2. Initialize E-IMZO

```ts
onMounted(async () => {
  await install()
  certificates.value = await listKeys()
})
```

### 3. Sign Document

```ts
const { id } = await loadKey(selectedCert.value) // Prompts for password
const result = await signData(id, documentContent.value)
signature.value = typeof result === 'string' ? result : result.pkcs7_64
```

## Key Points

1. **Always call `install()` first** - Initializes connection to E-IMZO
2. **Handle loading states** - Use `isLoading` to show progress
3. **Check `isInstalled`** - Show download prompt if E-IMZO isn't available
4. **Display `error`** - Show user-friendly error messages
5. **Password prompt** - `loadKey()` triggers E-IMZO's password dialog

## Next Steps

- [Certificate Selection](/examples/certificate-selection) - Advanced certificate picker
- [Mobile QR Signing](/examples/mobile-qr) - Mobile signing support
