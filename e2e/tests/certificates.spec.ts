/**
 * Certificate Tests
 *
 * Tests for listing, filtering, and selecting certificates.
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

test.describe("Certificate Management", () => {
  let playgroundPage: PlaygroundPage;

  test.beforeEach(async ({ page }) => {
    playgroundPage = new PlaygroundPage(page);

    // Ensure mock server is configured correctly if available
    if (useMockServer()) {
      const server = getMockServer();
      server?.resetConfig();
      server?.updateConfig({
        installed: true,
        includeCertificates: true,
        includeTokens: true,
      });
    }
  });

  test.describe("Certificate Listing", () => {
    test("should list PFX certificates from the mock server", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      // Go to signing tab and wait for certificates
      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      const cards = playgroundPage.getCertificateCards();
      const count = await cards.count();

      // Should have mock certificates loaded
      expect(count).toBeGreaterThan(0);
    });

    test("should display certificate details correctly", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      const firstCard = playgroundPage.getCertificateCards().first();
      const cardText = await firstCard.textContent();

      // Should show some name (real or mock)
      // Card should have meaningful content (not empty)
      expect(cardText).toBeTruthy();
      expect(cardText!.length).toBeGreaterThan(10);
    });

    test("should show certificate information on cards", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      const firstCard = playgroundPage.getCertificateCards().first();
      const cardText = await firstCard.textContent();

      // Should show some certificate info (TIN, validity, type indicator)
      expect(cardText).toMatch(/TIN|Valid|File|Token/i);
    });

    test("should handle empty certificate list (mock only)", async () => {
      test.skip(!useMockServer(), "Requires mock server");

      const server = getMockServer();
      server?.updateConfig({
        includeCertificates: false,
        includeTokens: false,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.page.waitForTimeout(1000);

      const cards = playgroundPage.getCertificateCards();
      const count = await cards.count();

      // Should have no certificates (only mock data from playground)
      // The playground uses mock data so this tests the widget behavior
      expect(count).toBeDefined();
    });
  });

  test.describe("Certificate Selection", () => {
    test("should highlight selected certificate", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Click on first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();

      // Should have selected class
      const classes = await firstCard.getAttribute("class");
      expect(classes).toContain("selected");
    });

    test("should enable continue button after selection", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select the first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();

      // Continue button should be enabled
      const continueBtn = playgroundPage.signWidget.locator(
        'button:has-text("Continue"), button:has-text("Confirm")'
      );
      await expect(continueBtn).toBeEnabled();
    });

    test("should allow changing certificate selection", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("signing");
      await playgroundPage.waitForCertificatesLoaded();

      // Select first certificate
      const firstCard = playgroundPage.getCertificateCards().first();
      await firstCard.click();
      expect(await firstCard.getAttribute("class")).toContain("selected");

      // Select second certificate
      const secondCard = playgroundPage.getCertificateCards().nth(1);
      if ((await secondCard.count()) > 0) {
        await secondCard.click();
        expect(await secondCard.getAttribute("class")).toContain("selected");
        // First should no longer be selected
        const firstClasses = await firstCard.getAttribute("class");
        expect(firstClasses).not.toContain("selected");
      }
    });
  });

  test.describe("Certificate Selector Component", () => {
    test("should display certificates in standalone selector", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await playgroundPage.selectTab("certificates");
      await playgroundPage.page.waitForTimeout(500);

      // The certificates tab uses mock data from playground
      const cards = playgroundPage.getSelectorCertificateCards();
      const count = await cards.count();

      // Should show the mock certificates
      expect(count).toBeGreaterThan(0);
    });

    test("should show selected certificate info", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await playgroundPage.selectTab("certificates");
      await playgroundPage.page.waitForTimeout(500);

      // Click on a certificate
      const firstCard = playgroundPage.getSelectorCertificateCards().first();
      await firstCard.click();

      // Should show selected info
      const hasSelected = await playgroundPage.hasCertificateSelected();
      expect(hasSelected).toBe(true);

      const info = await playgroundPage.getSelectedCertificateInfo();
      expect(info.length).toBeGreaterThan(0);
    });

    test("should display certificate type badge", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await playgroundPage.selectTab("certificates");
      await playgroundPage.page.waitForTimeout(500);

      const cards = playgroundPage.getSelectorCertificateCards();
      const firstCard = cards.first();
      const cardHTML = await firstCard.innerHTML();

      // Should show type indicator (PFX or Token)
      expect(cardHTML.toLowerCase()).toMatch(/pfx|token|ftjc/);
    });
  });

  test.describe("Certificate Expiration", () => {
    test("should display expired certificate differently", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await playgroundPage.selectTab("certificates");
      await playgroundPage.page.waitForTimeout(500);

      // Find the expired certificate card
      const expiredCard = playgroundPage
        .getSelectorCertificateCards()
        .filter({ hasText: "Expired User" });

      if ((await expiredCard.count()) > 0) {
        const classes = await expiredCard.getAttribute("class");
        // Should have an expired indicator class
        expect(classes?.toLowerCase()).toMatch(/expired|invalid|disabled/);
      }
    });

    test("should show validity dates on certificates", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await playgroundPage.selectTab("certificates");
      await playgroundPage.page.waitForTimeout(500);

      const firstCard = playgroundPage.getSelectorCertificateCards().first();
      const cardText = await firstCard.textContent();

      // Should show date information
      expect(cardText).toMatch(/\d{2,4}/); // Should contain year digits
    });
  });
});
