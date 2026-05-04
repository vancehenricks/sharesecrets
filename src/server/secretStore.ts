import crypto from 'crypto';

export interface Secret {
  id: string;
  encryptedContent: string;
  createdAt: number;
  expiresAt: number;
}

class SecretStore {
  private secrets: Map<string, Secret> = new Map();
  private readonly EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

  generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  createSecret(encryptedContent: string): { id: string; expiresAt: number } {
    const id = this.generateId();
    const now = Date.now();
    const expiresAt = now + this.EXPIRATION_TIME;

    const secret: Secret = {
      id,
      encryptedContent,
      createdAt: now,
      expiresAt
    };

    this.secrets.set(id, secret);

    // Auto-cleanup after expiration
    setTimeout(() => {
      this.secrets.delete(id);
    }, this.EXPIRATION_TIME);

    return { id, expiresAt };
  }

  getSecret(id: string): string | null {
    const secret = this.secrets.get(id);

    if (!secret) {
      return null;
    }

    if (Date.now() > secret.expiresAt) {
      this.secrets.delete(id);
      return null;
    }

    // Delete after retrieving (one-time access)
    this.secrets.delete(id);
    return secret.encryptedContent;
  }

  isValid(id: string): boolean {
    const secret = this.secrets.get(id);
    if (!secret) return false;
    return Date.now() <= secret.expiresAt;
  }
}

export const secretStore = new SecretStore();
