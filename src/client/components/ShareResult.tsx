import { useEffect, useState } from 'react';

interface SecretResponse {
  id: string;
  shareUrl: string;
  expiresAt: number;
  expiresIn: number;
  code?: string;
}

interface ShareResultProps {
  data: SecretResponse;
  onCreateNew: () => void;
}

export default function ShareResult({ data, onCreateNew }: ShareResultProps) {
  const [expiryTime, setExpiryTime] = useState('5 minutes');
  const [copyLabel, setCopyLabel] = useState('Copy Link');
  const [copyCodeLabel, setCopyCodeLabel] = useState('Copy Code');

  useEffect(() => {
    const expiresAt = data.expiresAt;

    function updateExpiryDisplay() {
      const secsLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      if (secsLeft <= 0) {
        setExpiryTime('Expired');
      } else {
        setExpiryTime(`${secsLeft} seconds`);
      }
    }

    updateExpiryDisplay();
    const countdownId = window.setInterval(() => {
      updateExpiryDisplay();
    }, 1000);

    return () => clearInterval(countdownId);
  }, [data.expiresAt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.shareUrl).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => {
        setCopyLabel('Copy Link');
      }, 2000);
    });
  };

  const handleCopyCode = () => {
    if (data.code) {
      navigator.clipboard.writeText(data.code).then(() => {
        setCopyCodeLabel('Copied!');
        setTimeout(() => {
          setCopyCodeLabel('Copy Code');
        }, 2000);
      });
    }
  };

  return (
    <div className="w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Link Generated!</h2>
        <p className="text-sm md:text-base text-gray-700 mt-2">Share this link with others:</p>
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-4">
          <input
            type="text"
            readOnly
            className="flex-1 px-3 py-2 border rounded-md bg-white font-mono text-xs md:text-sm break-all"
            value={data.shareUrl}
          />
          <button 
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            onClick={handleCopy}
          >
            {copyLabel}
          </button>
        </div>

        {data.code && (
          <div className="mt-6 p-3 md:p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <p className="m-0 font-semibold text-yellow-800 text-sm md:text-base">⚠️ Important: Share this code separately</p>
            <p className="text-xs md:text-sm text-yellow-800 mt-1">This code is required to decrypt the secret. It is shown only once.</p>
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-4">
              <input
                type="text"
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-white font-mono text-base md:text-lg text-center tracking-widest"
                value={data.code}
              />
              <button 
                className="w-full md:w-auto px-4 py-2 bg-yellow-600 text-white rounded-md font-medium hover:bg-yellow-700 transition-colors"
                onClick={handleCopyCode}
              >
                {copyCodeLabel}
              </button>
            </div>
          </div>
        )}

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
