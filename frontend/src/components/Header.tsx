import React from 'react';
import { ShieldAlert, Sun, Moon, Eye, Scale, HelpCircle, CheckCircle2, Workflow, FileText } from 'lucide-react';

interface HeaderProps {
  theme: string;
  setTheme: (theme: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
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
          padding: '0.4rem 1rem', 
          fontSize: '0.82rem', 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center'
        }}
      >
        <ShieldAlert size={16} aria-hidden="true" />
        <span>LegalEase AI provides informational assistance and does NOT provide formal legal advice. Consult qualified counsel for binding decisions.</span>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Scale size={28} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', lineHeight: 1.1 }}>LegalEase AI</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>AI for Legal Assistance Access</span>
          </div>
        </div>

        {/* ARIA Navigation Landmark */}
        <nav aria-label="Main Navigation">
          <ul style={{ display: 'flex', listStyle: 'none', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'documents', label: 'Documents & Overview', icon: FileText },
              { id: 'compare', label: 'Contract Compare', icon: Workflow },
              { id: 'qa', label: 'Evidence Q&A', icon: HelpCircle },
              { id: 'lawyer-brief', label: 'Lawyer Brief', icon: CheckCircle2 }
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                      color: activeTab === tab.id ? '#ffffff' : 'var(--text-primary)',
                      borderColor: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.88rem'
                    }}
                  >
                    <IconComp size={15} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
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
            {theme === 'dark' && <Moon size={16} aria-hidden="true" />}
            {theme === 'light' && <Sun size={16} aria-hidden="true" />}
            {theme === 'high-contrast' && <Eye size={16} aria-hidden="true" />}
            <span style={{ fontSize: '0.8rem' }}>{theme.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

