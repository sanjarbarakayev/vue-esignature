/**
 * Mock E-IMZO WebSocket Server for E2E Testing
 *
 * Simulates the E-IMZO CAPIWS service for browser testing without
 * requiring the actual E-IMZO application to be installed.
 */

import { WebSocketServer, WebSocket } from "ws";
import {
  createVersionResponse,
  createApiKeyResponse,
  createListCertificatesResponse,
  createListTokensResponse,
  createListReadersResponse,
  createListBaikTokensResponse,
  createListCkcResponse,
  createLoadKeyResponse,
  createVerifyPasswordResponse,
  createPkcs7Response,
  createErrorResponse,
  type MockResponse,
} from "../fixtures/responses";

/**
 * Mock server configuration
 */
export interface MockServerConfig {
  /** Whether E-IMZO is "installed" (server accepts connections) */
  installed: boolean;
  /** E-IMZO version to report */
  version: { major: string; minor: string };
  /** Whether to include PFX certificates */
  includeCertificates: boolean;
  /** Whether to include FTJC tokens */
  includeTokens: boolean;
  /** Whether password verification should succeed */
  passwordCorrect: boolean;
  /** Hardware device connection states */
  hardwarePlugged: {
    idCard: boolean;
    baik: boolean;
    ckc: boolean;
  };
  /** Force error response for testing */
  simulateError?: string;
  /** Response delay in milliseconds */
  responseDelay: number;
}

/**
 * Default configuration
 */
export const defaultConfig: MockServerConfig = {
  installed: true,
  version: { major: "4", minor: "86" },
  includeCertificates: true,
  includeTokens: true,
  passwordCorrect: true,
  hardwarePlugged: {
    idCard: false,
    baik: false,
    ckc: false,
  },
  responseDelay: 0,
};

/**
 * CAPIWS message request format
 */
interface CAPIWSRequest {
  name: string;
  plugin?: string;
  arguments?: (string | string[])[];
}

/**
 * Mock E-IMZO WebSocket Server
 */
export class MockEIMZOServer {
  private wss: WebSocketServer | null = null;
  private config: MockServerConfig;
  private port: number;

  constructor(port = 64646, config: Partial<MockServerConfig> = {}) {
    this.port = port;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Update server configuration
   */
  updateConfig(config: Partial<MockServerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = { ...defaultConfig };
  }

  /**
   * Start the mock WebSocket server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.port,
          path: "/service/cryptapi",
        });

        this.wss.on("connection", (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        this.wss.on("listening", () => {
          resolve();
        });

        this.wss.on("error", (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the mock WebSocket server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          this.wss = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as CAPIWSRequest;
        const response = await this.handleMessage(message);

        // Apply response delay if configured
        if (this.config.responseDelay > 0) {
          await this.delay(this.config.responseDelay);
        }

        ws.send(JSON.stringify(response));
      } catch {
        ws.send(
          JSON.stringify(createErrorResponse("INVALID_REQUEST"))
        );
      }
    });
  }

  /**
   * Handle CAPIWS message and generate response
   */
  private async handleMessage(message: CAPIWSRequest): Promise<MockResponse> {
    // Check for forced error simulation
    if (this.config.simulateError) {
      return createErrorResponse(this.config.simulateError);
    }

    const { name, plugin } = message;

    // Handle version request
    if (name === "version") {
      return createVersionResponse(
        this.config.version.major,
        this.config.version.minor
      );
    }

    // Handle API key registration
    if (name === "apikey") {
      return createApiKeyResponse(true);
    }

    // Handle plugin-specific requests
    if (plugin) {
      return this.handlePluginMessage(plugin, name, message.arguments);
    }

    return createErrorResponse("UNKNOWN_COMMAND");
  }

  /**
   * Handle plugin-specific messages
   */
  private handlePluginMessage(
    plugin: string,
    name: string,
    args?: (string | string[])[]
  ): MockResponse {
    switch (plugin) {
      case "pfx":
        return this.handlePfxPlugin(name, args);
      case "ftjc":
        return this.handleFtjcPlugin(name, args);
      case "idcard":
        return this.handleIdCardPlugin(name);
      case "baikey":
        return this.handleBaikeyPlugin(name);
      case "ckc":
        return this.handleCkcPlugin(name);
      case "pkcs7":
        return this.handlePkcs7Plugin(name);
      default:
        return createErrorResponse("UNKNOWN_PLUGIN");
    }
  }

  /**
   * Handle PFX plugin messages
   */
  private handlePfxPlugin(
    name: string,
    _args?: (string | string[])[]
  ): MockResponse {
    switch (name) {
      case "list_all_certificates":
        return createListCertificatesResponse(this.config.includeCertificates);
      case "load_key":
        return createLoadKeyResponse(true);
      case "verify_password":
        return createVerifyPasswordResponse(this.config.passwordCorrect);
      case "change_password":
        return { success: true };
      default:
        return createErrorResponse("UNKNOWN_PFX_COMMAND");
    }
  }

  /**
   * Handle FTJC plugin messages
   */
  private handleFtjcPlugin(
    name: string,
    _args?: (string | string[])[]
  ): MockResponse {
    switch (name) {
      case "list_all_keys":
        return createListTokensResponse(this.config.includeTokens);
      case "load_key":
        return createLoadKeyResponse(true);
      case "verify_pin":
        return createVerifyPasswordResponse(this.config.passwordCorrect);
      case "change_pin":
        return { success: true };
      default:
        return createErrorResponse("UNKNOWN_FTJC_COMMAND");
    }
  }

  /**
   * Handle ID Card plugin messages
   */
  private handleIdCardPlugin(name: string): MockResponse {
    if (name === "list_readers") {
      return createListReadersResponse(this.config.hardwarePlugged.idCard);
    }
    return createErrorResponse("UNKNOWN_IDCARD_COMMAND");
  }

  /**
   * Handle BAIK key plugin messages
   */
  private handleBaikeyPlugin(name: string): MockResponse {
    if (name === "list_tokens") {
      return createListBaikTokensResponse(this.config.hardwarePlugged.baik);
    }
    return createErrorResponse("UNKNOWN_BAIKEY_COMMAND");
  }

  /**
   * Handle CKC plugin messages
   */
  private handleCkcPlugin(name: string): MockResponse {
    if (name === "list_ckc") {
      return createListCkcResponse(this.config.hardwarePlugged.ckc);
    }
    return createErrorResponse("UNKNOWN_CKC_COMMAND");
  }

  /**
   * Handle PKCS7 plugin messages
   */
  private handlePkcs7Plugin(name: string): MockResponse {
    if (name === "create_pkcs7") {
      return createPkcs7Response(true);
    }
    return createErrorResponse("UNKNOWN_PKCS7_COMMAND");
  }

  /**
   * Helper to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): MockServerConfig {
    return { ...this.config };
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.wss !== null;
  }
}

/**
 * Global server instance for tests
 */
let globalServer: MockEIMZOServer | null = null;

/**
 * Start the global mock server
 */
export async function startMockServer(
  port = 64646,
  config?: Partial<MockServerConfig>
): Promise<MockEIMZOServer> {
  if (globalServer) {
    await globalServer.stop();
  }
  globalServer = new MockEIMZOServer(port, config);
  await globalServer.start();
  return globalServer;
}

/**
 * Stop the global mock server
 */
export async function stopMockServer(): Promise<void> {
  if (globalServer) {
    await globalServer.stop();
    globalServer = null;
  }
}

/**
 * Get the global mock server instance
 */
export function getMockServer(): MockEIMZOServer | null {
  return globalServer;
}
