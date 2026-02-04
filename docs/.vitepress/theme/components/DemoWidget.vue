<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  detectEIMZO,
  type EIMZOStatus,
} from "@sanjarbarakayev/vue-esignature";
import StatusIndicator from "@examples/StatusIndicator.vue";
import InstallPrompt from "@examples/InstallPrompt.vue";

const props = withDefaults(
  defineProps<{
    /** Demo title */
    title: string;
    /** Description text */
    description?: string;
    /** Show mock data when E-IMZO is not available */
    mockMode?: boolean;
    /** Show connection status indicator */
    showStatus?: boolean;
    /** Center the content */
    centered?: boolean;
  }>(),
  {
    description: "",
    mockMode: true,
    showStatus: true,
    centered: false,
  }
);

const status = ref<EIMZOStatus | null>(null);
const isChecking = ref(true);
const useMockData = ref(false);

const isInstalled = ref(false);

async function checkStatus() {
  isChecking.value = true;
  try {
    status.value = await detectEIMZO();
    isInstalled.value = status.value.isRunning;
    useMockData.value = !status.value.isRunning && props.mockMode;
  } catch {
    isInstalled.value = false;
    useMockData.value = props.mockMode;
  }
  isChecking.value = false;
}

function handleInstallDetected() {
  isInstalled.value = true;
  useMockData.value = false;
}

onMounted(() => {
  checkStatus();
});
</script>

<template>
  <div class="demo-widget-container">
    <header class="demo-widget-header">
      <h3>{{ title }}</h3>
      <div class="demo-status">
        <span v-if="useMockData" class="mock-badge"> Mock Data </span>
        <StatusIndicator v-if="showStatus" size="sm" :auto-check="true" />
      </div>
    </header>

    <div class="demo-widget-content" :class="{ centered }">
      <!-- Checking state -->
      <div v-if="isChecking" class="checking-state">
        <div class="spinner"></div>
        <p>Checking E-IMZO status...</p>
      </div>

      <!-- Not installed and no mock mode -->
      <InstallPrompt
        v-else-if="!isInstalled && !mockMode"
        :auto-check="false"
        compact
        @detected="handleInstallDetected"
      />

      <!-- Content slot with context -->
      <slot
        v-else
        :is-installed="isInstalled"
        :mock-mode="useMockData"
        :status="status"
      />
    </div>
  </div>
</template>

<style scoped>
.checking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--vp-c-text-2);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.checking-state p {
  margin: 0;
  font-size: 14px;
}
</style>
