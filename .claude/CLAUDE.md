# vue-esignature

TypeScript conversion of E-IMZO digital signature library for Vue 3.

## Tech Stack
- Vue 3 + Composition API
- TypeScript strict mode
- Vite for building
- Vitest for testing

## Original Source
- Repo: https://github.com/qo0p/e-imzo-doc
- Commit: f6f1bcd7f2f364c0aa0450956896e9477fb1a512
- Date: 2025-11-26

## What's Done
- Core client converted
- Certificate types (PfxCertificate, FtjcCertificate)
- useESignature composable
- WebSocket transport layer

## What's Missing
- pkcs.js (GOST hash) → needs conversion
- crc32.js → needs conversion  
- e-imzo-mobile.js (QR codes) → needs conversion
- Test suite
- i18n for error messages