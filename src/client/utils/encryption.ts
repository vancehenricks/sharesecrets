// Generate a random 6-digit code (000000-999999)
export function generateCode(): string {
  const code = Math.floor(Math.random() * 1000000);
  return code.toString().padStart(6, '0');
}

// Derive encryption key from 6-digit code
async function deriveKey(code: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt secret with 6-digit code
export async function encryptSecret(secret: string, code: string): Promise<string> {
  const key = await deriveKey(code);
  
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    secretData
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(new Uint8Array(iv), 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Decrypt secret with 6-digit code
export async function decryptSecret(encryptedData: string, code: string): Promise<string> {
  const key = await deriveKey(code);
  
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  try {
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Decryption failed. Invalid code or corrupted data.');
  }
}
