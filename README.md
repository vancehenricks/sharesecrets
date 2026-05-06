# Share Secrets

Share Secrets makes it trivial to share secrets safely with a single-use link. Links expire by default after 5 minutes and can only be viewed once.

Key idea: Zero-trust by design — all encryption and decryption happen in the browser. The server stores only ciphertext and never sees plaintext or the user's passphrase.

## Features
- Client-side encryption (AES-256-GCM) — secrets are encrypted in-browser before upload
- File uploads (client-side encrypted) — upload files up to 1 MB; files are encrypted in-browser and stored as ciphertext just like text secrets
- One-time access: a secret can be retrieved exactly once
- Automatic expiration (default: 5 minutes)
- Minimal server: in-memory storage, no persistent database required
- Open source (MIT)

## Security & privacy
- Zero-trust server: the server stores ciphertext only. If the server is compromised, attackers cannot read secrets without the client-side key.
- Secrets are decrypted only in the browser. Do not send passphrases or plaintext to the server.
- Follow safe sharing practices: transmit the share link and the code separately when sharing.

## Quickstart

Prerequisites
- Node.js 18+
- npm

Install and run
```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start the server
npm start
```
Visit: http://localhost:3000

Demo: https://sharesecrets.cornerofthe.net

Development
```bash
npm install
npm run dev          # full dev (server + client)
npm run dev:client   # frontend only
npm run build:client  # build frontend
npm run build:server  # compile server
```

## API (overview)
- POST /api/secrets — upload ciphertext (client encrypts). Supports encrypted text or file payloads (files up to 1 MB); returns share id and metadata
- GET /api/secrets/:id — retrieve ciphertext (server deletes after first read)
- GET /api/secrets/:id/check — check if id is valid / not expired


### This project is released under the MIT License. See LICENSE for details.

