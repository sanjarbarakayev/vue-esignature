/**
 * CAPIWS (Crypto API WebSocket) Module
 * Contains Base64 utilities and WebSocket client for E-IMZO communication
 */

import type {
  IBase64,
  ICAPIWS,
  CAPIWSFunctionDef,
  CAPIWSCallback,
  CAPIWSErrorCallback,
  CAPIWSBaseResponse,
  CAPIWSVersionResponse,
} from "../types";

// ============================================================================
// Base64 Utilities
// ============================================================================

/**
 * Initialize Base64 utilities on window object
 * This is required for E-IMZO communication as it uses window.Base64
 */
const initBase64 = (): void => {
  "use strict";

  if (typeof window === "undefined") return;

  const _Base64 = window.Base64;
  const version = "2.1.4";

  const b64chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const b64tab: Record<string, number> = {};
  for (let i = 0; i < b64chars.length; i++) {
    b64tab[b64chars.charAt(i)] = i;
  }

  const fromCharCode = String.fromCharCode;

  const cb_utob = (c: string): string => {
    if (c.length < 2) {
      const cc = c.charCodeAt(0);
      return cc < 0x80
        ? c
        : cc < 0x800
        ? fromCharCode(0xc0 | (cc >>> 6)) + fromCharCode(0x80 | (cc & 0x3f))
        : fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) +
          fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
          fromCharCode(0x80 | (cc & 0x3f));
    } else {
      const cc =
        0x10000 +
        (c.charCodeAt(0) - 0xd800) * 0x400 +
        (c.charCodeAt(1) - 0xdc00);
      return (
        fromCharCode(0xf0 | ((cc >>> 18) & 0x07)) +
        fromCharCode(0x80 | ((cc >>> 12) & 0x3f)) +
        fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
        fromCharCode(0x80 | (cc & 0x3f))
      );
    }
  };

  const re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\x00-\x7F]/g;

  const utob = (u: string): string => {
    return u.replace(re_utob, cb_utob);
  };

  const cb_encode = (ccc: string): string => {
    const padlen = [0, 2, 1][ccc.length % 3];
    const ord =
      (ccc.charCodeAt(0) << 16) |
      ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8) |
      (ccc.length > 2 ? ccc.charCodeAt(2) : 0);
    const chars = [
      b64chars.charAt(ord >>> 18),
      b64chars.charAt((ord >>> 12) & 63),
      padlen >= 2 ? "=" : b64chars.charAt((ord >>> 6) & 63),
      padlen >= 1 ? "=" : b64chars.charAt(ord & 63),
    ];
    return chars.join("");
  };

  const btoa = window.btoa
    ? (b: string): string => window.btoa(b)
    : (b: string): string => b.replace(/[\s\S]{1,3}/g, cb_encode);

  const _encode = (u: string): string => btoa(utob(u));

  const encode = (u: string, urisafe?: boolean): string => {
    return !urisafe
      ? _encode(u)
      : _encode(u)
          .replace(/[+/]/g, (m0: string) => (m0 === "+" ? "-" : "_"))
          .replace(/=/g, "");
  };

  const encodeURI = (u: string): string => encode(u, true);

  const re_btou = new RegExp(
    [
      "[\xC0-\xDF][\x80-\xBF]",
      "[\xE0-\xEF][\x80-\xBF]{2}",
      "[\xF0-\xF7][\x80-\xBF]{3}",
    ].join("|"),
    "g"
  );

  const cb_btou = (cccc: string): string => {
    switch (cccc.length) {
      case 4: {
        const cp =
          ((0x07 & cccc.charCodeAt(0)) << 18) |
          ((0x3f & cccc.charCodeAt(1)) << 12) |
          ((0x3f & cccc.charCodeAt(2)) << 6) |
          (0x3f & cccc.charCodeAt(3));
        const offset = cp - 0x10000;
        return (
          fromCharCode((offset >>> 10) + 0xd800) +
          fromCharCode((offset & 0x3ff) + 0xdc00)
        );
      }
      case 3:
        return fromCharCode(
          ((0x0f & cccc.charCodeAt(0)) << 12) |
            ((0x3f & cccc.charCodeAt(1)) << 6) |
            (0x3f & cccc.charCodeAt(2))
        );
      default:
        return fromCharCode(
          ((0x1f & cccc.charCodeAt(0)) << 6) | (0x3f & cccc.charCodeAt(1))
        );
    }
  };

  const btou = (b: string): string => b.replace(re_btou, cb_btou);

  const cb_decode = (cccc: string): string => {
    const len = cccc.length;
    const padlen = len % 4;
    const n =
      (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0) |
      (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0) |
      (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0) |
      (len > 3 ? b64tab[cccc.charAt(3)] : 0);
    const chars = [
      fromCharCode(n >>> 16),
      fromCharCode((n >>> 8) & 0xff),
      fromCharCode(n & 0xff),
    ];
    chars.length -= [0, 0, 2, 1][padlen];
    return chars.join("");
  };

  const atob = window.atob
    ? (a: string): string => window.atob(a)
    : (a: string): string => a.replace(/[\s\S]{1,4}/g, cb_decode);

  const _decode = (a: string): string => btou(atob(a));

  const decode = (a: string): string => {
    return _decode(
      a
        .replace(/[-_]/g, (m0: string) => (m0 === "-" ? "+" : "/"))
        .replace(/[^A-Za-z0-9+/]/g, "")
    );
  };

  const noConflict = (): IBase64 => {
    const Base64 = window.Base64;
    window.Base64 = _Base64;
    return Base64;
  };

  const Base64: IBase64 = {
    VERSION: version,
    atob,
    btoa,
    fromBase64: decode,
    toBase64: encode,
    utob,
    encode,
    encodeURI,
    btou,
    decode,
    noConflict,
  };

  if (typeof Object.defineProperty === "function") {
    const noEnum = <T>(v: T) => ({
      value: v,
      enumerable: false,
      writable: true,
      configurable: true,
    });

    Base64.extendString = (): void => {
      Object.defineProperty(
        String.prototype,
        "fromBase64",
        noEnum(function (this: string) {
          return decode(this);
        })
      );
      Object.defineProperty(
        String.prototype,
        "toBase64",
        noEnum(function (this: string, urisafe?: boolean) {
          return encode(this, urisafe);
        })
      );
      Object.defineProperty(
        String.prototype,
        "toBase64URI",
        noEnum(function (this: string) {
          return encode(this, true);
        })
      );
    };
  }

  window.Base64 = Base64;
};

