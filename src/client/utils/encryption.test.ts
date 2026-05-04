/**
 * Unit tests for encryption utilities
 * Tests client-side encryption and decryption functions
 */

import { generateCode, encryptSecret, decryptSecret } from './encryption';

describe('Encryption Utils', () => {
  describe('generateCode', () => {
    test('generates 6-digit code', () => {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    test('generates codes in valid range', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        const num = parseInt(code);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1000000);
      }
    });

    test('pads with zeros', () => {
      // Test by calling multiple times and checking format
      for (let i = 0; i < 50; i++) {
        const code = generateCode();
        expect(code).toHaveLength(6);
      }
    });
  });

  describe('encryptSecret', () => {
    test('encrypts and returns non-empty string', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    test('encrypted output differs from input', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      expect(encrypted).not.toBe(secret);
      expect(encrypted).not.toContain(secret);
    });

    test('different secrets produce different encryptions', async () => {
      const code = '123456';
      const encrypted1 = await encryptSecret('Secret 1', code);
      const encrypted2 = await encryptSecret('Secret 2', code);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('same secret with same code encrypts differently each time (random IV)', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted1 = await encryptSecret(secret, code);
      const encrypted2 = await encryptSecret(secret, code);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('handles empty string', async () => {
      const encrypted = await encryptSecret('', '123456');
      expect(encrypted).toBeTruthy();
    });

    test('handles special characters', async () => {
      const secret = '!@#$%^&*()_+-=[]{}|;:,.<>?/';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      expect(encrypted).toBeTruthy();
    });

    test('handles unicode characters', async () => {
      const secret = '你好世界 مرحبا بالعالم';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      expect(encrypted).toBeTruthy();
    });

    test('handles long secrets', async () => {
      const secret = 'x'.repeat(10000);
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decryptSecret', () => {
    test('decrypts with correct code', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      const decrypted = await decryptSecret(encrypted, code);
      
      expect(decrypted).toBe(secret);
    });

    test('fails with wrong code', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, '654321')).rejects.toThrow();
    });

    test('round-trip encryption/decryption for various strings', async () => {
      const testCases = [
        'simple text',
        'text with numbers 123456',
        'text with special chars !@#$%',
        'multi\nline\ntext',
        '{"json": "object"}',
        'A'.repeat(1000),
      ];

      for (const secret of testCases) {
        const code = generateCode();
        const encrypted = await encryptSecret(secret, code);
        const decrypted = await decryptSecret(encrypted, code);
        expect(decrypted).toBe(secret);
      }
    });

    test('wrong code produces error with correct message', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      try {
        await decryptSecret(encrypted, '999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Decryption failed');
      }
    });

    test('corrupted encrypted data fails', async () => {
      const code = '123456';
      const corrupted = 'not-valid-base64-or-corrupted-data';
      
      await expect(decryptSecret(corrupted, code)).rejects.toThrow();
    });
  });

  describe('encryption security', () => {
    test('IV is different for each encryption', async () => {
      const secret = 'test';
      const code = '123456';
      
      const encrypted1 = await encryptSecret(secret, code);
      const encrypted2 = await encryptSecret(secret, code);
      
      // Both should decrypt correctly but be different
      const decrypted1 = await decryptSecret(encrypted1, code);
      const decrypted2 = await decryptSecret(encrypted2, code);
      
      expect(decrypted1).toBe(secret);
      expect(decrypted2).toBe(secret);
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('code validation - empty code fails', async () => {
      const secret = 'test';
      const code = generateCode();
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, '')).rejects.toThrow();
    });

    test('code validation - wrong format fails', async () => {
      const secret = 'test';
      const code = generateCode();
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, 'not-a-number')).rejects.toThrow();
    });
  });
});

// Minimal test runner that outputs TAP format
const tests: { name: string; fn: () => Promise<void> }[] = [];
let testCount = 0;
let passCount = 0;

function describe(suite: string, fn: () => void) {
  console.log(`\n# ${suite}`);
  fn();
}

function test(name: string, fn: () => Promise<void>) {
  tests.push({ name, fn });
}

function expect(value: any) {
  return {
    toBeTruthy: () => {
      testCount++;
      if (value) {
        passCount++;
        console.log(`ok ${testCount} ${value !== undefined ? '- ' : ''}(toBeTruthy)`);
      } else {
        console.log(`not ok ${testCount} - Expected truthy, got ${value}`);
      }
    },
    toMatch: (regex: RegExp) => {
      testCount++;
      if (regex.test(value)) {
        passCount++;
        console.log(`ok ${testCount} - (toMatch ${regex})`);
      } else {
        console.log(`not ok ${testCount} - Expected to match ${regex}, got ${value}`);
      }
    },
    toHaveLength: (length: number) => {
      testCount++;
      if (value.length === length) {
        passCount++;
        console.log(`ok ${testCount} - (length === ${length})`);
      } else {
        console.log(`not ok ${testCount} - Expected length ${length}, got ${value.length}`);
      }
    },
    toBe: (expected: any) => {
      testCount++;
      if (value === expected) {
        passCount++;
        console.log(`ok ${testCount} - (toBe)`);
      } else {
        console.log(`not ok ${testCount} - Expected ${expected}, got ${value}`);
      }
    },
    not: {
      toBe: (expected: any) => {
        testCount++;
        if (value !== expected) {
          passCount++;
          console.log(`ok ${testCount} - (not.toBe)`);
        } else {
          console.log(`not ok ${testCount} - Expected not to be ${expected}`);
        }
      },
      toContain: (substring: string) => {
        testCount++;
        if (!value.includes(substring)) {
          passCount++;
          console.log(`ok ${testCount} - (not.toContain)`);
        } else {
          console.log(`not ok ${testCount} - Expected not to contain ${substring}`);
        }
      },
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      testCount++;
      if (value >= expected) {
        passCount++;
        console.log(`ok ${testCount} - (>= ${expected})`);
      } else {
        console.log(`not ok ${testCount} - Expected >= ${expected}, got ${value}`);
      }
    },
    toBeLessThan: (expected: number) => {
      testCount++;
      if (value < expected) {
        passCount++;
        console.log(`ok ${testCount} - (< ${expected})`);
      } else {
        console.log(`not ok ${testCount} - Expected < ${expected}, got ${value}`);
      }
    },
    toReject: async () => {
      testCount++;
      try {
        await value;
        console.log(`not ok ${testCount} - Expected to reject`);
      } catch {
        passCount++;
        console.log(`ok ${testCount} - (toReject)`);
      }
    },
  };
}

async function fail(message: string) {
  throw new Error(message);
}

// Execute tests
(async () => {
  for (const t of tests) {
    try {
      await t.fn();
    } catch (error: any) {
      testCount++;
      console.log(`not ok ${testCount} - ${t.name}: ${error?.message || error}`);
    }
  }
  console.log(`\n1..${testCount}`);
  console.log(`# pass ${passCount}`);
  console.log(`# fail ${testCount - passCount}`);
  process.exit(passCount === testCount ? 0 : 1);
})();
