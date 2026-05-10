import { useEffect, useState } from 'react';

interface SecretData {
  combinedUrl: string;
  expiresAt: number;
}

interface ShareResultProps {
  data: SecretData;
  onCreateNew: () => void;
}

export default function ShareResult({ data, onCreateNew }: ShareResultProps) {
  const [expiryTime, setExpiryTime] = useState('5 minutes');
  const [copyLabel, setCopyLabel] = useState('Copy Link');

  useEffect(() => {
    const expiresAt = data.expiresAt;

    function updateExpiryDisplay() {
      const secsLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setExpiryTime(secsLeft <= 0 ? 'Expired' : `${secsLeft} seconds`);
    }

    updateExpiryDisplay();
    const countdownId = window.setInterval(updateExpiryDisplay, 1000);
    return () => clearInterval(countdownId);
  }, [data.expiresAt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.combinedUrl).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy Link'), 2000);
    });
  };

  return (
    <div className="w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Link Generated!</h2>
        <p className="text-sm md:text-base text-gray-700 mt-2">Share this link with the recipient:</p>
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-4">
          <input
            type="text"
            readOnly
            className="flex-1 px-3 py-2 border rounded-md bg-white font-mono text-xs md:text-sm break-all"
            value={data.combinedUrl}
          />
          <button
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            onClick={handleCopy}
          >
            {copyLabel}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-3">The decryption key is embedded in the link after <span className="font-mono">#</span> and is never sent to the server.</p>
        <p className="text-xs md:text-sm text-gray-600 mt-4">⏱️ This link expires in <span className="font-medium">{expiryTime}</span></p>
      </div>

      <div className="mt-4">
        <button
          className="w-full px-4 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md font-medium hover:shadow-lg transition-shadow"
          onClick={onCreateNew}
        >
          Share Another Secret
        </button>
      </div>
    </div>
  );
}
