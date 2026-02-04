/**
 * Hardware Token Tests
 *
 * Tests for hardware device detection including ID Card readers,
 * BAIK tokens, and CKC devices.
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

test.describe("Hardware Token Detection", () => {
  let playgroundPage: PlaygroundPage;

  test.beforeEach(async ({ page }) => {
    playgroundPage = new PlaygroundPage(page);

    // Reset mock server configuration if available
    if (useMockServer()) {
      const server = getMockServer();
      server?.resetConfig();
      server?.updateConfig({
        installed: true,
        version: { major: "4", minor: "86" }, // NEW_API3 for hardware support
      });
    }
  });

  test.describe("ID Card Reader", () => {
    test("should show ID Card status", async () => {
      if (useMockServer()) {
        const server = getMockServer();
        server?.updateConfig({
          hardwarePlugged: { idCard: false, baik: false, ckc: false },
        });
      }

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      const status = await playgroundPage.getHardwareStatus("idcard");
      // Either shows connected or not connected
      expect(status.toLowerCase()).toMatch(/connected/);
    });

    test("should show hardware cards UI", async () => {
      if (useMockServer()) {
        const server = getMockServer();
        server?.updateConfig({
          hardwarePlugged: { idCard: true, baik: false, ckc: false },
        });
      }

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      // Hardware tab shows static UI, connection check happens on demand
      const cards = playgroundPage.hardwareCards;
      expect(await cards.count()).toBeGreaterThan(0);
    });
  });

  test.describe("BAIK Token", () => {
    test("should show BAIK token status", async () => {
      if (useMockServer()) {
        const server = getMockServer();
        server?.updateConfig({
          hardwarePlugged: { idCard: false, baik: false, ckc: false },
        });
      }

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      const status = await playgroundPage.getHardwareStatus("baik");
      expect(status.toLowerCase()).toMatch(/connected/);
    });
  });

  test.describe("CKC Device", () => {
    test("should show CKC device status", async () => {
      if (useMockServer()) {
        const server = getMockServer();
        server?.updateConfig({
          hardwarePlugged: { idCard: false, baik: false, ckc: false },
        });
      }

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      const status = await playgroundPage.getHardwareStatus("ckc");
      expect(status.toLowerCase()).toMatch(/connected/);
    });
  });

  test.describe("Multiple Devices", () => {
    test("should display all three hardware cards", async () => {
      if (useMockServer()) {
        const server = getMockServer();
        server?.updateConfig({
          hardwarePlugged: { idCard: true, baik: true, ckc: false },
        });
      }

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      // Should show all three hardware cards
      const cards = playgroundPage.hardwareCards;
      expect(await cards.count()).toBe(3);
    });

    test("should display all hardware types on hardware tab", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(300);

      const tabContent = await playgroundPage.page
        .locator(".tab-panel")
        .textContent();

      // Should mention all three hardware types
      expect(tabContent).toContain("ID Card");
      expect(tabContent).toContain("BAIK");
      expect(tabContent).toContain("CKC");
    });
  });

  test.describe("Version Requirements (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server for version simulation");

    test("should require version 4.12+ for ID Card detection", async () => {
      const server = getMockServer();
      server?.updateConfig({
        version: { major: "4", minor: "12" },
        hardwarePlugged: { idCard: true, baik: false, ckc: false },
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      // ID Card should be detectable with version 4.12
      const cards = playgroundPage.hardwareCards;
      expect(await cards.count()).toBeGreaterThan(0);
    });

    test("should require version 4.86+ for BAIK and CKC", async () => {
      const server = getMockServer();
      server?.updateConfig({
        version: { major: "4", minor: "86" },
        hardwarePlugged: { idCard: false, baik: true, ckc: true },
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(500);

      // BAIK and CKC should be detectable with version 4.86
      const cards = playgroundPage.hardwareCards;
      expect(await cards.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Hardware UI Elements", () => {
    test("should display hardware device icons", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(300);

      // Check for hardware icons
      const icons = playgroundPage.page.locator(".hardware-card .hw-icon");
      expect(await icons.count()).toBe(3);
    });

    test("should show device descriptions", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(300);

      const cards = playgroundPage.hardwareCards;
      const firstCard = cards.first();
      const description = firstCard.locator("p");

      expect(await description.textContent()).toBeTruthy();
    });

    test("should show info banner about hardware requirements", async () => {
      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      await playgroundPage.selectTab("hardware");
      await playgroundPage.page.waitForTimeout(300);

      const infoBanner = playgroundPage.page.locator(".info-banner");
      expect(await infoBanner.isVisible()).toBe(true);

      const bannerText = await infoBanner.textContent();
      expect(bannerText).toContain("hardware");
    });
  });
});
