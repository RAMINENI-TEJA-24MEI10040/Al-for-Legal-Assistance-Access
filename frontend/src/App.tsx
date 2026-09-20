import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentDashboard } from './components/DocumentDashboard';
import { DocumentViewer } from './components/DocumentViewer';
import { DocumentComparison } from './components/DocumentComparison';
import { QAPanel } from './components/QAPanel';
import { LawyerBriefView } from './components/LawyerBriefView';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { LoginView } from './components/LoginView';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<string>('dark');
  const [activeTab, setActiveTab] = useState<string>('documents');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [token, setToken] = useState<string>(() => localStorage.getItem('legalease_token') || '');
  const [user, setUser] = useState<any>(null);
  
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [exportDocId, setExportDocId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch document list when authenticated
  useEffect(() => {
    if (token) {
      fetchDocuments(token);
    }
  }, [token]);

  const fetchDocuments = async (authToken: string) => {
    try {
      const res = await fetch('/api/v1/documents', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else if (res.status === 401) {
        // Token expired
        setToken('');
        localStorage.removeItem('legalease_token');
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const handleLoginSuccess = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('legalease_token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('legalease_token');
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/v1/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDocuments(token);
        if (selectedDocId === docId) {
          setSelectedDocId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Header theme={theme} setTheme={setTheme} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setSelectedDocId(null); }} />

      <main id="main-content" className="main-content" role="main">
        {activeTab === 'documents' && (
          selectedDocId ? (
            <DocumentViewer
              documentId={selectedDocId}
              onBack={() => setSelectedDocId(null)}
              token={token}
              onOpenExport={(id) => setExportDocId(id)}
            />
          ) : (
            <DocumentDashboard
              documents={documents}
              onSelectDocument={(id) => setSelectedDocId(id)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onDeleteDocument={handleDeleteDocument}
            />
          )
        )}

        {activeTab === 'compare' && (
          <DocumentComparison documents={documents} token={token} />
        )}

        {activeTab === 'qa' && (
          <QAPanel documents={documents} token={token} />
        )}

        {activeTab === 'lawyer-brief' && (
          <LawyerBriefView documents={documents} token={token} onOpenExport={(id) => setExportDocId(id)} />
        )}
      </main>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => fetchDocuments(token)}
        token={token}
      />

      {exportDocId && (
        <ExportModal
          isOpen={!!exportDocId}
          documentId={exportDocId}
          onClose={() => setExportDocId(null)}
          token={token}
        />
      )}
    </div>
  );
};
