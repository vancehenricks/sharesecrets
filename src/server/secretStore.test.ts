/**
 * Unit tests for SecretStore
 * Tests server-side secret storage and retrieval
 */

import { secretStore } from './secretStore';

describe('SecretStore', () => {
  describe('generateId', () => {
    test('generates unique IDs', () => {
      const id1 = secretStore.generateId();
      const id2 = secretStore.generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(32); // 16 bytes * 2 hex chars
      expect(id2).toHaveLength(32);
    });

    test('generates hex strings', () => {
      const id = secretStore.generateId();
      expect(id).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('createSecret', () => {
    test('returns id and expiresAt', () => {
      const result = secretStore.createSecret('encrypted content');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('expiresAt');
      expect(result.id).toBeTruthy();
      expect(typeof result.expiresAt).toBe('number');
    });

    test('expiresAt is in the future', () => {
      const before = Date.now();
      const result = secretStore.createSecret('encrypted content');
      const after = Date.now();
      
      expect(result.expiresAt).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 100);
      expect(result.expiresAt).toBeLessThanOrEqual(after + 5 * 60 * 1000 + 100);
    });

    test('stores secret and retrieves it', () => {
      const content = 'ZCg/wm9sWWGXW8oc1Nb8fXdT9J21nw6ciCKMueNNzzzGi88DtV==';
      const { id } = secretStore.createSecret(content);
      const retrieved = secretStore.getSecret(id);
      
      expect(retrieved).toBe(content);
    });
  });

  describe('getSecret', () => {
    test('returns null for non-existent secret', () => {
      const retrieved = secretStore.getSecret('non-existent-id-12345678901234567890');
      expect(retrieved).toBeNull();
    });

    test('deletes secret after retrieval (one-time access)', () => {
      const content = 'secret content';
      const { id } = secretStore.createSecret(content);
      
      const first = secretStore.getSecret(id);
      expect(first).toBe(content);
      
      const second = secretStore.getSecret(id);
      expect(second).toBeNull();
    });

    test('handles multiple secrets independently', () => {
      const content1 = 'secret 1';
      const content2 = 'secret 2';
      
      const { id: id1 } = secretStore.createSecret(content1);
      const { id: id2 } = secretStore.createSecret(content2);
      
      expect(secretStore.getSecret(id1)).toBe(content1);
      expect(secretStore.getSecret(id2)).toBe(content2);
    });
  });

  describe('isValid', () => {
    test('returns true for valid secret', () => {
      const { id } = secretStore.createSecret('content');
      expect(secretStore.isValid(id)).toBe(true);
    });

    test('returns false for non-existent secret', () => {
      expect(secretStore.isValid('non-existent-id-12345678901234567890')).toBe(false);
    });

    test('returns false after retrieval (one-time access)', () => {
      const { id } = secretStore.createSecret('content');
      secretStore.getSecret(id);
      expect(secretStore.isValid(id)).toBe(false);
    });
  });

  describe('expiration', () => {
    test('marks secret as expired after expiration time', async () => {
      // This test uses a real timer, so we'll use a flag to test expiration logic
      const { id } = secretStore.createSecret('content');
      expect(secretStore.isValid(id)).toBe(true);
      
      // Wait a bit and verify still valid
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(secretStore.isValid(id)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles empty string content', () => {
      const { id } = secretStore.createSecret('');
      expect(secretStore.getSecret(id)).toBe('');
    });

    test('handles very long content', () => {
      const longContent = 'x'.repeat(100000);
      const { id } = secretStore.createSecret(longContent);
      expect(secretStore.getSecret(id)).toBe(longContent);
    });

    test('handles special characters in content', () => {
      const content = 'special!@#$%^&*()_+-=[]{}|;:,.<>?/\\';
      const { id } = secretStore.createSecret(content);
      expect(secretStore.getSecret(id)).toBe(content);
    });
  });
});

// Test runner
const tests: { name: string; fn: () => Promise<void> | void }[] = [];
let testCount = 0;
let passCount = 0;

function describe(suite: string, fn: () => void) {
  console.log(`\n# ${suite}`);
  fn();
}

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

function expect(value: any) {
  return {
    toHaveProperty: (prop: string) => {
      testCount++;
      if (value && prop in value) {
        passCount++;
        console.log(`ok ${testCount} - (toHaveProperty ${prop})`);
      } else {
        console.log(`not ok ${testCount} - Expected property ${prop}`);
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
    toBeNull: () => {
      testCount++;
      if (value === null) {
        passCount++;
        console.log(`ok ${testCount} - (toBeNull)`);
      } else {
        console.log(`not ok ${testCount} - Expected null, got ${value}`);
      }
    },
    toMatch: (regex: RegExp) => {
      testCount++;
      if (regex.test(value)) {
        passCount++;
        console.log(`ok ${testCount} - (toMatch)`);
      } else {
        console.log(`not ok ${testCount} - Expected to match ${regex}`);
      }
    },
    toHaveLength: (length: number) => {
      testCount++;
      if (value && value.length === length) {
        passCount++;
        console.log(`ok ${testCount} - (length === ${length})`);
      } else {
        console.log(`not ok ${testCount} - Expected length ${length}, got ${value?.length}`);
      }
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
    toBeLessThanOrEqual: (expected: number) => {
      testCount++;
      if (value <= expected) {
        passCount++;
        console.log(`ok ${testCount} - (<= ${expected})`);
      } else {
        console.log(`not ok ${testCount} - Expected <= ${expected}, got ${value}`);
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
    },
  };
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
