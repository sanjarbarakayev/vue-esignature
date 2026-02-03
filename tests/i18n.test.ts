/**
 * I18n Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  setLocale,
  getLocale,
  getErrorMessage,
  getSupportedLocales,
  isLocaleSupported,
  i18n,
} from "../src/i18n";

describe("i18n", () => {
  beforeEach(() => {
    // Reset to default locale before each test
    setLocale("en");
  });

  describe("setLocale / getLocale", () => {
    it("should default to 'en'", () => {
      expect(getLocale()).toBe("en");
    });

    it("should set locale to 'ru'", () => {
      setLocale("ru");
      expect(getLocale()).toBe("ru");
    });

    it("should set locale to 'uz'", () => {
      setLocale("uz");
      expect(getLocale()).toBe("uz");
    });

    it("should throw for unsupported locale", () => {
      expect(() => setLocale("fr" as any)).toThrow("Unsupported locale");
    });
  });

  describe("getErrorMessage", () => {
    it("should return English message by default", () => {
      const message = getErrorMessage("WRONG_PASSWORD");
      expect(message).toBe("Incorrect password.");
    });

    it("should return Russian message when locale is ru", () => {
      setLocale("ru");
      const message = getErrorMessage("WRONG_PASSWORD");
      expect(message).toBe("Пароль неверный.");
    });

    it("should return Uzbek message when locale is uz", () => {
      setLocale("uz");
      const message = getErrorMessage("WRONG_PASSWORD");
      expect(message).toBe("Parol noto'g'ri.");
    });

    it("should allow locale override parameter", () => {
      setLocale("en");
      const message = getErrorMessage("WRONG_PASSWORD", "ru");
      expect(message).toBe("Пароль неверный.");
    });

    it("should return key if message not found", () => {
      const message = getErrorMessage("NONEXISTENT_KEY" as any);
      expect(message).toBe("NONEXISTENT_KEY");
    });

    it("should return CAPIWS_CONNECTION message in English", () => {
      const message = getErrorMessage("CAPIWS_CONNECTION");
      expect(message).toContain("Connection error");
    });

    it("should return CAPIWS_CONNECTION message in Russian", () => {
      setLocale("ru");
      const message = getErrorMessage("CAPIWS_CONNECTION");
      expect(message).toContain("Ошибка соединения");
    });

    it("should return CAPIWS_CONNECTION message in Uzbek", () => {
      setLocale("uz");
      const message = getErrorMessage("CAPIWS_CONNECTION");
      expect(message).toContain("bog'lanishda xatolik");
    });

    it("should return UPDATE_APP message with download link", () => {
      const message = getErrorMessage("UPDATE_APP");
      expect(message).toContain("https://e-imzo.soliq.uz/download/");
    });
  });

  describe("getSupportedLocales", () => {
    it("should return array of supported locales", () => {
      const locales = getSupportedLocales();
      expect(locales).toEqual(["en", "ru", "uz"]);
    });
  });

  describe("isLocaleSupported", () => {
    it("should return true for 'en'", () => {
      expect(isLocaleSupported("en")).toBe(true);
    });

    it("should return true for 'ru'", () => {
      expect(isLocaleSupported("ru")).toBe(true);
    });

    it("should return true for 'uz'", () => {
      expect(isLocaleSupported("uz")).toBe(true);
    });

    it("should return false for unsupported locale", () => {
      expect(isLocaleSupported("fr")).toBe(false);
    });
  });

  describe("i18n object", () => {
    it("should have all methods", () => {
      expect(typeof i18n.setLocale).toBe("function");
      expect(typeof i18n.getLocale).toBe("function");
      expect(typeof i18n.getErrorMessage).toBe("function");
      expect(typeof i18n.getSupportedLocales).toBe("function");
      expect(typeof i18n.isLocaleSupported).toBe("function");
      expect(typeof i18n.detectAndSetBrowserLocale).toBe("function");
    });

    it("i18n methods should work the same as direct exports", () => {
      i18n.setLocale("ru");
      expect(i18n.getLocale()).toBe("ru");
      expect(i18n.getErrorMessage("WRONG_PASSWORD")).toBe("Пароль неверный.");
    });
  });

  describe("all error message keys", () => {
    const messageKeys = [
      "ERIIMZO_NOT_INSTALLED",
      "ERIIMZO_CRYPTO_API_ERROR",
      "ERIIMZO_CERT_NOT_FOUND",
      "ERIIMZO_WRONG_PASSWORD",
      "ERIIMZO_NO_READER",
      "ERIIMZO_CARD_NOT_FOUND",
      "CAPIWS_CONNECTION",
      "BROWSER_WS",
      "UPDATE_APP",
      "WRONG_PASSWORD",
      "VERSION_UNDEFINED",
      "INSTALL_NEW_VERSION",
      "SIGNING_ERROR",
      "KEY_LOAD_ERROR",
      "CERTIFICATE_EXPIRED",
      "CERTIFICATE_NOT_YET_VALID",
    ] as const;

    for (const key of messageKeys) {
      it(`should have '${key}' message in English`, () => {
        setLocale("en");
        const message = getErrorMessage(key);
        expect(message).not.toBe(key);
        expect(message.length).toBeGreaterThan(0);
      });

      it(`should have '${key}' message in Russian`, () => {
        setLocale("ru");
        const message = getErrorMessage(key);
        expect(message).not.toBe(key);
        expect(message.length).toBeGreaterThan(0);
      });

      it(`should have '${key}' message in Uzbek`, () => {
        setLocale("uz");
        const message = getErrorMessage(key);
        expect(message).not.toBe(key);
        expect(message.length).toBeGreaterThan(0);
      });
    }
  });
});
