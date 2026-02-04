<script setup lang="ts">
import { ref, computed } from "vue";

// Example components (NOT included in npm package)
import StatusIndicator from "@examples/StatusIndicator.vue";
import InstallPrompt from "@examples/InstallPrompt.vue";
import CertificateSelector from "@examples/CertificateSelector.vue";
import MobileQRModal from "@examples/MobileQRModal.vue";
import ESignatureWidget from "@examples/ESignatureWidget.vue";

// Core API (from library)
import { setLocale, type SupportedLocale, type Certificate } from "@/index";

type Tab = "signing" | "certificates" | "mobile" | "hardware";

const activeTab = ref<Tab>("signing");
const locale = ref<SupportedLocale>("en");
const showMobileModal = ref(false);
const isEIMZOInstalled = ref(false);

const mockCertificates = ref<Certificate[]>([
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
] as Certificate[]);

const selectedCertificate = ref<Certificate | null>(null);

const documentContent = ref(
  "This is a sample document content that will be signed using E-IMZO digital signature system."
);

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "signing", label: "Document Signing", icon: "pencil" },
  { id: "certificates", label: "Certificates", icon: "document" },
  { id: "mobile", label: "Mobile QR", icon: "qr" },
  { id: "hardware", label: "Hardware Tokens", icon: "usb" },
];

function handleLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  locale.value = target.value as SupportedLocale;
  setLocale(locale.value);
}

function handleSigned(signature: string, certificate: Certificate) {
  alert(
    `Document signed successfully!\nSigner: ${certificate.CN}\nSignature length: ${signature.length} chars`
  );
}

function handleMobileSigned(signature: string, hash: string) {
  showMobileModal.value = false;
  alert(`Mobile signing successful!\nHash: ${hash.substring(0, 16)}...`);
}

function handleError(error: Error) {
  alert(`Error: ${error.message}`);
}

function handleInstallDetected() {
  isEIMZOInstalled.value = true;
}

function handleCertSelect(cert: Certificate) {
  selectedCertificate.value = cert;
}
</script>

