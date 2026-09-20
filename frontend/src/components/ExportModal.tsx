import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Calendar, Mail, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  documentId: string;
  onClose: () => void;
  token: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, documentId, onClose, token }) => {
  const [format, setFormat] = useState<string>('pdf');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ document_id: documentId, export_format: format })
      });

      if (res.ok) {
        const data = await res.json();
        // Trigger browser download
        const downloadRes = await fetch(data.download_url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const blob = await downloadRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legalease_export_${documentId}.${format === 'excel' ? 'xlsx' : format === 'ics' ? 'ics' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Close export dialog"
          className="btn btn-secondary"
          style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem' }}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="export-dialog-title">Export Document Brief</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Select your target export format:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'pdf', label: 'PDF Document', icon: FileText },
            { id: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
            { id: 'ics', label: 'ICS Calendar File', icon: Calendar },
            { id: 'email_draft', label: 'Email Draft Text', icon: Mail }
          ].map((item) => {
            const IconComponent = item.icon;
            const isSelected = format === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFormat(item.id)}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '1rem', gap: '0.5rem' }}
                aria-pressed={isSelected}
              >
                <IconComponent size={24} aria-hidden="true" />
                <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleExport} className="btn btn-primary" disabled={loading}>
            <Download size={18} aria-hidden="true" />
            {loading ? 'Generating...' : 'Download Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
