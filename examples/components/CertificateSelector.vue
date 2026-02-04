<!--
  EXAMPLE COMPONENT - Not included in npm package

  This is a reference implementation showing how to build UI with the core API.
  Copy and customize for your project.

  Source: https://github.com/sanjarbarakayev/vue-esignature/tree/main/examples/components
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import type {
  Certificate,
  PfxCertificate,
  FtjcCertificate,
} from "@sanjarbarakayev/vue-esignature";

const props = defineProps<{
  certificates: Certificate[];
  modelValue: Certificate | null;
  disabled?: boolean;
  compact?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [cert: Certificate | null];
  select: [cert: Certificate];
}>();

type FilterType = "all" | "pfx" | "ftjc";

const filterType = ref<FilterType>("all");
const searchQuery = ref("");
const showExpired = ref(false);

const filteredCertificates = computed(() => {
  return props.certificates.filter((cert) => {
    if (filterType.value !== "all" && cert.type !== filterType.value) {
      return false;
    }
    if (!showExpired.value && isExpired(cert)) {
      return false;
    }
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      const searchFields = [cert.CN, cert.O, cert.TIN, cert.serialNumber].map(
        (f) => (f || "").toLowerCase()
      );
      if (!searchFields.some((f) => f.includes(query))) {
        return false;
      }
    }
    return true;
  });
});

const typeCounts = computed(() => ({
  all: props.certificates.length,
  pfx: props.certificates.filter((c) => c.type === "pfx").length,
  ftjc: props.certificates.filter((c) => c.type === "ftjc").length,
}));

function isExpired(cert: Certificate): boolean {
  return new Date() > cert.validTo;
}

