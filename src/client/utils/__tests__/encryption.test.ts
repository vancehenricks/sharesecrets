import { generateKey, encryptSecret, decryptSecret, encryptFile, isFilePayload, parseFilePayload } from '../encryption';

describe('Encryption Utils', () => {
  describe('generateKey', () => {
    it('generates a base64url string', () => {
      const key = generateKey();
      expect(typeof key).toBe('string');
      expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates 32-byte keys (43 base64url chars)', () => {
      const key = generateKey();
      expect(key.length).toBe(43);
    });

    it('generates unique keys each time', () => {
      const keys = new Set(Array.from({ length: 20 }, generateKey));
      expect(keys.size).toBe(20);
    });
  });

  describe('encryptSecret', () => {
    it('encrypts and returns non-empty string', async () => {
      const encrypted = await encryptSecret('My secret', generateKey());
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
    });

    it('encrypted output differs from input', async () => {
      const secret = 'My secret';
      const encrypted = await encryptSecret(secret, generateKey());
      expect(encrypted).not.toBe(secret);
      expect(encrypted).not.toContain(secret);
    });

    it('different secrets produce different encryptions', async () => {
      const key = generateKey();
      const encrypted1 = await encryptSecret('Secret 1', key);
      const encrypted2 = await encryptSecret('Secret 2', key);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('same secret with same key encrypts differently each time (random IV)', async () => {
      const key = generateKey();
      const encrypted1 = await encryptSecret('My secret', key);
      const encrypted2 = await encryptSecret('My secret', key);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('handles empty string', async () => {
      const encrypted = await encryptSecret('', generateKey());
      expect(encrypted).toBeTruthy();
    });

    it('handles special characters', async () => {
      const encrypted = await encryptSecret('!@#$%^&*()_+-=[]{}|;:,.<>?/', generateKey());
      expect(encrypted).toBeTruthy();
    });

    it('handles unicode characters', async () => {
      const encrypted = await encryptSecret('你好世界 مرحبا بالعالم', generateKey());
      expect(encrypted).toBeTruthy();
    });

    it('handles long secrets', async () => {
      const encrypted = await encryptSecret('x'.repeat(10000), generateKey());
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decryptSecret', () => {
    it('decrypts with correct key', async () => {
      const secret = 'My secret';
      const key = generateKey();
      const encrypted = await encryptSecret(secret, key);
      const decrypted = await decryptSecret(encrypted, key);
      expect(decrypted).toBe(secret);
    });

    it('fails with wrong key', async () => {
      const encrypted = await encryptSecret('My secret', generateKey());
      await expect(decryptSecret(encrypted, generateKey())).rejects.toThrow();
    });

    it('round-trip encryption/decryption for various strings', async () => {
      const testCases = [
        'simple text',
        'text with numbers 123456',
        'text with special chars !@#$%',
        'multi\nline\ntext',
        '{"json": "object"}',
        'A'.repeat(1000),
      ];

      for (const secret of testCases) {
        const key = generateKey();
        const encrypted = await encryptSecret(secret, key);
        const decrypted = await decryptSecret(encrypted, key);
        expect(decrypted).toBe(secret);
      }
    });

    it('wrong key produces error with correct message', async () => {
      const encrypted = await encryptSecret('My secret', generateKey());
      await expect(decryptSecret(encrypted, generateKey())).rejects.toThrow('Decryption failed');
    });

    it('corrupted encrypted data fails', async () => {
      await expect(decryptSecret('not-valid-base64-or-corrupted-data', generateKey())).rejects.toThrow();
    });
  });

  describe('encryption security', () => {
    it('IV is different for each encryption', async () => {
      const key = generateKey();
      const encrypted1 = await encryptSecret('test', key);
      const encrypted2 = await encryptSecret('test', key);
      expect(await decryptSecret(encrypted1, key)).toBe('test');
      expect(await decryptSecret(encrypted2, key)).toBe('test');
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('file encryption', () => {
    it('encrypts and decrypts small binary file', async () => {
      const key = generateKey();
      const file = new File([new Uint8Array([1,2,3,4,5])], 'test.bin', { type: 'application/octet-stream' });
      const encrypted = await encryptFile(file, key);

      const decryptedJson = await decryptSecret(encrypted, key);
      expect(isFilePayload(decryptedJson)).toBe(true);

      const payload = parseFilePayload(decryptedJson);
      expect(payload.name).toBe('test.bin');
      expect(payload.mimeType).toBe('application/octet-stream');

      const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
      expect(Array.from(bytes)).toEqual([1,2,3,4,5]);
    });

    it('handles empty text file', async () => {
      const key = generateKey();
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      const encrypted = await encryptFile(file, key);

      const decryptedJson = await decryptSecret(encrypted, key);
      expect(isFilePayload(decryptedJson)).toBe(true);

      const payload = parseFilePayload(decryptedJson);
      expect(payload.name).toBe('empty.txt');
      expect(atob(payload.data)).toBe('');
    });

    it('handles large file (near 1MB limit)', async () => {
      const key = generateKey();
      const largeBuffer = new Uint8Array(900 * 1024);
      largeBuffer.fill(0xAB);
      const file = new File([largeBuffer], 'large.bin', { type: 'application/octet-stream' });

      const encrypted = await encryptFile(file, key);
      const decryptedJson = await decryptSecret(encrypted, key);
      expect(isFilePayload(decryptedJson)).toBe(true);

      const payload = parseFilePayload(decryptedJson);
      const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
      expect(bytes.length).toBe(900 * 1024);
      expect(bytes[0]).toBe(0xAB);
    });

    it('preserves special characters in file name', async () => {
      const key = generateKey();
      const file = new File(['data'], 'my file (1) [final].txt', { type: 'text/plain' });
      const encrypted = await encryptFile(file, key);

      const decryptedJson = await decryptSecret(encrypted, key);
      const payload = parseFilePayload(decryptedJson);
      expect(payload.name).toBe('my file (1) [final].txt');
    });

    it('uses application/octet-stream when file type is empty', async () => {
      const key = generateKey();
      const file = new File(['data'], 'noextension', { type: '' });
      const encrypted = await encryptFile(file, key);

      const decryptedJson = await decryptSecret(encrypted, key);
      const payload = parseFilePayload(decryptedJson);
      expect(payload.mimeType).toBe('application/octet-stream');
    });
  });

  describe('isFilePayload', () => {
    it('returns true for valid file payload JSON', () => {
      const json = JSON.stringify({ type: 'file', name: 'f.txt', mimeType: 'text/plain', data: '' });
      expect(isFilePayload(json)).toBe(true);
    });

    it('returns false for plain text (not JSON)', () => {
      expect(isFilePayload('hello world')).toBe(false);
    });

    it('returns false for invalid JSON', () => {
      expect(isFilePayload('{invalid json')).toBe(false);
    });

    it('returns false for JSON object without type field', () => {
      expect(isFilePayload(JSON.stringify({ name: 'f.txt' }))).toBe(false);
    });

    it('returns false for JSON object with wrong type value', () => {
      expect(isFilePayload(JSON.stringify({ type: 'text', name: 'f.txt' }))).toBe(false);
    });

    it('returns false for JSON array', () => {
      expect(isFilePayload(JSON.stringify([1, 2, 3]))).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isFilePayload('')).toBe(false);
    });
  });

  describe('parseFilePayload', () => {
    it('parses valid file payload', () => {
      const payload = { type: 'file', name: 'test.txt', mimeType: 'text/plain', data: btoa('hello') };
      const result = parseFilePayload(JSON.stringify(payload));
      expect(result.name).toBe('test.txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.data).toBe(btoa('hello'));
    });

    it('throws on invalid JSON', () => {
      expect(() => parseFilePayload('{invalid')).toThrow();
    });

    it('returns object even if fields are missing (type cast)', () => {
      const result = parseFilePayload(JSON.stringify({ type: 'file' }));
      expect(result).toBeDefined();
      expect(result.name).toBeUndefined();
    });
  });
});
