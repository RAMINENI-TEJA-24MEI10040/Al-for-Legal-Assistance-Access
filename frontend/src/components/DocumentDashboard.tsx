import React, { useState } from 'react';
import { FileText, Plus, AlertCircle, Eye, Trash2, ShieldCheck, Clock } from 'lucide-react';

interface DocumentDashboardProps {
  documents: any[];
  onSelectDocument: (docId: string) => void;
  onOpenUpload: () => void;
  onDeleteDocument: (docId: string) => void;
}

export const DocumentDashboard: React.FC<DocumentDashboardProps> = ({
  documents,
  onSelectDocument,
  onOpenUpload,
  onDeleteDocument
}) => {
  const [search, setSearch] = useState<string>('');

  const filteredDocs = documents.filter((d) =>
    d.filename?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section aria-labelledby="dashboard-heading" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 id="dashboard-heading">Legal Document Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage, analyze, and inspect your organization's legal contracts with GenAI intelligence.
            </p>
          </div>

          <button onClick={onOpenUpload} className="btn btn-primary" aria-label="Upload new legal document">
            <Plus size={18} aria-hidden="true" /> Upload Document
          </button>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <label htmlFor="doc-search" className="sr-only" style={{ display: 'none' }}>Search documents</label>
          <input
            id="doc-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by filename or title..."
            className="btn btn-secondary"
            style={{ width: '100%', textAlign: 'left', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} aria-hidden="true" />
          <h3>No Legal Documents Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload your first PDF, DOCX, or TXT document to begin automated analysis.</p>
          <button onClick={onOpenUpload} className="btn btn-primary">
            <Plus size={18} aria-hidden="true" /> Upload Legal Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredDocs.map((doc) => (
            <article key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={24} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} aria-hidden="true" />
                    <h3 style={{ fontSize: '1.05rem', wordBreak: 'break-word' }}>{doc.filename}</h3>
                  </div>
                  <span className={`risk-badge ${doc.status === 'completed' ? 'low' : 'medium'}`}>
                    {doc.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                  <span>Pages: {doc.page_count || 1} | Type: {doc.file_type?.toUpperCase()}</span>
                  <span>Processing Stage: {doc.processing_stage}</span>
                  <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => onSelectDocument(doc.id)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  aria-label={`Inspect ${doc.filename}`}
                >
                  <Eye size={16} aria-hidden="true" /> Inspect Analysis
                </button>
                <button
                  onClick={() => onDeleteDocument(doc.id)}
                  className="btn btn-secondary"
                  aria-label={`Delete ${doc.filename}`}
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
