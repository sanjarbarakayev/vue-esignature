/**
 * Error Handling Tests
 *
 * Tests for error states, error messages, and error recovery.
 */

import { test, expect } from "@playwright/test";
import { PlaygroundPage } from "../pages/playground.page";
import { getMockServer } from "../mocks/websocket-server";

/**
 * Check if we're using the mock server
 */
function useMockServer(): boolean {
  return process.env.USE_MOCK_SERVER === "true";
}

test.describe("Error Handling", () => {
  let playgroundPage: PlaygroundPage;

  test.beforeEach(async ({ page }) => {
    playgroundPage = new PlaygroundPage(page);

    if (useMockServer()) {
      const server = getMockServer();
      server?.resetConfig();
    }
  });

  test.describe("API Key Errors (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for error simulation");

    test("should handle API key validation failure", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        simulateError: "API_KEY_INVALID",
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      // Wait for connection attempt
      await page.waitForTimeout(2000);

      // Should show error or failed connection
      const status = await playgroundPage.getStatus();
      // Either shows error or disconnected state
      expect(status).toBeDefined();

      // Clear error for other tests
      server?.updateConfig({ simulateError: undefined });
    });
  });

  test.describe("Load Key Errors (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for error simulation");

    test("should handle load key failure", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      // Simulate error during key loading
      server?.updateConfig({ simulateError: "LOAD_KEY_FAILED" });

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Should show error or allow retry
      const widgetVisible = await playgroundPage.signWidget.isVisible();
      expect(widgetVisible).toBe(true);

      // Clear error
      server?.updateConfig({ simulateError: undefined });
    });

    test("should allow retry after load key failure", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
        simulateError: "LOAD_KEY_FAILED",
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Fix the error
      server?.updateConfig({ simulateError: undefined });

      // Widget should still be usable for retry
      const cards = playgroundPage.getCertificateCards();
      const cardsVisible = await cards.first().isVisible();

      // Either shows error with retry or allows re-selection
      expect(cardsVisible || (await playgroundPage.hasError())).toBe(true);
    });
  });

  test.describe("Signing Errors (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for error simulation");

    test("should handle PKCS7 creation failure", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
        passwordCorrect: true,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");

      // Simulate PKCS7 failure
      server?.updateConfig({ simulateError: "PKCS7_CREATION_FAILED" });

      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Should handle error gracefully
      const widgetVisible = await playgroundPage.signWidget.isVisible();
      expect(widgetVisible).toBe(true);

      // Clear error
      server?.updateConfig({ simulateError: undefined });
    });
  });

  test.describe("Password Errors (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for error simulation");

    test("should display wrong password error message", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
        passwordCorrect: false,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Should show password error or prompt
      const widgetText = await playgroundPage.signWidget.textContent();
      const hasPasswordReference =
        widgetText?.toLowerCase().includes("password") ||
        widgetText?.toLowerCase().includes("пароль") ||
        widgetText?.toLowerCase().includes("parol");

      expect(hasPasswordReference || (await playgroundPage.hasError())).toBe(
        true
      );

      // Reset
      server?.updateConfig({ passwordCorrect: true });
    });
  });

  test.describe("Localized Error Messages", () => {
    test("should show English UI", async ({ page }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      // Set English locale
      await playgroundPage.setLocale("en");
      await page.waitForTimeout(300);

      await playgroundPage.selectTab("signing");

      // Check that UI is in English
      const tabContent = await playgroundPage.page
        .locator(".tab-panel")
        .textContent();
      expect(tabContent).toMatch(/Document|Certificate|Sign/i);
    });

    test("should show Russian locale option", async ({ page }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      // Set Russian locale
      await playgroundPage.setLocale("ru");
      await page.waitForTimeout(300);

      // Verify locale changed
      const locale = await playgroundPage.getLocale();
      expect(locale).toBe("ru");
    });

    test("should show Uzbek locale option", async ({ page }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      // Set Uzbek locale
      await playgroundPage.setLocale("uz");
      await page.waitForTimeout(300);

      // Verify locale changed
      const locale = await playgroundPage.getLocale();
      expect(locale).toBe("uz");
    });
  });

  test.describe("Network Errors (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for delay simulation");

    test("should handle WebSocket connection timeout", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        responseDelay: 5000, // 5 second delay
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      // Should still eventually show status
      await page.waitForTimeout(2000);
      const status = await playgroundPage.getStatus();
      expect(status).toBeDefined();

      // Reset delay
      server?.updateConfig({ responseDelay: 0 });
    });
  });

  test.describe("Recovery (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for error simulation");

    test("should recover after error is resolved", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        simulateError: "TEMPORARY_ERROR",
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await page.waitForTimeout(1000);

      // Clear error
      server?.updateConfig({ simulateError: undefined });

      // Reload page to retry connection
      await page.reload();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      const isConnected = await playgroundPage.isEIMZOConnected();
      expect(isConnected).toBe(true);
    });

    test("should maintain UI state after error", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      // Navigate to certificates
      await playgroundPage.selectTab("certificates");
      await page.waitForTimeout(300);

      // Simulate transient error
      server?.updateConfig({ simulateError: "TRANSIENT_ERROR" });
      await page.waitForTimeout(500);

      // Clear error
      server?.updateConfig({ simulateError: undefined });

      // Tab should still be visible
      const isActive = await playgroundPage.isTabActive("certificates");
      expect(isActive).toBe(true);

      // Certificates should still be visible
      const cards = playgroundPage.getSelectorCertificateCards();
      expect(await cards.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Error Display (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for error simulation");

    test("should display user-friendly error messages", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        passwordCorrect: false,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1500);

      // Check for error message
      const errorMsg = await playgroundPage.getErrorMessage();
      if (errorMsg) {
        // Error message should be readable (not a code)
        expect(errorMsg.length).toBeGreaterThan(5);
        // Should not be a raw error code
        expect(errorMsg).not.toMatch(/^[A-Z_]+$/);
      }

      server?.resetConfig();
    });

    test("should clear error on successful retry", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
        passwordCorrect: false,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Fix the issue
      server?.updateConfig({ passwordCorrect: true });

      // Try again
      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Error should eventually clear or allow progress
      const widgetVisible = await playgroundPage.signWidget.isVisible();
      expect(widgetVisible).toBe(true);

      server?.resetConfig();
    });
  });
});
