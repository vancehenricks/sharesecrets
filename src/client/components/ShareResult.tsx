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
        
        {data.code && (
          <>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>⚠️ Important: Share this code separately</p>
              <p style={{ margin: '0 0 10px 0', color: '#856404' }}>The viewer needs this code to decrypt the secret:</p>
              <div className="link-container">
                <input
                  type="text"
                  readOnly
                  className="link-input"
                  value={data.code}
                  style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '2px', textAlign: 'center' }}
                />
                <button className="btn btn-secondary" onClick={handleCopyCode}>
                  {copyCodeLabel}
                </button>
              </div>
            </div>
          </>
        )}
        
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
