/**
 * GOST R 34.11-94 Hash Function Implementation
 *
 * TypeScript implementation of the Russian GOST R 34.11-94 cryptographic hash function.
 * Based on C-code by Alexei Kravchenko and Markku-Juhani Saarinen,
 * and the original JavaScript implementation from e-imzo-doc.
 *
 * @example
 * ```typescript
 * import { GostHash, Utf8 } from '@sanjarbarakayev/vue-esignature'
 *
 * const hasher = new GostHash()
 * const hash = hasher.gosthash('Hello World')
 * const hashFromHex = hasher.gosthashHex('48656c6c6f')
 * ```
 */

/**
 * UTF-8 encoding/decoding utilities
 */
export const Utf8 = {
  /**
   * Encode a Unicode string to UTF-8
   */
  encode(strUni: string): string {
    // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
    let strUtf = strUni.replace(/[\u0080-\u07ff]/g, (c: string) => {
      const cc = c.charCodeAt(0);
      return String.fromCharCode(0xc0 | (cc >> 6), 0x80 | (cc & 0x3f));
    });
    // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
    strUtf = strUtf.replace(/[\u0800-\uffff]/g, (c: string) => {
      const cc = c.charCodeAt(0);
      return String.fromCharCode(
        0xe0 | (cc >> 12),
        0x80 | ((cc >> 6) & 0x3f),
        0x80 | (cc & 0x3f)
      );
    });
    return strUtf;
  },

  /**
   * Decode a UTF-8 string to Unicode
   */
  decode(strUtf: string): string {
    // Decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char
    let strUni = strUtf.replace(
      /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,
      (c: string) => {
        const cc =
          ((c.charCodeAt(0) & 0x0f) << 12) |
          ((c.charCodeAt(1) & 0x3f) << 6) |
          (c.charCodeAt(2) & 0x3f);
        return String.fromCharCode(cc);
      }
    );
    // 2-byte chars
    strUni = strUni.replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, (c: string) => {
      const cc = ((c.charCodeAt(0) & 0x1f) << 6) | (c.charCodeAt(1) & 0x3f);
      return String.fromCharCode(cc);
    });
    return strUni;
  },
};

/**
 * CryptoPro S-Box for GOST 28147-89
 */
const SBOX: readonly (readonly number[])[] = [
  [10, 4, 5, 6, 8, 1, 3, 7, 13, 12, 14, 0, 9, 2, 11, 15],
  [5, 15, 4, 0, 2, 13, 11, 9, 1, 7, 6, 3, 12, 14, 10, 8],
  [7, 15, 12, 14, 9, 4, 1, 0, 3, 11, 5, 2, 6, 10, 8, 13],
  [4, 10, 7, 12, 0, 15, 2, 8, 14, 1, 6, 5, 13, 11, 9, 3],
  [7, 6, 4, 11, 9, 12, 2, 10, 1, 8, 0, 14, 15, 13, 3, 5],
  [7, 6, 2, 4, 13, 9, 15, 0, 10, 1, 5, 11, 8, 14, 12, 3],
  [13, 14, 4, 1, 7, 0, 5, 10, 3, 12, 8, 15, 6, 2, 9, 11],
  [1, 3, 10, 9, 5, 11, 4, 15, 8, 6, 7, 14, 13, 0, 2, 12],
];

/**
 * Hex character lookup
 */
const HEX_CHARS = "0123456789abcdef";

/**
 * GOST R 34.11-94 Hash Function
 *
 * Implements the Russian GOST R 34.11-94 cryptographic hash function
 * using the CryptoPro S-Box.
 */
export class GostHash {
  private hash: number[] = new Array(8);
  private sum: number[] = new Array(8);
  private message: number[] = new Array(32);
  private length: number = 0;
  private r: number = 0;
  private l: number = 0;
  private gostSbox: number[][] = [];
  private readonly sbox: readonly (readonly number[])[] = SBOX;

  constructor() {
    // Initialize the 4x256 lookup tables
    for (let j = 0; j < 4; j++) {
      this.gostSbox[j] = new Array(256);
    }
  }

  /**
   * Rotate left operation
   */
  private rol(word: number, n: number): number {
    return (word << (n & 0x1f)) | (word >>> (32 - (n & 0x1f)));
  }

