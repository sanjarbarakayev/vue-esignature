# Error Handling

Vue E-Signature provides comprehensive error handling with localized messages. This guide covers common errors and how to handle them.

## Error Types

### Connection Errors

Occur when E-IMZO application is not running or not installed.

```ts
try {
  await install()
} catch (error) {
  if (error.message.includes('Connection') || error.message.includes('соединения')) {
    // E-IMZO not installed or not running
    showInstallPrompt()
  }
}
```

### Authentication Errors

Occur when the password is incorrect.

```ts
try {
  await loadKey(certificate)
} catch (error) {
  if (error.message.includes('password') || error.message.includes('BadPadding')) {
    showError('Incorrect password. Please try again.')
  }
}
```

### Version Errors

Occur when E-IMZO version is outdated.

```ts
try {
  await checkVersion()
} catch (error) {
  if (error.message.includes('version') || error.message.includes('UPDATE')) {
    showUpdatePrompt()
  }
}
```

### Certificate Errors

Occur when certificates are invalid or not found.

```ts
try {
  await listKeys()
} catch (error) {
  if (error.message.includes('certificate') || error.message.includes('сертификат')) {
    showError('No valid certificates found.')
  }
}
```

## Error Handler Utility

Create a centralized error handler:

```ts
import { getErrorMessage, type ErrorMessageKey } from '@sanjarbarakayev/vue-esignature'

type ErrorType =
  | 'connection'
  | 'password'
  | 'version'
  | 'certificate'
  | 'hardware'
  | 'unknown'

interface HandledError {
  type: ErrorType
  message: string
  action?: string
  original: Error
}

const errorPatterns: Array<{
  patterns: string[]
  type: ErrorType
  messageKey: ErrorMessageKey
  action?: string
}> = [
  {
    patterns: ['Connection', 'соединения', 'WebSocket', 'CAPIWS'],
    type: 'connection',
    messageKey: 'CAPIWS_CONNECTION',
    action: 'install'
  },
  {
    patterns: ['password', 'BadPadding', 'пароль', 'Parol'],
    type: 'password',
    messageKey: 'WRONG_PASSWORD'
  },
  {
    patterns: ['version', 'UPDATE', 'версия'],
    type: 'version',
    messageKey: 'UPDATE_APP',
    action: 'update'
  },
  {
    patterns: ['certificate', 'сертификат', 'expired'],
    type: 'certificate',
    messageKey: 'ERIIMZO_CERT_NOT_FOUND'
  },
  {
    patterns: ['reader', 'card', 'token', 'карт'],
    type: 'hardware',
    messageKey: 'ERIIMZO_CARD_NOT_FOUND'
  }
]

export function handleError(error: unknown): HandledError {
  const err = error as Error
  const message = err.message || String(error)

  for (const pattern of errorPatterns) {
    if (pattern.patterns.some(p => message.includes(p))) {
      return {
        type: pattern.type,
        message: getErrorMessage(pattern.messageKey),
        action: pattern.action,
        original: err
      }
    }
  }

  return {
    type: 'unknown',
    message: message,
    original: err
  }
}
```

## Error Handling Component

A reusable error display component:

```vue
<script setup lang="ts">
import type { HandledError } from '@/utils/errorHandler'

const props = defineProps<{
  error: HandledError | null
}>()

const emit = defineEmits<{
  retry: []
  dismiss: []
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="error" class="error-container" :class="error.type">
      <div class="error-icon">
        <span v-if="error.type === 'connection'">🔌</span>
        <span v-else-if="error.type === 'password'">🔐</span>
        <span v-else-if="error.type === 'version'">⬆️</span>
        <span v-else-if="error.type === 'certificate'">📜</span>
        <span v-else-if="error.type === 'hardware'">💳</span>
        <span v-else>⚠️</span>
      </div>

      <div class="error-content">
        <p class="error-message" v-html="error.message" />

        <div class="error-actions">
          <template v-if="error.action === 'install'">
            <a
              href="https://e-imzo.soliq.uz/download/"
              target="_blank"
              class="btn primary"
            >
              Download E-IMZO
            </a>
          </template>

          <template v-else-if="error.action === 'update'">
            <a
              href="https://e-imzo.soliq.uz/download/"
              target="_blank"
              class="btn primary"
            >
              Update E-IMZO
            </a>
          </template>

          <template v-else>
            <button @click="emit('retry')" class="btn primary">
              Try Again
            </button>
          </template>

          <button @click="emit('dismiss')" class="btn secondary">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.error-container {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fff3f3;
  border: 1px solid #ffcdd2;
}

.error-container.connection {
  background: #fff8e1;
  border-color: #ffe082;
}

.error-container.version {
  background: #e3f2fd;
  border-color: #90caf9;
}

.error-icon {
  font-size: 32px;
  line-height: 1;
}

.error-content {
  flex: 1;
}

.error-message {
  margin: 0 0 12px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}

.btn.primary {
  background: #1976d2;
  color: white;
}

.btn.secondary {
  background: #e0e0e0;
  color: #333;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## Try-Catch Patterns

### Basic Pattern

```ts
const { install, error } = useESignature()

async function initialize() {
  try {
    await install()
  } catch (err) {
    // Error is automatically set in error.value
    console.error('Initialization failed:', err)
  }
}
```

### With Error Handler

```ts
import { handleError } from '@/utils/errorHandler'

const handledError = ref<HandledError | null>(null)

async function signDocument() {
  handledError.value = null

  try {
    const { id } = await loadKey(certificate)
    const signature = await signData(id, content)
    return signature
  } catch (err) {
    handledError.value = handleError(err)
    throw err // Re-throw if needed
  }
}
```

### With Retry Logic

```ts
async function signWithRetry(maxAttempts = 3) {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await signDocument()
    } catch (err) {
      lastError = err as Error

      // Don't retry password errors
      if (lastError.message.includes('password')) {
        throw lastError
      }

      // Wait before retry
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  throw lastError
}
```

## Global Error Handling

Set up global error handling in your app:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.errorHandler = (error, instance, info) => {
  // Log to monitoring service
  console.error('Global error:', error)
  console.error('Component:', instance)
  console.error('Info:', info)

  // Show user-friendly notification
  // ...
}

app.mount('#app')
```

## Best Practices

1. **Always use try-catch** - Wrap all E-IMZO operations
2. **Show user-friendly messages** - Use localized error messages
3. **Provide actions** - Give users clear next steps
4. **Log errors** - Send errors to monitoring service
5. **Don't expose internals** - Hide technical details from users
6. **Test error paths** - Verify error handling in all scenarios

## Next Steps

- [TypeScript Support](/guide/typescript) - Type-safe error handling
- [API Reference](/api/) - Complete API documentation
