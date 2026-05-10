import { useState } from 'react';
import ShareForm from '../components/ShareForm';
import type { ShareInput } from '../components/ShareForm';
import ShareResult from '../components/ShareResult';
import Footer from '../components/Footer';
import { generateKey, encryptSecret, encryptFile } from '../utils/encryption';

interface SecretData {
  combinedUrl: string;
  expiresAt: number;
}

export default function MainPage() {
  const [secretData, setSecretData] = useState<SecretData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async (input: ShareInput) => {
    if (input.kind === 'text' && !input.content.trim()) {
      alert('Please enter a secret');
      return;
    }

    setLoading(true);
    try {
      const key = generateKey();
      const encryptedContent =
        input.kind === 'text'
          ? await encryptSecret(input.content, key)
          : await encryptFile(input.file, key);

      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedContent }),
      });

      if (!response.ok) throw new Error('Failed to create secret');

      const data = (await response.json()) as { shareUrl: string; expiresAt: number };
      setSecretData({
        combinedUrl: `${data.shareUrl}#k=${key}`,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 md:px-4 py-4">
      <div className="bg-white rounded-lg md:rounded-xl shadow-2xl p-5 md:p-10 max-w-2xl w-full">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Share a Secret</h1>
        {secretData ? (
          <ShareResult
            data={secretData}
            onCreateNew={() => setSecretData(null)}
          />
        ) : (
          <ShareForm onShare={handleShare} loading={loading} />
        )}
        <Footer />
      </div>
    </div>
  );
}
