# Vue E-Signature

[![npm version](https://img.shields.io/npm/v/vue-esignature.svg)](https://www.npmjs.com/package/vue-esignature)
[![npm downloads](https://img.shields.io/npm/dm/vue-esignature.svg)](https://www.npmjs.com/package/vue-esignature)
[![license](https://img.shields.io/npm/l/vue-esignature.svg)](https://github.com/yourusername/vue-esignature/blob/main/LICENSE)

Vue 3 plugin for **E-IMZO** electronic digital signature (EDS) integration - Uzbekistan's national digital signature system.

## Features

- 🔐 **Full E-IMZO Support** - PFX certificates, USB tokens, BAIK tokens, CKC devices
- 🎯 **Vue 3 Integration** - Plugin and composable with full TypeScript support
- ⚡ **Promise-based API** - Modern async/await pattern
- 📦 **Tree-shakeable** - Import only what you need
- 🔒 **Type-safe** - Full TypeScript definitions included

## Requirements

- **Vue 3.3+**
- **E-IMZO Application** installed on user's computer
  - Download from: <https://e-imzo.uz/main/downloads/>
  - Minimum version: **3.37**

## Installation

```bash
# npm
npm install vue-esignature

# yarn
yarn add vue-esignature

# pnpm
pnpm add vue-esignature
```

## Quick Start

### 1. Register the Plugin

```typescript
// main.ts
import { createApp } from 'vue'
import { VueESignature } from 'vue-esignature'
import App from './App.vue'

const app = createApp(App)
app.use(VueESignature)
app.mount('#app')
```

### 2. Use in Components

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature, type Certificate } from 'vue-esignature'

const {
  isInstalled,
  isLoading,
  error,
  certificates,
  install,
  listKeys,
  loadKey,
  signData
} = useESignature()

const selectedCert = ref<Certificate | null>(null)

onMounted(async () => {
  // Initialize E-IMZO
  const success = await install()
  if (!success) {
    console.error('E-IMZO not installed:', error.value)
    return
  }

  // Get available certificates
  await listKeys()
})

const handleSign = async () => {
  if (!selectedCert.value) return

  try {
    // Load the certificate key
    const { id } = await loadKey(selectedCert.value)

    // Sign data
    const signature = await signData(JSON.stringify({ data: 'to sign' }))
    console.log('Signature:', signature)
  } catch (e) {
    console.error('Signing failed:', e)
  }
}
</script>

<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="isInstalled">
      <select v-model="selectedCert">
        <option v-for="cert in certificates" :key="cert.serialNumber" :value="cert">
          {{ cert.CN }} ({{ cert.TIN }})
        </option>
      </select>
      <button @click="handleSign" :disabled="!selectedCert">
        Sign Document
      </button>
    </div>
    <div v-else>E-IMZO not installed</div>
  </div>
</template>
```

## Plugin Options

```typescript
app.use(VueESignature, {
  apiKeys: [
    { domain: 'myapp.example.com', key: 'YOUR_API_KEY_HERE' },
    { domain: 'api.example.com', key: 'ANOTHER_API_KEY' }
  ]
})
```

## API Reference

### `useESignature()` Composable

#### Reactive State

| Property | Type | Description |
|----------|------|-------------|
| `signer` | `ESignature` | E-Signature instance |
| `isInstalled` | `Ref<boolean>` | Whether E-IMZO is initialized |
| `isLoading` | `Ref<boolean>` | Operation in progress |
| `error` | `Ref<string \| null>` | Current error message |
| `certificates` | `Ref<Certificate[]>` | Available certificates |
| `loadedCert` | `Ref<Certificate \| null>` | Loaded certificate |
| `loadedKeyId` | `Ref<string \| null>` | Current key ID |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `install()` | `Promise<boolean>` | Initialize E-IMZO |
| `listKeys()` | `Promise<Certificate[]>` | Get certificates |
| `loadKey(cert)` | `Promise<LoadKeyResult>` | Load certificate key |
| `signData(data, keyId?)` | `Promise<string>` | Sign with loaded key |
| `signWithUSB(data)` | `Promise<string>` | Sign with USB token |
| `signWithBAIK(data)` | `Promise<string>` | Sign with BAIK token |
| `checkUSBToken()` | `Promise<boolean>` | Check USB connection |
| `checkBAIKToken()` | `Promise<boolean>` | Check BAIK connection |
| `clearError()` | `void` | Clear error state |
| `reset()` | `void` | Reset all state |

### `ESignature` Class

For direct class usage without the composable:

```typescript
import { ESignature } from 'vue-esignature'

const signer = new ESignature()

// Add custom API keys
signer.addApiKey('myapp.example.com', 'API_KEY')

// Initialize
await signer.install()

// List certificates
const certs = await signer.listAllUserKeys()

// Load and sign
const { id } = await signer.loadKey(cert)
const signature = await signer.createPkcs7(id, data)
```

### Certificate Type

```typescript
interface Certificate {
  serialNumber: string;    // Certificate serial number
  validFrom: Date;         // Validity start date
  validTo: Date;           // Validity end date
  CN: string;              // Common Name (owner's full name)
  TIN: string;             // Tax Identification Number (INN)
  PINFL: string;           // Personal ID Number
  UID: string;             // Unique Identifier
  O: string;               // Organization
  T: string;               // Title/Position
  type: 'pfx' | 'ftjc';    // Certificate type
}
```

## Hardware Token Support

### USB Token (ID Card)

```typescript
const { checkUSBToken, signWithUSB } = useESignature()

const isPlugged = await checkUSBToken()
if (isPlugged) {
  const signature = await signWithUSB(dataToSign)
}
```

### BAIK Token

```typescript
const { checkBAIKToken, signWithBAIK } = useESignature()

const isPlugged = await checkBAIKToken()
if (isPlugged) {
  const signature = await signWithBAIK(dataToSign)
}
```

## Error Handling

```typescript
const { install, error, clearError } = useESignature()

const success = await install()

if (!success) {
  if (error.value?.includes('E-IMZO')) {
    // E-IMZO not installed
    showInstallPrompt()
  } else if (error.value?.includes('version')) {
    // Version too old
    showUpdatePrompt()
  }
  
  clearError()
}
```

### Common Error Messages

| Message | Meaning | Solution |
|---------|---------|----------|
| "Ошибка соединения с E-IMZO" | E-IMZO not running | Install/start E-IMZO |
| "ВНИМАНИЕ !!! Установите новую версию" | Version too old | Update E-IMZO |
| "Пароль неверный" | Wrong password | Re-enter password |
| "Браузер не поддерживает WebSocket" | Old browser | Update browser |

## Key Caching

For better UX, cache the key ID to avoid repeated password prompts:

```typescript
import Cookies from 'js-cookie'

const CACHE_KEY = `key_${cert.UID}`
const cachedKeyId = Cookies.get(CACHE_KEY)

if (cachedKeyId) {
  try {
    return await signData(data, cachedKeyId)
  } catch {
    // Key expired, reload
  }
}

const { id } = await loadKey(cert)
Cookies.set(CACHE_KEY, id, { expires: 0.25 }) // 6 hours
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Certificate,
  PfxCertificate,
  FtjcCertificate,
  LoadKeyResult,
  SignPkcs7Result,
  VersionInfo,
  ESignaturePluginOptions
} from 'vue-esignature'
```

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Edge | 79+ |
| Safari | 11+ |

> **Note**: WebSocket support required. Internet Explorer is not supported.

## Security Notes

1. **API Keys** - Keep API keys secure. Don't commit to public repositories.
2. **HTTPS** - Use HTTPS in production (E-IMZO uses `wss://` for secure connections).
3. **Passwords** - Certificate passwords are entered via E-IMZO native dialog, never in browser.

## Troubleshooting

### E-IMZO not detected

1. Ensure E-IMZO application is installed
2. Check if E-IMZO service is running
3. Try restarting the browser
4. Check firewall settings (ports 64443/64646)

### No certificates found

1. Check if certificates are installed in E-IMZO
2. Verify certificate validity dates
3. Ensure certificates have TIN or PINFL

### Signing fails

1. Check certificate expiration
2. Verify password is correct
3. Ensure key ID hasn't expired (reload if needed)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © Your Name

## Related Links

- [E-IMZO Official Site](https://e-imzo.uz/)
- [E-IMZO Downloads](https://e-imzo.uz/main/downloads/)
- [Installation Guide](https://esi.uz/index/help)
