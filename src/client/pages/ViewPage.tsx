import { useEffect, useState } from 'react';

interface SecretContentResponse {
  content: string;
}

interface ViewPageProps {
  secretId: string;
}

type LoadingState = 'loading' | 'success' | 'error';

export default function ViewPage({ secretId }: ViewPageProps) {
  const [state, setState] = useState<LoadingState>('loading');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSecret(secretId)
      .then((content) => {
        setContent(content);
        setState('success');
      })
      .catch((error) => {
        setError(error.message);
        setState('error');
      });
  }, [secretId]);

  async function fetchSecret(id: string): Promise<string> {
    const response = await fetch(`/api/secrets/${id}`);

    if (response.status === 404) {
      throw new Error('Secret not found or has expired.');
    }

    if (!response.ok) {
      throw new Error('Failed to retrieve secret.');
    }

    const data = (await response.json()) as SecretContentResponse;
    return data.content;
  }

  return (
    <div className="container">
      <div className="card">
        <h1>View Secret</h1>
        
        {state === 'loading' && (
          <div className="loading">
            <p>Loading secret...</p>
          </div>
        )}

        {state === 'success' && (
          <div className="secret-container">
            <div className="secret-content">
              <h2>Secret Content:</h2>
              <div className="content-box">
                <pre>{content}</pre>
              </div>
              <p className="info-message">
                ℹ️ This secret has been viewed and can no longer be accessed.
              </p>
              <a href="/" className="btn btn-primary">
                Share Another Secret
              </a>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="error-container">
            <div className="error-message">
              <h2>Secret Not Found</h2>
              <p>{error}</p>
              <a href="/" className="btn btn-primary">
                Create a New Secret
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
