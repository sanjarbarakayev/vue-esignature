/**
 * Playwright Global Teardown
 *
 * Stops the mock E-IMZO WebSocket server after tests complete.
 */

import { stopMockServer } from "./mocks/websocket-server";

async function globalTeardown(): Promise<void> {
  // Only stop mock server if we started it
  if (process.env.USE_MOCK_SERVER === "true") {
    await stopMockServer();
    // eslint-disable-next-line no-console
    console.log("Mock E-IMZO WebSocket server stopped");
  } else {
    // eslint-disable-next-line no-console
    console.log("Real E-IMZO was used, no mock server to stop");
  }
}

export default globalTeardown;
