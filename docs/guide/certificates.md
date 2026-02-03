# Working with Certificates

E-IMZO supports two types of certificates for digital signatures: software-based PFX certificates and hardware token certificates (FTJC).

## Certificate Types

### PFX Certificates

PFX (Personal Information Exchange) certificates are software-based certificates stored as files with the `.pfx` extension.

```ts
interface PfxCertificate {
  type: 'pfx'
  serialNumber: string
  validFrom: Date
  validTo: Date
  CN: string        // Common Name (full name)
  TIN: string       // Tax Identification Number
  PINFL: string     // Personal ID Number
  UID: string       // Unique Identifier
  O: string         // Organization
  T: string         // Title/Position
  disk: string      // Drive letter (e.g., "C:")
  path: string      // File path
  name: string      // File name
  alias: string     // Certificate alias
}
```

**Characteristics:**
- Stored on the user's computer
- Protected by a password
- Can be backed up and transferred
- Lower security compared to hardware tokens

### FTJC Certificates (Hardware Tokens)

FTJC certificates are stored on hardware tokens like ID cards or USB tokens.

```ts
interface FtjcCertificate {
  type: 'ftjc'
  serialNumber: string
  validFrom: Date
  validTo: Date
  CN: string        // Common Name
  TIN: string       // Tax Identification Number
  PINFL: string     // Personal ID Number
  UID: string       // Unique Identifier
  O: string         // Organization
  T: string         // Title/Position
  cardUID: string   // Card unique identifier
  statusInfo: string
  ownerName: string
  info: string
}
```

**Characteristics:**
- Stored on physical device
- Higher security (private key never leaves the device)
- Requires card reader or USB port
- Cannot be copied or backed up

## Listing Certificates

To get all available certificates:

```ts
import { useESignature } from '@sanjarbarakayev/vue-esignature'

const { listKeys } = useESignature()

const certificates = await listKeys()

// Filter by type
const pfxCerts = certificates.filter(cert => cert.type === 'pfx')
const tokenCerts = certificates.filter(cert => cert.type === 'ftjc')
```

## Displaying Certificate Information

Create a component to display certificate details:

```vue
<script setup lang="ts">
import type { Certificate } from '@sanjarbarakayev/vue-esignature'

defineProps<{
  certificate: Certificate
}>()

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function isExpired(cert: Certificate): boolean {
  return new Date() > cert.validTo
}

function isNotYetValid(cert: Certificate): boolean {
  return new Date() < cert.validFrom
}
</script>

<template>
  <div class="certificate-card" :class="{ expired: isExpired(certificate) }">
    <div class="cert-header">
      <span class="cert-type">{{ certificate.type.toUpperCase() }}</span>
      <span v-if="isExpired(certificate)" class="expired-badge">Expired</span>
      <span v-else-if="isNotYetValid(certificate)" class="invalid-badge">Not Yet Valid</span>
    </div>

    <h3>{{ certificate.CN }}</h3>

    <div class="cert-details">
      <div class="detail-row">
        <span class="label">Organization:</span>
        <span class="value">{{ certificate.O || 'N/A' }}</span>
      </div>
      <div class="detail-row">
        <span class="label">Position:</span>
        <span class="value">{{ certificate.T || 'N/A' }}</span>
      </div>
      <div class="detail-row">
        <span class="label">TIN:</span>
        <span class="value">{{ certificate.TIN }}</span>
      </div>
      <div class="detail-row">
        <span class="label">PINFL:</span>
        <span class="value">{{ certificate.PINFL }}</span>
      </div>
      <div class="detail-row">
        <span class="label">Valid:</span>
        <span class="value">
          {{ formatDate(certificate.validFrom) }} -
          {{ formatDate(certificate.validTo) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="label">Serial:</span>
        <span class="value">{{ certificate.serialNumber }}</span>
      </div>

      <!-- PFX-specific details -->
      <template v-if="certificate.type === 'pfx'">
        <div class="detail-row">
          <span class="label">Location:</span>
          <span class="value">{{ certificate.disk }}{{ certificate.path }}{{ certificate.name }}</span>
        </div>
      </template>

      <!-- FTJC-specific details -->
      <template v-if="certificate.type === 'ftjc'">
        <div class="detail-row">
          <span class="label">Card UID:</span>
          <span class="value">{{ certificate.cardUID }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value">{{ certificate.statusInfo }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
```

