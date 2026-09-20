import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, ExternalLink, ListChecks, HelpCircle } from 'lucide-react';

interface LawyerBriefViewProps {
  documents: Array<{ id: string; filename: string }>;
  token: string;
  onOpenExport: (docId: string) => void;
}

export const LawyerBriefView: React.FC<LawyerBriefViewProps> = ({ documents, token, onOpenExport }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [brief, setBrief] = useState<any>(null);

  useEffect(() => {
    if (selectedDocId) {
      fetch(`/api/v1/lawyer-brief/${selectedDocId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setBrief(data))
        .catch((err) => console.error(err));
    }
  }, [selectedDocId, token]);

  return (
    <section aria-labelledby="brief-heading" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 id="brief-heading">Lawyer Handoff Brief & Action Checklist</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Synthesizes contract terms, key questions, and action items for qualified legal counsel review.</p>
          </div>
          
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="btn btn-secondary"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.filename}</option>
            ))}
          </select>

          {selectedDocId && (
            <button onClick={() => onOpenExport(selectedDocId)} className="btn btn-primary">
              <Download size={18} aria-hidden="true" /> Export Brief & Checklist
            </button>
          )}
        </div>
      </div>

      {brief && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <article className="card">
            <h3>Executive One-Page Brief</h3>
            <p style={{ whiteSpace: 'pre-line', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{brief.one_page_summary}</p>
          </article>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Questions for Legal Counsel */}
            <article className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <HelpCircle size={20} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                <h3>Questions for Legal Counsel</h3>
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {brief.questions_for_lawyer?.map((q: string, idx: number) => (
                  <li key={idx} style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{q}</li>
                ))}
              </ul>
            </article>

            {/* Action Checklist */}
            <article className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <ListChecks size={20} style={{ color: 'var(--risk-low-border)' }} aria-hidden="true" />
                <h3>Next-Step Action Checklist</h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {brief.action_checklist?.map((item: any, idx: number) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <input type="checkbox" id={`chk-${idx}`} style={{ width: '16px', height: '16px' }} />
                    <label htmlFor={`chk-${idx}`}>{item.task} ({item.priority} Priority)</label>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Verified Government Legal Resources */}
          <article className="card">
            <h3>Verified Government & Statutory Resources</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Official reference materials from verified public authorities:
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {brief.government_resources?.map((res: any, idx: number) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <span>{res.name}</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
};
