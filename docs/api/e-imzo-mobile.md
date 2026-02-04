# EIMZOMobile

QR code generator for E-IMZO mobile signing.

## Import

```ts
import { EIMZOMobile } from '@eimzo/vue'
import type {
  IQRCode,
  IQRCodeConstructor,
  EIMZOMobileOptions,
  QRCodeResult
} from '@eimzo/vue'
```

## Constructor

```ts
new EIMZOMobile(
  siteId: string,
  element: HTMLElement,
  QRCodeLib: IQRCodeConstructor,
  options?: EIMZOMobileOptions
)
```

**Parameters:**
- `siteId` - Your registered E-IMZO site identifier
- `element` - HTML element to render QR code into
- `QRCodeLib` - QR code library constructor
- `options` - Optional configuration

**Options:**
```ts
interface EIMZOMobileOptions {
  width?: number   // Default: 300
  height?: number  // Default: 300
}
```

**Example:**
```ts
import QRCode from 'qrcode.js'

const element = document.getElementById('qrcode')!
const mobile = new EIMZOMobile('SITE123', element, QRCode, {
  width: 256,
  height: 256
})
```

## Methods

### makeQRCode()

```ts
makeQRCode(docNum: string, text: string): [string, string] | null
```

Generate and display a QR code for document signing.

**Parameters:**
- `docNum` - Document number/identifier
- `text` - Document content to be signed

**Returns:** Tuple of `[textHash, fullCode]` or `null` if parameters are invalid.

**Example:**
```ts
const result = mobile.makeQRCode('DOC-2024-001', 'Contract content...')

if (result) {
  const [textHash, qrCode] = result
  console.log('Document hash:', textHash)
  console.log('QR code data:', qrCode)
}
```

### clear()

```ts
clear(): void
```

Clear the current QR code display.

**Example:**
```ts
mobile.clear()
```

## Static Methods

### generateQRCodeData()

```ts
static generateQRCodeData(
  siteId: string,
  docNum: string,
  text: string
): QRCodeResult | null
```

Generate QR code data without rendering.

**Returns:**
```ts
interface QRCodeResult {
  textHash: string  // 64-char GOST hash of content
  code: string      // Full QR code data string
}
```

**Example:**
```ts
const result = EIMZOMobile.generateQRCodeData(
  'SITE123',
  'DOC-001',
  'Document content'
)

if (result) {
  // Use your own QR rendering
  renderQRCode(result.code)
}
```

## QR Code Data Format

The QR code contains concatenated data:

```
[SITE_ID][DOC_NUMBER][GOST_HASH (64 chars)][CRC32 (8 chars)]
```

**Example:**
```
SITE123DOC-001bc6041dd2aa401ebfa6e9886734174febdb4729aa972d60f549ac39b29721ba0a1b2c3d4
```

## QRCode Library Interface

Your QR code library must implement:

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

### Compatible Libraries

#### qrcode.js

```bash
npm install qrcode.js
```

```ts
import QRCode from 'qrcode.js'

const mobile = new EIMZOMobile(siteId, element, QRCode)
```

#### Custom Wrapper

```ts
import SomeQRLibrary from 'some-qr-library'

class QRCodeWrapper implements IQRCode {
  private instance: any

  constructor(el: HTMLElement, opts?: { width?: number; height?: number }) {
    this.instance = new SomeQRLibrary(el, opts)
  }

  makeCode(data: string): void {
    this.instance.generate(data)
  }

  clear(): void {
    this.instance.destroy()
  }
}

const mobile = new EIMZOMobile(siteId, element, QRCodeWrapper)
```

## Complete Example

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

const qrElement = ref<HTMLElement | null>(null)
const mobile = ref<EIMZOMobile | null>(null)
const qrResult = ref<{ hash: string; code: string } | null>(null)

onMounted(() => {
  if (qrElement.value) {
    mobile.value = new EIMZOMobile(
      props.siteId,
      qrElement.value,
      QRCode,
      { width: 280, height: 280 }
    )

    const result = mobile.value.makeQRCode(
      props.documentNumber,
      props.content
    )

    if (result) {
      qrResult.value = {
        hash: result[0],
        code: result[1]
      }
    }
  }
})

onUnmounted(() => {
  mobile.value?.clear()
})

function regenerate() {
  const result = mobile.value?.makeQRCode(
    props.documentNumber,
    props.content
  )

  if (result) {
    qrResult.value = {
      hash: result[0],
      code: result[1]
    }
  }
}
</script>

<template>
  <div class="mobile-signing">
    <div ref="qrElement" class="qr-code" />

    <div v-if="qrResult" class="info">
      <p><strong>Document Hash:</strong></p>
      <code>{{ qrResult.hash }}</code>
    </div>

    <div class="instructions">
      <ol>
        <li>Open E-IMZO app on your phone</li>
        <li>Tap "Scan QR"</li>
        <li>Point camera at QR code</li>
        <li>Enter PIN and confirm</li>
      </ol>
    </div>

    <button @click="regenerate">Regenerate QR</button>
  </div>
</template>
```

## Server-Side Usage

Generate QR data on the server:

```ts
import { EIMZOMobile } from '@eimzo/vue'

// No QRCode library needed for data generation
const result = EIMZOMobile.generateQRCodeData(
  'SITE123',
  'DOC-001',
  'Document content'
)

if (result) {
  // Send to client or use server-side QR rendering
  return {
    qrData: result.code,
    documentHash: result.textHash
  }
}
```

## See Also

- [Mobile Signing Guide](/guide/mobile)
- [GOST Hash](/api/gost-hash)
- [CRC32](/api/crc32)
