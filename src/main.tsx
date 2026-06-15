import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import furahaLogo from './images/FURAHA-GOLD.png';

const ensureFavicon = () => {
  const setLink = (rel: string, sizes?: string) => {
    let link = document.querySelector(`link[rel='${rel}']${sizes ? `[sizes='${sizes}']` : ''}`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (sizes) link.sizes = sizes;
      document.head.appendChild(link);
    }
    link.href = furahaLogo;
  };
  setLink('icon', '32x32');
  setLink('icon', '192x192');
  setLink('shortcut icon');
  setLink('apple-touch-icon');
  let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = '#f59e0b';
};

ensureFavicon();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
