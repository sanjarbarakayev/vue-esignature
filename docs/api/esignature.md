# ESignature Class

The main class for E-IMZO digital signature operations.

## Import

```ts
import { ESignature } from '@eimzo/vue'
```

## Constructor

```ts
const esign = new ESignature()
```

Creates a new ESignature instance with default API keys for `localhost` and `127.0.0.1`.

## Properties

### apiKeys

```ts
apiKeys: string[]
```

Array of API keys for domain authorization. Format: `[domain1, key1, domain2, key2, ...]`

**Default:**
```ts
[
  'localhost', '<localhost_key>',
  '127.0.0.1', '<127.0.0.1_key>'
]
```

### loadedKey

```ts
get loadedKey(): Certificate | null
set loadedKey(value: Certificate | null): void
```

The currently loaded certificate. Set automatically when `loadKey()` succeeds.

## Methods

### install()

```ts
async install(): Promise<void>
```

Initialize the E-IMZO connection. Must be called before any other operations.

**Throws:** Error if E-IMZO is not installed or version is outdated.

**Example:**
```ts
try {
  await esign.install()
  console.log('E-IMZO initialized')
} catch (error) {
  console.error('Failed to initialize:', error)
}
```

### checkVersion()

```ts
async checkVersion(): Promise<VersionInfo>
```

Check the installed E-IMZO version.

**Returns:** `VersionInfo` with `major` and `minor` properties.

**Throws:** Error if version is below minimum required (3.37).

**Example:**
```ts
const version = await esign.checkVersion()
console.log(`E-IMZO v${version.major}.${version.minor}`)
```

### installApiKeys()

```ts
async installApiKeys(): Promise<void>
```

Install API keys for domain authorization. Called automatically by `install()`.

### listAllUserKeys()

```ts
async listAllUserKeys(): Promise<Certificate[]>
```

List all available certificates (PFX and FTJC).

**Returns:** Array of certificates.

**Example:**
```ts
const certs = await esign.listAllUserKeys()
certs.forEach(cert => {
  console.log(cert.CN, cert.type)
})
```

### loadKey()

```ts
async loadKey(cert: Certificate): Promise<LoadKeyResult>
```

Load a certificate for signing. Prompts user for password.

**Parameters:**
- `cert` - Certificate to load

**Returns:** `LoadKeyResult` with `id` and `cert` properties.

**Throws:** Error on wrong password or other failures.

**Example:**
```ts
const { id, cert } = await esign.loadKey(selectedCert)
console.log('Key ID:', id)
console.log('Loaded:', cert.CN)
```

### createPkcs7()

```ts
async createPkcs7(
  keyId: string,
  content: string
): Promise<SignPkcs7Result | string>
```

Create a PKCS#7 digital signature.

**Parameters:**
- `keyId` - Key ID from `loadKey()`
- `content` - Content to sign

**Returns:** Signature as string or `SignPkcs7Result` object.

**Example:**
```ts
const signature = await esign.createPkcs7(keyId, 'Document content')
```

### appendPkcs7Attached()

```ts
async appendPkcs7Attached(
  keyId: string,
  content: string
): Promise<SignPkcs7Result | string>
```

Append signature to existing PKCS#7.

### changeKeyPassword()

```ts
async changeKeyPassword(cert: Certificate): Promise<void>
```

Change the password for a certificate.

**Parameters:**
- `cert` - Certificate to change password for

### addApiKey()

```ts
addApiKey(domain: string, key: string): void
```

Add an API key for a domain.

**Parameters:**
- `domain` - Domain name
- `key` - API key

**Example:**
```ts
esign.addApiKey('yourdomain.com', 'YOUR_API_KEY')
```

### isIDCardPlugged()

```ts
async isIDCardPlugged(): Promise<boolean>
```

Check if an ID card is plugged in.

### isBAIKTokenPlugged()

```ts
async isBAIKTokenPlugged(): Promise<boolean>
```

Check if a BAIK token is plugged in.

### isCKCPlugged()

```ts
async isCKCPlugged(): Promise<boolean>
```

Check if a CKC device is plugged in.

### signWithUSB()

```ts
async signWithUSB(content: string): Promise<string>
```

Sign with USB token (ID card).

**Parameters:**
- `content` - Content to sign

**Returns:** PKCS#7 signature as Base64 string.

### signWithBAIK()

```ts
async signWithBAIK(content: string): Promise<string>
```

Sign with BAIK token.

### signWithCKC()

```ts
async signWithCKC(content: string): Promise<string>
```

Sign with CKC device.

## Complete Example

```ts
import { ESignature } from '@eimzo/vue'

async function signDocument(content: string) {
  const esign = new ESignature()

  // Add production API key
  esign.addApiKey('myapp.com', 'MY_API_KEY')

  // Initialize
  await esign.install()

  // List certificates
  const certs = await esign.listAllUserKeys()
  if (certs.length === 0) {
    throw new Error('No certificates found')
  }

  // Load first certificate
  const { id } = await esign.loadKey(certs[0])

  // Sign content
  const signature = await esign.createPkcs7(id, content)

  return typeof signature === 'string'
    ? signature
    : signature.pkcs7_64
}
```

## See Also

- [useESignature Composable](/api/composable)
- [Certificate Types](/api/types)
