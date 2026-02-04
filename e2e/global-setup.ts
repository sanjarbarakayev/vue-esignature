/**
 * Playwright Global Setup
 *
 * Starts the mock E-IMZO WebSocket server before tests run.
 * If port 64646 is in use (real E-IMZO running), skip mock server.
 */

import { createServer, Socket } from "net";
import { startMockServer } from "./mocks/websocket-server";

/**
 * Check if a port is in use by attempting to connect to it
 */
function isPortInUse(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();

    socket.setTimeout(1000);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true); // Port is in use
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false); // Connection timed out, port not in use
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false); // Error connecting, port not in use
    });

    socket.connect(port, host);
  });
}

async function globalSetup(): Promise<void> {
  const EIMZO_PORT = 64646;

  // Check if E-IMZO is already running on the port
  const portInUse = await isPortInUse(EIMZO_PORT);

  // eslint-disable-next-line no-console
  console.log(`Port ${EIMZO_PORT} in use: ${portInUse}`);

  if (!portInUse) {
    // Port is free, start the mock WebSocket server
    try {
      const server = await startMockServer(EIMZO_PORT);

      // Store the port in environment for tests to access
      process.env.MOCK_WS_PORT = String(server.getPort());
      process.env.USE_MOCK_SERVER = "true";

      // eslint-disable-next-line no-console
      console.log(
        `Mock E-IMZO WebSocket server started on port ${server.getPort()}`
      );
    } catch (error) {
      // Failed to start mock server, fall back to real E-IMZO mode
      // eslint-disable-next-line no-console
      console.log("Failed to start mock server:", error);
      process.env.MOCK_WS_PORT = String(EIMZO_PORT);
      process.env.USE_MOCK_SERVER = "false";
    }
  } else {
    // E-IMZO is running, tests will use real server
    process.env.MOCK_WS_PORT = String(EIMZO_PORT);
    process.env.USE_MOCK_SERVER = "false";

    // eslint-disable-next-line no-console
    console.log(
      "Real E-IMZO detected on port 64646, tests will use real server"
    );
  }
}

export default globalSetup;
