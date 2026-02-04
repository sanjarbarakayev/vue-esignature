# Certificate Selection Demo

The `CertificateSelector` component provides a user-friendly interface for browsing and selecting digital certificates.

<LiveCertificateSelector />

## Features

- **Type filtering** - Filter between PFX (file-based) and Token (hardware) certificates
- **Search** - Find certificates by name, organization, or TIN
- **Validity display** - Visual indicators for valid, expiring soon, and expired certificates
- **Responsive design** - Works on desktop and mobile

## Usage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  useESignature,
  CertificateSelector,
  type Certificate
} from '@eimzo/vue'

const { install, listKeys } = useESignature()
const certificates = ref<Certificate[]>([])
const selected = ref<Certificate | null>(null)

onMounted(async () => {
  await install()
  certificates.value = await listKeys()
})
</script>

<template>
  <CertificateSelector
    :certificates="certificates"
    v-model="selected"
    @select="handleSelect"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `certificates` | `Certificate[]` | required | List of certificates to display |
| `modelValue` | `Certificate \| null` | `null` | Currently selected certificate (v-model) |
| `disabled` | `boolean` | `false` | Disable selection |
| `compact` | `boolean` | `false` | Use compact display mode |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `Certificate \| null` | Emitted when selection changes |
| `select` | `Certificate` | Emitted when a certificate is selected |

## Styling

The component uses CSS custom properties that can be overridden:

```css
:root {
  --eimzo-primary: #3498db;
  --eimzo-success: #27ae60;
  --eimzo-warning: #f39c12;
  --eimzo-danger: #e74c3c;
}
```
