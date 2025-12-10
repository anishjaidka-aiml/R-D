// lib/auth/crypto.js
// DEV STUB – NO REAL ENCRYPTION

// No imports at all – especially not from "crypto"

export function encrypt(plainText) {
  if (plainText === null || plainText === undefined) return null;
  return String(plainText); // just store as plain string
}

export function decrypt(cipherText) {
  if (cipherText === null || cipherText === undefined) return null;
  return String(cipherText); // just return it
}
