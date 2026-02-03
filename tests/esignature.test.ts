/**
 * ESignature Tests
 *
 * Tests for the main ESignature class.
 * Uses mocked CAPIWS to avoid requiring actual E-IMZO installation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ESignature } from "../src/core/eimzo";
import { mockPfxCertificate, mockFtjcCertificate } from "./mocks/capiws.mock";

// Mock the EIMZOClient module
vi.mock("../src/core/client", () => ({
  EIMZOClient: {
    API_KEYS: [],
    NEW_API: true,
    NEW_API2: true,
    NEW_API3: true,
    checkVersion: vi.fn(),
    installApiKeys: vi.fn(),
    listAllUserKeys: vi.fn(),
    loadKey: vi.fn(),
    createPkcs7: vi.fn(),
    changeKeyPassword: vi.fn(),
    idCardIsPLuggedIn: vi.fn(),
    isBAIKTokenPLuggedIn: vi.fn(),
    isCKCPLuggedIn: vi.fn(),
  },
}));

import { EIMZOClient } from "../src/core/client";

describe("ESignature", () => {
  let esignature: ESignature;

  beforeEach(() => {
    esignature = new ESignature();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with default API keys", () => {
      expect(esignature.apiKeys).toContain("localhost");
      expect(esignature.apiKeys).toContain("127.0.0.1");
    });

    it("should have null loadedKey initially", () => {
      expect(esignature.loadedKey).toBeNull();
    });
  });

  describe("addApiKey", () => {
    it("should add new domain and key", () => {
      esignature.addApiKey("example.com", "key123");
      expect(esignature.apiKeys).toContain("example.com");
      expect(esignature.apiKeys).toContain("key123");
    });

    it("should not add duplicate domain", () => {
      const initialLength = esignature.apiKeys.length;
      esignature.addApiKey("localhost", "newkey");
      expect(esignature.apiKeys.length).toBe(initialLength);
    });
  });

  describe("checkVersion", () => {
    it("should resolve with version info on success", async () => {
      vi.mocked(EIMZOClient.checkVersion).mockImplementation(
        (success, _fail) => {
          success("3", "40");
        }
      );

      const result = await esignature.checkVersion();
      expect(result).toEqual({ major: 3, minor: 40 });
    });

    it("should reject with UPDATE_APP error if version is too old", async () => {
      vi.mocked(EIMZOClient.checkVersion).mockImplementation(
        (success, _fail) => {
          success("2", "0");
        }
      );

      await expect(esignature.checkVersion()).rejects.toThrow();
    });

    it("should reject with error message on failure", async () => {
      vi.mocked(EIMZOClient.checkVersion).mockImplementation(
        (_success, fail) => {
          fail(new Error("Connection failed"), "Connection failed");
        }
      );

      await expect(esignature.checkVersion()).rejects.toThrow(
        "Connection failed"
      );
    });

    it("should reject with CAPIWS_CONNECTION on null error", async () => {
      vi.mocked(EIMZOClient.checkVersion).mockImplementation(
        (_success, fail) => {
          fail(null, null);
        }
      );

      await expect(esignature.checkVersion()).rejects.toThrow();
    });
  });

  describe("installApiKeys", () => {
    it("should resolve on success", async () => {
      vi.mocked(EIMZOClient.installApiKeys).mockImplementation(
        (success, _fail) => {
          success();
        }
      );

      await expect(esignature.installApiKeys()).resolves.toBeUndefined();
    });

    it("should reject on failure", async () => {
      vi.mocked(EIMZOClient.installApiKeys).mockImplementation(
        (_success, fail) => {
          fail();
        }
      );

      await expect(esignature.installApiKeys()).rejects.toThrow();
    });
  });

  describe("listAllUserKeys", () => {
    it("should resolve with certificates on success", async () => {
      vi.mocked(EIMZOClient.listAllUserKeys).mockImplementation(
        (_idGen, _uiGen, success, _fail) => {
          success([mockPfxCertificate, mockFtjcCertificate], "cert-0");
        }
      );

      const result = await esignature.listAllUserKeys();
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("pfx");
      expect(result[1].type).toBe("ftjc");
    });

    it("should reject on failure", async () => {
      vi.mocked(EIMZOClient.listAllUserKeys).mockImplementation(
        (_idGen, _uiGen, _success, fail) => {
          fail(new Error("Failed"), "Failed to list keys");
        }
      );

      await expect(esignature.listAllUserKeys()).rejects.toThrow(
        "Failed to list keys"
      );
    });
  });

  describe("loadKey", () => {
    it("should resolve with key ID and certificate on success", async () => {
      vi.mocked(EIMZOClient.loadKey).mockImplementation(
        (_cert, success, _fail) => {
          success("key-123");
        }
      );

      const result = await esignature.loadKey(mockPfxCertificate);
      expect(result.id).toBe("key-123");
      expect(result.cert).toBe(mockPfxCertificate);
    });

    it("should set loadedKey on success", async () => {
      vi.mocked(EIMZOClient.loadKey).mockImplementation(
        (_cert, success, _fail) => {
          success("key-123");
        }
      );

      await esignature.loadKey(mockPfxCertificate);
      expect(esignature.loadedKey).toBe(mockPfxCertificate);
    });

    it("should reject with WRONG_PASSWORD on BadPaddingException", async () => {
      vi.mocked(EIMZOClient.loadKey).mockImplementation(
        (_cert, _success, fail) => {
          fail(new Error("BadPaddingException"), "BadPaddingException");
        }
      );

      await expect(esignature.loadKey(mockPfxCertificate)).rejects.toThrow(
        "password"
      );
    });

    it("should reject with error message on other errors", async () => {
      vi.mocked(EIMZOClient.loadKey).mockImplementation(
        (_cert, _success, fail) => {
          fail(new Error("Other error"), "Some other error");
        }
      );

      await expect(esignature.loadKey(mockPfxCertificate)).rejects.toThrow(
        "Some other error"
      );
    });

    it("should reject with BROWSER_WS on null error", async () => {
      vi.mocked(EIMZOClient.loadKey).mockImplementation(
        (_cert, _success, fail) => {
          fail(null, null);
        }
      );

      await expect(esignature.loadKey(mockPfxCertificate)).rejects.toThrow();
    });
  });

  describe("createPkcs7", () => {
    it("should resolve with pkcs7 on success", async () => {
      const mockPkcs7 = "base64-pkcs7-signature";
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, success, _fail) => {
          success(mockPkcs7);
        }
      );

      const result = await esignature.createPkcs7("key-123", "data to sign");
      expect(result).toBe(mockPkcs7);
    });

    it("should reject with WRONG_PASSWORD on BadPaddingException", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("BadPaddingException"), "BadPaddingException");
        }
      );

      await expect(esignature.createPkcs7("key-123", "data")).rejects.toThrow(
        "password"
      );
    });

    it("should reject with error message on other errors", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("Signing error"), "Certificate expired");
        }
      );

      await expect(esignature.createPkcs7("key-123", "data")).rejects.toThrow(
        "Certificate expired"
      );
    });

    it("should reject with BROWSER_WS on null error", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(null, null);
        }
      );

      await expect(esignature.createPkcs7("key-123", "data")).rejects.toThrow();
    });
  });

  describe("appendPkcs7Attached", () => {
    it("should resolve with pkcs7 on success", async () => {
      const mockPkcs7 = "attached-pkcs7-signature";
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, success, _fail) => {
          success(mockPkcs7);
        }
      );

      const result = await esignature.appendPkcs7Attached(
        "key-123",
        "data to sign"
      );
      expect(result).toBe(mockPkcs7);
    });

    it("should reject with WRONG_PASSWORD on BadPaddingException", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("BadPaddingException"), "BadPaddingException");
        }
      );

      await expect(
        esignature.appendPkcs7Attached("key-123", "data")
      ).rejects.toThrow("password");
    });

    it("should reject with error message on other errors", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("Append error"), "Failed to append signature");
        }
      );

      await expect(
        esignature.appendPkcs7Attached("key-123", "data")
      ).rejects.toThrow("Failed to append signature");
    });

    it("should reject with BROWSER_WS on null error", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(null, null);
        }
      );

      await expect(
        esignature.appendPkcs7Attached("key-123", "data")
      ).rejects.toThrow();
    });
  });

  describe("isIDCardPlugged", () => {
    it("should resolve with true when plugged in", async () => {
      vi.mocked(EIMZOClient.idCardIsPLuggedIn).mockImplementation(
        (success, _fail) => {
          success(true);
        }
      );

      const result = await esignature.isIDCardPlugged();
      expect(result).toBe(true);
    });

    it("should resolve with false when not plugged in", async () => {
      vi.mocked(EIMZOClient.idCardIsPLuggedIn).mockImplementation(
        (success, _fail) => {
          success(false);
        }
      );

      const result = await esignature.isIDCardPlugged();
      expect(result).toBe(false);
    });

    it("should reject on failure", async () => {
      vi.mocked(EIMZOClient.idCardIsPLuggedIn).mockImplementation(
        (_success, fail) => {
          fail(new Error("Reader not found"));
        }
      );

      await expect(esignature.isIDCardPlugged()).rejects.toThrow();
    });
  });

  describe("isBAIKTokenPlugged", () => {
    it("should resolve with boolean", async () => {
      vi.mocked(EIMZOClient.isBAIKTokenPLuggedIn).mockImplementation(
        (success, _fail) => {
          success(true);
        }
      );

      const result = await esignature.isBAIKTokenPlugged();
      expect(result).toBe(true);
    });

    it("should reject on failure", async () => {
      vi.mocked(EIMZOClient.isBAIKTokenPLuggedIn).mockImplementation(
        (_success, fail) => {
          fail(new Error("Token not found"));
        }
      );

      await expect(esignature.isBAIKTokenPlugged()).rejects.toThrow();
    });
  });

  describe("isCKCPlugged", () => {
    it("should resolve with boolean", async () => {
      vi.mocked(EIMZOClient.isCKCPLuggedIn).mockImplementation(
        (success, _fail) => {
          success(false);
        }
      );

      const result = await esignature.isCKCPlugged();
      expect(result).toBe(false);
    });

    it("should reject on failure", async () => {
      vi.mocked(EIMZOClient.isCKCPLuggedIn).mockImplementation(
        (_success, fail) => {
          fail(new Error("CKC not found"));
        }
      );

      await expect(esignature.isCKCPlugged()).rejects.toThrow();
    });
  });

  describe("changeKeyPassword", () => {
    it("should resolve on success", async () => {
      vi.mocked(EIMZOClient.changeKeyPassword).mockImplementation(
        (_cert, success, _fail) => {
          success();
        }
      );

      await expect(
        esignature.changeKeyPassword(mockPfxCertificate)
      ).resolves.toBeUndefined();
    });

    it("should reject on failure", async () => {
      vi.mocked(EIMZOClient.changeKeyPassword).mockImplementation(
        (_cert, _success, fail) => {
          fail(new Error("Password change failed"));
        }
      );

      await expect(
        esignature.changeKeyPassword(mockPfxCertificate)
      ).rejects.toThrow();
    });
  });

  describe("signWithUSB", () => {
    it("should create pkcs7 with 'idcard' keyId", async () => {
      const mockPkcs7 = "usb-pkcs7-signature";
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (id, _data, _ts, success, _fail) => {
          expect(id).toBe("idcard");
          success(mockPkcs7);
        }
      );

      const result = await esignature.signWithUSB("data");
      expect(result).toBe(mockPkcs7);
    });

    it("should reject with WRONG_PASSWORD on BadPaddingException", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("BadPaddingException"), "BadPaddingException");
        }
      );

      await expect(esignature.signWithUSB("data")).rejects.toThrow("password");
    });

    it("should reject with error message on other errors", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("Device error"), "USB device not responding");
        }
      );

      await expect(esignature.signWithUSB("data")).rejects.toThrow(
        "USB device not responding"
      );
    });

    it("should reject with BROWSER_WS on null error", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(null, null);
        }
      );

      await expect(esignature.signWithUSB("data")).rejects.toThrow();
    });
  });

  describe("signWithBAIK", () => {
    it("should create pkcs7 with 'baikey' keyId", async () => {
      const mockPkcs7 = "baik-pkcs7-signature";
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (id, _data, _ts, success, _fail) => {
          expect(id).toBe("baikey");
          success(mockPkcs7);
        }
      );

      const result = await esignature.signWithBAIK("data");
      expect(result).toBe(mockPkcs7);
    });

    it("should reject with WRONG_PASSWORD on BadPaddingException", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("BadPaddingException"), "BadPaddingException");
        }
      );

      await expect(esignature.signWithBAIK("data")).rejects.toThrow("password");
    });

    it("should reject with error message on other errors", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("Token error"), "BAIK token not found");
        }
      );

      await expect(esignature.signWithBAIK("data")).rejects.toThrow(
        "BAIK token not found"
      );
    });

    it("should reject with BROWSER_WS on null error", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(null, null);
        }
      );

      await expect(esignature.signWithBAIK("data")).rejects.toThrow();
    });
  });

  describe("signWithCKC", () => {
    it("should create pkcs7 with 'ckc' keyId", async () => {
      const mockPkcs7 = "ckc-pkcs7-signature";
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (id, _data, _ts, success, _fail) => {
          expect(id).toBe("ckc");
          success(mockPkcs7);
        }
      );

      const result = await esignature.signWithCKC("data");
      expect(result).toBe(mockPkcs7);
    });

    it("should reject with WRONG_PASSWORD on BadPaddingException", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("BadPaddingException"), "BadPaddingException");
        }
      );

      await expect(esignature.signWithCKC("data")).rejects.toThrow("password");
    });

    it("should reject with error message on other errors", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(new Error("CKC error"), "CKC device not connected");
        }
      );

      await expect(esignature.signWithCKC("data")).rejects.toThrow(
        "CKC device not connected"
      );
    });

    it("should reject with BROWSER_WS on null error", async () => {
      vi.mocked(EIMZOClient.createPkcs7).mockImplementation(
        (_id, _data, _ts, _success, fail) => {
          fail(null, null);
        }
      );

      await expect(esignature.signWithCKC("data")).rejects.toThrow();
    });
  });

  describe("install", () => {
    it("should check version and install API keys", async () => {
      vi.mocked(EIMZOClient.checkVersion).mockImplementation(
        (success, _fail) => {
          success("3", "40");
        }
      );
      vi.mocked(EIMZOClient.installApiKeys).mockImplementation(
        (success, _fail) => {
          success();
        }
      );

      await esignature.install();

      expect(EIMZOClient.checkVersion).toHaveBeenCalled();
      expect(EIMZOClient.installApiKeys).toHaveBeenCalled();
      expect(EIMZOClient.API_KEYS).toEqual(esignature.apiKeys);
    });

    it("should reject if version check fails", async () => {
      vi.mocked(EIMZOClient.checkVersion).mockImplementation(
        (_success, fail) => {
          fail(new Error("Connection error"), "Connection error");
        }
      );

      await expect(esignature.install()).rejects.toThrow();
    });
  });

  describe("loadedKey getter/setter", () => {
    it("should get and set loadedKey", () => {
      expect(esignature.loadedKey).toBeNull();
      esignature.loadedKey = mockPfxCertificate;
      expect(esignature.loadedKey).toBe(mockPfxCertificate);
    });
  });
});
