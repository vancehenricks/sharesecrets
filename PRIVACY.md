Privacy Policy

Effective date: 2026-05-05

Summary
OneTimeShare is designed with privacy and minimal data collection in mind. The core principle is zero-trust: encryption and decryption occur entirely in the user's browser. The server never receives plaintext secrets or user passphrases.

What we store
- Ciphertext only: encrypted secret blobs sent by clients.
- Minimal metadata required for operation: creation timestamp, expiration, and one-time access state.
- Short-lived in-memory storage (no persistent database by default).

What we do not collect
- Plaintext secrets or user passphrases.
- Names, emails, or other personal identifiers by default.
- Persistent analytics or user-tracking data.

Logs & debugging
- Short-lived server logs may include request IDs and timestamps for debugging. Logs should not contain plaintext secrets.

Self-hosting
- If you self-host OneTimeShare, you control all data and retention policies. The MIT license permits running and modifying the software to meet your privacy requirements.

Contact
- Report privacy questions or issues via the project repository: https://github.com/vancehenricks/onetimeshare/issues