<template>
  <div class="playground">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h1>Vue E-Signature Playground</h1>
        </div>

        <div class="header-controls">
          <StatusIndicator :auto-check="true" size="md" />

          <select
            :value="locale"
            @change="handleLocaleChange"
            class="locale-select"
          >
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="uz">O'zbek</option>
          </select>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <!-- Tabs -->
      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Document Signing Tab -->
        <div v-if="activeTab === 'signing'" class="tab-panel">
          <div class="panel-header">
            <h2>Document Signing</h2>
            <p>
              Complete signing workflow with certificate selection and signature
              creation.
            </p>
          </div>
          <div class="widget-container">
            <ESignatureWidget
              :content="documentContent"
              document-title="Sample Document"
              :locale="locale"
              :show-preview="true"
              :allow-multiple="true"
              @signed="handleSigned"
              @error="handleError"
              @cancel="() => {}"
            />
          </div>
        </div>

        <!-- Certificates Tab -->
        <div v-else-if="activeTab === 'certificates'" class="tab-panel">
          <div class="panel-header">
            <h2>Certificate Selection</h2>
            <p>
              Browse and filter available certificates. (Using mock data for
              demo)
            </p>
          </div>
          <div class="panel-content">
            <div class="info-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                >This demo uses mock certificate data. Real certificates will be
                loaded when E-IMZO is installed.</span
              >
            </div>
            <CertificateSelector
              :certificates="mockCertificates"
              v-model="selectedCertificate"
              @select="handleCertSelect"
            />
            <div v-if="selectedCertificate" class="selected-info">
              <strong>Selected:</strong> {{ selectedCertificate.CN }} ({{
                selectedCertificate.O
              }})
            </div>
          </div>
        </div>

        <!-- Mobile QR Tab -->
        <div v-else-if="activeTab === 'mobile'" class="tab-panel">
          <div class="panel-header">
            <h2>Mobile QR Signing</h2>
            <p>Generate QR codes for signing with the E-IMZO mobile app.</p>
          </div>
          <div class="panel-content centered">
            <div class="mobile-preview">
              <div class="phone-frame">
                <div class="phone-screen">
                  <div class="app-header">E-IMZO Mobile</div>
                  <div class="scan-prompt">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6.343 17.657l1.414-1.414M6.343 6.343l1.414 1.414M17.657 6.343l-1.414 1.414"
                      />
                    </svg>
                    <span>Scan QR code to sign</span>
                  </div>
                </div>
              </div>
            </div>
            <button class="btn primary large" @click="showMobileModal = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m14 0h2M6.343 17.657l1.414-1.414M6.343 6.343l1.414 1.414M17.657 6.343l-1.414 1.414"
                />
              </svg>
              Generate QR Code
            </button>
          </div>
        </div>

        <!-- Hardware Tokens Tab -->
        <div v-else-if="activeTab === 'hardware'" class="tab-panel">
          <div class="panel-header">
            <h2>Hardware Tokens</h2>
            <p>Detect and use hardware security tokens for signing.</p>
          </div>
          <div class="panel-content">
            <div class="hardware-cards">
              <div class="hardware-card">
                <div class="hw-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    />
                  </svg>
                </div>
                <h3>ID Card Reader</h3>
                <p>USB smart card reader for national ID cards</p>
                <div class="hw-status disconnected">
                  <span class="status-dot"></span>
                  Not Connected
                </div>
              </div>

              <div class="hardware-card">
                <div class="hw-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h3>BAIK Token</h3>
                <p>USB cryptographic token for signing</p>
                <div class="hw-status disconnected">
                  <span class="status-dot"></span>
                  Not Connected
                </div>
              </div>

              <div class="hardware-card">
                <div class="hw-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <h3>CKC Device</h3>
                <p>Central Key Center hardware module</p>
                <div class="hw-status disconnected">
                  <span class="status-dot"></span>
                  Not Connected
                </div>
              </div>
            </div>

            <div class="info-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                >Connect a hardware token and ensure E-IMZO is running to detect
                devices.</span
              >
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
          <a
            href="https://github.com/sanjarbarakayev/vue-esignature"
            target="_blank"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@eimzo/vue"
            target="_blank"
          >
            npm
          </a>
          <a href="https://e-imzo.uz" target="_blank"> E-IMZO Official </a>
        </div>
        <p>Vue E-Signature &copy; 2024</p>
      </div>
    </footer>

    <!-- Mobile QR Modal -->
    <MobileQRModal
      :visible="showMobileModal"
      site-id="DEMO_SITE"
      document-number="DOC-2024-001"
      :content="documentContent"
      @close="showMobileModal = false"
      @signed="handleMobileSigned"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
.playground {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.header {
  background: var(--eimzo-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--eimzo-shadow);
  border-bottom: 1px solid var(--eimzo-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--eimzo-space-md) var(--eimzo-space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--eimzo-space-sm);
}

.logo svg {
  width: 32px;
  height: 32px;
  color: var(--eimzo-primary);
}

.logo h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--eimzo-text);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--eimzo-space-md);
}

.locale-select {
  padding: 6px 12px;
  border: 1px solid var(--eimzo-border-dark);
  border-radius: var(--eimzo-radius-sm);
  background: var(--eimzo-bg);
  font-size: 14px;
  cursor: pointer;
  color: #fff;
}

/* Main */
.main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--eimzo-space-lg);
  width: 100%;
}

/* Tabs */
.tabs {
  display: flex;
  gap: var(--eimzo-space-xs);
  background: var(--eimzo-bg-secondary);
  border: 1px solid var(--eimzo-border);
  padding: var(--eimzo-space-xs);
  border-radius: var(--eimzo-radius-lg);
  margin-bottom: var(--eimzo-space-lg);
}

.tab-btn {
  flex: 1;
  padding: var(--eimzo-space-sm) var(--eimzo-space-md);
  border: none;
  background: transparent;
  border-radius: var(--eimzo-radius);
  font-size: 14px;
  font-weight: 500;
  color: var(--eimzo-text-secondary);
  cursor: pointer;
  transition: all var(--eimzo-transition);
}

.tab-btn:hover {
  background: var(--eimzo-bg-secondary);
}

.tab-btn.active {
  background: var(--eimzo-primary);
  color: white;
}

