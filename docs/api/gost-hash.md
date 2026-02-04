# GOST Hash

GOST R 34.11-94 cryptographic hash function implementation.

## Import

```ts
import {
  GostHash,
  SignedAttributeHash,
  Utf8,
  gosthash,
  gosthashHex,
  GOST_TEST_VECTORS
} from '@eimzo/vue'
```

## GostHash Class

### Constructor

```ts
const hasher = new GostHash()
```

### Methods

#### gosthash()

```ts
gosthash(value: string): string
```

Calculate GOST hash from a string.

**Parameters:**
- `value` - Input string

**Returns:** Hash as 64-character lowercase hexadecimal string.

**Example:**
```ts
const hasher = new GostHash()
const hash = hasher.gosthash('message digest')
// Returns: "bc6041dd2aa401ebfa6e9886734174febdb4729aa972d60f549ac39b29721ba0"
```

#### gosthashHex()

```ts
gosthashHex(hex: string): string
```

Calculate GOST hash from a hexadecimal string.

**Parameters:**
- `hex` - Input hex string

**Returns:** Hash as 64-character lowercase hexadecimal string.

**Example:**
```ts
const hasher = new GostHash()
const hash = hasher.gosthashHex('48656c6c6f') // "Hello"
```

#### toHex()

```ts
toHex(str: string): string
```

Convert string to hexadecimal.

**Example:**
```ts
const hasher = new GostHash()
hasher.toHex('ABC') // "414243"
```

## SignedAttributeHash Class

Calculator for PKCS#7 signed attribute hashes.

### Methods

#### hash()

```ts
hash(text: string): SignedAttributeHashResult
```

Calculate hash for text content.

**Returns:**
```ts
interface SignedAttributeHashResult {
  utcTime: string              // e.g., "240115120000Z"
  signedAttributesHash: string // 64-char hex
  textHash: string             // 64-char hex
}
```

**Example:**
```ts
const sah = new SignedAttributeHash()
const result = sah.hash('Document content')

console.log(result.utcTime)              // UTC timestamp
console.log(result.textHash)             // Hash of content
console.log(result.signedAttributesHash) // Hash of signed attributes
```

#### hashHex()

```ts
hashHex(hexText: string): SignedAttributeHashResult
```

Calculate hash for hex-encoded content.

## Utf8 Utility

UTF-8 encoding/decoding utilities.

### encode()

```ts
Utf8.encode(str: string): string
```

Encode Unicode string to UTF-8.

### decode()

```ts
Utf8.decode(str: string): string
```

Decode UTF-8 string to Unicode.

**Example:**
```ts
const encoded = Utf8.encode('Привет')
const decoded = Utf8.decode(encoded)
console.log(decoded) // "Привет"
```

## Convenience Functions

### gosthash()

```ts
function gosthash(value: string): string
```

Calculate GOST hash from string.

### gosthashHex()

```ts
function gosthashHex(hex: string): string
```

Calculate GOST hash from hex string.

**Example:**
```ts
const hash1 = gosthash('test')
const hash2 = gosthashHex('74657374') // "test" in hex
```

## Test Vectors

Official GOST R 34.11-94 test vectors:

```ts
import { GOST_TEST_VECTORS, GostHash } from '@eimzo/vue'

const hasher = new GostHash()

GOST_TEST_VECTORS.forEach(vector => {
  const calculated = hasher.gosthash(vector.text).toUpperCase()
  console.log(calculated === vector.hash ? '✓' : '✗', vector.text)
})
```

### Test Vector Values

| Text | Hash |
|------|------|
| `""` (empty) | `981E5F3CA30C841487830F84FB433E13AC1101569B9C13584AC483234CD656C0` |
| `"a"` | `E74C52DD282183BF37AF0079C9F78055715A103F17E3133CEFF1AACF2F403011` |
| `"abc"` | `B285056DBF18D7392D7677369524DD14747459ED8143997E163B2986F92FD42C` |
| `"message digest"` | `BC6041DD2AA401EBFA6E9886734174FEBDB4729AA972D60F549AC39B29721BA0` |

## Use Cases

### Document Hashing

```ts
import { gosthash } from '@eimzo/vue'

function hashDocument(content: string): string {
  return gosthash(content)
}

const docHash = hashDocument('Contract content...')
```

### QR Code Generation

Used by `EIMZOMobile` for document hashing:

```ts
import { GostHash, CRC32 } from '@eimzo/vue'

function generateQRData(siteId: string, docNum: string, content: string) {
  const hasher = new GostHash()
  const crc = new CRC32()

  const textHash = hasher.gosthash(content)
  const dataWithoutCrc = siteId + docNum + textHash
  const checksum = crc.calcHex(dataWithoutCrc)

  return dataWithoutCrc + checksum
}
```

### Mobile Signing Attributes

```ts
import { SignedAttributeHash } from '@eimzo/vue'

const sah = new SignedAttributeHash()
const result = sah.hash('Document to sign')

// Use for mobile signing workflow
sendToMobileApp({
  timestamp: result.utcTime,
  documentHash: result.textHash,
  attributeHash: result.signedAttributesHash
})
```

## Type Definitions

```ts
interface IGostHash {
  gosthash(value: string): string
  gosthashHex(hex: string): string
  toHex(str: string): string
}

interface SignedAttributeHashResult {
  utcTime: string
  signedAttributesHash: string
  textHash: string
}

interface GostTestVector {
  hash: string
  text: string
}
```

## Algorithm Notes

- Implements GOST R 34.11-94 hash function
- Uses CryptoPro S-Box parameters
- Produces 256-bit (32-byte) hash
- Output is 64 hexadecimal characters

## See Also

- [CRC32](/api/crc32)
- [EIMZOMobile](/api/e-imzo-mobile)
