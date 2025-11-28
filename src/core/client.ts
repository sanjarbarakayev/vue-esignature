/**
 * E-IMZO Client Module
 * High-level client for interacting with E-IMZO certificates and keys
 */

import { CAPIWS } from "./capiws";
import type {
  Certificate,
  PfxCertificate,
  FtjcCertificate,
  IEIMZOClient,
  VersionSuccessCallback,
  FailCallback,
  BooleanSuccessCallback,
  VoidSuccessCallback,
  LoadKeySuccessCallback,
  Pkcs7SuccessCallback,
  ItemIdGenerator,
  ItemUiGenerator,
  ListAllUserKeysSuccessCallback,
  CAPIWSVersionResponse,
  CAPIWSBaseResponse,
  CAPIWSLoadKeyResponse,
  CAPIWSPkcs7Response,
  CAPIWSListCertificatesResponse,
  CAPIWSListTokensResponse,
  CAPIWSListReadersResponse,
  CAPIWSListBAIKTokensResponse,
  CAPIWSListCKCResponse,
} from "../types";
import { ERROR_MESSAGES } from "../types";

// ============================================================================
// X.500 Name Parser Utilities
// ============================================================================

const splitKeep = (
  str: string,
  splitter: string | RegExp,
  ahead: boolean = false
): string[] => {
  const result: string[] = [];

  if (splitter !== "") {
    const getSubst = (value: string): string => {
      const substChar = value[0] === "0" ? "1" : "0";
      return substChar.repeat(value.length);
    };

    const matches: Array<{ value: string; index: number }> = [];

    if (splitter instanceof RegExp) {
      str.replace(splitter, (m, ...args) => {
        const index = args[args.length - 2] as number;
        matches.push({ value: m, index });
        return getSubst(m);
      });
    } else {
      let searchIndex = 0;
      let foundIndex: number;
      while ((foundIndex = str.indexOf(splitter, searchIndex)) !== -1) {
        matches.push({ value: splitter, index: foundIndex });
        searchIndex = foundIndex + splitter.length;
      }
    }

    let lastIndex = 0;
    for (const m of matches) {
      const nextIndex = ahead ? m.index : m.index + m.value.length;
      if (nextIndex !== lastIndex) {
        result.push(str.substring(lastIndex, nextIndex));
        lastIndex = nextIndex;
      }
    }

    if (lastIndex < str.length) {
      result.push(str.substring(lastIndex));
    }
  } else {
    result.push(str);
  }

  return result;
};

const getX500Val = (s: string, f: string): string => {
  const res = splitKeep(s, /,[A-Z]+=/g, true);
  for (let i = 0; i < res.length; i++) {
    const prefix = i > 0 ? "," : "";
    const n = res[i].search(prefix + f + "=");
    if (n !== -1) {
      return res[i].slice(n + f.length + 1 + (i > 0 ? 1 : 0));
    }
  }
  return "";
};

// ============================================================================
// Certificate Parsing
// ============================================================================

interface PfxCertificateRaw {
  disk: string;
  path: string;
  name: string;
  alias: string;
}

interface FtjcTokenRaw {
  cardUID: string;
  statusInfo: string;
  ownerName: string;
  info: string;
}

const parsePfxCertificate = (el: PfxCertificateRaw): PfxCertificate | null => {
  let x500name_ex = el.alias.toUpperCase();
  x500name_ex = x500name_ex.replace("1.2.860.3.16.1.1=", "INN=");
  x500name_ex = x500name_ex.replace("1.2.860.3.16.1.2=", "PINFL=");

  const vo: PfxCertificate = {
    disk: el.disk,
    path: el.path,
    name: el.name,
    alias: el.alias,
    serialNumber: getX500Val(x500name_ex, "SERIALNUMBER"),
    validFrom: new Date(
      getX500Val(x500name_ex, "VALIDFROM").replace(/\./g, "-").replace(" ", "T")
    ),
    validTo: new Date(
      getX500Val(x500name_ex, "VALIDTO").replace(/\./g, "-").replace(" ", "T")
    ),
    CN: getX500Val(x500name_ex, "CN"),
    TIN: getX500Val(x500name_ex, "INN") || getX500Val(x500name_ex, "UID"),
    UID: getX500Val(x500name_ex, "UID"),
    PINFL: getX500Val(x500name_ex, "PINFL"),
    O: getX500Val(x500name_ex, "O"),
    T: getX500Val(x500name_ex, "T"),
    type: "pfx",
  };

  if (!vo.TIN && !vo.PINFL) return null;
  return vo;
};