/* Tab Content */
.tab-content {
  background: var(--eimzo-bg);
  border: 1px solid var(--eimzo-border);
  border-radius: var(--eimzo-radius-lg);
  box-shadow: var(--eimzo-shadow-lg);
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.tab-panel {
  padding: var(--eimzo-space-lg);
}

.panel-header {
  margin-bottom: var(--eimzo-space-lg);
}

.panel-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--eimzo-text);
  margin-bottom: var(--eimzo-space-xs);
}

.panel-header p {
  color: var(--eimzo-text-secondary);
  font-size: 14px;
}

.panel-content {
  max-width: 600px;
}

.panel-content.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--eimzo-space-lg);
}

.widget-container {
  display: flex;
  justify-content: center;
}

/* Info Banner */
.info-banner {
  display: flex;
  align-items: center;
  gap: var(--eimzo-space-sm);
  padding: var(--eimzo-space-md);
  background: var(--eimzo-primary-light);
  border-radius: var(--eimzo-radius);
  margin-bottom: var(--eimzo-space-md);
  font-size: 14px;
  color: var(--eimzo-primary);
}

.info-banner svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.selected-info {
  margin-top: var(--eimzo-space-md);
  padding: var(--eimzo-space-md);
  background: var(--eimzo-success-light);
  border-radius: var(--eimzo-radius);
  color: var(--eimzo-success-dark);
}

/* Mobile Preview */
.mobile-preview {
  margin-bottom: var(--eimzo-space-lg);
}

.phone-frame {
  width: 200px;
  height: 350px;
  background: #1a1a1a;
  border-radius: 24px;
  padding: 12px;
  box-shadow: var(--eimzo-shadow-lg);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: var(--eimzo-bg);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--eimzo-primary);
  color: white;
  padding: var(--eimzo-space-sm);
  text-align: center;
  font-weight: 500;
  font-size: 14px;
}

.scan-prompt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--eimzo-space-md);
  color: var(--eimzo-text-secondary);
  padding: var(--eimzo-space-md);
}

.scan-prompt svg {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.scan-prompt span {
  font-size: 14px;
}

/* Hardware Cards */
.hardware-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--eimzo-space-md);
  margin-bottom: var(--eimzo-space-lg);
}

.hardware-card {
  background: var(--eimzo-bg);
  border: 1px solid var(--eimzo-border);
  border-radius: var(--eimzo-radius);
  padding: var(--eimzo-space-lg);
  text-align: center;
}

.hardware-card .hw-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--eimzo-space-md);
  background: var(--eimzo-bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hardware-card .hw-icon svg {
  width: 24px;
  height: 24px;
  color: var(--eimzo-text-secondary);
}

.hardware-card h3 {
  font-size: 16px;
  margin-bottom: var(--eimzo-space-xs);
  color: var(--eimzo-text);
}

.hardware-card p {
  font-size: 13px;
  color: var(--eimzo-text-secondary);
  margin-bottom: var(--eimzo-space-md);
}

.hw-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
}

.hw-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.hw-status.connected {
  background: var(--eimzo-success-light);
  color: var(--eimzo-success-dark);
}

.hw-status.connected .status-dot {
  background: var(--eimzo-success);
}

.hw-status.disconnected {
  background: var(--eimzo-bg-secondary);
  color: var(--eimzo-text-muted);
}

.hw-status.disconnected .status-dot {
  background: var(--eimzo-text-muted);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--eimzo-space-sm);
  padding: 10px 20px;
  border: none;
  border-radius: var(--eimzo-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--eimzo-transition);
}

.btn.primary {
  background: var(--eimzo-primary);
  color: white;
}

.btn.primary:hover {
  background: var(--eimzo-primary-hover);
}

.btn.large {
  padding: 14px 28px;
  font-size: 16px;
}

.btn svg {
  width: 20px;
  height: 20px;
}

/* Footer */
.footer {
  background: var(--eimzo-bg-secondary);
  border-top: 1px solid var(--eimzo-border);
  padding: var(--eimzo-space-lg);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  color: var(--eimzo-text-secondary);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: var(--eimzo-space-lg);
  margin-bottom: var(--eimzo-space-sm);
}

.footer-links a {
  color: var(--eimzo-primary);
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}

.footer p {
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--eimzo-space-md);
  }

  .tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: 1 1 45%;
    font-size: 13px;
  }

  .tab-panel {
    padding: var(--eimzo-space-md);
  }
}
</style>
