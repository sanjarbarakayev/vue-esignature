# Installation

## Package Installation

Install Vue E-Signature using your preferred package manager:

::: code-group

```bash [npm]
npm install @eimzo/vue
```

```bash [pnpm]
pnpm add @eimzo/vue
```

```bash [yarn]
yarn add @eimzo/vue
```

:::

## Vue Plugin Setup (Optional)

You can register Vue E-Signature as a Vue plugin to make it available throughout your application:

```ts
// main.ts
import { createApp } from 'vue'
import { VueESignature } from '@eimzo/vue'
import App from './App.vue'

const app = createApp(App)

app.use(VueESignature, {
  // Optional: Add custom API keys for your domain
  apiKeys: [
    { domain: 'yourdomain.com', key: 'YOUR_API_KEY' }
  ],
  // Optional: Auto-initialize on plugin registration
  autoInstall: false
})

app.mount('#app')
```

## Direct Import

Alternatively, import the composable or class directly in your components:

```vue
<script setup lang="ts">
import { useESignature } from '@eimzo/vue'

const esignature = useESignature()
</script>
```

Or use the class-based API:

```ts
import { ESignature } from '@eimzo/vue'

const esignature = new ESignature()
```

## E-IMZO Application

::: warning Important
Users must have E-IMZO installed on their machine for the library to work.
:::

### Download E-IMZO

Direct users to download from the official source:

- [E-IMZO Downloads](https://e-imzo.soliq.uz/download/)

### Supported Platforms

| Platform | Application |
|----------|-------------|
| Windows | E-IMZO for Windows |
| macOS | E-IMZO for macOS |
| Linux | E-IMZO for Linux |
| Browser Extension | E-IMZO Browser |

## API Keys

E-IMZO requires API keys for domain authorization. Default keys for `localhost` and `127.0.0.1` are included for development.

### Adding Custom API Keys

For production, register your domain with E-IMZO and add your API key:

```ts
import { ESignature } from '@eimzo/vue'

const esignature = new ESignature()

// Add your production API key
esignature.addApiKey('yourdomain.com', 'YOUR_PRODUCTION_API_KEY')
```

Or via plugin options:

```ts
app.use(VueESignature, {
  apiKeys: [
    { domain: 'yourdomain.com', key: 'YOUR_PRODUCTION_API_KEY' },
    { domain: 'staging.yourdomain.com', key: 'YOUR_STAGING_API_KEY' }
  ]
})
```

## TypeScript Configuration

Vue E-Signature includes TypeScript definitions out of the box. No additional configuration is required.

For the best experience, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

## Browser Requirements

Vue E-Signature requires browsers with WebSocket support:

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 11+ |
| Edge | 79+ |

::: tip
Internet Explorer is not supported. Users on older browsers should upgrade to a modern browser.
:::

## Troubleshooting

### "E-IMZO not installed" Error

This error appears when the E-IMZO application is not running or not installed.

**Solutions:**
1. Install E-IMZO from [e-imzo.soliq.uz/download](https://e-imzo.soliq.uz/download/)
2. Start the E-IMZO application
3. Check if E-IMZO Browser extension is enabled

### "WebSocket not supported" Error

This error appears in older browsers that don't support WebSocket.

**Solution:** Upgrade to a modern browser (Chrome, Firefox, Safari, or Edge).

### "API key not valid" Error

This error appears when using an unregistered domain.

**Solutions:**
1. Use `localhost` or `127.0.0.1` for development
2. Register your domain with E-IMZO for production
3. Verify your API key is correct

## Next Steps

- [Quick Start](/guide/quick-start) - Get up and running in minutes
- [Working with Certificates](/guide/certificates) - Learn about certificate management
