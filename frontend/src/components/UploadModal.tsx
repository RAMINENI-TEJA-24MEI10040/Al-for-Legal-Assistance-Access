import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  token: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess, token }) => {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');
    setStage('Uploading file to security scanner...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Upload failed');
      }

      const doc = await res.json();
      setStage('Validating magic bytes and page limits...');

      // Poll 11-stage progress
      let currentStatus = 'queued';
      let polls = 0;
      while (currentStatus !== 'completed' && currentStatus !== 'failed' && polls < 30) {
        await new Promise((r) => setTimeout(r, 800));
        const statusRes = await fetch(`/api/v1/documents/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setStage(`Stage: ${statusData.processing_stage} (${statusData.status})`);
          currentStatus = statusData.status;
          if (statusData.status === 'failed') {
            throw new Error(statusData.error_message || 'Processing failed');
          }
        }
        polls++;
      }

      setStage('Completed successfully!');
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="upload-title"
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
      <div className="card" style={{ width: '100%', maxWidth: '550px', position: 'relative' }}>
        <button 
          onClick={onClose} 
          aria-label="Close upload modal" 
          className="btn btn-secondary" 
          style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem' }}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="upload-title">Upload Legal Document</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Select a PDF, DOCX, or TXT file (Max 50MB, 500 Pages).
        </p>

        {/* Accessible ARIA Live Region for Async Processing Announcements */}
        <div aria-live="polite" aria-atomic="true" style={{ marginBottom: '1rem' }}>
          {stage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              <span>{stage}</span>
            </div>
          )}
          {error && (
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div 
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-tertiary)',
            cursor: 'pointer',
            marginBottom: '1.5rem'
          }}
        >
          <input 
            type="file" 
            id="file-input" 
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={32} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
            <span style={{ fontWeight: 600 }}>{file ? file.name : 'Click to select or drag document here'}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, DOCX, TXT supported</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={isUploading}>
            Cancel
          </button>
          <button onClick={handleUpload} className="btn btn-primary" disabled={!file || isUploading}>
            {isUploading ? 'Processing...' : 'Upload & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};