function isExpiringSoon(cert: Certificate): boolean {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return new Date() > new Date(cert.validTo.getTime() - thirtyDays);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function selectCertificate(cert: Certificate) {
  if (props.disabled) return;
  emit("update:modelValue", cert);
  emit("select", cert);
}

function isPfx(cert: Certificate): cert is PfxCertificate {
  return cert.type === "pfx";
}

function isFtjc(cert: Certificate): cert is FtjcCertificate {
  return cert.type === "ftjc";
}

function isSelected(cert: Certificate): boolean {
  return props.modelValue?.serialNumber === cert.serialNumber;
}

function getDaysRemaining(cert: Certificate): number {
  const now = new Date();
  const diff = cert.validTo.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

defineExpose({
  filterType,
  searchQuery,
  showExpired,
  filteredCertificates,
});
</script>

<template>
  <div class="cert-selector" :class="{ compact, disabled }">
    <!-- Search & Filters -->
    <div class="toolbar">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, TIN, or organization..."
          :disabled="disabled"
        />
      </div>

      <div class="filter-row">
        <div class="filter-tabs">
          <button
            v-for="tab in (['all', 'pfx', 'ftjc'] as FilterType[])"
            :key="tab"
            :class="{ active: filterType === tab }"
            :disabled="disabled"
            @click="filterType = tab"
          >
            <span class="tab-label">{{ tab === 'ftjc' ? 'Token' : tab === 'pfx' ? 'File' : 'All' }}</span>
            <span class="tab-count">{{ typeCounts[tab] }}</span>
          </button>
        </div>

        <label class="toggle-expired">
          <input type="checkbox" v-model="showExpired" :disabled="disabled" />
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
          <span class="toggle-label">Show expired</span>
        </label>
      </div>
    </div>

    <!-- Certificate List -->
    <div class="cert-list">
      <TransitionGroup name="cert-list">
        <template v-if="filteredCertificates.length > 0">
          <article
            v-for="(cert, index) in filteredCertificates"
            :key="cert.serialNumber"
            class="cert-card"
            :class="{
              selected: isSelected(cert),
              expired: isExpired(cert),
              warning: isExpiringSoon(cert) && !isExpired(cert),
            }"
            :style="{ '--index': index }"
            @click="selectCertificate(cert)"
            role="button"
            :aria-pressed="isSelected(cert)"
            :tabindex="disabled ? -1 : 0"
            @keydown.enter="selectCertificate(cert)"
            @keydown.space.prevent="selectCertificate(cert)"
          >
            <!-- Selection Ring -->
            <div class="selection-ring"></div>

            <!-- Left: Type indicator -->
            <div class="cert-type-indicator" :class="cert.type">
              <svg v-if="cert.type === 'pfx'" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
              </svg>
              <svg v-else viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd" />
              </svg>
            </div>

            <!-- Middle: Content -->
            <div class="cert-content">
              <div class="cert-header">
                <h3 class="cert-name">{{ cert.CN }}</h3>
                <span class="status-badge" :class="{ expired: isExpired(cert), warning: isExpiringSoon(cert) && !isExpired(cert) }">
                  <span class="status-dot"></span>
                  <span v-if="isExpired(cert)">Expired</span>
                  <span v-else-if="isExpiringSoon(cert)">{{ getDaysRemaining(cert) }}d left</span>
                  <span v-else>Active</span>
                </span>
              </div>
              <p class="cert-org">{{ cert.O || 'Individual Certificate' }}</p>

              <div v-if="!compact" class="cert-details">
                <div class="detail-item">
                  <span class="detail-label">TIN</span>
                  <span class="detail-value">{{ cert.TIN }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Valid</span>
                  <span class="detail-value">{{ formatDate(cert.validFrom) }} — {{ formatDate(cert.validTo) }}</span>
                </div>
                <div v-if="isPfx(cert)" class="detail-item">
                  <span class="detail-label">File</span>
                  <span class="detail-value mono">{{ cert.name }}</span>
                </div>
                <div v-if="isFtjc(cert)" class="detail-item">
                  <span class="detail-label">Card</span>
                  <span class="detail-value mono">{{ cert.cardUID }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Selection check -->
            <div class="cert-check">
              <Transition name="check">
                <div v-if="isSelected(cert)" class="check-circle">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div v-else class="empty-circle"></div>
              </Transition>
            </div>
          </article>
        </template>

        <div v-else key="empty" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h4>No certificates found</h4>
          <p v-if="searchQuery">Try adjusting your search terms</p>
          <p v-else>No certificates match the current filters</p>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* Light mode (default) */
.cert-selector {
  --cs-bg: #ffffff;
  --cs-bg-subtle: #f8fafc;
  --cs-bg-hover: #f1f5f9;
  --cs-border: #e2e8f0;
  --cs-border-hover: #cbd5e1;
  --cs-text: #1e293b;
  --cs-text-secondary: #64748b;
  --cs-text-muted: #94a3b8;
  --cs-accent: #0ea5e9;
  --cs-accent-light: #e0f2fe;
  --cs-accent-dark: #0284c7;
  --cs-success: #10b981;
  --cs-success-light: #d1fae5;
  --cs-warning: #f59e0b;
  --cs-warning-light: #fef3c7;
  --cs-danger: #ef4444;
  --cs-danger-light: #fee2e2;
  --cs-pfx: #6366f1;
  --cs-pfx-light: #e0e7ff;
  --cs-token: #8b5cf6;
  --cs-token-light: #ede9fe;
  --cs-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --cs-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);

  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--cs-text);
}

/* Dark mode - via prefers-color-scheme or VitePress .dark class */
@media (prefers-color-scheme: dark) {
  .cert-selector {
    --cs-bg: #1e293b;
    --cs-bg-subtle: #0f172a;
    --cs-bg-hover: #334155;
    --cs-border: #334155;
    --cs-border-hover: #475569;
    --cs-text: #f1f5f9;
    --cs-text-secondary: #94a3b8;
    --cs-text-muted: #64748b;
    --cs-accent-light: rgba(14, 165, 233, 0.15);
    --cs-success-light: rgba(16, 185, 129, 0.15);
    --cs-warning-light: rgba(245, 158, 11, 0.15);
    --cs-danger-light: rgba(239, 68, 68, 0.15);
    --cs-pfx-light: rgba(99, 102, 241, 0.15);
    --cs-token-light: rgba(139, 92, 246, 0.15);
    --cs-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    --cs-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}

/* VitePress dark mode support */
:global(.dark) .cert-selector {
  --cs-bg: #1e293b;
  --cs-bg-subtle: #0f172a;
  --cs-bg-hover: #334155;
  --cs-border: #334155;
  --cs-border-hover: #475569;
  --cs-text: #f1f5f9;
  --cs-text-secondary: #94a3b8;
  --cs-text-muted: #64748b;
  --cs-accent-light: rgba(14, 165, 233, 0.15);
  --cs-success-light: rgba(16, 185, 129, 0.15);
  --cs-warning-light: rgba(245, 158, 11, 0.15);
  --cs-danger-light: rgba(239, 68, 68, 0.15);
  --cs-pfx-light: rgba(99, 102, 241, 0.15);
  --cs-token-light: rgba(139, 92, 246, 0.15);
  --cs-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --cs-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.cert-selector.disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--cs-text-muted);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--cs-text);
  transition: all 0.15s ease;
}

.search-box input::placeholder {
  color: var(--cs-text-muted);
}

