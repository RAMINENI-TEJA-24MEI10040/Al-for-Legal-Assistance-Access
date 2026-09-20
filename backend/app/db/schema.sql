-- LegalEase AI Master Local SQL Schema (SQLite 3 with WAL Mode)
PRAGMA foreign_keys = ON;

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 3. Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Role_Permissions junction
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    mfa_enabled INTEGER DEFAULT 0,
    mfa_secret TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 5. Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- pdf, docx, txt
    file_size_bytes INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    jurisdiction TEXT DEFAULT 'General',
    status TEXT DEFAULT 'queued', -- queued, processing, analyzing, completed, failed
    processing_stage TEXT DEFAULT 'Uploading', -- 11-stage progress state
    error_message TEXT,
    page_count INTEGER DEFAULT 0,
    pii_redacted INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(document_id, version_number)
);

-- 7. Document Sections
CREATE TABLE IF NOT EXISTS document_sections (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    section_number TEXT,
    heading TEXT,
    level INTEGER DEFAULT 1,
    parent_section_id TEXT,
    page_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE
);

-- 8. Document Chunks (Structure-Aware)
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    section_id TEXT,
    chunk_index INTEGER NOT NULL,
    text_content TEXT NOT NULL,
    cleaned_content TEXT NOT NULL,
    page_number INTEGER,
    section_heading TEXT,
    clause_type TEXT,
    parent_heading TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES document_sections(id) ON DELETE SET NULL
);

-- 9. Clauses
CREATE TABLE IF NOT EXISTS clauses (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    chunk_id TEXT NOT NULL,
    title TEXT,
    clause_type TEXT NOT NULL, -- liability, indemnification, termination, confidentiality, etc.
    source_text TEXT NOT NULL,
    summary TEXT,
    page_number INTEGER,
    section_number TEXT,
    section_heading TEXT,
    is_risky INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE
);

-- 10. Definitions
CREATE TABLE IF NOT EXISTS definitions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    term TEXT NOT NULL,
    definition_text TEXT NOT NULL,
    section_heading TEXT,
    page_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 11. Embeddings (Dense Vector Storage)
CREATE TABLE IF NOT EXISTS embeddings (
    id TEXT PRIMARY KEY,
    chunk_id TEXT NOT NULL UNIQUE,
    document_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    embedding_json TEXT NOT NULL, -- JSON array of floats for cosine sim calculation
    dimension INTEGER DEFAULT 768,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 12. Queries & RAG Interactions
CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    document_id TEXT,
    query_text TEXT NOT NULL,
    retrieval_mode TEXT DEFAULT 'hybrid', -- vector, bm25, hybrid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 13. Responses
CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL UNIQUE,
    answer_text TEXT NOT NULL,
    confidence_status TEXT NOT NULL, -- High Confidence, Moderate Confidence, Needs Legal Review, Insufficient Evidence
    model_used TEXT NOT NULL,
    latency_ms REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE
);

-- 14. Citations
CREATE TABLE IF NOT EXISTS citations (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    chunk_id TEXT NOT NULL,
    source_text TEXT NOT NULL,
    section_heading TEXT,
    page_number INTEGER,
    similarity_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE
);

-- 15. Risk Findings
CREATE TABLE IF NOT EXISTS risk_findings (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    clause_id TEXT,
    issue_title TEXT NOT NULL,
    severity TEXT NOT NULL, -- Low, Medium, High, Critical
    evidence_text TEXT NOT NULL,
    source_section TEXT,
    page_number INTEGER,
    explanation TEXT NOT NULL,
    verification_status TEXT NOT NULL, -- Verified, Unverified, AI Interpretation
    potential_consideration TEXT NOT NULL,
    requires_professional_review INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE SET NULL
);

-- 16. Review Tasks (Lawyer Brief & Human Review Escalation)
CREATE TABLE IF NOT EXISTS review_tasks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    assigned_user_id TEXT,
    task_description TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Urgent
    status TEXT DEFAULT 'Pending', -- Pending, In_Review, Resolved, Dismissed
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- DOCUMENT_UPLOADED, QUERY_EXECUTED, EXPORT_CREATED, etc.
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    details_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 18. Security Events
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    user_id TEXT,
    event_type TEXT NOT NULL, -- PROMPT_INJECTION, CROSS_TENANT_ATTEMPT, ZIP_BOMB, LOGIN_FAILURE
    severity TEXT NOT NULL, -- WARNING, CRITICAL
    details_json TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Exports
CREATE TABLE IF NOT EXISTS exports (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    export_format TEXT NOT NULL, -- pdf, excel, ics, email_draft
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 20. Model Usage & Cost Tracking
CREATE TABLE IF NOT EXISTS model_usage (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- parse, chunk, embedding, risk_analysis, qa, comparison
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL DEFAULT 0.0,
    latency_ms REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_org ON document_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_clauses_doc ON clauses(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_doc ON embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_risks_doc ON risk_findings(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