// Initialize Base64 on module load
initBase64();

// ============================================================================
// CAPIWS (Crypto API WebSocket Client)
// ============================================================================

const getWebSocketUrl = (): string => {
  if (typeof window === "undefined") return "";
  const isHttps = window.location.protocol.toLowerCase() === "https:";
  return (
    (isHttps ? "wss://127.0.0.1:64443" : "ws://127.0.0.1:64646") +
    "/service/cryptapi"
  );
};

/**
 * CAPIWS - Crypto API WebSocket client for E-IMZO communication
 */
export const CAPIWS: ICAPIWS =
  typeof window !== "undefined" && typeof window.EIMZOEXT !== "undefined"
    ? window.EIMZOEXT
    : {
        URL: getWebSocketUrl(),

        callFunction<T extends CAPIWSBaseResponse>(
          funcDef: CAPIWSFunctionDef,
          callback: CAPIWSCallback<T>,
          error: CAPIWSErrorCallback
        ): void {
          if (typeof window === "undefined" || !window.WebSocket) {
            if (error) error(new Error("WebSocket not supported"));
            return;
          }

          let socket: WebSocket;
          try {
            socket = new WebSocket(this.URL);
          } catch (e) {
            error(e);
            return;
          }

          socket.onclose = (e: CloseEvent): void => {
            if (error && e.code !== 1000) {
              error(e.code);
            }
          };

          socket.onmessage = (event: MessageEvent): void => {
            const data = JSON.parse(event.data) as T;
            socket.close();
            callback(event, data);
          };

          socket.onopen = (): void => {
            socket.send(JSON.stringify(funcDef));
          };
        },

        version(
          callback: CAPIWSCallback<CAPIWSVersionResponse>,
          error: CAPIWSErrorCallback
        ): void {
          if (typeof window === "undefined" || !window.WebSocket) {
            if (error) error(new Error("WebSocket not supported"));
            return;
          }

          let socket: WebSocket;
          try {
            socket = new WebSocket(this.URL);
          } catch (e) {
            error(e);
            return;
          }

          socket.onclose = (e: CloseEvent): void => {
            if (error && e.code !== 1000) {
              error(e.code);
            }
          };

          socket.onmessage = (event: MessageEvent): void => {
            const data = JSON.parse(event.data) as CAPIWSVersionResponse;
            socket.close();
            callback(event, data);
          };

          socket.onopen = (): void => {
            socket.send(JSON.stringify({ name: "version" }));
          };
        },

        apidoc(
          callback: CAPIWSCallback<CAPIWSBaseResponse>,
          error: CAPIWSErrorCallback
        ): void {
          if (typeof window === "undefined" || !window.WebSocket) {
            if (error) error(new Error("WebSocket not supported"));
            return;
          }

          let socket: WebSocket;
          try {
            socket = new WebSocket(this.URL);
          } catch (e) {
            error(e);
            return;
          }

          socket.onclose = (e: CloseEvent): void => {
            if (error && e.code !== 1000) {
              error(e.code);
            }
          };

          socket.onmessage = (event: MessageEvent): void => {
            const data = JSON.parse(event.data) as CAPIWSBaseResponse;
            socket.close();
            callback(event, data);
          };

          socket.onopen = (): void => {
            socket.send(JSON.stringify({ name: "apidoc" }));
          };
        },

        apikey(
          domainAndKey: string[],
          callback: CAPIWSCallback<CAPIWSBaseResponse>,
          error: CAPIWSErrorCallback
        ): void {
          if (typeof window === "undefined" || !window.WebSocket) {
            if (error) error(new Error("WebSocket not supported"));
            return;
          }

          let socket: WebSocket;
          try {
            socket = new WebSocket(this.URL);
          } catch (e) {
            error(e);
            return;
          }

          socket.onclose = (e: CloseEvent): void => {
            if (error && e.code !== 1000) {
              error(e.code);
            }
          };

          socket.onmessage = (event: MessageEvent): void => {
            const data = JSON.parse(event.data) as CAPIWSBaseResponse;
            socket.close();
            callback(event, data);
          };

          socket.onopen = (): void => {
            socket.send(
              JSON.stringify({ name: "apikey", arguments: domainAndKey })
            );
          };
        },
      };

export type { IBase64, ICAPIWS };