const parseFtjcCertificate = (el: FtjcTokenRaw): FtjcCertificate | null => {
  let x500name_ex = el.info.toUpperCase();
  x500name_ex = x500name_ex.replace("1.2.860.3.16.1.1=", "INN=");
  x500name_ex = x500name_ex.replace("1.2.860.3.16.1.2=", "PINFL=");

  const vo: FtjcCertificate = {
    cardUID: el.cardUID,
    statusInfo: el.statusInfo,
    ownerName: el.ownerName,
    info: el.info,
    serialNumber: getX500Val(x500name_ex, "SERIALNUMBER"),
    validFrom: new Date(getX500Val(x500name_ex, "VALIDFROM")),
    validTo: new Date(getX500Val(x500name_ex, "VALIDTO")),
    CN: getX500Val(x500name_ex, "CN"),
    TIN: getX500Val(x500name_ex, "INN") || getX500Val(x500name_ex, "UID"),
    UID: getX500Val(x500name_ex, "UID"),
    PINFL: getX500Val(x500name_ex, "PINFL"),
    O: getX500Val(x500name_ex, "O"),
    T: getX500Val(x500name_ex, "T"),
    type: "ftjc",
  };

  if (!vo.TIN && !vo.PINFL) return null;
  return vo;
};

// ============================================================================
// EIMZOClient Implementation
// ============================================================================

interface FindKeysError {
  e?: unknown;
  r?: string;
}

