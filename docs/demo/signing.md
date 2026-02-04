# Document Signing Demo

The `ESignatureWidget` component provides a complete document signing workflow.

<LiveSigningWidget />

## Features

- **E-IMZO detection** - Automatically checks for E-IMZO installation
- **Certificate selection** - Browse and select from available certificates
- **Hardware token support** - ID Card and BAIK token integration
- **Confirmation step** - Review document before signing
- **Signature download** - Export signature as .p7s file
- **Error handling** - Clear error messages and retry options

## Workflow Steps

1. **Detection** - Check if E-IMZO is installed
2. **Initialize** - Connect to E-IMZO and load certificates
3. **Select** - Choose certificate or hardware token
4. **Confirm** - Review document details
5. **Sign** - Enter password (if required) and create signature
6. **Success** - Download or use the signature

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  ESignatureWidget,
  type Certificate
} from '@eimzo/vue'

const documentContent = ref('Contract content to sign...')

function handleSigned(signature: string, certificate: Certificate) {
  console.log('Signed by:', certificate.CN)
  // Send signature to server
}

function handleError(error: Error) {
  console.error('Signing failed:', error.message)
}
</script>

<template>
  <ESignatureWidget
    :content="documentContent"
    document-title="Employment Contract"
    locale="en"
    :show-preview="true"
    :allow-multiple="false"
    @signed="handleSigned"
    @error="handleError"
    @cancel="handleCancel"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Document content to sign |
| `documentTitle` | `string` | `'Document'` | Title shown in confirmation |
| `locale` | `'en' \| 'ru' \| 'uz'` | `'en'` | Language for messages |
| `showPreview` | `boolean` | `true` | Show content preview |
| `allowMultiple` | `boolean` | `false` | Allow signing multiple documents |
| `compact` | `boolean` | `false` | Use compact display mode |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `signed` | `(signature: string, certificate: Certificate)` | Signing successful |
| `error` | `Error` | Signing failed |
| `cancel` | - | User cancelled |

## Localization

The widget supports three languages:

```typescript
// Change language
import { setLocale } from '@eimzo/vue'

setLocale('ru') // Russian
setLocale('uz') // Uzbek
setLocale('en') // English
```
