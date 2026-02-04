<!--
  EXAMPLE COMPONENT - Not included in npm package

  This is a reference implementation showing how to build UI with the core API.
  Copy and customize for your project.

  Source: https://github.com/sanjarbarakayev/vue-esignature/tree/main/examples/components
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  detectEIMZO,
  getEIMZODownloadUrl,
  type EIMZOStatus,
} from "@eimzo/vue";

const props = withDefaults(
  defineProps<{
    /** Auto-check on mount */
    autoCheck?: boolean;
    /** Show compact version */
    compact?: boolean;
    /** Custom title */
    title?: string;
  }>(),
  {
    autoCheck: true,
    compact: false,
    title: "E-IMZO Required",
  }
);

const emit = defineEmits<{
  detected: [];
  checkAgain: [];
}>();

type CheckState = "checking" | "installed" | "not-installed" | "no-websocket";

const state = ref<CheckState>("checking");
const status = ref<EIMZOStatus | null>(null);

const downloadUrl = computed(() => getEIMZODownloadUrl());

const platform = computed(() => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "other";
});

const platformIcon = computed(() => {
  switch (platform.value) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "Desktop";
  }
});

async function checkInstallation() {
  state.value = "checking";
  emit("checkAgain");

  try {
    const result = await detectEIMZO();
    status.value = result;

    if (!result.browserSupported) {
      state.value = "no-websocket";
    } else if (result.isRunning) {
      state.value = "installed";
      emit("detected");
    } else {
      state.value = "not-installed";
    }
  } catch {
    state.value = "not-installed";
  }
}

function openDownload() {
  window.open(downloadUrl.value, "_blank");
}

onMounted(() => {
  if (props.autoCheck) {
    checkInstallation();
  }
});

defineExpose({ checkInstallation, status });
</script>

<template>
  <div class="install-prompt" :class="{ compact }">
    <!-- Checking state -->
    <div v-if="state === 'checking'" class="state-content checking">
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
      <p>Checking for E-IMZO...</p>
    </div>

    <!-- Installed state -->
    <div v-else-if="state === 'installed'" class="state-content installed">
      <div class="icon success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3>E-IMZO Detected</h3>
      <p>E-IMZO is installed and running on port {{ status?.port }}.</p>
    </div>

    <!-- No WebSocket support -->
    <div v-else-if="state === 'no-websocket'" class="state-content error">
      <div class="icon error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3>Browser Not Supported</h3>
      <p>
        Your browser does not support WebSocket, which is required for E-IMZO.
      </p>
      <p class="hint">
        Please use a modern browser like Chrome, Firefox, Safari, or Edge.
      </p>
    </div>

    <!-- Not installed state -->
    <div v-else class="state-content not-installed">
      <div class="icon warning-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3>{{ title }}</h3>
      <p>
        E-IMZO software is required for digital signing. It doesn't appear to be
        installed or running on your computer.
      </p>

      <div v-if="!compact" class="steps">
        <h4>How to install:</h4>
        <ol>
          <li>
            Download E-IMZO for <strong>{{ platformIcon }}</strong>
          </li>
          <li>Run the installer and follow the instructions</li>
          <li>Launch E-IMZO application</li>
          <li>Click "Check Again" below</li>
        </ol>
      </div>

      <div class="actions">
        <button class="btn primary" @click="openDownload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download E-IMZO
        </button>
        <button class="btn secondary" @click="checkInstallation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Check Again
        </button>
      </div>

      <p v-if="!compact" class="note">
        Need help?
        <a href="https://e-imzo.uz" target="_blank" rel="noopener">
          Visit e-imzo.uz
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.install-prompt {
  font-family: var(
    --eimzo-font-family,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif
  );
  background: var(--eimzo-bg, #fff);
  border: 1px solid var(--eimzo-border, #eee);
  border-radius: var(--eimzo-radius-lg, 12px);
  padding: var(--eimzo-space-lg, 24px);
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.install-prompt.compact {
  padding: var(--eimzo-space-md, 16px);
}

.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--eimzo-space-md, 16px);
}

.spinner-container {
  display: flex;
  justify-content: center;
  padding: var(--eimzo-space-md, 16px);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--eimzo-border, #eee);
  border-top-color: var(--eimzo-primary, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon svg {
  width: 28px;
  height: 28px;
}

.success-icon {
  background: var(--eimzo-success-light, #d4edda);
  color: var(--eimzo-success, #27ae60);
}

.warning-icon {
  background: var(--eimzo-warning-light, #fff3cd);
  color: var(--eimzo-warning, #f39c12);
}

.error-icon {
  background: var(--eimzo-danger-light, #f8d7da);
  color: var(--eimzo-danger, #e74c3c);
}

h3 {
  margin: 0;
  font-size: 18px;
  color: var(--eimzo-text, #333);
}

.compact h3 {
  font-size: 16px;
}

p {
  margin: 0;
  color: var(--eimzo-text-secondary, #666);
  font-size: 14px;
  line-height: 1.5;
}

.hint {
  font-size: 13px;
  color: var(--eimzo-text-muted, #999);
}

.steps {
  text-align: left;
  background: var(--eimzo-bg-secondary, #f5f5f5);
  padding: var(--eimzo-space-md, 16px);
  border-radius: var(--eimzo-radius, 8px);
  width: 100%;
}

.steps h4 {
  margin: 0 0 var(--eimzo-space-sm, 8px);
  font-size: 14px;
  color: var(--eimzo-text, #333);
}

.steps ol {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--eimzo-text-secondary, #666);
}

.steps li {
  margin: var(--eimzo-space-xs, 4px) 0;
}

.actions {
  display: flex;
  gap: var(--eimzo-space-sm, 8px);
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--eimzo-space-sm, 8px);
  padding: 10px 16px;
  border: none;
  border-radius: var(--eimzo-radius, 8px);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--eimzo-transition, 0.2s ease);
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn.primary {
  background: var(--eimzo-primary, #3498db);
  color: #fff;
}

.btn.primary:hover {
  background: var(--eimzo-primary-hover, #2980b9);
}

.btn.secondary {
  background: var(--eimzo-bg-secondary, #f5f5f5);
  color: var(--eimzo-text, #333);
}

.btn.secondary:hover {
  background: var(--eimzo-border, #eee);
}

.note {
  font-size: 12px;
  color: var(--eimzo-text-muted, #999);
}

.note a {
  color: var(--eimzo-primary, #3498db);
  text-decoration: none;
}

.note a:hover {
  text-decoration: underline;
}
</style>
