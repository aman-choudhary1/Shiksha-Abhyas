import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  Target,
  CheckCircle2,
  Play,
  RotateCcw,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';

const FILTERS = [
  { id: 'all', label: 'All Tests' },
  { id: 'pending', label: 'Ready to Start' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'submitted', label: 'Completed' },
];

export default function TestList({ role = 'student' }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    api.get(`/${role}/tests`)
      .then((res) => {
        if (active) setTests(res.data.data?.tests || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Failed to load practice tests');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [role]);

  const filtered = tests.filter((t) => {
    const matchesQuery =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject_name?.toLowerCase().includes(search.toLowerCase());
    if (!matchesQuery) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !t.my_status || t.my_status === 'not_started';
    return t.my_status === statusFilter;
  });

  return (
    <div className="fade-up">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Available Practice Tests</h2>
          <p className="text-muted">Choose an exam and test your knowledge under timed conditions</p>
        </div>
        <div className="search-box">
          <Search size={16} className="search-box-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      {!loading && tests.length > 0 && (
        <div className="filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-chip ${statusFilter === f.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      )}

      {error && <div className="form-error mb-4">⚠️ {error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="coming-soon glass-card" style={{ minHeight: '30vh' }}>
          <div className="cs-icon-wrap">
            <ClipboardList size={28} />
          </div>
          <h3>No practice tests found</h3>
          <p>
            {search || statusFilter !== 'all'
              ? 'Try clearing your search query or switching the status filter.'
              : 'Please check back later once new tests are published by the Administrator.'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
        {filtered.map((t, idx) => {
          const isCompleted = t.my_status === 'submitted';
          const isInProgress = t.my_status === 'in_progress';

          return (
            <motion.div
              key={t.id}
              className="glass-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.25) }}
              whileHover={{ y: -3 }}
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-primary">{t.subject_name || 'General'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isCompleted && <span className="badge badge-success">Completed</span>}
                  {isInProgress && <span className="badge badge-warning">In Progress</span>}
                  {t.class_level && (
                    <span className="badge badge-muted">Class {t.class_level}</span>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '6px' }}>
                  {t.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                  {t.description || 'Comprehensive timed mock test with instant evaluation.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.84rem', color: 'var(--clr-text-dim)', borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} /> {t.duration_mins} mins
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Target size={14} /> {t.total_marks || '—'} marks
                </span>
              </div>

              {isCompleted ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: 'auto', paddingTop: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-success)', fontSize: '0.88rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> {t.score}/{t.total_marks} ({t.percentage}%)
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/${role}/tests/${t.id}/take`)}
                  >
                    <RotateCcw size={14} /> Retake
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 'auto', width: '100%' }}
                  onClick={() => navigate(`/${role}/tests/${t.id}/take`)}
                >
                  <Play size={15} />
                  <span>{isInProgress ? 'Resume Test' : 'Start Practice Test'}</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