.search-box input:focus {
  outline: none;
  border-color: var(--cs-accent);
  box-shadow: 0 0 0 3px var(--cs-accent-light);
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-border);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.filter-tabs button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--cs-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-tabs button:hover:not(.active) {
  color: var(--cs-text);
  background: var(--cs-bg-hover);
}

.filter-tabs button.active {
  background: var(--cs-bg);
  color: var(--cs-text);
  box-shadow: var(--cs-shadow);
}

.tab-count {
  padding: 1px 6px;
  background: var(--cs-bg-hover);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--cs-text-muted);
}

.filter-tabs button.active .tab-count {
  background: var(--cs-accent-light);
  color: var(--cs-accent);
}

/* Toggle */
.toggle-expired {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-expired input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-track {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--cs-bg-hover);
  border: 1px solid var(--cs-border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: var(--cs-text-muted);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-expired input:checked + .toggle-track {
  background: var(--cs-accent);
  border-color: var(--cs-accent);
}

.toggle-expired input:checked + .toggle-track .toggle-thumb {
  left: 18px;
  background: white;
}

.toggle-label {
  font-size: 13px;
  color: var(--cs-text-secondary);
}

/* Certificate List */
.cert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

/* Certificate Card */
.cert-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cert-card:hover {
  border-color: var(--cs-border-hover);
  box-shadow: var(--cs-shadow);
}

.cert-card:focus {
  outline: none;
  border-color: var(--cs-accent);
  box-shadow: 0 0 0 3px var(--cs-accent-light);
}

.cert-card.selected {
  border-color: var(--cs-accent);
  background: var(--cs-accent-light);
}

.cert-card.expired {
  opacity: 0.65;
}

.cert-card.warning:not(.selected) {
  border-color: var(--cs-warning);
}

/* Selection Ring (for accessibility) */
.selection-ring {
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.cert-card:focus-visible .selection-ring {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--cs-accent);
}

/* Type Indicator */
.cert-type-indicator {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.cert-type-indicator.pfx {
  background: var(--cs-pfx-light);
  color: var(--cs-pfx);
}

.cert-type-indicator.ftjc {
  background: var(--cs-token-light);
  color: var(--cs-token);
}

.cert-type-indicator svg {
  width: 20px;
  height: 20px;
}

/* Content */
.cert-content {
  flex: 1;
  min-width: 0;
}

.cert-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.cert-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--cs-text);
  line-height: 1.4;
}

.cert-org {
  margin: 0;
  font-size: 13px;
  color: var(--cs-text-secondary);
}

/* Status Badge */
.status-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: var(--cs-success-light);
  color: var(--cs-success);
}

.status-badge.expired {
  background: var(--cs-danger-light);
  color: var(--cs-danger);
}

.status-badge.warning {
  background: var(--cs-warning-light);
  color: var(--cs-warning);
}

.status-dot {
  width: 5px;
  height: 5px;
  background: currentColor;
  border-radius: 50%;
}

/* Details */
.cert-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--cs-border);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.detail-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--cs-text-muted);
}

.detail-value {
  font-size: 12px;
  color: var(--cs-text-secondary);
}

.detail-value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 11px;
}

/* Check Circle */
.cert-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 8px;
}

.check-circle {
  width: 24px;
  height: 24px;
  background: var(--cs-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-circle svg {
  width: 14px;
  height: 14px;
  color: white;
}

.empty-circle {
  width: 24px;
  height: 24px;
  border: 2px solid var(--cs-border);
  border-radius: 50%;
  transition: border-color 0.15s ease;
}

.cert-card:hover .empty-circle {
  border-color: var(--cs-border-hover);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: var(--cs-text-muted);
  opacity: 0.5;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-state h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--cs-text);
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  color: var(--cs-text-muted);
}

/* Animations */
.cert-list-enter-active {
  transition: all 0.3s ease;
  transition-delay: calc(var(--index, 0) * 30ms);
}

.cert-list-leave-active {
  transition: all 0.2s ease;
}

.cert-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.cert-list-leave-to {
  opacity: 0;
}

.check-enter-active,
.check-leave-active {
  transition: all 0.15s ease;
}

.check-enter-from,
.check-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* Compact Mode */
.compact .cert-card {
  padding: 10px 12px;
  gap: 10px;
}

.compact .cert-type-indicator {
  width: 32px;
  height: 32px;
}

.compact .cert-type-indicator svg {
  width: 16px;
  height: 16px;
}

.compact .cert-name {
  font-size: 13px;
}

.compact .cert-org {
  font-size: 12px;
}

.compact .cert-details {
  display: none;
}

.compact .cert-check {
  margin-top: 4px;
}

.compact .status-badge {
  font-size: 10px;
  padding: 2px 6px;
}
</style>
