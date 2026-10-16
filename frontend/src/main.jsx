import { Capacitor } from '@capacitor/core';
import './mobile';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  Capacitor.isNativePlatform() && !/^https:\/\//.test(import.meta.env.VITE_API_URL || '') ? (
    <main style={{ padding: '48px 24px', maxWidth: 520, margin: 'auto' }}>
      <h1>Shifa Superstore</h1>
      <p>This app build needs a store server address. Configure the HTTPS API URL and rebuild using the mobile setup guide.</p>
    </main>
  ) : <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
