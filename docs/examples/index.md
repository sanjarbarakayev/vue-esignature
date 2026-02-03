# Examples

Practical examples of using Vue E-Signature in real applications.

## Basic Examples

### [Basic Signing](/examples/basic-signing)

The simplest signing flow - initialize, select certificate, and sign.

### [Certificate Selection](/examples/certificate-selection)

Build a certificate picker component with filtering and validation.

### [Mobile QR Signing](/examples/mobile-qr)

Generate QR codes for E-IMZO mobile app signing.

### [Vue Component](/examples/vue-component)

A complete, reusable signing component.

## Code Snippets

### Quick Sign

```ts
import { useESignature } from '@sanjarbarakayev/vue-esignature'

const { install, listKeys, loadKey, signData } = useESignature()

async function quickSign(content: string): Promise<string> {
  await install()
  const certs = await listKeys()
  const { id } = await loadKey(certs[0])
  const result = await signData(id, content)
  return typeof result === 'string' ? result : result.pkcs7_64
}
```

### Check Hardware Tokens

```ts
import { ESignature } from '@sanjarbarakayev/vue-esignature'

async function detectHardware() {
  const esign = new ESignature()
  await esign.install()

  return {
    idCard: await esign.isIDCardPlugged(),
    baikToken: await esign.isBAIKTokenPlugged(),
    ckcDevice: await esign.isCKCPlugged()
  }
}
```

### Multi-Document Signing

```ts
async function signMultiple(documents: string[]): Promise<string[]> {
  const { install, listKeys, loadKey, signData } = useESignature()

  await install()
  const certs = await listKeys()
  const { id } = await loadKey(certs[0])

  return Promise.all(documents.map(doc => signData(id, doc)))
}
```

### Localized Errors

```ts
import { setLocale, getErrorMessage } from '@sanjarbarakayev/vue-esignature'

setLocale('uz')

try {
  await signDocument()
} catch (error) {
  const message = (error as Error).message
  if (message.includes('password')) {
    alert(getErrorMessage('WRONG_PASSWORD'))
  }
}
```

## Full Application Example

See the [Vue Component](/examples/vue-component) example for a complete, production-ready implementation.
