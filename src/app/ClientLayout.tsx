'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { Sun, Moon, LogOut, Compass } from 'lucide-react';
import Link from 'next/link';

// Theme Context
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function MainLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');
  const { login, logout, authenticated, user } = usePrivy();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('meridian-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('meridian-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Sync user profile to database on login
  useEffect(() => {
    if (authenticated && user?.email?.address) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email.address,
        }),
      }).catch((err) => console.error('Failed to sync user with DB:', err));
    }
  }, [authenticated, user]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app-container">
        <header className="header">
          <Link href="/" className="logo-container">
            <img src="/logo.svg" alt="Meridian Logo" style={{ width: '2.5rem', height: '2.5rem' }} />
            <span className="logo-text">Meridian</span>
          </Link>
          
          <div className="nav-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme} 
              aria-label="Toggle visual theme"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {authenticated ? (
              <>
                <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  My Offers
                </Link>
                <button 
                  onClick={logout} 
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <button onClick={login} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem' }}>
                Sign In
              </button>
            )}
          </div>
        </header>
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmqmgrlfn00gy0cjmrwpba9q6';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email'], // Only Email login/signup
        appearance: {
          theme: 'light',
          accentColor: '#1cb0f6',
          logo: 'https://raw.githubusercontent.com/dotmantissa/meridian/main/public/logo.png', // Temporary placeholder until created
        },
      }}
    >
      <MainLayout>{children}</MainLayout>
    </PrivyProvider>
  );
}