export const EIMZOClient: IEIMZOClient = {
  NEW_API: false,
  NEW_API2: false,
  NEW_API3: false,

  API_KEYS: [
    "localhost",
    "96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B",
    "127.0.0.1",
    "A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F",
  ],

  checkVersion(success: VersionSuccessCallback, fail: FailCallback): void {
    CAPIWS.version(
      (_event: MessageEvent, data: CAPIWSVersionResponse) => {
        if (data.success === true) {
          if (data.major && data.minor) {
            const installedVersion =
              parseInt(data.major) * 100 + parseInt(data.minor);
            EIMZOClient.NEW_API = installedVersion >= 336;
            EIMZOClient.NEW_API2 = installedVersion >= 412;
            EIMZOClient.NEW_API3 = installedVersion >= 486;
            success(data.major, data.minor);
          } else {
            fail(null, ERROR_MESSAGES.VERSION_UNDEFINED);
          }
        } else {
          fail(null, data.reason || null);
        }
      },
      (e: unknown) => {
        fail(e, null);
      }
    );
  },

  installApiKeys(success: VoidSuccessCallback, fail: FailCallback): void {
    CAPIWS.apikey(
      EIMZOClient.API_KEYS,
      (_event: MessageEvent, data: CAPIWSBaseResponse) => {
        if (data.success) {
          success();
        } else {
          fail(null, data.reason || null);
        }
      },
      (e: unknown) => {
        fail(e, null);
      }
    );
  },

  listAllUserKeys(
    itemIdGen: ItemIdGenerator,
    itemUiGen: ItemUiGenerator,
    success: ListAllUserKeysSuccessCallback,
    fail: FailCallback
  ): void {
    const items: Certificate[] = [];
    const errors: FindKeysError[] = [];

    if (!EIMZOClient.NEW_API) {
      fail(null, ERROR_MESSAGES.INSTALL_NEW_VERSION);
      return;
    }

    if (EIMZOClient.NEW_API2) {
      findPfxs2(
        itemIdGen,
        itemUiGen,
        items,
        errors,
        (firstItmId2: string | null) => {
          if (items.length === 0 && errors.length > 0) {
            fail(errors[0].e, errors[0].r || null);
          } else {
            const firstId =
              items.length === 1 && firstItmId2 ? firstItmId2 : null;
            success(items, firstId);
          }
        }
      );
    } else {
      findPfxs2(
        itemIdGen,
        itemUiGen,
        items,
        errors,
        (firstItmId2: string | null) => {
          findTokens2(
            itemIdGen,
            itemUiGen,
            items,
            errors,
            (firstItmId3: string | null) => {
              if (items.length === 0 && errors.length > 0) {
                fail(errors[0].e, errors[0].r || null);
              } else {
                let firstId: string | null = null;
                if (items.length === 1) {
                  firstId = firstItmId2 || firstItmId3 || null;
                }
                success(items, firstId);
              }
            }
          );
        }
      );
    }
  },

  idCardIsPLuggedIn(success: BooleanSuccessCallback, fail: FailCallback): void {
    if (!EIMZOClient.NEW_API2) {
      console.log("E-IMZO version should be 4.12 or newer");
      success(false);
      return;
    }

    CAPIWS.callFunction<CAPIWSListReadersResponse>(
      { plugin: "idcard", name: "list_readers" },
      (_event: MessageEvent, data: CAPIWSListReadersResponse) => {
        if (data.success) {
          success((data.readers?.length ?? 0) > 0);
        } else {
          fail(null, data.reason || null);
        }
      },
      (e: unknown) => {
        fail(e, null);
      }
    );
  },

  isBAIKTokenPLuggedIn(
    success: BooleanSuccessCallback,
    fail: FailCallback
  ): void {
    if (!EIMZOClient.NEW_API3) {
      console.log("E-IMZO version should be 4.86 or newer");
      success(false);
      return;
    }

    CAPIWS.callFunction<CAPIWSListBAIKTokensResponse>(
      { plugin: "baikey", name: "list_tokens" },
      (_event: MessageEvent, data: CAPIWSListBAIKTokensResponse) => {
        if (data.success) {
          success((data.tokens?.length ?? 0) > 0);
        } else {
          fail(null, data.reason || null);
        }
      },
      (e: unknown) => {
        fail(e, null);
      }
    );
  },

  isCKCPLuggedIn(success: BooleanSuccessCallback, fail: FailCallback): void {
    if (!EIMZOClient.NEW_API3) {
      console.log("E-IMZO version should be 4.86 or newer");
      success(false);
      return;
    }

    CAPIWS.callFunction<CAPIWSListCKCResponse>(
      { plugin: "ckc", name: "list_ckc" },
      (_event: MessageEvent, data: CAPIWSListCKCResponse) => {
        if (data.success) {
          success((data.devices?.length ?? 0) > 0);
        } else {
          fail(null, data.reason || null);
        }
      },
      (e: unknown) => {
        fail(e, null);
      }
    );
  },

  loadKey(
    itemObject: Certificate,
    success: LoadKeySuccessCallback,
    fail: FailCallback,
    verifyPassword?: boolean
  ): void {
    if (!itemObject) return;

    if (itemObject.type === "pfx") {
      const vo = itemObject as PfxCertificate;
      CAPIWS.callFunction<CAPIWSLoadKeyResponse>(
        {
          plugin: "pfx",
          name: "load_key",
          arguments: [vo.disk, vo.path, vo.name, vo.alias],
        },
        (_event: MessageEvent, data: CAPIWSLoadKeyResponse) => {
          if (data.success && data.keyId) {
            const id = data.keyId;
            if (verifyPassword) {
              CAPIWS.callFunction<CAPIWSBaseResponse>(
                { name: "verify_password", plugin: "pfx", arguments: [id] },
                (_event: MessageEvent, data: CAPIWSBaseResponse) => {
                  if (data.success) {
                    success(id);
                  } else {
                    fail(null, data.reason || null);
                  }
                },
                (e: unknown) => {
                  fail(e, null);
                }
              );
            } else {
              success(id);
            }
          } else {
            fail(null, data.reason || null);
          }
        },
        (e: unknown) => {
          fail(e, null);
        }
      );
    } else if (itemObject.type === "ftjc") {
      const vo = itemObject as FtjcCertificate;
      CAPIWS.callFunction<CAPIWSLoadKeyResponse>(
        { plugin: "ftjc", name: "load_key", arguments: [vo.cardUID] },
        (_event: MessageEvent, data: CAPIWSLoadKeyResponse) => {
          if (data.success && data.keyId) {
            const id = data.keyId;
            if (verifyPassword) {
              CAPIWS.callFunction<CAPIWSBaseResponse>(
                { plugin: "ftjc", name: "verify_pin", arguments: [id, "1"] },
                (_event: MessageEvent, data: CAPIWSBaseResponse) => {
                  if (data.success) {
                    success(id);
                  } else {
                    fail(null, data.reason || null);
                  }
                },
                (e: unknown) => {
                  fail(e, null);
                }
              );
            } else {
              success(id);
            }
          } else {
            fail(null, data.reason || null);
          }
        },
        (e: unknown) => {
          fail(e, null);
        }
      );
    }
  },

  changeKeyPassword(
    itemObject: Certificate,
    success: VoidSuccessCallback,
    fail: FailCallback
  ): void {
    if (!itemObject) return;

    if (itemObject.type === "pfx") {
      const vo = itemObject as PfxCertificate;
      CAPIWS.callFunction<CAPIWSLoadKeyResponse>(
        {
          plugin: "pfx",
          name: "load_key",
          arguments: [vo.disk, vo.path, vo.name, vo.alias],
        },
        (_event: MessageEvent, data: CAPIWSLoadKeyResponse) => {
          if (data.success && data.keyId) {
            const id = data.keyId;
            CAPIWS.callFunction<CAPIWSBaseResponse>(
              { name: "change_password", plugin: "pfx", arguments: [id] },
              (_event: MessageEvent, data: CAPIWSBaseResponse) => {
                if (data.success) {
                  success();
                } else {
                  fail(null, data.reason || null);
                }
              },
              (e: unknown) => {
                fail(e, null);
              }
            );
          } else {
            fail(null, data.reason || null);
          }
        },
        (e: unknown) => {
          fail(e, null);
        }
      );
    } else if (itemObject.type === "ftjc") {
      const vo = itemObject as FtjcCertificate;
      CAPIWS.callFunction<CAPIWSLoadKeyResponse>(
        { plugin: "ftjc", name: "load_key", arguments: [vo.cardUID] },
        (_event: MessageEvent, data: CAPIWSLoadKeyResponse) => {
          if (data.success && data.keyId) {
            const id = data.keyId;
            CAPIWS.callFunction<CAPIWSBaseResponse>(
              { name: "change_pin", plugin: "ftjc", arguments: [id, "1"] },
              (_event: MessageEvent, data: CAPIWSBaseResponse) => {
                if (data.success) {
                  success();
                } else {
                  fail(null, data.reason || null);
                }
              },
              (e: unknown) => {
                fail(e, null);
              }
            );
          } else {
            fail(null, data.reason || null);
          }
        },
        (e: unknown) => {
          fail(e, null);
        }
      );
    }
  },

  createPkcs7(
    id: string,
    data: string,
    _timestamper: null,
    success: Pkcs7SuccessCallback,
    fail: FailCallback,
    detached?: boolean,
    isDataBase64Encoded?: boolean
  ): void {
    let data64: string;
    if (isDataBase64Encoded === true) {
      data64 = data;
    } else {
      data64 = window.Base64.encode(data);
    }

    const detachedArg = detached === true ? "yes" : "no";

    CAPIWS.callFunction<CAPIWSPkcs7Response>(
      {
        plugin: "pkcs7",
        name: "create_pkcs7",
        arguments: [data64, id, detachedArg],
      },
      (_event: MessageEvent, data: CAPIWSPkcs7Response) => {
        if (data.success && data.pkcs7_64) {
          success(data.pkcs7_64);
        } else {
          fail(null, data.reason || null);
        }
      },
      (e: unknown) => {
        fail(e, null);
      }
    );
  },
};

