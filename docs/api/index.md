# API Overview

Vue E-Signature provides multiple APIs to integrate E-IMZO digital signatures into your Vue 3 application.

## Core APIs

### useESignature Composable

The recommended way to use Vue E-Signature in Vue 3 components:

```ts
import { useESignature } from '@eimzo/vue'

const {
  install,
  listKeys,
  loadKey,
  signData,
  isInstalled,
  error
} = useESignature()
```

[View full documentation →](/api/composable)

### ESignature Class

For class-based usage or outside Vue components:

```ts
import { ESignature } from '@eimzo/vue'

const esign = new ESignature()
await esign.install()
```

[View full documentation →](/api/esignature)

## Crypto Utilities

### CRC32

Calculate CRC32 checksums:

```ts
import { CRC32, crc32, crc32Hex } from '@eimzo/vue'

const checksum = crc32('Hello World')
```

[View full documentation →](/api/crc32)

### GOST Hash

Calculate GOST R 34.11-94 hashes:

```ts
import { GostHash, gosthash } from '@eimzo/vue'

const hash = gosthash('Document content')
```

[View full documentation →](/api/gost-hash)

## Mobile Support

### EIMZOMobile

Generate QR codes for mobile signing:

```ts
import { EIMZOMobile } from '@eimzo/vue'

const mobile = new EIMZOMobile(siteId, element, QRCodeLib)
mobile.makeQRCode('DOC-001', 'Content')
```

[View full documentation →](/api/e-imzo-mobile)

## Internationalization

### i18n Functions

Localized error messages:

```ts
import { setLocale, getErrorMessage } from '@eimzo/vue'

setLocale('uz')
const msg = getErrorMessage('WRONG_PASSWORD')
```

[View full documentation →](/api/i18n)

## Types Reference

All TypeScript types and interfaces:

```ts
import type {
  Certificate,
  PfxCertificate,
  FtjcCertificate,
  LoadKeyResult,
  SignPkcs7Result
} from '@eimzo/vue'
```

[View full documentation →](/api/types)

## Quick Reference

| API | Description |
|-----|-------------|
| `useESignature()` | Vue 3 composable for E-IMZO operations |
| `ESignature` | Main class for signing operations |
| `EIMZOClient` | Low-level client (advanced usage) |
| `CAPIWS` | WebSocket transport layer (advanced usage) |
| `CRC32` | CRC32 checksum calculator |
| `GostHash` | GOST R 34.11-94 hash function |
| `SignedAttributeHash` | PKCS#7 signed attribute hasher |
| `EIMZOMobile` | Mobile QR code generator |
| `i18n` | Internationalization utilities |
