/**
 * Page Object Model for the Playground Application
 *
 * Provides methods for interacting with the playground app during E2E tests.
 */

import { type Page, type Locator, expect } from "@playwright/test";

type TabId = "signing" | "certificates" | "mobile" | "hardware";

const TAB_LABELS: Record<TabId, string> = {
  signing: "Document Signing",
  certificates: "Certificates",
  mobile: "Mobile QR",
  hardware: "Hardware Tokens",
};

export class PlaygroundPage {
  readonly page: Page;

  // Header elements
  readonly statusIndicator: Locator;
  readonly localeSelect: Locator;

  // Tab navigation
  readonly tabButtons: Locator;

  // Signing tab elements
  readonly signWidget: Locator;

  // Certificates tab elements
  readonly certificateSelector: Locator;
  readonly selectedInfo: Locator;

  // Mobile QR tab elements
  readonly generateQRButton: Locator;
  readonly mobileModal: Locator;

  // Hardware tab elements
  readonly hardwareCards: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.statusIndicator = page.locator(".status-indicator");
    this.localeSelect = page.locator(".locale-select");

    // Tabs
    this.tabButtons = page.locator(".tab-btn");

    // Signing tab
    this.signWidget = page.locator(".esign-widget");

    // Certificates tab
    this.certificateSelector = page.locator(".cert-selector");
    this.selectedInfo = page.locator(".selected-info");

    // Mobile QR
    this.generateQRButton = page.getByRole("button", {
      name: "Generate QR Code",
    });
    this.mobileModal = page.locator(".modal-overlay");

