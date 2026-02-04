# Example Components

These Vue components demonstrate how to build signing UI using the core API.

**Note:** These are NOT exported from the npm package. Copy and customize for your project.

## Components

| Component | Description |
|-----------|-------------|
| `StatusIndicator.vue` | Shows E-IMZO installation status |
| `InstallPrompt.vue` | Prompts user to install E-IMZO |
| `CertificateSelector.vue` | Certificate list with filtering |
| `MobileQRModal.vue` | QR code modal for mobile signing |
| `ESignatureWidget.vue` | Complete signing workflow widget |

## Usage

Copy a component to your project and import the core API:

```vue
<script setup>
import { useESignature } from '@eimzo/vue'
// Your component logic using the composable
</script>
```
