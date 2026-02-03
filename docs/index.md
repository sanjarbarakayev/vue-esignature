---
layout: home

hero:
  name: Vue E-Signature
  text: Digital Signatures for Vue 3
  tagline: Seamless integration with Uzbekistan's E-IMZO digital signature system
  image:
    src: /logo.svg
    alt: Vue E-Signature
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/sanjarbarakayev/vue-esignature

features:
  - icon: 🔐
    title: Digital Signatures
    details: Create PKCS#7 digital signatures using E-IMZO's secure infrastructure. Support for PFX files and hardware tokens.

  - icon: 📱
    title: Mobile Support
    details: Generate QR codes for E-IMZO mobile app signing workflow. Perfect for document approval on the go.

  - icon: 🌍
    title: Internationalization
    details: Built-in support for English, Russian, and Uzbek languages. Easy to extend with additional locales.

  - icon: 🔧
    title: TypeScript First
    details: Written in TypeScript with complete type definitions. Enjoy full IntelliSense support in your IDE.

  - icon: ⚡
    title: Vue 3 Native
    details: Built specifically for Vue 3 with Composition API. Use the composable or class-based API.

  - icon: 🧪
    title: Well Tested
    details: Comprehensive test suite with 163+ tests. Over 90% code coverage for reliability you can trust.
---

## Quick Start

Install the package:

```bash
npm install @sanjarbarakayev/vue-esignature
```

Use in your Vue component:

```vue
<script setup lang="ts">
import { useESignature } from '@sanjarbarakayev/vue-esignature'

const { install, listKeys, loadKey, signData } = useESignature()

// Initialize E-IMZO
await install()

// List available certificates
const certificates = await listKeys()

// Load a certificate and sign data
const { id } = await loadKey(certificates[0])
const signature = await signData(id, 'Document content')
</script>
```

## What is E-IMZO?

[E-IMZO](https://e-imzo.uz) is Uzbekistan's national electronic digital signature system. It enables:

- **Legal validity** - Digital signatures have the same legal status as handwritten signatures
- **Document authentication** - Verify the origin and integrity of electronic documents
- **Secure transactions** - Sign contracts, invoices, and official documents electronically

Vue E-Signature provides a modern, type-safe wrapper around the E-IMZO JavaScript API, making it easy to integrate digital signatures into your Vue 3 applications.

## Features at a Glance

| Feature | Description |
|---------|-------------|
| Certificate Management | List, load, and manage PFX and FTJC certificates |
| PKCS#7 Signing | Create attached and detached digital signatures |
| Hardware Token Support | Work with ID cards, BAIK tokens, and CKC devices |
| Mobile QR Codes | Generate QR codes for E-IMZO mobile app |
| GOST Hashing | Compute GOST R 34.11-94 hashes |
| CRC32 Checksums | Calculate CRC32 checksums for data validation |
| Multi-language | Error messages in English, Russian, and Uzbek |

## Browser Support

Vue E-Signature requires:
- Modern browsers with WebSocket support
- E-IMZO application or E-IMZO Browser installed on the user's machine

| Browser | Supported |
|---------|-----------|
| Chrome 60+ | ✅ |
| Firefox 55+ | ✅ |
| Safari 11+ | ✅ |
| Edge 79+ | ✅ |

## License

[MIT License](https://github.com/sanjarbarakayev/vue-esignature/blob/main/LICENSE)
