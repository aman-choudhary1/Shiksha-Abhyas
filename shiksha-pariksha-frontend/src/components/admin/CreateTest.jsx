import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  CheckSquare,
  Square,
  Rocket,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export default function CreateTest() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId] = useState('');
  const [classLevel, setClassLevel] = useState(10);
  const [durationMins, setDurationMins] = useState(30);
  const [targetRole, setTargetRole] = useState('both');

  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQIds, setSelectedQIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loadingQ, setLoadingQ] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoadingQ(true);
      api.get(`/admin/questions?limit=50&search=${encodeURIComponent(search)}`)
        .then((res) => {
          if (active) setAvailableQuestions(res.data.data?.questions || []);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoadingQ(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const subjects = useMemo(() => {
    const names = new Set();
    availableQuestions.forEach((q) => {
      if (q.subject_name) names.add(q.subject_name);
    });
    return ['all', ...Array.from(names)];
  }, [availableQuestions]);

  const displayedQuestions = useMemo(() => {
    if (subjectFilter === 'all') return availableQuestions;
    return availableQuestions.filter((q) => q.subject_name === subjectFilter);
  }, [availableQuestions, subjectFilter]);

  const toggleQuestion = (id) => {
    setSelectedQIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allDisplayedSelected =
      displayedQuestions.length > 0 && displayedQuestions.every((q) => selectedQIds.has(q.id));

    setSelectedQIds((prev) => {
      const next = new Set(prev);
      if (allDisplayedSelected) {
        displayedQuestions.forEach((q) => next.delete(q.id));
      } else {
        displayedQuestions.forEach((q) => next.add(q.id));
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a test title');
    if (selectedQIds.size === 0) return setError('Please select at least 1 question for this test');

    setSaving(true);
    setError('');

    try {
      await api.post('/admin/tests', {
        title: title.trim(),
        description: description.trim(),
        subject_id: subjectId ? parseInt(subjectId, 10) : null,
        class_level: classLevel ? parseInt(classLevel, 10) : null,
        duration_mins: parseInt(durationMins, 10) || 30,
        target_role: targetRole,
        question_ids: Array.from(selectedQIds),
      });

      navigate('/admin/tests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test');
    } finally {
      setSaving(false);
    }
  };

  const allDisplayedSelected =
    displayedQuestions.length > 0 && displayedQuestions.every((q) => selectedQIds.has(q.id));

  return (
    <div className="fade-up">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Create New Practice Test</h2>
          <p className="text-muted">Configure test settings and assemble bilingual MCQs from your question bank</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/tests')}>
          <ArrowLeft size={16} /> Back to Tests
        </button>
      </div>

      {error && <div className="form-error mb-4">⚠️ {error}</div>}

      <form onSubmit={handleSave} className="builder-grid">
        {/* Left Column: Metadata Settings */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={17} color="#6C63FF" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', color: 'var(--clr-text)' }}>
              Test Configuration
            </h3>
          </div>

          <div>
            <label className="form-label">Test Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Class 10 Science Chapter 1 Mock"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Brief instructions or summary for test takers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              <label className="form-label">Duration (Mins)</label>
              <input
                type="number"
                min={5}
                max={180}
                className="input-field"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Assigned Target Role</label>
            <select className="input-field" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              <option value="both">Both (Students & Teachers)</option>
              <option value="student">Students Only</option>
              <option value="teacher">Teachers Only</option>
            </select>
          </div>

          <div className="soft-item-card" style={{ marginTop: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-muted" style={{ fontSize: '0.86rem' }}>Questions Selected</span>
              <strong style={{ color: 'var(--clr-primary)', fontFamily: 'var(--font-heading)' }}>{selectedQIds.size}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted" style={{ fontSize: '0.86rem' }}>Estimated Total Marks</span>
              <strong style={{ color: 'var(--clr-success)', fontFamily: 'var(--font-heading)' }}>{selectedQIds.size}</strong>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '4px', padding: '12px' }}
            disabled={saving}
          >
            <Rocket size={16} />
            <span>{saving ? 'Creating Test...' : 'Create & Save Test'}</span>
          </button>
        </div>

        {/* Right Column: Question Bank Picker */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', color: 'var(--clr-text)' }}>
                Pick Questions ({displayedQuestions.length})
              </h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Click any question card below to include it in this exam</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-box" style={{ maxWidth: 240 }}>
                <Search size={15} className="search-box-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search questions..."
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
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSelectAll}
              >
                {allDisplayedSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                <span>{allDisplayedSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>

          {/* Subject Filter Pills */}
          {subjects.length > 1 && (
            <div className="filter-chips" style={{ marginBottom: '4px' }}>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`filter-chip ${subjectFilter === sub ? 'active' : ''}`}
                  onClick={() => setSubjectFilter(sub)}
                >
                  {sub === 'all' ? 'All Subjects' : sub}
                </button>
              ))}
            </div>
          )}

          {loadingQ && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          )}

          {!loadingQ && displayedQuestions.length === 0 && (
            <div className="coming-soon" style={{ minHeight: '24vh' }}>
              <div className="cs-icon-wrap"><HelpCircle size={26} /></div>
              <h3>No questions found</h3>
              <p>Try clearing your search filter or import questions from an Excel sheet first.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '580px', overflowY: 'auto', paddingRight: '4px' }}>
            {displayedQuestions.map((q) => {
              const isChecked = selectedQIds.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  style={{
                    padding: '15px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isChecked ? '#EEF2FF' : '#F8FAFC',
                    border: `1.5px solid ${isChecked ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '13px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ marginTop: '3px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{q.subject_name || 'Subject'}</span>
                      {q.exam_name && (
                        <span className="badge badge-muted">
                          {q.exam_name} {q.year}
                        </span>
                      )}
                    </div>
                    {q.question_text_en && (
                      <p style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--clr-text)', marginBottom: '4px' }}>
                        {q.question_text_en}
                      </p>
                    )}
                    {q.question_text_hi && (
                      <p style={{ fontSize: '0.86rem', color: '#4338CA' }}>
                        {q.question_text_hi}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
