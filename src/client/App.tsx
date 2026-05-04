import { useEffect, useState } from 'react';
import { useLocation } from './useLocation';
import MainPage from './pages/MainPage';
import ViewPage from './pages/ViewPage';
import './style.css';

export default function App() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/share/')) {
    const secretId = pathname.substring(7);
    return <ViewPage secretId={secretId} />;
  }

  return <MainPage />;
}
