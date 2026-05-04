CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  nonce TEXT NOT NULL,
  salt TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  retrieval_token TEXT NOT NULL UNIQUE,
  creator_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read BOOLEAN DEFAULT false,
  revoked BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_secrets_expires ON secrets (expires_at);