  /**
   * Convert byte value to 2-character hex string
   */
  private ch2hex(val: number): string {
    return HEX_CHARS[(val >>> 4) & 15] + HEX_CHARS[val & 15];
  }

  /**
   * Convert string to byte array
   */
  private str2bytes(str: string): number[] {
    const arr = new Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i) & 255;
    }
    return arr;
  }

  /**
   * Convert hex string to byte array
   */
  private hexStr2bytes(str: string): number[] {
    const hex = str.toLowerCase();
    const arr = new Array(str.length / 2);
    for (let i = 0, k = 0; i < hex.length; i += 2, k++) {
      arr[k] =
        ((HEX_CHARS.indexOf(hex.charAt(i)) & 0xf) << 4) +
        (HEX_CHARS.indexOf(hex.charAt(i + 1)) & 0xf);
    }
    return arr;
  }

  /**
   * Convert string to hex
   */
  toHex(str: string): string {
    let hex = "";
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16);
    }
    return hex;
  }

  /**
   * Initialize algorithm context before calculating hash
   */
  private gostInit(): void {
    for (let i = 0; i < 8; i++) {
      this.hash[i] = 0;
      this.sum[i] = 0;
      this.message[4 * i] = 0;
      this.message[4 * i + 1] = 0;
      this.message[4 * i + 2] = 0;
      this.message[4 * i + 3] = 0;
    }
    this.length = 0;
  }

  /**
   * A full encryption round of GOST 28147-89
   */
  private gostEncryptRound(key1: number, key2: number): void {
    let tmp = key1 + this.r;
    this.l ^=
      this.gostSbox[0][tmp & 0xff] ^
      this.gostSbox[1][(tmp >>> 8) & 0xff] ^
      this.gostSbox[2][(tmp >>> 16) & 0xff] ^
      this.gostSbox[3][(tmp >>> 24) & 0xff];
    tmp = key2 + this.l;
    this.r ^=
      this.gostSbox[0][tmp & 0xff] ^
      this.gostSbox[1][(tmp >>> 8) & 0xff] ^
      this.gostSbox[2][(tmp >>> 16) & 0xff] ^
      this.gostSbox[3][(tmp >>> 24) & 0xff];
  }

  /**
   * Encrypt a block with the given key
   */
  private gostEncrypt(
    ii: number,
    key: number[],
    varhash: number[]
  ): [number, number] {
    this.r = varhash[ii];
    this.l = varhash[ii + 1];
    this.gostEncryptRound(key[0], key[1]);
    this.gostEncryptRound(key[2], key[3]);
    this.gostEncryptRound(key[4], key[5]);
    this.gostEncryptRound(key[6], key[7]);
    this.gostEncryptRound(key[0], key[1]);
    this.gostEncryptRound(key[2], key[3]);
    this.gostEncryptRound(key[4], key[5]);
    this.gostEncryptRound(key[6], key[7]);
    this.gostEncryptRound(key[0], key[1]);
    this.gostEncryptRound(key[2], key[3]);
    this.gostEncryptRound(key[4], key[5]);
    this.gostEncryptRound(key[6], key[7]);
    this.gostEncryptRound(key[7], key[6]);
    this.gostEncryptRound(key[5], key[4]);
    this.gostEncryptRound(key[3], key[2]);
    this.gostEncryptRound(key[1], key[0]);
    return [this.l, this.r];
  }

  /**
   * The core transformation - process a 512-bit block
   */
  private gostBlockCompress(block: number[]): void {
    const key = new Array(8);
    const u = new Array(8);
    const v = new Array(8);
    const w = new Array(8);
    const s = new Array(8);

    // u := hash, v := <256-bit message block>
    for (let i = 0; i < 8; i++) {
      u[i] = this.hash[i];
      v[i] = block[i];
    }

    // w := u xor v
    w[0] = u[0] ^ v[0];
    w[1] = u[1] ^ v[1];
    w[2] = u[2] ^ v[2];
    w[3] = u[3] ^ v[3];
    w[4] = u[4] ^ v[4];
    w[5] = u[5] ^ v[5];
    w[6] = u[6] ^ v[6];
    w[7] = u[7] ^ v[7];

    // Calculate keys, encrypt hash and store result to the s[] array
    for (let i = 0; ; i += 2) {
      // Key generation: key_i := P(w)
      key[0] =
        (w[0] & 0x000000ff) |
        ((w[2] & 0x000000ff) << 8) |
        ((w[4] & 0x000000ff) << 16) |
        ((w[6] & 0x000000ff) << 24);
      key[1] =
        ((w[0] & 0x0000ff00) >>> 8) |
        (w[2] & 0x0000ff00) |
        ((w[4] & 0x0000ff00) << 8) |
        ((w[6] & 0x0000ff00) << 16);
      key[2] =
        ((w[0] & 0x00ff0000) >>> 16) |
        ((w[2] & 0x00ff0000) >>> 8) |
        (w[4] & 0x00ff0000) |
        ((w[6] & 0x00ff0000) << 8);
      key[3] =
        ((w[0] & 0xff000000) >>> 24) |
        ((w[2] & 0xff000000) >>> 16) |
        ((w[4] & 0xff000000) >>> 8) |
        (w[6] & 0xff000000);
      key[4] =
        (w[1] & 0x000000ff) |
        ((w[3] & 0x000000ff) << 8) |
        ((w[5] & 0x000000ff) << 16) |
        ((w[7] & 0x000000ff) << 24);
      key[5] =
        ((w[1] & 0x0000ff00) >>> 8) |
        (w[3] & 0x0000ff00) |
        ((w[5] & 0x0000ff00) << 8) |
        ((w[7] & 0x0000ff00) << 16);
      key[6] =
        ((w[1] & 0x00ff0000) >>> 16) |
        ((w[3] & 0x00ff0000) >>> 8) |
        (w[5] & 0x00ff0000) |
        ((w[7] & 0x00ff0000) << 8);
      key[7] =
        ((w[1] & 0xff000000) >>> 24) |
        ((w[3] & 0xff000000) >>> 16) |
        ((w[5] & 0xff000000) >>> 8) |
        (w[7] & 0xff000000);

      // Encryption: s_i := E_{key_i} (h_i)
      const res = this.gostEncrypt(i, key, this.hash);
      s[i] = res[0];
      s[i + 1] = res[1];

      if (i === 0) {
        // w:= A(u) ^ A^2(v)
        w[0] = u[2] ^ v[4];
        w[1] = u[3] ^ v[5];
        w[2] = u[4] ^ v[6];
        w[3] = u[5] ^ v[7];
        w[4] = u[6] ^ (v[0] ^= v[2]);
        w[5] = u[7] ^ (v[1] ^= v[3]);
        w[6] = (u[0] ^= u[2]) ^ (v[2] ^= v[4]);
        w[7] = (u[1] ^= u[3]) ^ (v[3] ^= v[5]);
      } else if ((i & 2) !== 0) {
        if (i === 6) break;
        // w := A^2(u) xor A^4(v) xor C_3; u := A(u) xor C_3
        // C_3=0xff00ffff000000ffff0000ff00ffff0000ff00ff00ff00ffff00ff00ff00ff00
        u[2] ^= u[4] ^ 0x000000ff;
        u[3] ^= u[5] ^ 0xff00ffff;
        u[4] ^= 0xff00ff00;
        u[5] ^= 0xff00ff00;
        u[6] ^= 0x00ff00ff;
        u[7] ^= 0x00ff00ff;
        u[0] ^= 0x00ffff00;
        u[1] ^= 0xff0000ff;

        w[0] = u[4] ^ v[0];
        w[2] = u[6] ^ v[2];
        w[4] = u[0] ^ (v[4] ^= v[6]);
        w[6] = u[2] ^ (v[6] ^= v[0]);
        w[1] = u[5] ^ v[1];
        w[3] = u[7] ^ v[3];
        w[5] = u[1] ^ (v[5] ^= v[7]);
        w[7] = u[3] ^ (v[7] ^= v[1]);
      } else {
        // i==4 here
        // w:= A( A^2(u) xor C_3 ) xor A^6(v)
        w[0] = u[6] ^ v[4];
        w[1] = u[7] ^ v[5];
        w[2] = u[0] ^ v[6];
        w[3] = u[1] ^ v[7];
        w[4] = u[2] ^ (v[0] ^= v[2]);
        w[5] = u[3] ^ (v[1] ^= v[3]);
        w[6] = (u[4] ^= u[6]) ^ (v[2] ^= v[4]);
        w[7] = (u[5] ^= u[7]) ^ (v[3] ^= v[5]);
      }
    }

    // Step hash function: x(block, hash) := psi^61(hash xor psi(block xor psi^12(S)))

    // 12 rounds of the LFSR and xor in <message block>
    u[0] = block[0] ^ s[6];
    u[1] = block[1] ^ s[7];
    u[2] =
      block[2] ^
      (s[0] << 16) ^
      (s[0] >>> 16) ^
      (s[0] & 0xffff) ^
      (s[1] & 0xffff) ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      s[6] ^
      (s[6] << 16) ^
      (s[7] & 0xffff0000) ^
      (s[7] >>> 16);
    u[3] =
      block[3] ^
      (s[0] & 0xffff) ^
      (s[0] << 16) ^
      (s[1] & 0xffff) ^
      (s[1] << 16) ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      s[6] ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff) ^
      (s[7] << 16) ^
      (s[7] >>> 16);
    u[4] =
      block[4] ^
      (s[0] & 0xffff0000) ^
      (s[0] << 16) ^
      (s[0] >>> 16) ^
      (s[1] & 0xffff0000) ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      (s[3] >>> 16) ^
      (s[4] << 16) ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff) ^
      (s[7] << 16) ^
      (s[7] >>> 16);
    u[5] =
      block[5] ^
      (s[0] << 16) ^
      (s[0] >>> 16) ^
      (s[0] & 0xffff0000) ^
      (s[1] & 0xffff) ^
      s[2] ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      (s[3] >>> 16) ^
      (s[4] << 16) ^
      (s[4] >>> 16) ^
      (s[5] << 16) ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff0000) ^
      (s[7] << 16) ^
      (s[7] >>> 16);
    u[6] =
      block[6] ^
      s[0] ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      s[3] ^
      (s[3] >>> 16) ^
      (s[4] << 16) ^
      (s[4] >>> 16) ^
      (s[5] << 16) ^
      (s[5] >>> 16) ^
      s[6] ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] << 16);
    u[7] =
      block[7] ^
      (s[0] & 0xffff0000) ^
      (s[0] << 16) ^
      (s[1] & 0xffff) ^
      (s[1] << 16) ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      s[4] ^
      (s[4] >>> 16) ^
      (s[5] << 16) ^
      (s[5] >>> 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff) ^
      (s[7] << 16) ^
      (s[7] >>> 16);

    // 1 round of the LFSR (a mixing transformation) and xor with <hash>
    v[0] = this.hash[0] ^ ((u[1] << 16) ^ (u[0] >>> 16));
    v[1] = this.hash[1] ^ ((u[2] << 16) ^ (u[1] >>> 16));
    v[2] = this.hash[2] ^ ((u[3] << 16) ^ (u[2] >>> 16));
    v[3] = this.hash[3] ^ ((u[4] << 16) ^ (u[3] >>> 16));
    v[4] = this.hash[4] ^ ((u[5] << 16) ^ (u[4] >>> 16));
    v[5] = this.hash[5] ^ ((u[6] << 16) ^ (u[5] >>> 16));
    v[6] = this.hash[6] ^ ((u[7] << 16) ^ (u[6] >>> 16));
    v[7] =
      this.hash[7] ^
      ((u[0] & 0xffff0000) ^
        (u[0] << 16) ^
        (u[1] & 0xffff0000) ^
        (u[1] << 16) ^
        (u[6] << 16) ^
        (u[7] & 0xffff0000) ^
        (u[7] >>> 16));

    // 61 rounds of LFSR, mixing up hash
    this.hash[0] =
      (v[0] & 0xffff0000) ^
      (v[0] << 16) ^
      (v[0] >>> 16) ^
      (v[1] >>> 16) ^
      (v[1] & 0xffff0000) ^
      (v[2] << 16) ^
      (v[3] >>> 16) ^
      (v[4] << 16) ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] >>> 16) ^
      (v[7] << 16) ^
      (v[7] >>> 16) ^
      (v[7] & 0xffff);
    this.hash[1] =
      (v[0] << 16) ^
      (v[0] >>> 16) ^
      (v[0] & 0xffff0000) ^
      (v[1] & 0xffff) ^
      v[2] ^
      (v[2] >>> 16) ^
      (v[3] << 16) ^
      (v[4] >>> 16) ^
      (v[5] << 16) ^
      (v[6] << 16) ^
      v[6] ^
      (v[7] & 0xffff0000) ^
      (v[7] >>> 16);
    this.hash[2] =
      (v[0] & 0xffff) ^
      (v[0] << 16) ^
      (v[1] << 16) ^
      (v[1] >>> 16) ^
      (v[1] & 0xffff0000) ^
      (v[2] << 16) ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      (v[5] >>> 16) ^
      v[6] ^
      (v[6] >>> 16) ^
      (v[7] & 0xffff) ^
      (v[7] << 16) ^
      (v[7] >>> 16);
    this.hash[3] =
      (v[0] << 16) ^
      (v[0] >>> 16) ^
      (v[0] & 0xffff0000) ^
      (v[1] & 0xffff0000) ^
      (v[1] >>> 16) ^
      (v[2] << 16) ^
      (v[2] >>> 16) ^
      v[2] ^
      (v[3] << 16) ^
      (v[4] >>> 16) ^
      v[4] ^
      (v[5] << 16) ^
      (v[6] << 16) ^
      (v[7] & 0xffff) ^
      (v[7] >>> 16);
    this.hash[4] =
      (v[0] >>> 16) ^
      (v[1] << 16) ^
      v[1] ^
      (v[2] >>> 16) ^
      v[2] ^
      (v[3] << 16) ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      (v[7] << 16);
    this.hash[5] =
      (v[0] << 16) ^
      (v[0] & 0xffff0000) ^
      (v[1] << 16) ^
      (v[1] >>> 16) ^
      (v[1] & 0xffff0000) ^
      (v[2] << 16) ^
      v[2] ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      (v[4] >>> 16) ^
      v[4] ^
      (v[5] << 16) ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      v[6] ^
      (v[7] << 16) ^
      (v[7] >>> 16) ^
      (v[7] & 0xffff0000);
    this.hash[6] =
      v[0] ^
      v[2] ^
      (v[2] >>> 16) ^
      v[3] ^
      (v[3] << 16) ^
      v[4] ^
      (v[4] >>> 16) ^
      (v[5] << 16) ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      v[6] ^
      (v[7] << 16) ^
      v[7];
    this.hash[7] =
      v[0] ^
      (v[0] >>> 16) ^
      (v[1] << 16) ^
      (v[1] >>> 16) ^
      (v[2] << 16) ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      v[4] ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      (v[7] << 16) ^
      v[7];
  }

  /**
   * Update block sum and message hash
   */
  private gostComputeSumAndHash(block: number[]): void {
    // Compute the 256-bit sum
    let carry = 0;
    let hb = 0;

    for (let i = 0; i < 8; i++) {
      hb = this.sum[i] >>> 24;
      this.sum[i] =
        (this.sum[i] & 0x00ffffff) + (block[i] & 0x00ffffff) + carry;
      hb = hb + (block[i] >>> 24) + (this.sum[i] >>> 24);
      this.sum[i] = (this.sum[i] & 0x00ffffff) | ((hb & 0xff) << 24);
      carry = (hb & 0x100) !== 0 ? 1 : 0;
    }
    // Update message hash
    this.gostBlockCompress(block);
  }

  /**
   * Calculate message hash - can be called repeatedly with chunks
   */
  private gostUpdate(msg: number[], size: number): void {
    const index = this.length & 31;
    let pmsg = 0;
    let currentSize = size;
    const msg32 = new Array(8);

    this.length += currentSize;

    // Fill partial block
    if (index !== 0) {
      const left = 32 - index;
      if (currentSize < left) {
        for (let i = 0; i < currentSize; i++) {
          this.message[index + i] = msg[i];
        }
        return;
      } else {
        for (let i = 0; i < left; i++) {
          this.message[index + i] = msg[i];
        }
      }

      // Process partial block
      for (let i = 0; i < 8; i++) {
        msg32[i] =
          (this.message[4 * i] & 0xff) |
          ((this.message[4 * i + 1] & 0xff) << 8) |
          ((this.message[4 * i + 2] & 0xff) << 16) |
          ((this.message[4 * i + 3] & 0xff) << 24);
      }
      this.gostComputeSumAndHash(msg32);
      pmsg += left;
      currentSize -= left;
    }

    while (currentSize >= 32) {
      for (let i = 0; i < 8; i++) {
        this.message[4 * i] = msg[pmsg + 4 * i];
        this.message[4 * i + 1] = msg[pmsg + 4 * i + 1];
        this.message[4 * i + 2] = msg[pmsg + 4 * i + 2];
        this.message[4 * i + 3] = msg[pmsg + 4 * i + 3];
        msg32[i] =
          (this.message[4 * i] & 0xff) |
          ((this.message[4 * i + 1] & 0xff) << 8) |
          ((this.message[4 * i + 2] & 0xff) << 16) |
          ((this.message[4 * i + 3] & 0xff) << 24);
      }
      this.gostComputeSumAndHash(msg32);
      pmsg += 32;
      currentSize -= 32;
    }

    if (currentSize !== 0) {
      for (let i = 0; i < currentSize; i++) {
        this.message[i] = msg[pmsg + i];
      }
    }
  }

  /**
   * Finish hashing and compute final digest
   */
  private gostFinal(): void {
    const index = this.length & 31;
    const msg32 = new Array(8);

    // Pad the last block with zeroes and hash it
    if (index > 0) {
      for (let i = 0; i < 32 - index; i++) {
        this.message[index + i] = 0;
      }
      for (let i = 0; i < 8; i++) {
        msg32[i] =
          (this.message[4 * i] & 0xff) |
          ((this.message[4 * i + 1] & 0xff) << 8) |
          ((this.message[4 * i + 2] & 0xff) << 16) |
          ((this.message[4 * i + 3] & 0xff) << 24);
      }
      this.gostComputeSumAndHash(msg32);
    }

    // Hash the message length and the sum
    msg32[0] = this.length << 3;
    msg32[1] = this.length >>> 29;
    for (let i = 2; i < 8; i++) {
      msg32[i] = 0;
    }

    this.gostBlockCompress(msg32);
    this.gostBlockCompress(this.sum);
  }

  /**
   * Initialize the lookup tables
   */
  private gostInitTable(): void {
    for (let i = 0, a = 0; a < 16; a++) {
      const ax = this.sbox[1][a] << 15;
      const bx = this.sbox[3][a] << 23;
      const cx = this.rol(this.sbox[5][a], 31);
      const dx = this.sbox[7][a] << 7;

      for (let b = 0; b < 16; b++, i++) {
        this.gostSbox[0][i] = ax | (this.sbox[0][b] << 11);
        this.gostSbox[1][i] = bx | (this.sbox[2][b] << 19);
        this.gostSbox[2][i] = cx | (this.sbox[4][b] << 27);
        this.gostSbox[3][i] = dx | (this.sbox[6][b] << 3);
      }
    }
  }

  /**
   * Calculate GOST hash from a string
   *
   * @param value - Input string to hash
   * @returns Hash as lowercase hexadecimal string (64 characters)
   *
   * @example
   * ```typescript
   * const hasher = new GostHash()
   * hasher.gosthash('message digest')
   * // Returns: 'bc6041dd2aa401ebfa6e9886734174febdb4729aa972d60f549ac39b29721ba0'
   * ```
   */
  gosthash(value: string): string {
    const rx = new Array(8);
    const x = this.str2bytes(Utf8.encode(value));
    this.gostInit();
    this.gostInitTable();
    this.gostUpdate(x, x.length);
    this.gostFinal();
    for (let i = 0; i < 8; i++) {
      rx[i] =
        this.ch2hex(this.hash[i] & 0xff) +
        this.ch2hex((this.hash[i] >>> 8) & 0xff) +
        this.ch2hex((this.hash[i] >>> 16) & 0xff) +
        this.ch2hex((this.hash[i] >>> 24) & 0xff);
    }
    return rx.join("");
  }

  /**
   * Calculate GOST hash from a hexadecimal string
   *
   * @param hex - Input hex string to hash
   * @returns Hash as lowercase hexadecimal string (64 characters)
   *
   * @example
   * ```typescript
   * const hasher = new GostHash()
   * hasher.gosthashHex('48656c6c6f') // "Hello" in hex
   * ```
   */
  gosthashHex(hex: string): string {
    const rx = new Array(8);
    const x = this.hexStr2bytes(hex);
    this.gostInit();
    this.gostInitTable();
    this.gostUpdate(x, x.length);
    this.gostFinal();
    for (let i = 0; i < 8; i++) {
      rx[i] =
        this.ch2hex(this.hash[i] & 0xff) +
        this.ch2hex((this.hash[i] >>> 8) & 0xff) +
        this.ch2hex((this.hash[i] >>> 16) & 0xff) +
        this.ch2hex((this.hash[i] >>> 24) & 0xff);
    }
    return rx.join("");
  }
}

