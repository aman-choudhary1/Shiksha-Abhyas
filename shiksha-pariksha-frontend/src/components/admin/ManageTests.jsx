import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Trash2,
  ClipboardList,
  Clock,
  Globe,
  EyeOff,
} from 'lucide-react';
import api from '../../services/api';

export default function ManageTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadTests = useCallback(() => {
    api.get('/admin/tests')
      .then((r) => setTests(r.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to fetch tests'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleTogglePublish = async (testId, currentStatus) => {
    try {
      await api.put(`/admin/tests/${testId}/publish`, { publish: !currentStatus });
      loadTests();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? All student attempts will be removed.')) return;
    try {
      await api.delete(`/admin/tests/${testId}`);
      loadTests();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = tests.filter(
    (t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Manage Practice Tests</h2>
          <p className="text-muted">Create, publish, and assign tests for teachers and students</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ maxWidth: 250 }}>
            <Search size={15} className="search-box-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/admin/tests/create')}>
            <Plus size={16} /> Create New Test
          </button>
        </div>
      </div>

      {error && <div className="form-error mb-4">⚠️ {error}</div>}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="coming-soon glass-card" style={{ minHeight: '32vh' }}>
          <div className="cs-icon-wrap"><ClipboardList size={28} /></div>
          <h3>{tests.length === 0 ? 'No practice tests yet' : 'No matching tests'}</h3>
          <p>
            {tests.length === 0
              ? 'Click "Create New Test" above to assemble a test from imported questions.'
              : 'Try a different search term.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Target Role</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{t.title}</div>
                    {t.class_level && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--clr-text-dim)' }}>Class {t.class_level}</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-primary">{t.subject_name || 'General'}</span>
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--clr-text-muted)', fontWeight: 500 }}>
                    {t.target_role || 'both'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.question_count || 0}</td>
                  <td style={{ color: 'var(--clr-text-dim)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} /> {t.duration_mins} mins
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.is_published ? 'badge-success' : 'badge-muted'}`}>
                      {t.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTogglePublish(t.id, t.is_published)}
                      >
                        {t.is_published ? <EyeOff size={13} /> : <Globe size={13} />}
                        <span>{t.is_published ? 'Unpublish' : 'Publish'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(t.id)}
                        title="Delete test"
                        aria-label={`Delete ${t.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
