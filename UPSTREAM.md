# Upstream Tracking

This document describes how vue-esignature tracks the upstream e-imzo-doc repository.

## Upstream Repository

| Field | Value |
|-------|-------|
| Repository | [qo0p/e-imzo-doc](https://github.com/qo0p/e-imzo-doc) |
| Current Synced Commit | `f6f1bcd7f2f364c0aa0450956896e9477fb1a512` |
| Last Sync Date | 2025-11-26 |

## File Mapping

The following JavaScript files from upstream have been converted to TypeScript:

| Upstream File | TypeScript Conversion | Status |
|---------------|----------------------|--------|
| `example.uz/php/demo/eimzoidcard/js/e-imzo.js` | `src/core/client.ts`, `src/core/capiws.ts` | Complete |
| `example.uz/php/demo/eimzoidcard/js/crc32.js` | `src/core/crc32.ts` | Complete |
| `example.uz/php/demo/eimzoidcard/js/pkcs.js` | `src/core/gost-hash.ts` | Complete |
| `example.uz/php/demo/eimzoidcard/js/e-imzo-mobile.js` | `src/core/e-imzo-mobile.ts` | Complete |

## Automated Sync Checking

A GitHub Actions workflow runs weekly to check for upstream changes:

- **Schedule**: Every Monday at 9:00 UTC
- **Workflow**: `.github/workflows/upstream-sync.yml`
- **Action**: Creates a GitHub issue if new commits are detected

## Manual Sync Instructions

### 1. Update the Submodule

```bash
# Fetch and update to latest upstream
git submodule update --remote e-imzo-doc

# Check what changed
cd e-imzo-doc
git log --oneline ORIG_HEAD..HEAD
git diff --name-only ORIG_HEAD..HEAD
```

### 2. Review Changes

Check if any of the following files were modified:
- `example.uz/php/demo/eimzoidcard/js/e-imzo.js`
- `example.uz/php/demo/eimzoidcard/js/crc32.js`
- `example.uz/php/demo/eimzoidcard/js/pkcs.js`
- `example.uz/php/demo/eimzoidcard/js/e-imzo-mobile.js`

### 3. Update TypeScript Conversions

If upstream files changed:

1. Compare the old and new versions
2. Update the corresponding TypeScript files
3. Ensure type safety is maintained
4. Update tests if necessary

### 4. Test

```bash
pnpm typecheck
pnpm test:run
pnpm build
```

### 5. Document

Update this file:
- Update "Current Synced Commit" with the new SHA
- Update "Last Sync Date"
- Add entry to Changelog below

## Changelog

### 2025-11-26 - Initial Sync

- Commit: `f6f1bcd7f2f364c0aa0450956896e9477fb1a512`
- Converted all JavaScript utilities to TypeScript
- Files converted:
  - `crc32.js` → `src/core/crc32.ts`
  - `pkcs.js` → `src/core/gost-hash.ts`
  - `e-imzo-mobile.js` → `src/core/e-imzo-mobile.ts`
- Added comprehensive test suite
- Added i18n support for error messages (en, ru, uz)

## Notes

### Dependency Injection for QRCode

The upstream `e-imzo-mobile.js` directly uses the global `QRCode` constructor. Our TypeScript conversion uses dependency injection instead:

```typescript
// Upstream (JavaScript)
var qrcode = new QRCode(qrcode_element, { width: 300, height: 300 });

// vue-esignature (TypeScript)
const mobile = new EIMZOMobile(siteId, element, QRCodeLib, { width: 300, height: 300 });
```

This allows users to provide their own QRCode library without bundling it.

### GOST Hash CryptoPro S-Box

The GOST R 34.11-94 hash implementation uses the CryptoPro S-Box parameters, matching the upstream implementation. The test vectors from Wikipedia are used to verify correctness.
