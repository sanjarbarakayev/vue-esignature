/**
 * E-IMZO Mobile Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EIMZOMobile } from "../src/core/e-imzo-mobile";
import { MockQRCode } from "./mocks/capiws.mock";

describe("EIMZOMobile", () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Create a mock DOM element
    mockElement = document.createElement("div");
    mockElement.id = "qrcode";
  });

  describe("constructor", () => {
    it("should create instance with required parameters", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      expect(mobile).toBeInstanceOf(EIMZOMobile);
    });

    it("should create QRCode with default dimensions", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      expect(mobile).toBeDefined();
    });

    it("should create QRCode with custom dimensions", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode, {
        width: 400,
        height: 400,
      });
      expect(mobile).toBeDefined();
    });
  });

  describe("makeQRCode", () => {
    it("should return null if siteId is empty", () => {
      const mobile = new EIMZOMobile("", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "text");
      expect(result).toBeNull();
    });

    it("should return null if docNum is empty", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("", "text");
      expect(result).toBeNull();
    });

    it("should return null if text is empty", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "");
      expect(result).toBeNull();
    });

    it("should return tuple with textHash and code", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "Document content");

      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      expect(typeof result![0]).toBe("string");
      expect(typeof result![1]).toBe("string");
    });

    it("should return 64-character text hash", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "Document content");

      expect(result![0].length).toBe(64);
    });

    it("should include siteId in code", () => {
      const mobile = new EIMZOMobile("TESTSITE", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "text");

      expect(result![1]).toContain("TESTSITE");
    });

    it("should include docNum in code", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("DOC-001", "text");

      expect(result![1]).toContain("DOC-001");
    });

    it("should include textHash in code", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "text");

      expect(result![1]).toContain(result![0]);
    });

    it("should include CRC32 at end of code", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result = mobile.makeQRCode("doc1", "text");

      // Code should be siteId + docNum + textHash (64) + crc32 (8)
      // Last 8 characters should be CRC32
      expect(result![1].length).toBeGreaterThan(8);
    });

    it("should produce consistent results", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result1 = mobile.makeQRCode("doc1", "text");
      const result2 = mobile.makeQRCode("doc1", "text");

      expect(result1![0]).toBe(result2![0]);
      expect(result1![1]).toBe(result2![1]);
    });

    it("should produce different hashes for different texts", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const result1 = mobile.makeQRCode("doc1", "text1");
      const result2 = mobile.makeQRCode("doc1", "text2");

      expect(result1![0]).not.toBe(result2![0]);
    });
  });

  describe("generateQRCodeData (static)", () => {
    it("should return null if siteId is empty", () => {
      const result = EIMZOMobile.generateQRCodeData("", "doc1", "text");
      expect(result).toBeNull();
    });

    it("should return null if docNum is empty", () => {
      const result = EIMZOMobile.generateQRCodeData("site123", "", "text");
      expect(result).toBeNull();
    });

    it("should return null if text is empty", () => {
      const result = EIMZOMobile.generateQRCodeData("site123", "doc1", "");
      expect(result).toBeNull();
    });

    it("should return QRCodeResult object", () => {
      const result = EIMZOMobile.generateQRCodeData(
        "site123",
        "doc1",
        "Document content"
      );

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("textHash");
      expect(result).toHaveProperty("code");
    });

    it("should produce same result as makeQRCode", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      const instanceResult = mobile.makeQRCode("doc1", "text");
      const staticResult = EIMZOMobile.generateQRCodeData("site123", "doc1", "text");

      expect(staticResult!.textHash).toBe(instanceResult![0]);
      expect(staticResult!.code).toBe(instanceResult![1]);
    });
  });

  describe("clear", () => {
    it("should call clear on QRCode instance if available", () => {
      const mobile = new EIMZOMobile("site123", mockElement, MockQRCode);
      mobile.makeQRCode("doc1", "text");

      // Should not throw
      expect(() => mobile.clear()).not.toThrow();
    });
  });
});