// ============================================================================
// Private Helper Functions
// ============================================================================

function findPfxs2(
  itemIdGen: ItemIdGenerator,
  itemUiGen: ItemUiGenerator,
  items: Certificate[],
  errors: FindKeysError[],
  callback: (firstItemId: string | null) => void
): void {
  let itmkey0: string | null = null;

  CAPIWS.callFunction<CAPIWSListCertificatesResponse>(
    { plugin: "pfx", name: "list_all_certificates" },
    (_event: MessageEvent, data: CAPIWSListCertificatesResponse) => {
      if (data.success && data.certificates) {
        for (let i = 0; i < data.certificates.length; i++) {
          const el = data.certificates[i];
          const vo = parsePfxCertificate(el);
          if (!vo) continue;

          const itmkey = itemIdGen(vo, String(i));
          if (!itmkey0) {
            itmkey0 = itmkey;
          }
          const itm = itemUiGen(itmkey, vo);
          items.push(itm);
        }
      } else {
        errors.push({ r: data.reason });
      }
      callback(itmkey0);
    },
    (e: unknown) => {
      errors.push({ e });
      callback(itmkey0);
    }
  );
}

function findTokens2(
  itemIdGen: ItemIdGenerator,
  itemUiGen: ItemUiGenerator,
  items: Certificate[],
  errors: FindKeysError[],
  callback: (firstItemId: string | null) => void
): void {
  let itmkey0: string | null = null;

  CAPIWS.callFunction<CAPIWSListTokensResponse>(
    { plugin: "ftjc", name: "list_all_keys", arguments: [""] },
    (_event: MessageEvent, data: CAPIWSListTokensResponse) => {
      if (data.success && data.tokens) {
        for (let i = 0; i < data.tokens.length; i++) {
          const el = data.tokens[i];
          const vo = parseFtjcCertificate(el);
          if (!vo) continue;

          const itmkey = itemIdGen(vo, String(i));
          if (!itmkey0) {
            itmkey0 = itmkey;
          }
          const itm = itemUiGen(itmkey, vo);
          items.push(itm);
        }
      } else {
        errors.push({ r: data.reason });
      }
      callback(itmkey0);
    },
    (e: unknown) => {
      errors.push({ e });
      callback(itmkey0);
    }
  );
}
