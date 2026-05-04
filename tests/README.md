# OneTimeShare Tests

This directory contains unit tests and integration tests for the OneTimeShare application.

## Test Files

### Unit Tests

1. **`src/client/utils/encryption.test.ts`** - Client-side encryption utilities
   - Tests code generation (6-digit format)
   - Tests encryption/decryption round-trips
   - Tests security properties (wrong code rejection, IV randomness)
   - Tests edge cases (empty strings, special characters, unicode, long strings)

2. **`src/server/secretStore.test.ts`** - Server-side secret storage
   - Tests ID generation uniqueness
   - Tests secret creation and retrieval
   - Tests one-time access enforcement
   - Tests expiration logic
   - Tests edge cases (empty content, long content, special characters)

### Integration Tests

1. **`tests/integration.sh`** - API endpoint integration tests
   - Tests all API endpoints with curl
   - Tests success scenarios (create, retrieve, check)
   - Tests error scenarios (invalid input, missing content, non-existent secrets)
   - Tests one-time access enforcement
   - Tests HTTP status codes
   - Tests response JSON validity
   - Tests share URL format
   - Color-coded output with pass/fail summary

2. **`tests/e2e-encryption.sh`** - End-to-end encryption/decryption
   - Tests full encryption/decryption flow
   - Tests with various data types (simple text, passwords, JSON, unicode, etc.)
   - Tests correct code validation
   - Tests wrong code rejection

## Running Tests

### Prerequisites

```bash
npm install
npm run build
```

### Run All Tests

```bash
npm test
```

This runs:
1. `npm run test:e2e` - End-to-end encryption tests
2. `npm run test:integration` - API integration tests

### Run Specific Tests

```bash
# End-to-end encryption tests only
npm run test:e2e

# API integration tests only (requires server running)
npm run test:integration

# Start server and run integration tests
npm run build && node dist/server.js &
sleep 2
npm run test:integration
```

## Test Coverage

### Encryption Utilities (`encryption.test.ts`)
- ✓ Code generation (6-digit format, range validation, zero padding)
- ✓ Encryption produces non-empty output different from input
- ✓ Different secrets produce different encryptions
- ✓ Same secret with same code produces different encryptions (random IV)
- ✓ Special characters, unicode, and long strings
- ✓ Decryption with correct code
- ✓ Wrong code rejection with proper error message
- ✓ Corrupted data rejection
- ✓ Round-trip encryption/decryption for various inputs
- ✓ IV is different for each encryption

### Secret Store (`secretStore.test.ts`)
- ✓ Unique ID generation (hex format)
- ✓ Create and retrieve secrets
- ✓ Expiration timestamp calculation
- ✓ One-time access enforcement (delete after retrieval)
- ✓ Multiple secrets handled independently
- ✓ Non-existent secret handling
- ✓ Edge cases (empty, long, special characters)

### API Integration Tests (`integration.sh`)
- ✓ Server connectivity check
- ✓ POST /api/secrets - Create secret
  - Valid encrypted content accepted
  - Response contains id, shareUrl, expiresAt
- ✓ POST /api/secrets - Error handling
  - Rejects missing encryptedContent
  - Rejects empty encryptedContent
- ✓ GET /api/secrets/:id - Retrieve secret
  - Returns encrypted content
  - One-time access enforced (fails on second retrieval)
- ✓ GET /api/secrets/:id - Error handling
  - 404 for non-existent secret
- ✓ GET /api/secrets/:id/check - Validity check
  - Returns valid:true for new secrets
  - Returns valid:false after retrieval
- ✓ Multiple secrets stored independently
- ✓ HTTP status codes (200, 404)
- ✓ Share URL format and validity
- ✓ JSON response validity

## Example Test Output

### Integration Tests

```
╔════════════════════════════════════════╗
║  OneTimeShare API Integration Tests   ║
╚════════════════════════════════════════╝

## Server Connectivity
→ Checking if server is running on http://localhost:3000
✓ Server is reachable

## POST /api/secrets - Create Secret
→ Creating secret with encrypted content
✓ Response contains id
✓ Response contains shareUrl
✓ Response contains expiresAt
✓ Extracted secret ID: b5c5bcc8fb413960ab0bf6fbd09c7c14

## GET /api/secrets/:id - Retrieve Secret
→ Retrieving secret with ID: b5c5bcc8fb413960ab0bf6fbd09c7c14
✓ Response contains encrypted content
✓ Retrieved encrypted content: ZCg/wm9sWWGXW8oc1Nb8fXdT9J21nw6...

## One-Time Access Enforcement
→ Creating new secret for one-time access test
→ Retrieving secret first time
✓ First retrieval successful
→ Attempting second retrieval (should fail)
✓ Second retrieval correctly rejected (one-time access enforced)

## Test Summary
Total tests: 42
Passed: 42
Failed: 0

✓ All tests passed!
```

### End-to-End Encryption Tests

```
╔════════════════════════════════════════════════╗
║  End-to-End Encryption/Decryption Test        ║
╚════════════════════════════════════════════════╝

Running encryption/decryption tests...

✓ Simple text - Correct decryption
  └─ Wrong code correctly rejected
✓ Password - Correct decryption
  └─ Wrong code correctly rejected
✓ JSON - Correct decryption
  └─ Wrong code correctly rejected
✓ Multi-line - Correct decryption
  └─ Wrong code correctly rejected
✓ Unicode - Correct decryption
  └─ Wrong code correctly rejected
✓ Empty string - Correct decryption
  └─ Wrong code correctly rejected
✓ Long string - Correct decryption
  └─ Wrong code correctly rejected

════════════════════════════════════════

Results: 14 passed, 0 failed

✓ All end-to-end tests passed!
```

## Architecture

The tests validate the complete encryption flow:

1. **Client-side Code Generation**: 6-digit code generated (000000-999999)
2. **Client-side Encryption**: AES-256-GCM using code-derived key
3. **Server Storage**: Only encrypted content stored (no code, no plain text)
4. **Viewer Retrieval**: Encrypted content downloaded
5. **Client-side Decryption**: Decrypted only with correct 6-digit code

The server never has access to:
- The original secret
- The 6-digit decryption code
- Any unencrypted data

## Test Environment

- Node.js 18+
- Modern browser with Web Crypto API support
- curl (for integration tests)
- Bash shell

## Notes

- Unit tests are written to be runnable with minimal test framework dependencies
- Integration tests use curl for maximum compatibility and no dependencies
- Tests include color-coded output for easy result identification
- All tests are idempotent and can be run multiple times
