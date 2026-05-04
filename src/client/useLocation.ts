import { useState, useEffect } from 'react';

export function useLocation() {
  const [location, setLocation] = useState({
    pathname: window.location.pathname,
  });

  useEffect(() => {
    const handlePopState = () => {
      setLocation({ pathname: window.location.pathname });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return location;
}
