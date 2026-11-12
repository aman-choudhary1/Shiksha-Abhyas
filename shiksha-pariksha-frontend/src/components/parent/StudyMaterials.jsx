import React, { useEffect, useState } from 'react';
import { Search, X, BookOpen, FileText, Download } from 'lucide-react';
import api from '../../services/api';

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/parent/materials')
      .then((res) => setMaterials(res.data.data?.materials || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(
    (m) =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Curated Study Materials &amp; Guides</h2>
          <p className="text-muted">Download approved revision notes, formula handbooks, and reference papers for your child</p>
        </div>
        <div className="search-box" style={{ maxWidth: 280 }}>
          <Search size={15} className="search-box-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search notes or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="coming-soon glass-card" style={{ minHeight: '30vh' }}>
          <div className="cs-icon-wrap"><BookOpen size={28} /></div>
          <h3>No study materials available</h3>
          <p>Study guides and sample papers uploaded by the administrator will appear here.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
        {filtered.map((m) => (
          <div key={m.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-parent">{m.subject_name || 'General'}</span>
              <span className="badge badge-muted">
                {m.class_level ? `Class ${m.class_level}` : 'All Classes'}
              </span>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '6px' }}>
                {m.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                {m.description || 'Reference notes for exam revision.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--clr-border)', paddingTop: '14px', marginTop: 'auto' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--clr-text-dim)', fontWeight: 600 }}>
                <FileText size={14} /> {m.file_type?.toUpperCase() || 'PDF'}
              </span>
              <a
                href={`http://localhost:4000${m.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
