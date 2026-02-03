# Certificate Selection Example

A reusable certificate picker component with filtering, validation, and detailed display.

## CertificateSelector Component

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Certificate, PfxCertificate, FtjcCertificate } from '@sanjarbarakayev/vue-esignature'

const props = defineProps<{
  certificates: Certificate[]
  modelValue: Certificate | null
}>()

const emit = defineEmits<{
  'update:modelValue': [cert: Certificate | null]
  select: [cert: Certificate]
}>()

// Filter state
const filterType = ref<'all' | 'pfx' | 'ftjc'>('all')
const searchQuery = ref('')
const showExpired = ref(false)

// Filtered certificates
const filteredCertificates = computed(() => {
  return props.certificates.filter(cert => {
    // Type filter
    if (filterType.value !== 'all' && cert.type !== filterType.value) {
      return false
    }

    // Expired filter
    if (!showExpired.value && isExpired(cert)) {
      return false
    }

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const searchFields = [
        cert.CN,
        cert.O,
        cert.TIN,
        cert.serialNumber
      ].map(f => (f || '').toLowerCase())

      if (!searchFields.some(f => f.includes(query))) {
        return false
      }
    }

    return true
  })
})

// Certificate counts by type
const typeCounts = computed(() => ({
  all: props.certificates.length,
  pfx: props.certificates.filter(c => c.type === 'pfx').length,
  ftjc: props.certificates.filter(c => c.type === 'ftjc').length
}))

// Helper functions
function isExpired(cert: Certificate): boolean {
  return new Date() > cert.validTo
}

function isExpiringSoon(cert: Certificate): boolean {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  return new Date() > new Date(cert.validTo.getTime() - thirtyDays)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function selectCertificate(cert: Certificate) {
  emit('update:modelValue', cert)
  emit('select', cert)
}

// Type guards
function isPfx(cert: Certificate): cert is PfxCertificate {
  return cert.type === 'pfx'
}

function isFtjc(cert: Certificate): cert is FtjcCertificate {
  return cert.type === 'ftjc'
}
</script>

<template>
  <div class="certificate-selector">
    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search certificates..."
        />
      </div>

      <div class="type-filter">
        <button
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          All ({{ typeCounts.all }})
        </button>
        <button
          :class="{ active: filterType === 'pfx' }"
          @click="filterType = 'pfx'"
        >
          PFX ({{ typeCounts.pfx }})
        </button>
        <button
          :class="{ active: filterType === 'ftjc' }"
          @click="filterType = 'ftjc'"
        >
          Token ({{ typeCounts.ftjc }})
        </button>
      </div>

      <label class="expired-toggle">
        <input type="checkbox" v-model="showExpired" />
        <span>Show expired</span>
      </label>
    </div>

    <!-- Certificate list -->
    <div class="cert-list">
      <div
        v-if="filteredCertificates.length === 0"
        class="empty-state"
      >
        <p>No certificates found</p>
        <small v-if="searchQuery">Try adjusting your search</small>
      </div>

      <div
        v-for="cert in filteredCertificates"
        :key="cert.serialNumber"
        class="cert-card"
        :class="{
          selected: modelValue?.serialNumber === cert.serialNumber,
          expired: isExpired(cert),
          'expiring-soon': isExpiringSoon(cert) && !isExpired(cert)
        }"
        @click="selectCertificate(cert)"
      >
        <!-- Type badge -->
        <div class="cert-type">
          <span class="type-icon">
            {{ cert.type === 'pfx' ? '📄' : '💳' }}
          </span>
          <span class="type-label">
            {{ cert.type.toUpperCase() }}
          </span>
        </div>

        <!-- Main info -->
        <div class="cert-main">
          <h3 class="cert-name">{{ cert.CN }}</h3>
          <p class="cert-org">{{ cert.O || 'Individual' }}</p>
        </div>

        <!-- Details -->
        <div class="cert-details">
          <div class="detail">
            <span class="label">TIN:</span>
            <span class="value">{{ cert.TIN }}</span>
          </div>
          <div class="detail">
            <span class="label">Valid:</span>
            <span class="value">
              {{ formatDate(cert.validFrom) }} - {{ formatDate(cert.validTo) }}
            </span>
          </div>

          <!-- Type-specific details -->
          <template v-if="isPfx(cert)">
            <div class="detail">
              <span class="label">File:</span>
              <span class="value">{{ cert.name }}</span>
            </div>
          </template>

          <template v-if="isFtjc(cert)">
            <div class="detail">
              <span class="label">Card:</span>
              <span class="value">{{ cert.cardUID }}</span>
            </div>
          </template>
        </div>

        <!-- Status badges -->
        <div class="cert-status">
          <span v-if="isExpired(cert)" class="badge expired">
            Expired
          </span>
          <span v-else-if="isExpiringSoon(cert)" class="badge warning">
            Expiring Soon
          </span>
          <span v-else class="badge valid">
            Valid
          </span>
        </div>

        <!-- Selected indicator -->
        <div
          v-if="modelValue?.serialNumber === cert.serialNumber"
          class="selected-indicator"
        >
          ✓
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.certificate-selector {
  font-family: system-ui, sans-serif;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.search input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.type-filter {
  display: flex;
  gap: 4px;
}

.type-filter button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.type-filter button.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.expired-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.cert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #666;
}

.cert-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cert-card:hover {
  border-color: #3498db;
}

.cert-card.selected {
  border-color: #27ae60;
  background: #f0fff4;
}

.cert-card.expired {
  opacity: 0.6;
}

.cert-card.expiring-soon {
  border-color: #f39c12;
}

.cert-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.type-icon {
  font-size: 28px;
}

.type-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
}

.cert-main {
  min-width: 0;
}

.cert-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cert-org {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.cert-details {
  font-size: 12px;
  grid-column: 2;
}

.detail {
  display: flex;
  gap: 8px;
}

.detail .label {
  color: #888;
  min-width: 50px;
}

.cert-status {
  position: absolute;
  top: 12px;
  right: 12px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge.valid {
  background: #d4edda;
  color: #155724;
}

.badge.warning {
  background: #fff3cd;
  color: #856404;
}

.badge.expired {
  background: #f8d7da;
  color: #721c24;
}

.selected-indicator {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style>
```

## Usage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature } from '@sanjarbarakayev/vue-esignature'
import type { Certificate } from '@sanjarbarakayev/vue-esignature'
import CertificateSelector from './CertificateSelector.vue'

const { install, listKeys } = useESignature()

const certificates = ref<Certificate[]>([])
const selectedCert = ref<Certificate | null>(null)

onMounted(async () => {
  await install()
  certificates.value = await listKeys()
})

function handleSelect(cert: Certificate) {
  console.log('Selected:', cert.CN)
}
</script>

<template>
  <CertificateSelector
    :certificates="certificates"
    v-model="selectedCert"
    @select="handleSelect"
  />
</template>
```

## Features

- **Type filtering** - Show all, PFX only, or tokens only
- **Search** - Filter by name, organization, or TIN
- **Expired filtering** - Hide/show expired certificates
- **Visual status** - Clear badges for valid, expiring soon, and expired
- **Type-specific details** - Show file path for PFX, card ID for tokens
- **Selection state** - Visual feedback for selected certificate

## Next Steps

- [Mobile QR Signing](/examples/mobile-qr)
- [Vue Component](/examples/vue-component)
