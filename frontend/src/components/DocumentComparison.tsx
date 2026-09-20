import React, { useState } from 'react';
import { Columns, Table, ArrowRightLeft, AlertCircle } from 'lucide-react';

interface ComparisonMatrixItem {
  clause_type: string;
  status: string;
  doc_a_quote: string;
  doc_b_quote: string;
}

interface DocumentComparisonProps {
  documents: Array<{ id: string; filename: string }>;
  token: string;
}

export const DocumentComparison: React.FC<DocumentComparisonProps> = ({ documents, token }) => {
  const [docA, setDocA] = useState<string>(documents[0]?.id || '');
  const [docB, setDocB] = useState<string>(documents[1]?.id || '');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('table'); // Table fallback by default for WCAG compliance

  const handleCompare = async () => {
    if (!docA || !docB) return;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ document_id_a: docA, document_id_b: docB })
      });

      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="comparison-heading" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h2 id="comparison-heading">Clause-by-Clause Contract Comparison</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Select two documents to evaluate additions, deletions, material differences, and clause modifications.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="select-doc-a" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
              Base Document (Document A)
            </label>
            <select
              id="select-doc-a"
              value={docA}
              onChange={(e) => setDocA(e.target.value)}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left' }}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="select-doc-b" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
              Comparison Document (Document B)
            </label>
            <select
              id="select-doc-b"
              value={docB}
              onChange={(e) => setDocB(e.target.value)}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left' }}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleCompare} className="btn btn-primary" disabled={loading || !docA || !docB}>
          <ArrowRightLeft size={18} aria-hidden="true" />
          {loading ? 'Comparing Documents...' : 'Run Clause Comparison'}
        </button>
      </div>

      {comparisonData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Accessible View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>Comparison Matrix ({comparisonData.summary?.modifications_count || 0} Material Changes)</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }} role="group" aria-label="Comparison View Mode">
              <button
                onClick={() => setViewMode('table')}
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                aria-pressed={viewMode === 'table'}
              >
                <Table size={16} aria-hidden="true" /> Accessible Structured Table
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`btn ${viewMode === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
                aria-pressed={viewMode === 'visual'}
              >
                <Columns size={16} aria-hidden="true" /> Side-by-Side View
              </button>
            </div>
          </div>

          {/* WCAG Accessible Structured Table Mode */}
          {viewMode === 'table' ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} aria-label="Structured Clause Comparison Table">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th scope="col" style={{ padding: '0.75rem' }}>Clause Category</th>
                    <th scope="col" style={{ padding: '0.75rem' }}>Status</th>
                    <th scope="col" style={{ padding: '0.75rem' }}>Document A Quote</th>
                    <th scope="col" style={{ padding: '0.75rem' }}>Document B Quote</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.comparison_matrix?.map((item: ComparisonMatrixItem, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th scope="row" style={{ padding: '0.75rem', fontWeight: 600 }}>{item.clause_type}</th>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`risk-badge ${item.status.includes('Removed') || item.status.includes('Modified') ? 'medium' : 'low'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{item.doc_a_quote}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{item.doc_b_quote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Visual Side-by-Side Layout */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card">
                <h4>Document A: {comparisonData.document_a?.filename}</h4>
                {comparisonData.comparison_matrix?.map((item: ComparisonMatrixItem, idx: number) => (
                  <div key={idx} style={{ marginTop: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <strong>{item.clause_type}</strong> ({item.status})
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.doc_a_quote}</p>
                  </div>
                ))}
              </div>

              <div className="card">
                <h4>Document B: {comparisonData.document_b?.filename}</h4>
                {comparisonData.comparison_matrix?.map((item: ComparisonMatrixItem, idx: number) => (
                  <div key={idx} style={{ marginTop: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <strong>{item.clause_type}</strong> ({item.status})
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.doc_b_quote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
