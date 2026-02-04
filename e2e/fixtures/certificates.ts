/**
 * Mock certificate data for E2E testing
 */

export interface MockPfxCertificateRaw {
  disk: string;
  path: string;
  name: string;
  alias: string;
}

export interface MockFtjcTokenRaw {
  cardUID: string;
  statusInfo: string;
  ownerName: string;
  info: string;
}

/**
 * Generate a certificate alias string in X.500 format
 */
function createPfxAlias(
  cn: string,
  serialNumber: string,
  tin: string,
  pinfl: string,
  org: string,
  title: string,
  validFrom: string,
  validTo: string
): string {
  return (
    `CN=${cn},` +
    `SERIALNUMBER=${serialNumber},` +
    `1.2.860.3.16.1.1=${tin},` +
    `1.2.860.3.16.1.2=${pinfl},` +
    `UID=${tin},` +
    `O=${org},` +
    `T=${title},` +
    `VALIDFROM=${validFrom},` +
    `VALIDTO=${validTo}`
  );
}

/**
 * Generate a token info string in X.500 format
 */
function createFtjcInfo(
  cn: string,
  serialNumber: string,
  tin: string,
  pinfl: string,
  org: string,
  title: string,
  validFrom: string,
  validTo: string
): string {
  return createPfxAlias(
    cn,
    serialNumber,
    tin,
    pinfl,
    org,
    title,
    validFrom,
    validTo
  );
}

/**
 * Mock PFX certificates for testing
 */
export const mockPfxCertificatesRaw: MockPfxCertificateRaw[] = [
  {
    disk: "C:",
    path: "/Users/test/certs/",
    name: "aziz_alimov.pfx",
    alias: createPfxAlias(
      "Aziz Alimov",
      "1234567890",
      "123456789",
      "31234567890123",
      "Example Company LLC",
      "Director",
      "2024.01.01 00:00:00",
      "2026.12.31 23:59:59"
    ),
  },
  {
    disk: "D:",
    path: "/certificates/",
    name: "dilshod_karimov.pfx",
    alias: createPfxAlias(
      "Dilshod Karimov",
      "0987654321",
      "987654321",
      "40987654321098",
      "Tech Solutions Inc",
      "Manager",
      "2024.06.01 00:00:00",
      "2026.06.01 23:59:59"
    ),
  },
  {
    disk: "C:",
    path: "/old/",
    name: "expired_user.pfx",
    alias: createPfxAlias(
      "Expired User",
      "5555555555",
      "555555555",
      "55555555555555",
      "Old Company",
      "Employee",
      "2022.01.01 00:00:00",
      "2023.12.31 23:59:59"
    ),
  },
];

/**
 * Mock FTJC tokens for testing
 */
export const mockFtjcTokensRaw: MockFtjcTokenRaw[] = [
  {
    cardUID: "CARD-12345-ABCDE",
    statusInfo: "Active",
    ownerName: "Bobur Karimov",
    info: createFtjcInfo(
      "Bobur Karimov",
      "1111222233",
      "111222333",
      "11122233344455",
      "Hardware Corp",
      "Engineer",
      "2024.03.01 00:00:00",
      "2026.03.01 23:59:59"
    ),
  },
  {
    cardUID: "CARD-67890-FGHIJ",
    statusInfo: "Active",
    ownerName: "Sardor Rahimov",
    info: createFtjcInfo(
      "Sardor Rahimov",
      "4444555566",
      "444555666",
      "44455566677788",
      "Secure Systems Ltd",
      "Analyst",
      "2024.07.01 00:00:00",
      "2026.07.01 23:59:59"
    ),
  },
];

/**
 * Mock hardware reader names
 */
export const mockIdCardReaders: string[] = [
  "ACS ACR38U-CCID",
  "Gemalto USB Smart Card Reader",
];

/**
 * Mock BAIK token names
 */
export const mockBaikTokens: string[] = ["BAIK Token USB 001", "BAIK Token USB 002"];

/**
 * Mock CKC device names
 */
export const mockCkcDevices: string[] = ["CKC Module v1.0"];
