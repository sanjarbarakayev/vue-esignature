# useESignature Composable

Vue 3 composable for E-IMZO digital signature operations.

## Import

```ts
import { useESignature } from '@eimzo/vue'
```

## Usage

```ts
const {
  // Methods
  install,
  listKeys,
  loadKey,
  signData,
  createPkcs7,
  changeKeyPassword,
  isIDCardPlugged,
  isBAIKTokenPlugged,
  isCKCPlugged,
  signWithUSB,
  signWithBAIK,
  signWithCKC,
  addApiKey,

  // Reactive State
  isInstalled,
  isLoading,
  loadedKey,
  error
} = useESignature()
```

## Reactive State

### isInstalled

```ts
isInstalled: Ref<boolean>
```

Whether E-IMZO has been successfully initialized.

### isLoading

```ts
isLoading: Ref<boolean>
```

Whether an operation is in progress.

### loadedKey

```ts
loadedKey: Ref<Certificate | null>
```

The currently loaded certificate.

### error

```ts
error: Ref<Error | null>
```

The last error that occurred.

## Methods

### install()

```ts
async install(): Promise<void>
```

Initialize E-IMZO. Sets `isInstalled` to `true` on success.

**Example:**
```ts
const { install, isInstalled, error } = useESignature()

await install()

if (error.value) {
  console.error('Failed:', error.value.message)
} else {
  console.log('Installed:', isInstalled.value)
}
```

### listKeys()

```ts
async listKeys(): Promise<Certificate[]>
```

List all available certificates.

**Example:**
```ts
const certs = await listKeys()
console.log(`Found ${certs.length} certificates`)
```

### loadKey()

```ts
async loadKey(cert: Certificate): Promise<LoadKeyResult>
```

Load a certificate. Updates `loadedKey` on success.

**Example:**
```ts
const { id, cert } = await loadKey(selectedCert)
console.log('Key ID:', id)
console.log('Loaded cert:', loadedKey.value?.CN)
```

### signData()

```ts
async signData(
  keyId: string,
  content: string
): Promise<SignPkcs7Result | string>
```

Sign data using a loaded key.

**Example:**
```ts
const { id } = await loadKey(cert)
const signature = await signData(id, 'Document content')
```

### createPkcs7()

```ts
async createPkcs7(
  keyId: string,
  content: string,
  detached?: boolean
): Promise<SignPkcs7Result | string>
```

Create PKCS#7 signature with optional detached mode.

### changeKeyPassword()

```ts
async changeKeyPassword(cert: Certificate): Promise<void>
```

Change certificate password.

### addApiKey()

```ts
addApiKey(domain: string, key: string): void
```

Add API key for a domain.

### isIDCardPlugged()

```ts
async isIDCardPlugged(): Promise<boolean>
```

Check if ID card is connected.

### isBAIKTokenPlugged()

```ts
async isBAIKTokenPlugged(): Promise<boolean>
```

Check if BAIK token is connected.

### isCKCPlugged()

```ts
async isCKCPlugged(): Promise<boolean>
```

Check if CKC device is connected.

### signWithUSB()

```ts
async signWithUSB(content: string): Promise<string>
```

Sign with USB token.

### signWithBAIK()

```ts
async signWithBAIK(content: string): Promise<string>
```

Sign with BAIK token.

### signWithCKC()

```ts
async signWithCKC(content: string): Promise<string>
```

Sign with CKC device.

## Complete Example

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useESignature } from '@eimzo/vue'
import type { Certificate } from '@eimzo/vue'

const {
  install,
  listKeys,
  loadKey,
  signData,
  isInstalled,
  isLoading,
  loadedKey,
  error
} = useESignature()

const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const content = ref('Document to sign')
const signature = ref('')

const canSign = computed(() =>
  isInstalled.value &&
  selectedCert.value &&
  !isLoading.value
)

onMounted(async () => {
  await install()
  if (isInstalled.value) {
    certificates.value = await listKeys()
  }
})

async function handleSign() {
  if (!selectedCert.value) return

  const { id } = await loadKey(selectedCert.value)
  const result = await signData(id, content.value)
  signature.value = typeof result === 'string' ? result : result.pkcs7_64
}
</script>

<template>
  <div>
    <div v-if="error" class="error">
      {{ error.message }}
    </div>

    <div v-if="isLoading">Loading...</div>

    <div v-else-if="isInstalled">
      <select v-model="selectedCert">
        <option :value="null">Select certificate</option>
        <option v-for="cert in certificates" :key="cert.serialNumber" :value="cert">
          {{ cert.CN }}
        </option>
      </select>

      <textarea v-model="content" rows="4" />

      <button @click="handleSign" :disabled="!canSign">
        Sign
      </button>

      <div v-if="loadedKey">
        Signed with: {{ loadedKey.CN }}
      </div>

      <textarea v-if="signature" :value="signature" readonly rows="6" />
    </div>

    <div v-else>
      E-IMZO not available
    </div>
  </div>
</template>
```

## Return Type

```ts
interface UseESignatureReturn {
  // Methods
  install: () => Promise<void>
  listKeys: () => Promise<Certificate[]>
  loadKey: (cert: Certificate) => Promise<LoadKeyResult>
  signData: (keyId: string, content: string) => Promise<SignPkcs7Result | string>
  createPkcs7: (keyId: string, content: string, detached?: boolean) => Promise<SignPkcs7Result | string>
  changeKeyPassword: (cert: Certificate) => Promise<void>
  addApiKey: (domain: string, key: string) => void
  isIDCardPlugged: () => Promise<boolean>
  isBAIKTokenPlugged: () => Promise<boolean>
  isCKCPlugged: () => Promise<boolean>
  signWithUSB: (content: string) => Promise<string>
  signWithBAIK: (content: string) => Promise<string>
  signWithCKC: (content: string) => Promise<string>

  // Reactive State
  isInstalled: Ref<boolean>
  isLoading: Ref<boolean>
  loadedKey: Ref<Certificate | null>
  error: Ref<Error | null>
}
```

## See Also

- [ESignature Class](/api/esignature)
- [Certificate Types](/api/types)
