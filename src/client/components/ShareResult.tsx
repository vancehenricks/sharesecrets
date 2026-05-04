import { useEffect, useState } from 'react';

interface SecretResponse {
  id: string;
  shareUrl: string;
  expiresAt: number;
  expiresIn: number;
}

interface ShareResultProps {
  data: SecretResponse;
  onCreateNew: () => void;
}

export default function ShareResult({ data, onCreateNew }: ShareResultProps) {
  const [expiryTime, setExpiryTime] = useState('5 minutes');
  const [copyLabel, setCopyLabel] = useState('Copy Link');

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

  return (
    <div className="result-container">
      <div className="success-message">
        <h2>Link Generated!</h2>
        <p>Share this link with others:</p>
        <div className="link-container">
          <input
            type="text"
            readOnly
            className="link-input"
            value={data.shareUrl}
          />
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copyLabel}
          </button>
        </div>
        <p className="expiry-info">⏱️ This link expires in <span>{expiryTime}</span></p>
      </div>
      <button 
        className="btn btn-primary" 
        onClick={onCreateNew}
        style={{ marginTop: '20px' }}
      >
        Share Another Secret
      </button>
    </div>
  );
}
