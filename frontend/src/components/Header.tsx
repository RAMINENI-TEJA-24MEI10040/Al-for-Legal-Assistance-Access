import React from 'react';
import { ShieldAlert, Sun, Moon, Eye, Scale } from 'lucide-react';

interface HeaderProps {
  theme: string;
  setTheme: (theme: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme, activeTab, setActiveTab }) => {
  return (
    <header className="app-header" role="banner" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
      {/* Mandatory Legal Disclaimer Banner */}
      <div 
        role="region" 
        aria-label="Legal Disclaimer" 
        style={{ 
          background: '#991b1b', 
          color: '#ffffff', 
          padding: '0.5rem 1rem', 
          fontSize: '0.85rem', 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center'
        }}
      >
        <ShieldAlert size={18} aria-hidden="true" />
        <span>LegalEase AI provides information assistance and does NOT provide legal advice. Consult qualified counsel for legal decisions.</span>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Scale size={28} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
          <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>LegalEase AI</span>
        </div>

        {/* ARIA Navigation Landmark */}
        <nav aria-label="Main Navigation">
          <ul style={{ display: 'flex', listStyle: 'none', gap: '0.5rem' }}>
            {['documents', 'compare', 'qa', 'lawyer-brief'].map((tab) => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  aria-current={activeTab === tab ? 'page' : undefined}
                  className="btn btn-secondary"
                  style={{
                    backgroundColor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === tab ? '#ffffff' : 'var(--text-primary)',
                    borderColor: activeTab === tab ? 'var(--accent-primary)' : 'var(--border-color)',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab.replace('-', ' ')}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Accessibility Theme Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} role="group" aria-label="Accessibility Theme Toggle">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'high-contrast' : 'dark')}
            className="btn btn-secondary"
            aria-label={`Current Theme: ${theme}. Click to switch theme.`}
            title="Toggle Light / Dark / High Contrast Theme"
          >
            {theme === 'dark' && <Moon size={18} aria-hidden="true" />}
            {theme === 'light' && <Sun size={18} aria-hidden="true" />}
            {theme === 'high-contrast' && <Eye size={18} aria-hidden="true" />}
            <span style={{ fontSize: '0.85rem' }}>{theme.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
