<script setup lang="ts">
import { ref } from "vue";
import DemoWidget from "./DemoWidget.vue";
import CertificateSelector from "../../../../src/components/demos/CertificateSelector.vue";
import type { Certificate } from "../../../../src/types";

const selectedCert = ref<Certificate | null>(null);

// Mock certificates for demo
const mockCertificates: Certificate[] = [
  {
    serialNumber: "1234567890",
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2026-12-31"),
    CN: "Aziz Alimov",
    TIN: "123456789",
    PINFL: "31234567890123",
    UID: "uid-001",
    O: "Example Company LLC",
    T: "Director",
    type: "pfx",
    disk: "C:",
    path: "/certs/",
    name: "aziz_alimov.pfx",
    alias: "CN=Aziz Alimov",
  },
  {
    serialNumber: "0987654321",
    validFrom: new Date("2023-06-01"),
    validTo: new Date("2025-06-01"),
    CN: "Bobur Karimov",
    TIN: "987654321",
    PINFL: "40987654321098",
    UID: "uid-002",
    O: "Tech Solutions Inc",
    T: "Manager",
    type: "ftjc",
    cardUID: "CARD-12345",
    statusInfo: "Active",
    ownerName: "Bobur Karimov",
    info: "Token certificate",
  },
  {
    serialNumber: "5555555555",
    validFrom: new Date("2022-01-01"),
    validTo: new Date("2023-12-31"),
    CN: "Expired User",
    TIN: "555555555",
    PINFL: "55555555555555",
    UID: "uid-003",
    O: "Old Company",
    T: "Employee",
    type: "pfx",
    disk: "D:",
    path: "/old/",
    name: "expired.pfx",
    alias: "CN=Expired User",
  },
] as Certificate[];

function handleSelect(cert: Certificate) {
  selectedCert.value = cert;
}
</script>

<template>
  <DemoWidget
    title="Certificate Selection"
    description="Browse and filter available certificates"
    :mock-mode="true"
  >
    <template #default="{ mockMode }">
      <div class="live-cert-selector">
        <CertificateSelector
          :certificates="mockCertificates"
          v-model="selectedCert"
          @select="handleSelect"
        />

        <div v-if="selectedCert" class="selection-result">
          <strong>Selected:</strong> {{ selectedCert.CN }}
          <span class="org">({{ selectedCert.O }})</span>
        </div>

        <p v-if="mockMode" class="mock-notice">
          This demo uses sample certificate data. Real certificates will be
          loaded when E-IMZO is installed.
        </p>
      </div>
    </template>
  </DemoWidget>
</template>

<style scoped>
.live-cert-selector {
  max-width: 600px;
  width: 100%;
}

.selection-result {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--vp-c-green-soft);
  border-radius: 8px;
  font-size: 14px;
}

.selection-result .org {
  color: var(--vp-c-text-2);
  margin-left: 4px;
}

.mock-notice {
  margin-top: 16px;
  padding: 12px;
  background: var(--vp-c-yellow-soft);
  border-radius: 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
