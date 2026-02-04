# Interactive Demos

Try the library features directly in your browser. Full functionality requires E-IMZO installation.

::: tip Don't have E-IMZO?
[Download E-IMZO](https://e-imzo.soliq.uz/download/) to enable full signing functionality. Components will show mock data for UI preview when E-IMZO is not detected.
:::

## Document Signing

Complete signing workflow with certificate selection, confirmation, and signature download.

<LiveSigningWidget />

## Certificate Selection

Browse and filter available certificates by type, name, or organization.

<LiveCertificateSelector />

## Mobile QR Signing

Generate QR codes for signing with the E-IMZO mobile app.

<LiveMobileQR />

## Features Demonstrated

| Feature | Description |
|---------|-------------|
| **Auto-detection** | Automatically detects E-IMZO installation |
| **Mock mode** | Shows UI preview with sample data |
| **Certificate filtering** | Filter by type (PFX/Token), search, validity |
| **Multi-step workflow** | Guided signing process |
| **Hardware support** | ID Card and BAIK token integration |
| **Mobile signing** | QR code generation for mobile app |
| **Download signature** | Export as .p7s file |

## Using These Components

All demo components are exported from the library:

```typescript
import {
  ESignatureWidget,
  CertificateSelector,
  MobileQRModal,
  InstallPrompt,
  StatusIndicator
} from '@eimzo/vue'
```

See the [Examples](/examples/) section for detailed usage documentation.
