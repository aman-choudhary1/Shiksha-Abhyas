import React, { useEffect, useState } from 'react';
import { CheckCircle2, TrendingUp, Trophy, Award, Users } from 'lucide-react';
import api from '../../services/api';
import KpiCard from '../common/KpiCard';

export default function ChildReport() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/parent/children')
      .then((res) => {
        const list = res.data.data || [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0]);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to fetch student details'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) setReportLoading(true);
      api.get(`/parent/children/${selectedChild.id}/report`)
        .then((res) => { if (active) setReport(res.data.data); })
        .catch(() => { if (active) setReport(null); })
        .finally(() => { if (active) setReportLoading(false); });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedChild]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  }

  if (error) return <div className="form-error">⚠️ {error}</div>;

  if (children.length === 0) {
    return (
      <div className="coming-soon glass-card">
        <div className="cs-icon-wrap"><Users size={28} /></div>
        <h3>No Children Linked</h3>
        <p>No student profile is currently linked to your parent account. Please contact the administrator.</p>
      </div>
    );
  }

  const { overall, subjectBreakdown, recentTests } = report || {};
  const avgAccuracy = overall?.avg_percentage ? Number(parseFloat(overall.avg_percentage).toFixed(1)) : 0;
  const bestAccuracy = overall?.best_percentage ? Number(parseFloat(overall.best_percentage).toFixed(1)) : 0;

  return (
    <div className="fade-up">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Child Performance &amp; Progress Report</h2>
          <p className="text-muted">Monitor academic practice, subject accuracy, and exam preparation</p>
        </div>

        {children.length > 1 && (
          <div>
            <label className="form-label" style={{ marginBottom: '4px' }}>Select Child</label>
            <select
              className="input-field"
              value={selectedChild?.id}
              onChange={(e) => setSelectedChild(children.find((c) => c.id === parseInt(e.target.value, 10)))}
              style={{ minWidth: 220 }}
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.class_level ? `Class ${c.class_level}` : 'Student'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Child Profile Card */}
      {selectedChild && (
        <div
          className="glass-card mb-6"
          style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6C63FF, #BA68C8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                color: '#fff',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {selectedChild.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-text)' }}>{selectedChild.full_name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                {selectedChild.school_name || 'Government Higher Secondary School'} · {selectedChild.board || 'State Board'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-dim)', textTransform: 'uppercase' }}>Class</div>
              <div style={{ fontWeight: 700, color: 'var(--clr-text)' }}>
                {selectedChild.class_level || '10'} - {selectedChild.section || 'A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-dim)', textTransform: 'uppercase' }}>Roll No</div>
              <div style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{selectedChild.roll_number || '2026-A12'}</div>
            </div>
          </div>
        </div>
      )}

      {reportLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
      )}

      {!reportLoading && report && (
        <>
          <div className="stats-grid stats-grid-4 mb-6">
            <KpiCard
              icon={CheckCircle2}
              label="Tests Completed"
              value={overall?.completed || 0}
              accent="#D97706"
              index={0}
            />
            <KpiCard
              icon={TrendingUp}
              label="Average Accuracy"
              value={avgAccuracy}
              suffix="%"
              accent={avgAccuracy >= 60 ? '#059669' : '#D97706'}
              index={1}
            />
            <KpiCard
              icon={Trophy}
              label="Best Test Score"
              value={bestAccuracy}
              suffix="%"
              accent="#059669"
              index={2}
            />
            <KpiCard
              icon={Award}
              label="Total Score Earned"
              value={overall?.total_score_earned || 0}
              accent="#6C63FF"
              index={3}
            />
          </div>

          <div className="split-2col">
            {/* Subject-Wise Accuracy Breakdown */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Subject Performance Heatmap
              </h3>

              {(!subjectBreakdown || subjectBreakdown.length === 0) ? (
                <p className="text-muted">No subject attempt history available yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {subjectBreakdown.map((sb, idx) => {
                    const pct = Math.round(parseFloat(sb.avg_pct) || 0);
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>{sb.subject || 'General'}</span>
                          <span style={{ color: pct >= 70 ? 'var(--clr-success)' : 'var(--clr-warning)', fontWeight: 700 }}>
                            {pct}% ({sb.attempts} {sb.attempts === '1' ? 'test' : 'tests'})
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: pct >= 70
                                ? 'linear-gradient(90deg, #10B981, #14B8A6)'
                                : 'linear-gradient(90deg, #F59E0B, #F97316)',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Completed Tests */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Recent Test Attempts
              </h3>

              {(!recentTests || recentTests.length === 0) ? (
                <p className="text-muted">No practice tests completed recently.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentTests.map((t, idx) => (
                    <div
                      key={idx}
                      className="soft-item-card"
                      style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--clr-text)' }}>{t.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>
                          {t.subject || 'Mock'} · {new Date(t.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--clr-success)', fontSize: '1rem' }}>
                          {t.score}/{t.total_marks}
                        </div>
                        <span style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)' }}>{t.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
