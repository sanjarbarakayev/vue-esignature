/**
 * CRC32 Tests
 */

import { describe, it, expect } from "vitest";
import { CRC32, crc32, crc32Hex } from "../src/core/crc32";

describe("CRC32", () => {
  describe("calc", () => {
    it("should calculate CRC32 for empty string", () => {
      const crc = new CRC32();
      expect(crc.calc("")).toBe("0");
    });

    it("should calculate CRC32 for simple string", () => {
      const crc = new CRC32();
      // Known CRC32 values for common strings
      const result = crc.calc("test");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should calculate CRC32 for 'Hello World'", () => {
      const crc = new CRC32();
      const result = crc.calc("Hello World");
      expect(result).toBeDefined();
      // CRC32 for "Hello World" should be consistent
      expect(result).toBe("4a17b156");
    });

    it("should produce consistent results", () => {
      const crc = new CRC32();
      const input = "consistent input";
      const result1 = crc.calc(input);
      const result2 = crc.calc(input);
      expect(result1).toBe(result2);
    });

    it("should produce different results for different inputs", () => {
      const crc = new CRC32();
      const result1 = crc.calc("input1");
      const result2 = crc.calc("input2");
      expect(result1).not.toBe(result2);
    });
  });

  describe("calcHex", () => {
    it("should calculate CRC32 from hex string", () => {
      const crc = new CRC32();
      // "Hello" in hex is "48656c6c6f"
      const result = crc.calcHex("48656c6c6f");
      expect(result).toBeDefined();
      expect(result.length).toBe(8); // Always 8 characters (zero-padded)
    });

    it("should produce consistent results", () => {
      const crc = new CRC32();
      const hexInput = "48656c6c6f";
      const result1 = crc.calcHex(hexInput);
      const result2 = crc.calcHex(hexInput);
      expect(result1).toBe(result2);
    });

    it("should handle empty hex string", () => {
      const crc = new CRC32();
      const result = crc.calcHex("");
      expect(result.length).toBe(8);
    });

    it("should pad results to 8 characters", () => {
      const crc = new CRC32();
      const result = crc.calcHex("00");
      expect(result.length).toBe(8);
    });
  });

  describe("convenience functions", () => {
    it("crc32 should work like CRC32.calc", () => {
      const instance = new CRC32();
      const input = "test input";
      expect(crc32(input)).toBe(instance.calc(input));
    });

    it("crc32Hex should work like CRC32.calcHex", () => {
      const instance = new CRC32();
      const input = "48656c6c6f";
      expect(crc32Hex(input)).toBe(instance.calcHex(input));
    });
  });

  describe("edge cases", () => {
    it("should handle unicode characters", () => {
      const crc = new CRC32();
      const result = crc.calc("Привет мир");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle special characters", () => {
      const crc = new CRC32();
      const result = crc.calc("!@#$%^&*()");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle long strings", () => {
      const crc = new CRC32();
      const longString = "a".repeat(10000);
      const result = crc.calc(longString);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle newlines and tabs", () => {
      const crc = new CRC32();
      const result = crc.calc("line1\nline2\ttab");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });
});
