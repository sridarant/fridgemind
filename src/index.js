import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Service worker removed — caused stale UI and forced page reloads on update.
// Unregisters any previously installed SW on first load.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
