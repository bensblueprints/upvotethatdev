import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import faviconPng from '../resources/seperator.png';

function ensureFavicon(href: string) {
  const existing =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');

  const link = existing ?? document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = href;

  if (!existing) {
    document.head.appendChild(link);
  }
}

ensureFavicon(faviconPng);

createRoot(document.getElementById('root')!).render(<App />);
