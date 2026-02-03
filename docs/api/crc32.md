# CRC32

CRC32 checksum calculator for data validation.

## Import

```ts
import { CRC32, crc32, crc32Hex } from '@sanjarbarakayev/vue-esignature'
```

## CRC32 Class

### Constructor

```ts
const crc = new CRC32()
```

### Methods

#### calc()

```ts
calc(str: string): string
```

Calculate CRC32 checksum from a string.

**Parameters:**
- `str` - Input string

**Returns:** CRC32 checksum as hexadecimal string (lowercase).

**Example:**
```ts
const crc = new CRC32()
const checksum = crc.calc('Hello World')
console.log(checksum) // "4a17b156"
```

#### calcHex()

```ts
calcHex(hexStr: string): string
```

Calculate CRC32 checksum from a hexadecimal string.

**Parameters:**
- `hexStr` - Input hex string (e.g., "48656c6c6f" for "Hello")

**Returns:** CRC32 checksum as 8-character hexadecimal string (zero-padded).

**Example:**
```ts
const crc = new CRC32()
const checksum = crc.calcHex('48656c6c6f') // "Hello" in hex
console.log(checksum) // 8-character hex string
```

## Convenience Functions

### crc32()

```ts
function crc32(str: string): string
```

Calculate CRC32 from a string.

**Example:**
```ts
const checksum = crc32('test')
```

### crc32Hex()

```ts
function crc32Hex(hexStr: string): string
```

Calculate CRC32 from a hex string.

**Example:**
```ts
const checksum = crc32Hex('74657374') // "test" in hex
```

## Use Cases

### Data Validation

```ts
import { crc32 } from '@sanjarbarakayev/vue-esignature'

function validateData(data: string, expectedChecksum: string): boolean {
  return crc32(data) === expectedChecksum
}
```

### QR Code Generation

CRC32 is used internally by `EIMZOMobile` to add checksums to QR codes:

```ts
import { CRC32 } from '@sanjarbarakayev/vue-esignature'

const crc = new CRC32()
const qrData = 'SITE123DOC001<hash>'
const checksum = crc.calcHex(qrData)
const fullQrData = qrData + checksum
```

## Type Definition

```ts
interface ICRC32 {
  calc(str: string): string
  calcHex(hexStr: string): string
}
```

## See Also

- [GOST Hash](/api/gost-hash)
- [EIMZOMobile](/api/e-imzo-mobile)
