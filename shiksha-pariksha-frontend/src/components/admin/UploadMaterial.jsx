import React, { useEffect, useState, useCallback } from 'react';
import { UploadCloud, FileText, Download, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function UploadMaterial() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classLevel, setClassLevel] = useState(10);
  const [file, setFile] = useState(null);

  const loadMaterials = useCallback(() => {
    api.get('/admin/materials')
      .then((r) => setMaterials(r.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load materials'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    if (!file) return setError('Please select a file to upload');

    setUploading(true);
    setError('');
    setSuccess('');

    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('class_level', classLevel);
    form.append('file', file);

    try {
      await api.post('/admin/materials', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Material uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      loadMaterials();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study material?')) return;
    try {
      await api.delete(`/admin/materials/${id}`);
      loadMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="fade-up">
      <div className="page-header mb-6">
        <h2 className="page-title">Study Materials Management</h2>
        <p className="text-muted">Upload revision notes, formula sheets, and mock papers for students &amp; parents</p>
      </div>

      <div className="builder-grid">
        {/* Upload Form Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', marginBottom: '16px' }}>
            Upload New File
          </h3>

          {error && <div className="form-error mb-3">⚠️ {error}</div>}
          {success && (
            <div className="form-success mb-3">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Science Chapter 1 Formula Sheet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Summary for students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Class Level</label>
              <select className="input-field" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
                <option value={9}>Class 9</option>
                <option value={10}>Class 10</option>
                <option value={11}>Class 11</option>
                <option value={12}>Class 12</option>
              </select>
            </div>

            <div>
              <label className="form-label">File (PDF, DOCX) *</label>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary mt-2" disabled={uploading}>
              <UploadCloud size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload Material'}</span>
            </button>
          </form>
        </div>

        {/* Existing Materials List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', marginBottom: '16px' }}>
            Active Materials ({materials.length})
          </h3>

          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>}

          {!loading && materials.length === 0 && (
            <div className="coming-soon" style={{ minHeight: '24vh' }}>
              <div className="cs-icon-wrap"><FileText size={26} /></div>
              <h3>No study materials uploaded yet</h3>
              <p>Use the form on the left to share PDFs or revision notes.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {materials.map((m) => (
              <div
                key={m.id}
                className="soft-item-card"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: '#EEF2FF',
                      color: '#6C63FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '3px' }}>
                      {m.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>
                      {m.file_name} · {m.class_level ? `Class ${m.class_level}` : 'General'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a
                    href={`http://localhost:4000${m.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={14} /> Download
                  </a>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(m.id)}
                    aria-label={`Delete ${m.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
