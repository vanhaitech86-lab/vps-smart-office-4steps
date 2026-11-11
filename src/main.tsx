import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Đăng ký Service Worker cho PWA (Cài lên màn hình chính điện thoại & mở khi mạng yếu)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore SW error in dev
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

