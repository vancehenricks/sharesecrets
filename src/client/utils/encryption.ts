function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function uint8ToBase64url(bytes: Uint8Array): string {
  return uint8ToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToUint8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate a random 256-bit encryption key as base64url
export function generateKey(): string {
  return uint8ToBase64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function importKey(keyB64url: string): Promise<CryptoKey> {
  const keyBytes = base64urlToUint8(keyB64url);
  return crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(secret: string, key: string): Promise<string> {
  const cryptoKey = await importKey(key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(secret)
  );
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  return uint8ToBase64(combined);
}

export async function decryptSecret(encryptedData: string, key: string): Promise<string> {
  const cryptoKey = await importKey(key);
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  try {
    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);
    return new TextDecoder().decode(decryptedData);
  } catch {
    throw new Error('Decryption failed. Invalid key or corrupted data.');
  }
}

export interface FilePayload {
  type: 'file';
  name: string;
  mimeType: string;
  data: string; // base64-encoded raw file bytes
}

export async function encryptFile(file: File, key: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBase64 = uint8ToBase64(new Uint8Array(arrayBuffer));
  const payload: FilePayload = {
    type: 'file',
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    data: fileBase64,
  };
  return encryptSecret(JSON.stringify(payload), key);
}

export function isFilePayload(content: string): boolean {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return parsed?.type === 'file';
  } catch {
    return false;
  }
}

export function parseFilePayload(content: string): FilePayload {
  return JSON.parse(content) as FilePayload;
}
