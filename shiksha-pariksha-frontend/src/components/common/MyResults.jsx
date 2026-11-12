import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, TrendingUp, Trophy, RotateCcw, Target, Clock } from 'lucide-react';
import api from '../../services/api';
import KpiCard from './KpiCard';

export default function MyResults({ role = 'student' }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/${role}/results`)
      .then((res) => {
        if (active) setResults(res.data.data?.results || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Failed to load results');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [role]);

  const avgScore = results.length
    ? Math.round(results.reduce((acc, r) => acc + (parseFloat(r.percentage) || 0), 0) / results.length)
    : 0;
  const highestScore = results.length
    ? Math.round(Math.max(...results.map((r) => parseFloat(r.percentage) || 0)))
    : 0;

  return (
    <div className="fade-up">
      <div className="page-header mb-6">
        <h2 className="page-title">My Performance & Score History</h2>
        <p className="text-muted">Review your completed practice tests and track your improvement over time</p>
      </div>

      {/* Animated KPI Cards */}
      <div className="stats-grid stats-grid-3 mb-6">
        <KpiCard
          icon={CheckCircle2}
          label="Tests Completed"
          value={results.length}
          badge="History"
          accent="#6C63FF"
          index={0}
          loading={loading}
        />
        <KpiCard
          icon={TrendingUp}
          label="Average Accuracy"
          value={avgScore}
          suffix="%"
          sub="Across all attempts"
          accent={avgScore >= 60 ? '#059669' : '#D97706'}
          index={1}
          loading={loading}
        />
        <KpiCard
          icon={Trophy}
          label="Highest Score"
          value={highestScore}
          suffix="%"
          sub="Personal best"
          accent="#E11D48"
          index={2}
          loading={loading}
        />
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      )}

      {error && <div className="form-error mb-4">⚠️ {error}</div>}

      {!loading && results.length === 0 && (
        <div className="coming-soon glass-card" style={{ minHeight: '30vh' }}>
          <div className="cs-icon-wrap">
            <Target size={28} />
          </div>
          <h3>No test attempts yet</h3>
          <p>You haven&apos;t submitted any practice tests yet. Take a test to start tracking your performance!</p>
          <button type="button" className="btn btn-primary mt-2" onClick={() => navigate(`/${role}/tests`)}>
            Browse Available Tests
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Time Taken</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const pct = parseFloat(r.percentage) || 0;
                const isPassed = pct >= 50;
                const dateStr = r.submitted_at
                  ? new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.title}</td>
                    <td>
                      <span className="badge badge-primary">{r.subject_name || 'General'}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.score} / {r.total_marks}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 58, height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              height: '100%',
                              background: isPassed ? '#10B981' : '#F59E0B',
                            }}
                          />
                        </div>
                        <span style={{ color: isPassed ? 'var(--clr-success)' : 'var(--clr-warning)', fontWeight: 700 }}>
                          {r.percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--clr-text-dim)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {Math.floor((r.time_taken_sec || 0) / 60)}m {(r.time_taken_sec || 0) % 60}s
                      </span>
                    </td>
                    <td style={{ color: 'var(--clr-text-dim)' }}>{dateStr}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/${role}/tests/${r.test_id}/take`)}
                      >
                        <RotateCcw size={13} /> Retake
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
