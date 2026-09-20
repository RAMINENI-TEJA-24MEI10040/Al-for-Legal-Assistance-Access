import React, { useState } from 'react';
import { Send, FileText, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';

interface QAPanelProps {
  documents: Array<{ id: string; filename: string }>;
  token: string;
}

export const QAPanel: React.FC<QAPanelProps> = ({ documents, token }) => {
  const [query, setQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [qaHistory, setQaHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query_text: query,
          document_id: selectedDoc || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQaHistory([data, ...qaHistory]);
        setQuery('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="qa-heading" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h2 id="qa-heading">Evidence-Grounded Legal Document Q&A</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Ask questions about your uploaded contracts. Every claim is strictly grounded in retrieved evidence with page & section citations.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="qa-doc-filter" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
              Select Scope Document (Optional)
            </label>
            <select
              id="qa-doc-filter"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left' }}
            >
              <option value="">All Tenant Documents</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qa-query-input" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
              Your Question
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="qa-query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. What is the maximum liability cap or automatic renewal notice period?"
                className="btn btn-secondary"
                style={{ flex: 1, textAlign: 'left', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
                <Send size={18} aria-hidden="true" />
                {loading ? 'Analyzing...' : 'Ask Question'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Answer History & Citation Tracing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {qaHistory.map((item, idx) => (
          <article key={idx} className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="risk-badge low">Confidence: {item.confidence_status}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model: {item.model_used} ({item.latency_ms?.toFixed(0)}ms)</span>
            </div>

            <div style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
              {item.answer}
            </div>

            {item.citations && item.citations.length > 0 && (
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', color: 'var(--accent-primary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Verified Evidence Citations ({item.citations.length}):
                </strong>
                <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {item.citations.map((c: any, cIdx: number) => (
                    <li key={cIdx} style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.375rem' }}>
                      <span style={{ fontWeight: 600 }}>Section: {c.section_heading} (Page {c.page_number})</span>
                      <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{c.source_text?.substring(0, 180)}..."</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
