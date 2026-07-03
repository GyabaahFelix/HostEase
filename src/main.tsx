// Suppress unnecessary Vite dev websocket/HMR errors and prevent them from popping up in overlays or logs
if (typeof window !== 'undefined') {
  const isViteWebsocketError = (msg: string | undefined | null): boolean => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('failed to connect') ||
      lower.includes('hmr') ||
      lower.includes('vite')
    );
  };

  // Prevent browser from printing or passing the error to Vite's development error overlay
  window.addEventListener('error', (event) => {
    if (isViteWebsocketError(event.message) || (event.error && isViteWebsocketError(event.error.message))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || (typeof reason === 'string' ? reason : '');
    if (isViteWebsocketError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Also proxy console methods to silence any console noise from these benign connection errors
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && isViteWebsocketError(firstArg)) {
      return;
    }
    originalConsoleError.apply(this, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = function (...args) {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && isViteWebsocketError(firstArg)) {
      return;
    }
    originalConsoleWarn.apply(this, args);
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