    // Hardware
    this.hardwareCards = page.locator(".hardware-card");
  }

  /**
   * Navigate to the playground page
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Wait for the page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  // =========================================================================
  // Tab Navigation
  // =========================================================================

  /**
   * Select a tab by ID
   */
  async selectTab(tab: TabId): Promise<void> {
    const button = this.page.getByRole("button", { name: TAB_LABELS[tab] });
    await button.click();
  }

  /**
   * Get the currently active tab
   */
  async getActiveTab(): Promise<string> {
    const activeButton = this.tabButtons.filter({ hasClass: /active/ });
    return (await activeButton.textContent()) ?? "";
  }

  /**
   * Check if a tab is active
   */
  async isTabActive(tab: TabId): Promise<boolean> {
    const button = this.page.getByRole("button", { name: TAB_LABELS[tab] });
    const classes = await button.getAttribute("class");
    return classes?.includes("active") ?? false;
  }

  // =========================================================================
  // Status Indicator
  // =========================================================================

  /**
   * Get the status indicator text
   */
  async getStatus(): Promise<string> {
    return (await this.statusIndicator.textContent()) ?? "";
  }

  /**
   * Wait for the status to show connected
   */
  async waitForConnected(): Promise<void> {
    await expect(this.statusIndicator).toContainText("Connected", {
      timeout: 10000,
    });
  }

  /**
   * Wait for the status to show not installed
   */
  async waitForNotInstalled(): Promise<void> {
    await expect(this.statusIndicator).toContainText("Not", { timeout: 10000 });
  }

  /**
   * Check if status indicates E-IMZO is installed
   */
  async isEIMZOConnected(): Promise<boolean> {
    const status = await this.getStatus();
    return status.toLowerCase().includes("connected");
  }

  // =========================================================================
  // Locale Selection
  // =========================================================================

  /**
   * Change the locale
   */
  async setLocale(locale: "en" | "ru" | "uz"): Promise<void> {
    await this.localeSelect.selectOption(locale);
  }

  /**
   * Get the current locale
   */
  async getLocale(): Promise<string> {
    return await this.localeSelect.inputValue();
  }

  // =========================================================================
  // ESignatureWidget (Signing Tab)
  // =========================================================================

  /**
   * Get the widget step indicator text
   */
  async getWidgetStep(): Promise<string> {
    const stepIndicator = this.signWidget.locator(".progress-steps");
    return (await stepIndicator.textContent()) ?? "";
  }

  /**
   * Wait for certificates to load in the widget
   */
  async waitForCertificatesLoaded(): Promise<void> {
    await this.signWidget.locator(".cert-card").first().waitFor({
      timeout: 10000,
    });
  }

  /**
   * Get all certificate cards in the widget
   */
  getCertificateCards(): Locator {
    return this.signWidget.locator(".cert-card");
  }

  /**
   * Select a certificate by name in the widget
   */
  async selectCertificateByName(name: string): Promise<void> {
    const card = this.signWidget.locator(".cert-card", {
      hasText: name,
    });
    await card.click();
  }

  /**
   * Click the Continue/Confirm button in the widget
   */
  async clickContinue(): Promise<void> {
    const continueBtn = this.signWidget.locator(
      'button:has-text("Continue"), button:has-text("Confirm")'
    );
    await continueBtn.click();
  }

  /**
   * Click the Sign button
   */
  async clickSign(): Promise<void> {
    const signBtn = this.signWidget.locator('button:has-text("Sign")');
    await signBtn.click();
  }

  /**
   * Click the Cancel button
   */
  async clickCancel(): Promise<void> {
    const cancelBtn = this.signWidget.locator('button:has-text("Cancel")');
    await cancelBtn.click();
  }

  /**
   * Check if signature result is displayed
   */
  async hasSignatureResult(): Promise<boolean> {
    const result = this.signWidget.locator(".signature-display, .step-success");
    return await result.isVisible();
  }

  /**
   * Get the signature text
   */
  async getSignatureText(): Promise<string> {
    const result = this.signWidget.locator(".signature-display textarea, .signature-text");
    return await result.inputValue();
  }

  /**
   * Click the Copy Signature button
   */
  async clickCopySignature(): Promise<void> {
    const copyBtn = this.signWidget.locator('button:has-text("Copy")');
    await copyBtn.click();
  }

  /**
   * Click Sign Another Document button
   */
  async clickSignAnother(): Promise<void> {
    const btn = this.signWidget.locator(
      'button:has-text("Sign Another"), button:has-text("New")'
    );
    await btn.click();
  }

  // =========================================================================
  // CertificateSelector (Certificates Tab)
  // =========================================================================

  /**
   * Get certificate cards from the selector
   */
  getSelectorCertificateCards(): Locator {
    return this.certificateSelector.locator(".cert-card");
  }

  /**
   * Select a certificate in the standalone selector
   */
  async selectCertificateInSelector(name: string): Promise<void> {
    await this.selectTab("certificates");
    const card = this.certificateSelector.locator(".eimzo-cert-card", {
      hasText: name,
    });
    await card.click();
  }

  /**
   * Get selected certificate info text
   */
  async getSelectedCertificateInfo(): Promise<string> {
    return (await this.selectedInfo.textContent()) ?? "";
  }

  /**
   * Check if a certificate is selected
   */
  async hasCertificateSelected(): Promise<boolean> {
    return await this.selectedInfo.isVisible();
  }

  // =========================================================================
  // Mobile QR Tab
  // =========================================================================

  /**
   * Open the mobile QR modal
   */
  async openMobileQRModal(): Promise<void> {
    await this.selectTab("mobile");
    await this.generateQRButton.click();
  }

  /**
   * Check if the mobile modal is visible
   */
  async isMobileModalVisible(): Promise<boolean> {
    return await this.mobileModal.isVisible();
  }

  /**
   * Close the mobile modal
   */
  async closeMobileModal(): Promise<void> {
    const closeBtn = this.mobileModal.locator(
      'button:has-text("Close"), button:has-text("Done"), button.close-btn'
    );
    await closeBtn.click();
  }

  /**
   * Check if QR code is rendered in the modal
   */
  async hasQRCodeRendered(): Promise<boolean> {
    const canvas = this.mobileModal.locator("canvas.qr-canvas");
    const isVisible = await canvas.isVisible();
    if (!isVisible) return false;

    // Check that the canvas has content (width/height > 0)
    const box = await canvas.boundingBox();
    return box !== null && box.width > 0 && box.height > 0;
  }

  // =========================================================================
  // Hardware Tab
  // =========================================================================

  /**
   * Get hardware device status
   */
  async getHardwareStatus(
    device: "idcard" | "baik" | "ckc"
  ): Promise<string> {
    await this.selectTab("hardware");

    const deviceNames = {
      idcard: "ID Card Reader",
      baik: "BAIK Token",
      ckc: "CKC Device",
    };

    const card = this.hardwareCards.filter({ hasText: deviceNames[device] });
    const status = card.locator(".hw-status");
    return (await status.textContent()) ?? "";
  }

  /**
   * Check if a hardware device shows as connected
   */
  async isHardwareConnected(
    device: "idcard" | "baik" | "ckc"
  ): Promise<boolean> {
    const status = await this.getHardwareStatus(device);
    return status.toLowerCase().includes("connected");
  }

  // =========================================================================
  // Error Handling
  // =========================================================================

  /**
   * Get any error message displayed
   */
  async getErrorMessage(): Promise<string | null> {
    const errorEl = this.page.locator(".error-state, .step-error, .error-message, [role=alert]");
    if (await errorEl.isVisible()) {
      return await errorEl.textContent();
    }
    return null;
  }

  /**
   * Wait for an error to be displayed
   */
  async waitForError(): Promise<void> {
    await this.page.locator(".error-state, .step-error, .error-message, [role=alert]").waitFor({
      timeout: 5000,
    });
  }

  /**
   * Check if an error is displayed
   */
  async hasError(): Promise<boolean> {
    const errorEl = this.page.locator(".error-state, .step-error, .error-message, [role=alert]");
    return await errorEl.isVisible();
  }

  // =========================================================================
  // Install Prompt
  // =========================================================================

  /**
   * Check if install prompt is displayed
   */
  async hasInstallPrompt(): Promise<boolean> {
    const prompt = this.page.locator(".install-prompt, .step-install");
    return await prompt.isVisible();
  }

  /**
   * Get install prompt text
   */
  async getInstallPromptText(): Promise<string> {
    const prompt = this.page.locator(".install-prompt, .step-install");
    return (await prompt.textContent()) ?? "";
  }

  /**
   * Click the download button in install prompt
   */
  async clickDownloadButton(): Promise<void> {
    const prompt = this.page.locator(".install-prompt, .step-install");
    const downloadBtn = prompt.locator('a:has-text("Download"), button:has-text("Download")');
    await downloadBtn.click();
  }
}
