# Quick Start

This guide will walk you through creating your first digital signature with Vue E-Signature.

## Basic Setup

### 1. Import the Composable

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature } from '@eimzo/vue'
import type { Certificate } from '@eimzo/vue'

const { install, listKeys, loadKey, signData, isInstalled, error } = useESignature()

const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const signature = ref<string>('')
const loading = ref(false)
</script>
```

### 2. Initialize E-IMZO

```vue
<script setup lang="ts">
onMounted(async () => {
  try {
    loading.value = true
    await install()
    certificates.value = await listKeys()
  } catch (err) {
    console.error('Failed to initialize E-IMZO:', err)
  } finally {
    loading.value = false
  }
})
</script>
```

### 3. Create the UI

```vue
<template>
  <div class="esignature-demo">
    <!-- Loading state -->
    <div v-if="loading">Initializing E-IMZO...</div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      {{ error.message }}
    </div>

    <!-- Ready state -->
    <div v-else-if="isInstalled">
      <!-- Certificate selection -->
      <div class="form-group">
        <label>Select Certificate:</label>
        <select v-model="selectedCert">
          <option :value="null">-- Select --</option>
          <option
            v-for="cert in certificates"
            :key="cert.serialNumber"
            :value="cert"
          >
            {{ cert.CN }} ({{ cert.O }})
          </option>
        </select>
      </div>

      <!-- Sign button -->
      <button
        @click="handleSign"
        :disabled="!selectedCert"
      >
        Sign Document
      </button>

      <!-- Signature result -->
      <div v-if="signature" class="result">
        <h4>Signature (PKCS#7):</h4>
        <textarea readonly :value="signature" rows="6" />
      </div>
    </div>

    <!-- Not installed state -->
    <div v-else>
      <p>E-IMZO is not installed or not running.</p>
      <a href="https://e-imzo.soliq.uz/download/" target="_blank">
        Download E-IMZO
      </a>
    </div>
  </div>
</template>
```

### 4. Handle Signing

```vue
<script setup lang="ts">
async function handleSign() {
  if (!selectedCert.value) return

  try {
    loading.value = true

    // Load the certificate (prompts for password)
    const { id } = await loadKey(selectedCert.value)

    // Sign the document
    const result = await signData(id, 'Document content to sign')
    signature.value = typeof result === 'string' ? result : result.pkcs7_64

  } catch (err) {
    console.error('Signing failed:', err)
    alert('Signing failed: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}
</script>
```

## Complete Example

Here's the complete component:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature } from '@eimzo/vue'
import type { Certificate } from '@eimzo/vue'

const { install, listKeys, loadKey, signData, isInstalled, error } = useESignature()

const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const documentContent = ref('This is the document content to be signed.')
const signature = ref('')
const loading = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    await install()
    certificates.value = await listKeys()
  } catch (err) {
    console.error('Failed to initialize:', err)
  } finally {
    loading.value = false
  }
})

async function handleSign() {
  if (!selectedCert.value) return

  try {
    loading.value = true
    const { id } = await loadKey(selectedCert.value)
    const result = await signData(id, documentContent.value)
    signature.value = typeof result === 'string' ? result : result.pkcs7_64
  } catch (err) {
    alert('Error: ' + (err as Error).message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="esignature-demo">
    <h2>Digital Signature Demo</h2>

    <div v-if="loading" class="loading">
      <span>Loading...</span>
    </div>

    <div v-else-if="error" class="error">
      {{ error.message }}
    </div>

    <div v-else-if="isInstalled" class="content">
      <div class="form-group">
        <label for="cert">Certificate:</label>
        <select id="cert" v-model="selectedCert">
          <option :value="null">Select a certificate</option>
          <option
            v-for="cert in certificates"
            :key="cert.serialNumber"
            :value="cert"
          >
            {{ cert.CN }} - {{ cert.type.toUpperCase() }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="content">Document Content:</label>
        <textarea
          id="content"
          v-model="documentContent"
          rows="4"
        />
      </div>

      <button @click="handleSign" :disabled="!selectedCert || loading">
        {{ loading ? 'Signing...' : 'Sign Document' }}
      </button>

      <div v-if="signature" class="result">
        <label>PKCS#7 Signature:</label>
        <textarea readonly :value="signature" rows="8" />
      </div>
    </div>

    <div v-else class="not-installed">
      <p>E-IMZO is not installed.</p>
      <a
        href="https://e-imzo.soliq.uz/download/"
        target="_blank"
        class="download-btn"
      >
        Download E-IMZO
      </a>
    </div>
  </div>
</template>

<style scoped>
.esignature-demo {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  background: #3eaf7c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  padding: 12px;
  background: #fdeaea;
  border-radius: 4px;
}

.result {
  margin-top: 20px;
}

.result textarea {
  font-family: monospace;
  font-size: 12px;
}

.download-btn {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
}
</style>
```

## Using the Class API

If you prefer a class-based approach:

```ts
import { ESignature } from '@eimzo/vue'

const esignature = new ESignature()

async function signDocument(content: string) {
  // Initialize
  await esignature.install()

  // List certificates
  const certs = await esignature.listAllUserKeys()

  // Load a key (user will be prompted for password)
  const { id } = await esignature.loadKey(certs[0])

  // Sign
  const signature = await esignature.createPkcs7(id, content)

  return signature
}
```

## Next Steps

- [Working with Certificates](/guide/certificates) - Learn about different certificate types
- [Signing Documents](/guide/signing) - Explore advanced signing options
- [Hardware Tokens](/guide/hardware-tokens) - Use USB tokens and ID cards
