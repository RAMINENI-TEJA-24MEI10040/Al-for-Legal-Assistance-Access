import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

interface RiskFinding {
  id: str;
  issue_title: string;
  severity: string;
  severity_level: string;
  evidence_text: string;
  source_section: string;
  page_number: number;
  explanation: string;
  verification_status: string;
  potential_consideration: string;
}

interface RiskAnalysisViewProps {
  risks: RiskFinding[];
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ risks }) => {
  if (!risks || risks.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <CheckCircle2 size={36} style={{ color: 'var(--risk-low-border)', margin: '0 auto 1rem' }} aria-hidden="true" />
        <h3>No High-Severity Risk Concerns Flagged</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Automated analysis did not detect unlimited liabilities or severe auto-renewal traps.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="risk-section-heading" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 id="risk-section-heading">Risk Identification & Legal Concerns</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {risks.length} Risk Concern{risks.length > 1 ? 's' : ''} Identified
        </span>
      </div>

      {risks.map((risk) => {
        const isHigh = risk.severity_level?.toLowerCase() === 'high' || risk.severity?.toLowerCase().includes('high');
        const isMedium = risk.severity_level?.toLowerCase() === 'medium' || risk.severity?.toLowerCase().includes('medium');
        const badgeClass = isHigh ? 'high' : isMedium ? 'medium' : 'low';

        return (
          <article key={risk.id} className="card" style={{ borderLeft: `4px solid var(--risk-${badgeClass}-border)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} style={{ color: `var(--risk-${badgeClass}-border)` }} aria-hidden="true" />
                <h3 style={{ fontSize: '1.1rem' }}>{risk.issue_title}</h3>
              </div>
              
              {/* Text label alongside visual indicator as required by Section 32 */}
              <span className={`risk-badge ${badgeClass}`}>
                {risk.severity}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{risk.explanation}</p>

            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Source Evidence (Section: {risk.source_section} | Page {risk.page_number}):
              </strong>
              <blockquote style={{ fontStyle: 'italic', marginTop: '0.25rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem' }}>
                "{risk.evidence_text}"
              </blockquote>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Recommendation: {risk.potential_consideration}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', fontWeight: 600 }}>
                <UserCheck size={16} aria-hidden="true" /> Professional Review Required
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
};