/**
 * Result of signed attribute hash calculation
 */
export interface SignedAttributeHashResult {
  /** UTC time string in format YYMMDDhhmmssZ */
  utcTime: string;
  /** GOST hash of signed attributes */
  signedAttributesHash: string;
  /** GOST hash of the original text */
  textHash: string;
}

/**
 * PKCS#7 Signed Attribute Hash Calculator
 *
 * Calculates hashes for PKCS#7 signed attributes used in E-IMZO mobile signing.
 */
export class SignedAttributeHash {
  /**
   * Internal method to calculate PKCS signed attribute hash
   */
  private pkcsSignedAttributeHash(textHash: string): SignedAttributeHashResult {
    const hasher = new GostHash();
    const d = new Date();
    d.setHours(d.getHours() - 5);

    const yy = String(d.getFullYear() % 100).padStart(2, "0");
    const mn = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    const utcTimeStr = yy + mn + dd + hh + mm + ss + "Z";
    const utcTimeHex = hasher.toHex(utcTimeStr);

    const signedAttributes =
      "3169301806092a864886f70d010903310b06092a864886f70d010701301c06092a864886f70d010905310f170d" +
      utcTimeHex +
      "302f06092a864886f70d01090431220420" +
      textHash;

    return {
      utcTime: utcTimeStr,
      signedAttributesHash: hasher.gosthashHex(signedAttributes),
      textHash,
    };
  }