## Loading a Certificate

Before signing, you must load the certificate:

```ts
const { loadKey } = useESignature()

try {
  // This will prompt the user for their password
  const { id, cert } = await loadKey(selectedCertificate)

  // id is used for subsequent signing operations
  console.log('Key loaded:', id)
  console.log('Certificate:', cert.CN)
} catch (error) {
  if (error.message.includes('password')) {
    console.error('Wrong password')
  } else {
    console.error('Failed to load key:', error)
  }
}
```

## Validating Certificates

Before using a certificate, validate its status:

```ts
function validateCertificate(cert: Certificate): {
  valid: boolean
  reason?: string
} {
  const now = new Date()

  if (now > cert.validTo) {
    return {
      valid: false,
      reason: `Certificate expired on ${cert.validTo.toLocaleDateString()}`
    }
  }

  if (now < cert.validFrom) {
    return {
      valid: false,
      reason: `Certificate not valid until ${cert.validFrom.toLocaleDateString()}`
    }
  }

  return { valid: true }
}
```

## Certificate Selection Component

A complete certificate selection component:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Certificate } from '@sanjarbarakayev/vue-esignature'

const props = defineProps<{
  certificates: Certificate[]
}>()

const emit = defineEmits<{
  select: [certificate: Certificate]
}>()

const selectedSerial = ref<string | null>(null)
const filterType = ref<'all' | 'pfx' | 'ftjc'>('all')
const showExpired = ref(false)

const filteredCerts = computed(() => {
  return props.certificates.filter(cert => {
    // Filter by type
    if (filterType.value !== 'all' && cert.type !== filterType.value) {
      return false
    }

    // Filter expired
    if (!showExpired.value && new Date() > cert.validTo) {
      return false
    }

    return true
  })
})

function selectCertificate(cert: Certificate) {
  selectedSerial.value = cert.serialNumber
  emit('select', cert)
}
</script>

<template>
  <div class="certificate-selector">
    <div class="filters">
      <select v-model="filterType">
        <option value="all">All Types</option>
        <option value="pfx">PFX Only</option>
        <option value="ftjc">Hardware Tokens Only</option>
      </select>

      <label>
        <input type="checkbox" v-model="showExpired" />
        Show Expired
      </label>
    </div>

    <div v-if="filteredCerts.length === 0" class="no-certs">
      No certificates found
    </div>

    <div
      v-for="cert in filteredCerts"
      :key="cert.serialNumber"
      class="cert-item"
      :class="{ selected: selectedSerial === cert.serialNumber }"
      @click="selectCertificate(cert)"
    >
      <div class="cert-icon">
        {{ cert.type === 'pfx' ? '📄' : '💳' }}
      </div>
      <div class="cert-info">
        <div class="cert-name">{{ cert.CN }}</div>
        <div class="cert-org">{{ cert.O }}</div>
        <div class="cert-validity">
          Valid until: {{ cert.validTo.toLocaleDateString() }}
        </div>
      </div>
    </div>
  </div>
</template>
```

## Changing Certificate Password

To change the password for a PFX certificate:

```ts
const { changeKeyPassword } = useESignature()

try {
  await changeKeyPassword(certificate)
  console.log('Password changed successfully')
} catch (error) {
  console.error('Failed to change password:', error)
}
```

::: warning
Password change is only supported for PFX certificates. Hardware token passwords are managed through the E-IMZO application or card management software.
:::

## Best Practices

1. **Always validate certificate dates** before allowing signing
2. **Show clear certificate information** to help users select the right one
3. **Handle password errors gracefully** with clear messages
4. **Cache the loaded key ID** for multiple signing operations
5. **Provide type filtering** when users have many certificates

## Next Steps

- [Signing Documents](/guide/signing) - Create digital signatures
- [Hardware Tokens](/guide/hardware-tokens) - Work with ID cards and USB tokens
