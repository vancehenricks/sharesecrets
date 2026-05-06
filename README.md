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

### Combined link (optional)
A "combined link" embeds the 6-digit code into the URL fragment so a single link automatically applies the code and reveals the secret in the browser. Example: https://site/s/<id>#c=123456

Why fragment: URL fragments (the part after #) are not sent to the server in HTTP requests, so the server and intermediate proxies do not see the code. This reduces the risk of server-side logging or referrer leakage.

Trade-offs and safety:
- Fragments are accessible to client-side JavaScript, browser extensions, and appear in browser history and screenshots. They can be leaked if a page script or extension reads and transmits them.
- Use combined links only when you trust the recipient and understand they may appear in local history or screenshots.
- If you need maximum privacy, share the link and code separately (default behavior).

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

