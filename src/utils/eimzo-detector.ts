/**
 * E-IMZO Detection Utility
 *
 * Detects whether E-IMZO software is installed and running on the local machine.
 * E-IMZO communicates via WebSocket on localhost ports 64443 (secure) or 64646 (insecure).
 */

/**
 * E-IMZO connection status
 */
export interface EIMZOStatus {
  /** Whether E-IMZO software is installed and responding */
  isInstalled: boolean;
  /** Whether E-IMZO service is currently running */
  isRunning: boolean;
  /** The port E-IMZO is responding on (64443 or 64646), or null if not detected */
  port: number | null;
  /** Whether the current browser supports WebSocket */
  browserSupported: boolean;
}

/** E-IMZO WebSocket path */
const EIMZO_PATH = "/service/cryptapi";

/** Timeout for connection attempts (ms) */
const CONNECTION_TIMEOUT = 2000;

/**
 * Check if WebSocket is supported in the current browser
 */
function checkBrowserSupport(): boolean {
  return typeof WebSocket !== "undefined";
}

/**
 * Check if the current page is served over HTTPS
 */
function isSecureContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol.toLowerCase() === "https:";
}

/**
 * Get the appropriate WebSocket URL based on page protocol
 * - HTTPS pages must use WSS (port 64443)
 * - HTTP pages must use WS (port 64646)
 */
function getWebSocketConfig(): { protocol: string; port: number } {
  if (isSecureContext()) {
    return { protocol: "wss", port: 64443 };
  }
  return { protocol: "ws", port: 64646 };
}

/**
 * Attempt to connect to E-IMZO WebSocket
 */
function tryConnect(
  protocol: string,
  port: number
): Promise<{ success: boolean; port: number }> {
  return new Promise((resolve) => {
    if (!checkBrowserSupport()) {
      resolve({ success: false, port });
      return;
    }

    const url = `${protocol}://127.0.0.1:${port}${EIMZO_PATH}`;

    let resolved = false;
    let ws: WebSocket | null = null;

    const cleanup = () => {
      if (ws) {
        ws.onopen = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.onmessage = null;
        if (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        ) {
          ws.close();
        }
        ws = null;
      }
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({ success: false, port });
      }
    }, CONNECTION_TIMEOUT);

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (!resolved) {
          // Send a version request to verify it's actually E-IMZO
          ws?.send(JSON.stringify({ name: "version" }));
        }
      };

      ws.onmessage = (event) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          // If we got a response, E-IMZO is running
          try {
            const data = JSON.parse(event.data);
            resolve({ success: data.success !== false, port });
          } catch {
            resolve({ success: true, port });
          }
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve({ success: false, port });
        }
      };

      ws.onclose = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve({ success: false, port });
        }
      };
    } catch {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve({ success: false, port });
      }
    }
  });
}

/**
 * Detect E-IMZO installation and connection status
 *
 * The detection uses the appropriate WebSocket protocol based on the page context:
 * - HTTPS pages use WSS on port 64443
 * - HTTP pages use WS on port 64646
 *
 * @returns Promise resolving to E-IMZO status information
 *
 * @example
 * ```typescript
 * const status = await detectEIMZO()
 * if (status.isRunning) {
 *   console.log(`E-IMZO is running on port ${status.port}`)
 * } else if (!status.browserSupported) {
 *   console.log('Browser does not support WebSocket')
 * } else {
 *   console.log('E-IMZO is not installed or not running')
 * }
 * ```
 */
export async function detectEIMZO(): Promise<EIMZOStatus> {
  const browserSupported = checkBrowserSupport();

  if (!browserSupported) {
    return {
      isInstalled: false,
      isRunning: false,
      port: null,
      browserSupported: false,
    };
  }

  // Get the appropriate config based on page protocol
  const { protocol, port } = getWebSocketConfig();

  // Try to connect
  const result = await tryConnect(protocol, port);

  if (result.success) {
    return {
      isInstalled: true,
      isRunning: true,
      port: result.port,
      browserSupported: true,
    };
  }

  return {
    isInstalled: false,
    isRunning: false,
    port: null,
    browserSupported: true,
  };
}

/**
 * Get the recommended download URL for E-IMZO
 */
export function getEIMZODownloadUrl(): string {
  return "https://e-imzo.soliq.uz/download/";
}

/**
 * Check if E-IMZO is available (quick check, returns immediately if already known)
 * This is a convenience wrapper around detectEIMZO for simple boolean checks
 */
export async function isEIMZOAvailable(): Promise<boolean> {
  const status = await detectEIMZO();
  return status.isRunning;
}

/**
 * Get the WebSocket URL that would be used for E-IMZO connection
 * Useful for debugging
 */
export function getEIMZOWebSocketUrl(): string {
  const { protocol, port } = getWebSocketConfig();
  return `${protocol}://127.0.0.1:${port}${EIMZO_PATH}`;
}
