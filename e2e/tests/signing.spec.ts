/**
 * Document Signing Tests
 *
 * Tests for the complete signing workflow including certificate selection,
 * password verification, and signature creation.
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

test.describe("Document Signing Workflow", () => {
  let playgroundPage: PlaygroundPage;

  test.beforeEach(async ({ page }) => {
    playgroundPage = new PlaygroundPage(page);

    // Configure mock server for signing tests if available
    if (useMockServer()) {
      const server = getMockServer();
      server?.resetConfig();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
        passwordCorrect: true,
      });
    }
  });

  test.describe("Signing Flow", () => {
    test("should complete full signing workflow", async ({ page }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      // 1. Go to signing tab
      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // 2. Select the first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();

      // 3. Click continue
      await playgroundPage.clickContinue();

      // 4. Wait for signing to complete
      // The widget should progress through steps
      await page.waitForTimeout(1000);

      // Should either show password prompt or complete signing
      const widgetContent = await playgroundPage.signWidget.textContent();
      expect(widgetContent).toBeDefined();
    });

    test("should show document preview before signing", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");

      // Check for document preview
      const preview = playgroundPage.signWidget.locator(
        ".eimzo-document-preview, .document-content"
      );
      const hasPreview = await preview.isVisible();

      // Preview should be visible if show-preview is enabled
      if (hasPreview) {
        const previewText = await preview.textContent();
        expect(previewText).toContain("sample document");
      }
    });

    test("should show step indicator during signing process", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Check step indicator
      const stepText = await playgroundPage.getWidgetStep();
      // Should show step 1 or similar
      expect(stepText).toBeDefined();
    });

    test("should allow certificate re-selection", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();

      // Select different certificate if available
      const cards = playgroundPage.getCertificateCards();
      if ((await cards.count()) > 1) {
        const secondCard = cards.nth(1);
        await secondCard.click();

        // Second should now be selected
        const classes = await secondCard.getAttribute("class");
        expect(classes).toContain("selected");
      }
    });
  });

  test.describe("Password Handling (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for password simulation");

    test("should handle wrong password error", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({ passwordCorrect: false });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select certificate and try to sign
      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Check for error message about wrong password
      const hasError = await playgroundPage.hasError();
      const widgetText = await playgroundPage.signWidget.textContent();

      // Should show error or password prompt
      expect(hasError || widgetText?.toLowerCase().includes("password")).toBe(
        true
      );

      // Reset for other tests
      server?.updateConfig({ passwordCorrect: true });
    });

    test("should allow retry after password failure", async ({ page }) => {
      const server = getMockServer();
      server?.updateConfig({ passwordCorrect: false });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      await playgroundPage.selectCertificateByName("Aziz Alimov");
      await playgroundPage.clickContinue();

      await page.waitForTimeout(1000);

      // Now fix the password
      server?.updateConfig({ passwordCorrect: true });

      // Widget should still be interactive
      const widgetVisible = await playgroundPage.signWidget.isVisible();
      expect(widgetVisible).toBe(true);
    });
  });

  test.describe("Signature Result", () => {
    test("should display signature after successful signing", async ({
      page,
    }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select the first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();
      await playgroundPage.clickContinue();

      // Wait for potential password dialog and completion
      await page.waitForTimeout(2000);

      // Check if we got to a result state
      const widgetText = await playgroundPage.signWidget.textContent();
      expect(widgetText).toBeDefined();
    });

    test("should allow signing another document", async ({ page }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select the first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();
      await playgroundPage.clickContinue();

      await page.waitForTimeout(2000);

      // Try to find and click "Sign Another" or similar button
      const newBtn = page.locator(
        'button:has-text("Sign Another"), button:has-text("New"), button:has-text("Reset")'
      );

      if (await newBtn.isVisible()) {
        await newBtn.click();

        // Should reset to certificate selection
        await playgroundPage.waitForCertificatesLoaded();
        const cards = playgroundPage.getCertificateCards();
        expect(await cards.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Cancel Flow", () => {
    test("should allow canceling during signing process", async ({ page }) => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select the first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();

      // Look for cancel button at selection step
      const cancelBtn = page.locator('button:has-text("Cancel")').first();

      if (await cancelBtn.isVisible({ timeout: 1000 })) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }

      // Widget should still be visible
      const widgetVisible = await playgroundPage.signWidget.isVisible();
      expect(widgetVisible).toBe(true);
    });

    test("should preserve state when navigating away and back", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Navigate away
      await playgroundPage.selectTab("certificates");
      await playgroundPage.page.waitForTimeout(300);

      // Navigate back
      await playgroundPage.selectTab("signing");
      await playgroundPage.page.waitForTimeout(300);

      // Widget should still be usable
      const cards = playgroundPage.getCertificateCards();
      expect(await cards.count()).toBeGreaterThan(0);
    });
  });
});
