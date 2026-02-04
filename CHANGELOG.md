# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-02-04

### Breaking Changes

- **Removed demo components from npm package** - The following components are no longer exported:
  - `StatusIndicator`
  - `InstallPrompt`
  - `CertificateSelector`
  - `MobileQRModal`
  - `ESignatureWidget`
- **Removed CSS export** - `@sanjarbarakayev/vue-esignature/dist/style.css` is no longer available

### Migration Guide

If you were using the demo components, you have two options:

1. **Copy components to your project**: The demo components are available in the [examples/components](https://github.com/sanjarbarakayev/vue-esignature/tree/main/examples/components) directory. Copy them into your project and update imports to use the package's core exports.

2. **Build your own UI**: Use the core `useESignature()` composable and utility functions to build your own signing UI.

### Package Size

| Metric | Before (v1.3.0) | After (v2.0.0) | Reduction |
|--------|-----------------|----------------|-----------|
| Unpacked | 352 KB | 196 KB | 44% |
| Package (gzip) | 82 KB | 52 KB | 37% |
| CSS | 32 KB | 0 KB | 100% |

### Why This Change?

- **Smaller bundle**: Most users only need the core signing functionality
- **Flexibility**: Build your own UI that matches your app's design system
- **No opinions**: The library no longer dictates styling choices

## [1.3.0] - 2025-02-04

### Changed

- **BREAKING**: `MobileQRModal` now uses slot-based QR rendering instead of bundling qrcode library
  - Pass your own QR component via `#qr` slot: `<template #qr="{ code, size }">...</template>`
  - Supports any QR library (qrcode, vue-qrcode, qrcode.vue, etc.)
  - Shows helpful fallback when no slot provided

### Performance

- Reduced package size by **73%** (1.3 MB → 351 KB unpacked)
- Removed source maps from production build (saves ~885 KB)
- Added aggressive terser compression with 2-pass optimization
- Removed `qrcode` runtime dependency (zero dependencies now)

### Added

- E2E testing infrastructure with Playwright
- WebSocket testing support

## [1.2.0] - 2025-02-03

### Added

- Mobile signature support via QR codes (`e-imzo-mobile.js` conversion complete)
- CRC32 checksum utility (`crc32.js` conversion complete)
- GOST hash utilities (`pkcs.js` conversion complete)
- Demo components and styles for showcasing library usage
- VitePress documentation site
- Comprehensive test suite
- GitHub Pages deployment workflow

### Changed

- Export new modules from core for easier access to utilities

## [1.1.2] - 2024-11-28

### Fixed

- Fixed "Функция не найдено" (Function not found) error when signing with USB token
- Changed `signWithUSB()` and `signWithBAIK()` to use special keyId values ("idcard", "baikey") with `createPkcs7` instead of calling plugin-specific functions that may not exist in all E-IMZO versions

### Added

- Added `signWithCKC()` method for signing with CKC devices
- Added `checkCKCDevice()` method in composable to check CKC device connection

## [1.0.0] - 2024-11-28

### Added

- Initial release
- Vue 3 plugin (`VueESignature`) for E-IMZO integration
- `useESignature()` composable with reactive state
- `ESignature` class for direct usage
- Full TypeScript support with type definitions
- Support for PFX certificates
- Support for FTJC hardware tokens
- Support for USB ID cards (idcard plugin)
- Support for BAIK tokens (baikey plugin)
- Support for CKC devices
- PKCS7 signature creation
- Version checking and API key management
- Comprehensive documentation

### Security

- Secure WebSocket connections (wss://) for HTTPS sites
- Native password dialogs (passwords never exposed to browser)

## [Unreleased]

### Planned

- Vue component for certificate selection
- Timestamping service integration
- Signature verification utilities
