# What is Vue E-Signature?

Vue E-Signature is a Vue 3 plugin that provides seamless integration with [E-IMZO](https://e-imzo.uz), Uzbekistan's national electronic digital signature system.

## Why Vue E-Signature?

The official E-IMZO JavaScript library is designed for vanilla JavaScript and can be challenging to integrate with modern Vue 3 applications. Vue E-Signature solves this by providing:

- **TypeScript Support** - Full type definitions for better developer experience
- **Vue 3 Integration** - Native composables and plugin architecture
- **Promise-based API** - Modern async/await patterns instead of callbacks
- **Error Handling** - Localized error messages in English, Russian, and Uzbek
- **Well Tested** - Comprehensive test suite ensuring reliability

## Core Concepts

### Certificates

E-IMZO uses X.509 certificates for digital signatures. There are two types:

- **PFX Certificates** - Software-based certificates stored as `.pfx` files
- **FTJC Certificates** - Hardware token certificates (ID cards, USB tokens)

### Signing Process

1. **Initialize** - Connect to the E-IMZO application
2. **List Certificates** - Get available certificates on the user's machine
3. **Load Key** - Load a certificate with the user's password
4. **Sign** - Create a PKCS#7 digital signature

### PKCS#7 Signatures

PKCS#7 (also known as CMS - Cryptographic Message Syntax) is the standard format for digital signatures. E-IMZO creates signatures that are legally valid in Uzbekistan.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Vue App                         │
├─────────────────────────────────────────────────────────┤
│     useESignature()     │      ESignature Class         │
├─────────────────────────────────────────────────────────┤
│                   Vue E-Signature                       │
├─────────────────────────────────────────────────────────┤
│                   WebSocket (CAPIWS)                    │
├─────────────────────────────────────────────────────────┤
│              E-IMZO Application / Browser               │
└─────────────────────────────────────────────────────────┘
```

Vue E-Signature communicates with the locally installed E-IMZO application via WebSocket. The E-IMZO application handles all cryptographic operations securely.

## Prerequisites

Before using Vue E-Signature, users must have:

1. **E-IMZO Application** - Download from [e-imzo.soliq.uz/download](https://e-imzo.soliq.uz/download/)
2. **Valid Certificate** - Either a PFX file or hardware token with a valid certificate
3. **Modern Browser** - Chrome, Firefox, Safari, or Edge with WebSocket support

## Next Steps

- [Installation](/guide/installation) - Install the package in your project
- [Quick Start](/guide/quick-start) - Get up and running quickly
- [Working with Certificates](/guide/certificates) - Learn about certificate management
