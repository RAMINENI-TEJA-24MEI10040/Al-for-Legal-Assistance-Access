import React, { useState } from 'react';
import { Scale, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('admin@legalease.ai');
  const [password, setPassword] = useState<string>('Admin@123456');
  const [fullName, setFullName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login';
    const payload = isRegister
      ? { email, password, full_name: fullName, organization_name: 'Enterprise Legal Corp' }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Authentication failed');
      }

      const data = await res.json();
      onLoginSuccess(data.access_token, data.user);
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Scale size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} aria-hidden="true" />
          <h1>LegalEase AI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isRegister ? 'Create your enterprise legal account' : 'Sign in to your legal intelligence workspace'}
          </p>
        </div>

        {/* ARIA Live error region */}
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div style={{ backgroundColor: 'var(--risk-high-bg)', color: 'var(--risk-high-text)', border: '1px solid var(--risk-high-border)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegister && (
            <div>
              <label htmlFor="auth-fullname" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="btn btn-secondary"
                  style={{ width: '100%', paddingLeft: '2.5rem', textAlign: 'left', background: 'var(--bg-tertiary)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="counsel@enterprise.com"
                className="btn btn-secondary"
                style={{ width: '100%', paddingLeft: '2.5rem', textAlign: 'left', background: 'var(--bg-tertiary)' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="btn btn-secondary"
                style={{ width: '100%', paddingLeft: '2.5rem', textAlign: 'left', background: 'var(--bg-tertiary)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="btn btn-secondary"
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem' }}
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an enterprise account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};
