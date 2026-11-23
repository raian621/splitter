import type { Ledger } from "./types";

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  writer.write(data as BufferSource).catch(() => {});
  writer.close().catch(() => {});

  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  writer.write(data as BufferSource).catch(() => {});
  writer.close().catch(() => {});

  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const str = Array.from(bytes)
    .map((byte) => String.fromCodePoint(byte))
    .join("");
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToBytes(base64url: string): Uint8Array {
  const padding = (4 - (base64url.length % 4)) % 4;
  const base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(base64url.length + padding, "=");
  return Uint8Array.from(atob(base64), (m) => m.codePointAt(0)!);
}

export async function serializeLedger(ledger: Ledger): Promise<string> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(ledger));
  const compressed = await compress(jsonBytes);
  return bytesToBase64Url(compressed);
}

export async function deserializeLedger(serialized: string): Promise<Ledger> {
  const compressed = base64UrlToBytes(serialized);
  const jsonBytes = await decompress(compressed);
  const json = new TextDecoder().decode(jsonBytes);
  return JSON.parse(json);
}
