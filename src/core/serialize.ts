import type { Ledger } from "./types";

export function serializeLedger(ledger: Ledger): string {
  const serialized = new TextEncoder().encode(JSON.stringify(ledger));
  const serializedStr = Array.from(serialized)
    .map((byte) => String.fromCodePoint(byte))
    .join("");
  return btoa(serializedStr)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function deserializeLedger(serialized: string): Ledger {
  const padding = (4 - (serialized.length % 4)) % 4;
  const base64 = serialized
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(serialized.length + padding, "=");
  const ledgerStr = new TextDecoder().decode(
    Uint8Array.from(atob(base64), (m) => m.codePointAt(0)!),
  );
  return JSON.parse(ledgerStr);
}
