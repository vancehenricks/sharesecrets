import { useState } from 'react';
import ShareForm from '../components/ShareForm';
import ShareResult from '../components/ShareResult';
import { generateCode, encryptSecret } from '../utils/encryption';

interface SecretResponse {
  id: string;
  shareUrl: string;
  expiresAt: number;
  expiresIn: number;
  code?: string;
}

export default function MainPage() {
  const [secretData, setSecretData] = useState<SecretResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async (content: string) => {
    if (!content.trim()) {
      alert('Please enter a secret');
      return;
    }

    setLoading(true);
    try {
      // Generate code and encrypt content on client-side
      const code = generateCode();
      const encryptedContent = await encryptSecret(content, code);

      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedContent }),
      });

      if (!response.ok) throw new Error('Failed to create secret');

      const data = (await response.json()) as SecretResponse;
      data.code = code;
      setSecretData(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Share a Secret</h1>
        <p className="description">
          Share sensitive information via a one-time link. Links expire in 5 minutes.
        </p>

        {secretData ? (
          <ShareResult 
            data={secretData} 
            onCreateNew={() => setSecretData(null)}
          />
        ) : (
          <ShareForm onShare={handleShare} loading={loading} />
        )}
      </div>
    </div>
  );
}
