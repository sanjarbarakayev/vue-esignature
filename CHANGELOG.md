# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Mobile signature support via QR code
- Timestamping service integration
- Signature verification utilities
