<!--
  EXAMPLE COMPONENT - Not included in npm package

  This is a reference implementation showing how to build UI with the core API.
  Copy and customize for your project.

  Source: https://github.com/sanjarbarakayev/vue-esignature/tree/main/examples/components
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { detectEIMZO, type EIMZOStatus } from "@sanjarbarakayev/vue-esignature";

const props = withDefaults(
  defineProps<{
    /** Auto-check on mount */
    autoCheck?: boolean;
    /** Interval to re-check (ms), 0 to disable */
    checkInterval?: number;
    /** Show detailed tooltip */
    showTooltip?: boolean;
    /** Size variant */
    size?: "sm" | "md" | "lg";
  }>(),
  {
    autoCheck: true,
    checkInterval: 0,
    showTooltip: true,
    size: "md",
  }
);

const emit = defineEmits<{
  statusChange: [status: EIMZOStatus];
}>();

type ConnectionState = "checking" | "connected" | "disconnected" | "error";

const state = ref<ConnectionState>("checking");
const status = ref<EIMZOStatus | null>(null);
const showTooltipPopup = ref(false);
let intervalId: ReturnType<typeof setInterval> | null = null;

const statusLabel = computed(() => {
  switch (state.value) {
    case "checking":
      return "Checking...";
    case "connected":
      return "E-IMZO Connected";
    case "disconnected":
      return "Not Installed";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
});

const tooltipText = computed(() => {
  if (!status.value) return "Checking E-IMZO status...";

  if (!status.value.browserSupported) {
    return "Browser does not support WebSocket";
  }

  if (status.value.isRunning) {
    return `E-IMZO running on port ${status.value.port}`;
  }

  return "E-IMZO is not installed or not running. Click to download.";
});

async function checkStatus() {
  state.value = "checking";

  try {
    const result = await detectEIMZO();
    status.value = result;

    if (!result.browserSupported) {
      state.value = "error";
    } else if (result.isRunning) {
      state.value = "connected";
    } else {
      state.value = "disconnected";
    }

    emit("statusChange", result);
  } catch {
    state.value = "error";
  }
}

function handleClick() {
  if (state.value === "disconnected") {
    window.open("https://e-imzo.soliq.uz/download/", "_blank");
  } else {
    checkStatus();
  }
}

onMounted(() => {
  if (props.autoCheck) {
    checkStatus();
  }

  if (props.checkInterval > 0) {
    intervalId = setInterval(checkStatus, props.checkInterval);
  }
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

watch(
  () => props.checkInterval,
  (newVal) => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (newVal > 0) {
      intervalId = setInterval(checkStatus, newVal);
    }
  }
);

defineExpose({ checkStatus, status });
</script>

<template>
  <div
    class="status-indicator"
    :class="[state, size]"
    @click="handleClick"
    @mouseenter="showTooltipPopup = true"
    @mouseleave="showTooltipPopup = false"
    role="status"
    :aria-label="statusLabel"
  >
    <span class="status-dot" :class="state">
      <span v-if="state === 'checking'" class="spinner"></span>
    </span>
    <span class="status-label">{{ statusLabel }}</span>

    <Transition name="tooltip">
      <div
        v-if="showTooltip && showTooltipPopup"
        class="tooltip"
        role="tooltip"
      >
        {{ tooltipText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--eimzo-space-sm, 8px);
  padding: var(--eimzo-space-xs, 4px) var(--eimzo-space-sm, 8px);
  border-radius: var(--eimzo-radius, 8px);
  background: var(--eimzo-bg-secondary, #f5f5f5);
  cursor: pointer;
  position: relative;
  user-select: none;
  font-family: var(
    --eimzo-font-family,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif
  );
  transition: background var(--eimzo-transition, 0.2s ease);
}

.status-indicator:hover {
  background: var(--eimzo-bg-tertiary, #eee);
}

/* Size variants */
.status-indicator.sm {
  font-size: 12px;
  padding: 2px 6px;
}

.status-indicator.md {
  font-size: 13px;
}

.status-indicator.lg {
  font-size: 14px;
  padding: 6px 12px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator.sm .status-dot {
  width: 8px;
  height: 8px;
}

.status-indicator.lg .status-dot {
  width: 12px;
  height: 12px;
}

.status-dot.checking {
  background: var(--eimzo-warning, #f39c12);
}

.status-dot.connected {
  background: var(--eimzo-success, #27ae60);
  box-shadow: 0 0 6px var(--eimzo-success, #27ae60);
}

.status-dot.disconnected {
  background: var(--eimzo-danger, #e74c3c);
}

.status-dot.error {
  background: var(--eimzo-text-muted, #999);
}

.spinner {
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-top-color: var(--eimzo-bg, #fff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  position: absolute;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-label {
  color: var(--eimzo-text-secondary, #666);
  white-space: nowrap;
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--eimzo-text, #333);
  color: var(--eimzo-bg, #fff);
  font-size: 12px;
  border-radius: var(--eimzo-radius-sm, 4px);
  white-space: nowrap;
  z-index: 1000;
  box-shadow: var(--eimzo-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.tooltip::before {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: var(--eimzo-text, #333);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>
