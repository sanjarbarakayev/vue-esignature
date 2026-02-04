/**
 * E-IMZO Detection Tests
 *
 * Tests for detecting E-IMZO installation status, version checking,
 * and connection handling.
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

test.describe("E-IMZO Detection", () => {
  let playgroundPage: PlaygroundPage;

  test.beforeEach(async ({ page }) => {
    playgroundPage = new PlaygroundPage(page);

    // Reset mock server if available
    const server = getMockServer();
    if (server) {
      server.resetConfig();
    }
  });

  test("should show connected status when E-IMZO is available", async () => {
    if (useMockServer()) {
      const server = getMockServer();
      server?.updateConfig({ installed: true });
    }

    await playgroundPage.goto();
    await playgroundPage.waitForReady();

    // The status indicator should show connected
    await playgroundPage.waitForConnected();
    const isConnected = await playgroundPage.isEIMZOConnected();
    expect(isConnected).toBe(true);
  });

  test("should show correct version info", async () => {
    if (useMockServer()) {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        version: { major: "4", minor: "86" },
      });
    }

    await playgroundPage.goto();
    await playgroundPage.waitForReady();
    await playgroundPage.waitForConnected();

    const status = await playgroundPage.getStatus();
    expect(status).toContain("Connected");
  });

  test.describe("Version Detection (mock server only)", () => {
    test.skip(!useMockServer(), "Requires mock server");

    test("should handle old E-IMZO version gracefully", async () => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        version: { major: "2", minor: "0" },
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      // Should still show connected but may have limited features
      await playgroundPage.waitForConnected();
    });

    test("should detect version 3.36+ (NEW_API)", async () => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        version: { major: "3", minor: "36" },
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      const isConnected = await playgroundPage.isEIMZOConnected();
      expect(isConnected).toBe(true);
    });

    test("should detect version 4.12+ (NEW_API2)", async () => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        version: { major: "4", minor: "12" },
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      const isConnected = await playgroundPage.isEIMZOConnected();
      expect(isConnected).toBe(true);
    });

    test("should detect version 4.86+ (NEW_API3)", async () => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        version: { major: "4", minor: "86" },
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();
      await playgroundPage.waitForConnected();

      const isConnected = await playgroundPage.isEIMZOConnected();
      expect(isConnected).toBe(true);
    });

    test("should handle response delay gracefully", async () => {
      const server = getMockServer();
      server?.updateConfig({
        installed: true,
        responseDelay: 500,
      });

      await playgroundPage.goto();
      await playgroundPage.waitForReady();

      await playgroundPage.waitForConnected();
      const isConnected = await playgroundPage.isEIMZOConnected();
      expect(isConnected).toBe(true);

      server?.updateConfig({ responseDelay: 0 });
    });
  });

  test("should maintain connection across tab navigation", async () => {
    if (useMockServer()) {
      const server = getMockServer();
      server?.updateConfig({ installed: true });
    }

    await playgroundPage.goto();
    await playgroundPage.waitForReady();
    await playgroundPage.waitForConnected();

    // Navigate through tabs
    await playgroundPage.selectTab("certificates");
    expect(await playgroundPage.isEIMZOConnected()).toBe(true);

    await playgroundPage.selectTab("hardware");
    expect(await playgroundPage.isEIMZOConnected()).toBe(true);

    await playgroundPage.selectTab("mobile");
    expect(await playgroundPage.isEIMZOConnected()).toBe(true);

    await playgroundPage.selectTab("signing");
    expect(await playgroundPage.isEIMZOConnected()).toBe(true);
  });
});
