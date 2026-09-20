import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  FileSearch, 
  Scale, 
  Users, 
  Building2, 
  UserCheck, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

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
  const [activePersona, setActivePersona] = useState<'individual' | 'legal' | 'organization'>('individual');

  const filteredDocs = documents.filter((d) =>
    d.filename?.toLowerCase().includes(search.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. HERO SECTION */}
      <section 
        aria-labelledby="hero-title"
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--border-color)',
          padding: '2.5rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          <Sparkles size={16} aria-hidden="true" />
          <span>GenAI Legal Document Intelligence Platform</span>
        </div>

        <h1 id="hero-title" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          Understand Legal Documents. Identify Risks. Find Evidence.
        </h1>

        <p style={{ maxWidth: '820px', margin: '0 auto 1.75rem', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          LegalEase AI helps individuals, legal professionals, and organizations analyze complex legal documents, 
          extract critical clauses, flag hidden risk factors, and get <strong>100% evidence-grounded answers</strong> with zero hallucination.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={onOpenUpload} 
            className="btn btn-primary" 
            style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: 600 }}
            aria-label="Analyze a document now"
          >
            <Plus size={20} aria-hidden="true" /> Analyze a Document
          </button>
          <button 
            onClick={() => scrollToSection('problem-section')} 
            className="btn btn-secondary" 
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            Explore How It Works <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section id="problem-section" aria-labelledby="problem-heading" className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 id="problem-heading" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            The Problem We Are Solving
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
            Legal documents are filled with complex legalese, hidden liability traps, and lengthy clauses that create severe risks and high review costs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          
          <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <FileSearch size={24} style={{ color: '#ef4444' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Complex Legal Language</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Legal agreements use dense terminology and archaic legalese that non-lawyers struggle to comprehend, leading to uninformed signing.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Clock size={24} style={{ color: '#f59e0b' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Time-Consuming Manual Review</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Manual line-by-line review of a 50+ page agreement takes hours or days. Hiring counsel costs $300-$500/hour, creating deal bottlenecks.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #dc2626' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} style={{ color: '#dc2626' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hidden Risk Obligations</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Unfair indemnification caps, automatic renewals, and non-competes are hidden deep in boilerplate text, exposing signatories to financial risk.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={24} style={{ color: '#8b5cf6' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Untrustworthy AI Answers</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generic AI chatbots invent legal facts and lack verifiable document citations, making them unsafe for binding legal decisions.
            </p>
          </div>

        </div>
      </section>

      {/* 3. OUR SOLUTION SECTION */}
      <section id="solution-section" aria-labelledby="solution-heading" className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 id="solution-heading" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Our Solution — Direct Problem-to-Feature Mapping
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
            Every feature in LegalEase AI is specifically built to eliminate a real-world legal document pain point.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.95rem' }}>User Pain Point</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.95rem' }}>LegalEase AI Solution</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.95rem' }}>Core Technical Capability</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ef4444' }}>Complex legalese</td>
                <td style={{ padding: '0.85rem 1rem' }}>Plain-Language Clause Summaries</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Automated Clause Simplification & Categorization Agent</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f59e0b' }}>Long manual review</td>
                <td style={{ padding: '0.85rem 1rem' }}>Instant Section Extraction</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Parallel Chunk Parser (&lt; 500 ms for 500 pages)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#dc2626' }}>Hidden contract risks</td>
                <td style={{ padding: '0.85rem 1rem' }}>Automated Risk Scoring & Warnings</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Risk Analysis Agent (High/Medium/Low tags + counsel advice)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#8b5cf6' }}>AI hallucinations</td>
                <td style={{ padding: '0.85rem 1rem' }}>Strict Source-Citation RAG Q&amp;A</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>6-Layer Anti-Hallucination Guardrail + Gemini Embeddings</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#3b82f6' }}>Redline version tracking</td>
                <td style={{ padding: '0.85rem 1rem' }}>Side-by-Side Revision Comparison</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Contract Diff Engine &amp; Risk Shift Detector</td>
              </tr>
              <tr>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#10b981' }}>Need formal audit briefs</td>
                <td style={{ padding: '0.85rem 1rem' }}>Executive Lawyer Brief Exports</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Downloadable PDF / JSON / Text Brief Generator</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. TARGET USER PERSONAS */}
      <section aria-labelledby="personas-heading" className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 id="personas-heading" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Who Is LegalEase AI Built For?
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Tailored features for every type of legal document reader.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }} role="tablist" aria-label="Target User Personas">
          <button
            onClick={() => setActivePersona('individual')}
            role="tab"
            aria-selected={activePersona === 'individual'}
            className="btn btn-secondary"
            style={{
              backgroundColor: activePersona === 'individual' ? 'var(--accent-primary)' : 'transparent',
              color: activePersona === 'individual' ? '#ffffff' : 'var(--text-primary)',
              borderColor: activePersona === 'individual' ? 'var(--accent-primary)' : 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <UserCheck size={18} aria-hidden="true" /> Individuals &amp; Consumers
          </button>
          <button
            onClick={() => setActivePersona('legal')}
            role="tab"
            aria-selected={activePersona === 'legal'}
            className="btn btn-secondary"
            style={{
              backgroundColor: activePersona === 'legal' ? 'var(--accent-primary)' : 'transparent',
              color: activePersona === 'legal' ? '#ffffff' : 'var(--text-primary)',
              borderColor: activePersona === 'legal' ? 'var(--accent-primary)' : 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Scale size={18} aria-hidden="true" /> Legal Professionals &amp; Counsel
          </button>
          <button
            onClick={() => setActivePersona('organization')}
            role="tab"
            aria-selected={activePersona === 'organization'}
            className="btn btn-secondary"
            style={{
              backgroundColor: activePersona === 'organization' ? 'var(--accent-primary)' : 'transparent',
              color: activePersona === 'organization' ? '#ffffff' : 'var(--text-primary)',
              borderColor: activePersona === 'organization' ? 'var(--accent-primary)' : 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Building2 size={18} aria-hidden="true" /> SMBs &amp; Organizations
          </button>
        </div>

        <div className="card" style={{ background: 'var(--bg-tertiary)', padding: '1.5rem' }}>
          {activePersona === 'individual' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                👤 For Individuals &amp; Consumers
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Understand apartment leases, employment contracts, loan agreements, and online terms of service without paying hundreds in legal fees.
              </p>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>✅ Plain-English translation of technical legalese</li>
                <li>✅ Clear red-flag alerts before signing any binding document</li>
                <li>✅ Instant Q&amp;A to ask "Can my landlord increase rent without notice?"</li>
              </ul>
            </div>
          )}

          {activePersona === 'legal' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                ⚖️ For Legal Professionals &amp; In-House Counsel
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Accelerate due diligence and deal reviews with automated clause parsing, contract diffing, and formatted brief generation.
              </p>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>✅ Automated lawyer brief generation with actionable recommendations</li>
                <li>✅ Side-by-side revision comparison highlighting risk deltas</li>
                <li>✅ 100% verifiable section citations for every AI extraction</li>
              </ul>
            </div>
          )}

          {activePersona === 'organization' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                🏢 For SMBs &amp; Organizations
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Protect your company from unfavorable vendor terms, liability traps, and non-compliance penalties before signing contracts.
              </p>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>✅ Automated risk scoring (High, Medium, Low) across all active contracts</li>
                <li>✅ Exportable audit reports for executive board and compliance reviews</li>
                <li>✅ Multi-tenant security isolation ensuring organizational data privacy</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 5. HOW IT WORKS VISUAL WORKFLOW */}
      <section aria-labelledby="workflow-heading" className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 id="workflow-heading" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            How LegalEase AI Works
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            7 seamless steps from raw legal document to evidence-grounded intelligence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', textAlign: 'center' }}>
          {[
            { step: '1', title: 'Upload Contract', desc: 'PDF, DOCX, or TXT format' },
            { step: '2', title: 'AI Parsing', desc: 'Extracts sections & 768-dim vectors' },
            { step: '3', title: 'Clause Extraction', desc: 'Identifies obligations & terms' },
            { step: '4', title: 'Risk Analysis', desc: 'Scores risk flags & mitigation' },
            { step: '5', title: 'Evidence Q&A', desc: 'Citation-backed answers' },
            { step: '6', title: 'Revision Compare', desc: 'Highlights redline changes' },
            { step: '7', title: 'Export Brief', desc: 'Download PDF/JSON reports' }
          ].map((s) => (
            <div key={s.step} className="card" style={{ background: 'var(--bg-tertiary)', padding: '1rem 0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                {s.step}
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. YOUR LEGAL DOCUMENTS LIBRARY */}
      <section id="documents-section" aria-labelledby="dashboard-heading" className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 id="dashboard-heading" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Your Legal Documents</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Select a document to inspect analysis, review risk scoring, or initiate Q&amp;A.
            </p>
          </div>

          <button onClick={onOpenUpload} className="btn btn-primary" aria-label="Upload new legal document">
            <Plus size={18} aria-hidden="true" /> Upload Document
          </button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <label htmlFor="doc-search" className="sr-only" style={{ display: 'none' }}>Search documents</label>
            <input
              id="doc-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by filename..."
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left', paddingLeft: '2.5rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-tertiary)' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} aria-hidden="true" />
            <h3>No Legal Documents Uploaded Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload your first PDF, DOCX, or TXT legal document to trigger automated analysis.</p>
            <button onClick={onOpenUpload} className="btn btn-primary">
              <Plus size={18} aria-hidden="true" /> Upload Legal Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredDocs.map((doc) => (
              <article key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-tertiary)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} aria-hidden="true" />
                      <h3 style={{ fontSize: '1.05rem', wordBreak: 'break-word', fontWeight: 600 }}>{doc.filename}</h3>
                    </div>
                    <span className={`risk-badge ${doc.status === 'completed' ? 'low' : 'medium'}`}>
                      {doc.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                    <span>Pages: {doc.page_count || 1} | Format: {doc.file_type?.toUpperCase()}</span>
                    <span>Stage: {doc.processing_stage}</span>
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

    </div>
  );
};