  /**
   * Calculate hash for text content
   *
   * @param text - Input text to hash
   * @returns Hash result with UTC time, signed attributes hash, and text hash
   */
  hash(text: string): SignedAttributeHashResult {
    const hasher = new GostHash();
    const textHash = hasher.gosthash(text);
    return this.pkcsSignedAttributeHash(textHash);
  }

  /**
   * Calculate hash for hex-encoded content
   *
   * @param hexText - Input hex string to hash
   * @returns Hash result with UTC time, signed attributes hash, and text hash
   */
  hashHex(hexText: string): SignedAttributeHashResult {
    const hasher = new GostHash();
    const textHash = hasher.gosthashHex(hexText);
    return this.pkcsSignedAttributeHash(textHash);
  }
}

/**
 * GOST R 34.11-94 test vectors from Wikipedia
 * @see https://ru.wikipedia.org/wiki/ГОСТ_Р_34.11-94
 */
export const GOST_TEST_VECTORS: ReadonlyArray<{
  hash: string;
  text: string;
}> = [
  {
    hash: "981E5F3CA30C841487830F84FB433E13AC1101569B9C13584AC483234CD656C0",
    text: "",
  },
  {
    hash: "E74C52DD282183BF37AF0079C9F78055715A103F17E3133CEFF1AACF2F403011",
    text: "a",
  },
  {
    hash: "B285056DBF18D7392D7677369524DD14747459ED8143997E163B2986F92FD42C",
    text: "abc",
  },
  {
    hash: "BC6041DD2AA401EBFA6E9886734174FEBDB4729AA972D60F549AC39B29721BA0",
    text: "message digest",
  },
  {
    hash: "9004294A361A508C586FE53D1F1B02746765E71B765472786E4770D565830A76",
    text: "The quick brown fox jumps over the lazy dog",
  },
  {
    hash: "2CEFC2F7B7BDC514E18EA57FA74FF357E7FA17D652C75F69CB1BE7893EDE48EB",
    text: "This is message, length=32 bytes",
  },
  {
    hash: "C3730C5CBCCACF915AC292676F21E8BD4EF75331D9405E5F1A61DC3130A65011",
    text: "Suppose the original message has length = 50 bytes",
  },
];

/**
 * Convenience function to calculate GOST hash from a string
 */
export function gosthash(value: string): string {
  return new GostHash().gosthash(value);
}

/**
 * Convenience function to calculate GOST hash from a hex string
 */
export function gosthashHex(hex: string): string {
  return new GostHash().gosthashHex(hex);
}

export default GostHash;
