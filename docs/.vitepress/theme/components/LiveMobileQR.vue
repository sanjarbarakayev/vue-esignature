<script setup lang="ts">
import { ref, computed } from "vue";
import DemoWidget from "./DemoWidget.vue";
import MobileQRModal from "../../../../src/components/demos/MobileQRModal.vue";

const showModal = ref(false);

const documentContent =
  "Sample document content for mobile signing demonstration.";

// Generate a random hex string (simulating a UUID without dashes)
function generateHexId(length: number = 32): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

// Site ID must be registered with E-IMZO backend
// For demo purposes, we use a hex string
const siteId = ref(generateHexId(32));
const documentNumber = computed(() => generateHexId(32));

function handleSigned(signature: string, hash: string) {
  showModal.value = false;
  alert(`Mobile signing successful!\nHash: ${hash.substring(0, 16)}...`);
}

function handleError(error: Error) {
  console.error("Mobile signing error:", error);
}
</script>

<template>
  <DemoWidget
    title="Mobile QR Signing"
    description="Sign documents using E-IMZO mobile app"
    :mock-mode="true"
    :centered="true"
  >
    <template #default>
      <div class="mobile-qr-demo">
        <div class="demo-info">
          <p>
            Generate a QR code that can be scanned with the E-IMZO mobile app to
            sign documents remotely.
          </p>
          <ul>
            <li>QR code contains document hash and signing request</li>
            <li>Mobile app verifies and signs with user's certificate</li>
            <li>Signature is returned to the web application</li>
          </ul>
          <p class="warning">
            <strong>⚠️ Demo Only:</strong> This QR code won't work with the real E-IMZO app
            because it requires a registered <code>siteId</code> from E-IMZO.
            Use "Simulate Success" button to test the UI flow.
          </p>
        </div>

        <button class="demo-btn" @click="showModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6.343 17.657l1.414-1.414M6.343 6.343l1.414 1.414M17.657 6.343l-1.414 1.414"
            />
          </svg>
          Open QR Code Modal
        </button>

        <MobileQRModal
          :visible="showModal"
          :site-id="siteId"
          :document-number="documentNumber"
          :content="documentContent"
          @close="showModal = false"
          @signed="handleSigned"
          @error="handleError"
        />
      </div>
    </template>
  </DemoWidget>
</template>

<style scoped>
.mobile-qr-demo {
  max-width: 500px;
  text-align: center;
}

.demo-info {
  text-align: left;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.demo-info p {
  margin: 0 0 12px;
  color: var(--vp-c-text-1);
}

.demo-info ul {
  margin: 0;
  padding-left: 20px;
  color: var(--vp-c-text-2);
}

.demo-info li {
  margin: 4px 0;
  font-size: 14px;
}

.demo-info .warning {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--vp-c-warning-soft);
  border: 1px solid var(--vp-c-warning-1);
  border-radius: 6px;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.demo-info .warning code {
  background: var(--vp-c-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.demo-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.demo-btn:hover {
  background: var(--vp-c-brand-2);
}

.demo-btn svg {
  width: 20px;
  height: 20px;
}
</style>
