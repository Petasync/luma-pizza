import '@testing-library/jest-dom'
import { webcrypto } from 'crypto'
import { TextEncoder, TextDecoder } from 'util'

// jsdom lacks a few web globals our server code relies on. Wire in Node's
// implementations so admin-auth's HMAC (crypto.subtle + TextEncoder) is testable.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.assign(globalThis, { TextEncoder, TextDecoder })
}
