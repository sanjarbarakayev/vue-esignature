/**
 * GOST R 34.11-94 Hash Tests
 */

import { describe, it, expect } from "vitest";
import {
  GostHash,
  SignedAttributeHash,
  Utf8,
  gosthash,
  gosthashHex,
  GOST_TEST_VECTORS,
} from "../src/core/gost-hash";

describe("Utf8", () => {
  describe("encode", () => {
    it("should encode ASCII characters unchanged", () => {
      expect(Utf8.encode("Hello")).toBe("Hello");
    });

    it("should encode 2-byte UTF-8 characters", () => {
      // Cyrillic characters require 2 bytes
      const encoded = Utf8.encode("й");
      expect(encoded.length).toBeGreaterThan(1);
    });

    it("should encode 3-byte UTF-8 characters", () => {
      // Chinese characters require 3 bytes
      const encoded = Utf8.encode("中");
      expect(encoded.length).toBe(3);
    });
  });

  describe("decode", () => {
    it("should decode ASCII characters unchanged", () => {
      expect(Utf8.decode("Hello")).toBe("Hello");
    });

    it("should roundtrip encode/decode", () => {
      const original = "Привет мир 中文";
      const encoded = Utf8.encode(original);
      const decoded = Utf8.decode(encoded);
      expect(decoded).toBe(original);
    });
  });
});

