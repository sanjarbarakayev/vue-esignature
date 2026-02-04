# TypeScript Support

Vue E-Signature is written in TypeScript and provides complete type definitions out of the box.

## Type Imports

Import types directly from the package:

```ts
import type {
  Certificate,
  PfxCertificate,
  FtjcCertificate,
  LoadKeyResult,
  SignPkcs7Result,
  VersionInfo,
  SupportedLocale,
  ErrorMessageKey
} from '@eimzo/vue'
```

## Certificate Types

### Base Certificate

All certificates share these properties:

```ts
interface BaseCertificate {
  serialNumber: string
  validFrom: Date
  validTo: Date
  CN: string        // Common Name
  TIN: string       // Tax ID
  PINFL: string     // Personal ID
  UID: string
  O: string         // Organization
  T: string         // Title
  type: CertificateType
}
```

### PFX Certificate

```ts
interface PfxCertificate extends BaseCertificate {
  type: 'pfx'
  disk: string      // Drive letter
  path: string      // File path
  name: string      // File name
  alias: string     // Certificate alias
}
```

### FTJC Certificate

```ts
interface FtjcCertificate extends BaseCertificate {
  type: 'ftjc'
  cardUID: string
  statusInfo: string
  ownerName: string
  info: string
}
```

### Union Type

```ts
type Certificate = PfxCertificate | FtjcCertificate

// Type guard
function isPfxCertificate(cert: Certificate): cert is PfxCertificate {
  return cert.type === 'pfx'
}

function isFtjcCertificate(cert: Certificate): cert is FtjcCertificate {
  return cert.type === 'ftjc'
}
```

## Using Types with Composable

```ts
import { ref } from 'vue'
import { useESignature } from '@eimzo/vue'
import type {
  Certificate,
  LoadKeyResult,
  SignPkcs7Result
} from '@eimzo/vue'

const { install, listKeys, loadKey, signData } = useESignature()

// Typed refs
const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)
const keyResult = ref<LoadKeyResult | null>(null)
const signature = ref<string | SignPkcs7Result | null>(null)

async function initAndList() {
  await install()
  certificates.value = await listKeys()
}

async function loadAndSign(cert: Certificate, content: string) {
  // loadKey returns LoadKeyResult
  keyResult.value = await loadKey(cert)

  // signData returns string | SignPkcs7Result
  signature.value = await signData(keyResult.value.id, content)
}
```

## Using Types with Class API

```ts
import { ESignature } from '@eimzo/vue'
import type {
  Certificate,
  VersionInfo,
  LoadKeyResult
} from '@eimzo/vue'

class SigningService {
  private esign = new ESignature()
  private keyId: string | null = null

  async initialize(): Promise<VersionInfo> {
    await this.esign.install()
    return {
      major: 3,
      minor: 40
    }
  }

  async getCertificates(): Promise<Certificate[]> {
    return this.esign.listAllUserKeys()
  }

  async loadCertificate(cert: Certificate): Promise<LoadKeyResult> {
    const result = await this.esign.loadKey(cert)
    this.keyId = result.id
    return result
  }

  async sign(content: string): Promise<string> {
    if (!this.keyId) {
      throw new Error('No key loaded')
    }

    const result = await this.esign.createPkcs7(this.keyId, content)
    return typeof result === 'string' ? result : result.pkcs7_64
  }
}
```

## Generic Components

Create type-safe components:

```vue
<script setup lang="ts" generic="T extends Certificate">
import type { Certificate } from '@eimzo/vue'

const props = defineProps<{
  certificates: T[]
  modelValue: T | null
}>()

const emit = defineEmits<{
  'update:modelValue': [cert: T | null]
  select: [cert: T]
}>()

function selectCert(cert: T) {
  emit('update:modelValue', cert)
  emit('select', cert)
}
</script>

<template>
  <div class="cert-list">
    <div
      v-for="cert in certificates"
      :key="cert.serialNumber"
      @click="selectCert(cert)"
    >
      {{ cert.CN }}
    </div>
  </div>
</template>
```

## Type-Safe Error Handling

```ts
import type { ErrorMessageKey, SupportedLocale } from '@eimzo/vue'
import { getErrorMessage, setLocale } from '@eimzo/vue'

// TypeScript ensures only valid keys are used
const messageKey: ErrorMessageKey = 'WRONG_PASSWORD'
const message = getErrorMessage(messageKey)

// TypeScript ensures only valid locales
const locale: SupportedLocale = 'uz'
setLocale(locale)

// This would cause a TypeScript error:
// setLocale('fr') // Error: Argument not assignable
```

## QR Code Types

```ts
import type {
  IQRCode,
  IQRCodeConstructor,
  EIMZOMobileOptions,
  QRCodeResult
} from '@eimzo/vue'

// Implement your own QR code adapter
class CustomQRCode implements IQRCode {
  private element: HTMLElement

  constructor(element: HTMLElement, options?: { width?: number; height?: number }) {
    this.element = element
  }

  makeCode(data: string): void {
    // Implementation
  }

  clear(): void {
    // Implementation
  }
}

// Use with EIMZOMobile
const QRCodeClass: IQRCodeConstructor = CustomQRCode
```

## GOST Hash Types

```ts
import type {
  IGostHash,
  SignedAttributeHashResult,
  GostTestVector
} from '@eimzo/vue'

import { GostHash, GOST_TEST_VECTORS } from '@eimzo/vue'

const hasher: IGostHash = new GostHash()
const hash: string = hasher.gosthash('test')

// Test vectors are typed
const vectors: readonly GostTestVector[] = GOST_TEST_VECTORS
vectors.forEach(v => {
  console.log(v.hash, v.text)
})
```

## Type Assertions and Guards

```ts
import type { Certificate, SignPkcs7Result } from '@eimzo/vue'

// Type guard for SignPkcs7Result
function isSignPkcs7Result(value: unknown): value is SignPkcs7Result {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pkcs7_64' in value &&
    'signature_hex' in value
  )
}

// Usage
async function getSignatureString(keyId: string, content: string): Promise<string> {
  const result = await signData(keyId, content)

  if (typeof result === 'string') {
    return result
  }

  if (isSignPkcs7Result(result)) {
    return result.pkcs7_64
  }

  throw new Error('Unexpected result type')
}
```

## Strict Null Checks

Vue E-Signature works well with strict null checks:

```ts
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

```ts
const selectedCert = ref<Certificate | null>(null)

async function signIfSelected() {
  // TypeScript requires null check
  if (!selectedCert.value) {
    throw new Error('No certificate selected')
  }

  // Now TypeScript knows selectedCert.value is Certificate
  const { id } = await loadKey(selectedCert.value)
}
```

## Module Augmentation

Extend types if needed:

```ts
// types/vue-esignature.d.ts
import '@eimzo/vue'

declare module '@eimzo/vue' {
  interface PfxCertificate {
    // Add custom property
    customField?: string
  }
}
```

## Best Practices

1. **Import types explicitly** - Use `import type` for type-only imports
2. **Use type guards** - Create guards for union types
3. **Enable strict mode** - Use strict TypeScript configuration
4. **Document custom types** - Add JSDoc comments to custom types
5. **Avoid `any`** - Use proper types instead of `any`

## Next Steps

- [API Reference](/api/) - Complete API documentation
- [Examples](/examples/) - Type-safe code examples
