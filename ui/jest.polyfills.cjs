// Runs before any test module is imported. Adds Web Platform globals that
// jest-environment-jsdom does not expose, but our code (and Vite-supported
// browser APIs) rely on.

const { TextEncoder, TextDecoder } = require("util");
if (typeof globalThis.TextEncoder === "undefined") globalThis.TextEncoder = TextEncoder;
if (typeof globalThis.TextDecoder === "undefined") globalThis.TextDecoder = TextDecoder;

// Web Crypto: jsdom defines a partial `crypto` (no `subtle`). Node ships a
// full implementation under crypto.webcrypto. Replace with defineProperty so
// jsdom's non-writable getter doesn't silently block assignment.
if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.subtle === "undefined") {
  const { webcrypto } = require("crypto");
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto,
  });
}
