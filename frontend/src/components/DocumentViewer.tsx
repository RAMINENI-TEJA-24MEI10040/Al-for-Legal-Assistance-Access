import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, ShieldAlert, List, FileText, CheckCircle2 } from 'lucide-react';
import { RiskAnalysisView } from './RiskAnalysisView';

interface DocumentViewerProps {
  documentId: string;
  onBack: () => void;
  token: string;
  onOpenExport: (docId: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, onBack, token, onOpenExport }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'risks' | 'sections' | 'glossary'>('summary');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/v1/documents/${documentId}/analysis`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [documentId, token]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading document intelligence analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Failed to load document analysis.</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <section aria-labelledby="doc-title-heading" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={onBack} className="btn btn-secondary" aria-label="Back to dashboard">
              <ArrowLeft size={18} aria-hidden="true" /> Dashboard
            </button>
            <h1 id="doc-title-heading" style={{ fontSize: '1.4rem', margin: 0 }}>{analysis.filename}</h1>
          </div>

          <button onClick={() => onOpenExport(documentId)} className="btn btn-primary">
            <Download size={18} aria-hidden="true" /> Export Brief & Analysis
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'summary', label: 'Executive Summary' },
            { id: 'risks', label: `Risk Analysis (${analysis.potential_concerns?.length || 0})` },
            { id: 'sections', label: `Important Clauses (${analysis.important_clauses?.length || 0})` },
            { id: 'glossary', label: `Glossary (${analysis.glossary?.length || 0})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="btn btn-secondary"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-primary)',
                borderColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'
              }}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <article className="card">
            <h2>Executive Summary</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{analysis.executive_summary}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>IDENTIFIED PARTIES:</strong>
                <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{analysis.parties?.join(', ') || 'General Entities'}</p>
              </div>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>DOCUMENT PAGES:</strong>
                <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{analysis.page_count} Pages</p>
              </div>
            </div>
          </article>

          {/* Key Obligations */}
          <article className="card">
            <h2>Key Obligations (Shall Statements)</h2>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {analysis.key_obligations?.map((ob: any, idx: number) => (
                <li key={idx} style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  <span>{ob.obligation_text}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (Section: {ob.section_heading} | Page {ob.page_number})
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      )}

      {activeTab === 'risks' && (
        <RiskAnalysisView risks={analysis.potential_concerns || []} />
      )}

      {activeTab === 'sections' && (
        <div className="card">
          <h2>Important Clauses & Sections</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {analysis.important_clauses?.map((cls: any, idx: number) => (
              <div key={idx} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--accent-primary)' }}>{cls.clause_type} Clause</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Section: {cls.section_heading} (Page {cls.page_number})</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>"{cls.source_text}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'glossary' && (
        <div className="card">
          <h2>Defined Terms & Glossary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {analysis.glossary?.map((item: any, idx: number) => (
              <div key={idx} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>"{item.term}"</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.definition_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