describe("GostHash", () => {
  describe("gosthash", () => {
    it("should produce 64 character hex output", () => {
      const hasher = new GostHash();
      const result = hasher.gosthash("test");
      expect(result.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    it("should produce consistent results", () => {
      const hasher = new GostHash();
      const result1 = hasher.gosthash("test input");
      const result2 = hasher.gosthash("test input");
      expect(result1).toBe(result2);
    });

    it("should produce different hashes for different inputs", () => {
      const hasher = new GostHash();
      const result1 = hasher.gosthash("input1");
      const result2 = hasher.gosthash("input2");
      expect(result1).not.toBe(result2);
    });

    it("should pass GOST test vectors", () => {
      const hasher = new GostHash();

      for (const vector of GOST_TEST_VECTORS) {
        const calculated = hasher.gosthash(vector.text).toUpperCase();
        expect(calculated).toBe(vector.hash);
      }
    });

    it("should hash empty string correctly", () => {
      const hasher = new GostHash();
      const result = hasher.gosthash("").toUpperCase();
      expect(result).toBe(
        "981E5F3CA30C841487830F84FB433E13AC1101569B9C13584AC483234CD656C0"
      );
    });

    it("should hash 'a' correctly", () => {
      const hasher = new GostHash();
      const result = hasher.gosthash("a").toUpperCase();
      expect(result).toBe(
        "E74C52DD282183BF37AF0079C9F78055715A103F17E3133CEFF1AACF2F403011"
      );
    });

    it("should hash 'abc' correctly", () => {
      const hasher = new GostHash();
      const result = hasher.gosthash("abc").toUpperCase();
      expect(result).toBe(
        "B285056DBF18D7392D7677369524DD14747459ED8143997E163B2986F92FD42C"
      );
    });

    it("should hash 'message digest' correctly", () => {
      const hasher = new GostHash();
      const result = hasher.gosthash("message digest").toUpperCase();
      expect(result).toBe(
        "BC6041DD2AA401EBFA6E9886734174FEBDB4729AA972D60F549AC39B29721BA0"
      );
    });
  });

  describe("gosthashHex", () => {
    it("should produce 64 character hex output", () => {
      const hasher = new GostHash();
      const result = hasher.gosthashHex("48656c6c6f");
      expect(result.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    it("should produce consistent results", () => {
      const hasher = new GostHash();
      const result1 = hasher.gosthashHex("48656c6c6f");
      const result2 = hasher.gosthashHex("48656c6c6f");
      expect(result1).toBe(result2);
    });

    it("should hash hex-encoded 32-byte message correctly", () => {
      const hasher = new GostHash();
      // "This is message, length=32 bytes" in hex
      const hexInput =
        "54686973206973206d6573736167652c206c656e6774683d3332206279746573";
      const result = hasher.gosthashHex(hexInput).toUpperCase();
      expect(result).toBe(
        "2CEFC2F7B7BDC514E18EA57FA74FF357E7FA17D652C75F69CB1BE7893EDE48EB"
      );
    });
  });

  describe("toHex", () => {
    it("should convert string to hex", () => {
      const hasher = new GostHash();
      const result = hasher.toHex("A");
      expect(result).toBe("41"); // ASCII code for 'A' is 65 (0x41)
    });

    it("should handle multiple characters", () => {
      const hasher = new GostHash();
      const result = hasher.toHex("AB");
      expect(result).toBe("4142");
    });
  });

  describe("convenience functions", () => {
    it("gosthash should work like GostHash.gosthash", () => {
      const result1 = gosthash("test");
      const hasher = new GostHash();
      const result2 = hasher.gosthash("test");
      expect(result1).toBe(result2);
    });

    it("gosthashHex should work like GostHash.gosthashHex", () => {
      const result1 = gosthashHex("48656c6c6f");
      const hasher = new GostHash();
      const result2 = hasher.gosthashHex("48656c6c6f");
      expect(result1).toBe(result2);
    });
  });
});

describe("SignedAttributeHash", () => {
  describe("hash", () => {
    it("should return an object with utcTime, signedAttributesHash, and textHash", () => {
      const sah = new SignedAttributeHash();
      const result = sah.hash("test document");

      expect(result).toHaveProperty("utcTime");
      expect(result).toHaveProperty("signedAttributesHash");
      expect(result).toHaveProperty("textHash");
    });

    it("should return proper UTC time format", () => {
      const sah = new SignedAttributeHash();
      const result = sah.hash("test");

      // Format: YYMMDDhhmmssZ
      expect(result.utcTime).toMatch(/^\d{12}Z$/);
    });

    it("should return 64 character hashes", () => {
      const sah = new SignedAttributeHash();
      const result = sah.hash("test");

      expect(result.textHash.length).toBe(64);
      expect(result.signedAttributesHash.length).toBe(64);
    });

    it("should produce consistent textHash for same input", () => {
      const sah = new SignedAttributeHash();
      const hasher = new GostHash();

      const result = sah.hash("test document");
      const directHash = hasher.gosthash("test document");

      expect(result.textHash).toBe(directHash);
    });
  });

  describe("hashHex", () => {
    it("should return an object with utcTime, signedAttributesHash, and textHash", () => {
      const sah = new SignedAttributeHash();
      const result = sah.hashHex("48656c6c6f");

      expect(result).toHaveProperty("utcTime");
      expect(result).toHaveProperty("signedAttributesHash");
      expect(result).toHaveProperty("textHash");
    });

    it("should return 64 character hashes", () => {
      const sah = new SignedAttributeHash();
      const result = sah.hashHex("48656c6c6f");

      expect(result.textHash.length).toBe(64);
      expect(result.signedAttributesHash.length).toBe(64);
    });

    it("should produce consistent textHash for same input", () => {
      const sah = new SignedAttributeHash();
      const hasher = new GostHash();

      const result = sah.hashHex("48656c6c6f");
      const directHash = hasher.gosthashHex("48656c6c6f");

      expect(result.textHash).toBe(directHash);
    });
  });
});

describe("GOST_TEST_VECTORS", () => {
  it("should have 7 test vectors", () => {
    expect(GOST_TEST_VECTORS.length).toBe(7);
  });

  it("each vector should have hash and text properties", () => {
    for (const vector of GOST_TEST_VECTORS) {
      expect(vector).toHaveProperty("hash");
      expect(vector).toHaveProperty("text");
      expect(typeof vector.hash).toBe("string");
      expect(typeof vector.text).toBe("string");
    }
  });

  it("each hash should be 64 characters", () => {
    for (const vector of GOST_TEST_VECTORS) {
      expect(vector.hash.length).toBe(64);
    }
  });
});
