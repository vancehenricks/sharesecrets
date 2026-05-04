# One-Time Secret (single-app)

Run locally (requires Docker):

```bash
docker compose up --build
```

API endpoints (after build+start):
- `POST /api/create` {ciphertext, nonce, salt, key_hash} -> {id, retrieval_token, creator_token}
- `POST /api/fetch` {id, retrieval_token} -> deleted row (ciphertext/nonce/salt/key_hash)
- `POST /api/revoke` {creator_token} -> deletes related rows

Dokploy: use Dockerfile build type. Set `Dockerfile Path` to `Dockerfile` and `Docker Context Path` to `.`. Provide `DATABASE_URL` and `JWT_SECRET` via Dokploy environment variables.
