# Vue E-Signature Playground

Interactive development environment for testing vue-esignature components.

## Getting Started

From the root of the project:

```bash
# Start the playground
pnpm playground

# Or from this directory
pnpm dev
```

This will start a development server at `http://localhost:5173` with hot module replacement.

## Features

The playground includes interactive demos for:

- **Document Signing** - Complete signing workflow with the ESignatureWidget component
- **Certificate Selection** - Browse and filter certificates (mock data in demo)
- **Mobile QR Signing** - Generate QR codes for E-IMZO mobile app
- **Hardware Tokens** - View status of connected hardware devices

## E-IMZO Detection

The playground automatically detects whether E-IMZO software is installed. If not installed:

- Components will show installation prompts
- Mock data is available for UI preview
- Download links to e-imzo.uz are provided

## Development

The playground imports directly from the library source (`../src`), enabling:

- Hot reload on library changes
- TypeScript type checking
- Direct debugging of library code

## Build

```bash
# Build the playground
pnpm playground:build

# Preview the built version
pnpm playground:preview
```
