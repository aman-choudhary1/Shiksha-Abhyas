import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Trophy,
  BookOpenCheck,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import PortalShell from '../common/PortalShell';
import KpiCard from '../common/KpiCard';
import TestList from '../common/TestList';
import TakeTest from '../common/TakeTest';
import MyResults from '../common/MyResults';
import api from '../../services/api';

const NAV = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teacher/tests', icon: ClipboardList, label: 'Available Tests' },
  { to: '/teacher/results', icon: Trophy, label: 'My Results' },
];

export default function TeacherPortal() {
  const navigate = useNavigate();

  return (
    <PortalShell
      role="teacher"
      portalTitle="Teacher"
      portalSubtitle="Skill Portal"
      badgeLabel="Teacher"
      brandIcon={BookOpenCheck}
      avatarGradient="linear-gradient(135deg, #10B981, #14B8A6)"
      navItems={NAV}
    >
      <Routes>
        <Route index element={<TeacherDashboard navigate={navigate} />} />
        <Route path="tests" element={<TestList role="teacher" />} />
        <Route path="tests/:testId/take" element={<TakeTest role="teacher" />} />
        <Route path="results" element={<MyResults role="teacher" />} />
      </Routes>
    </PortalShell>
  );
}

function TeacherDashboard({ navigate }) {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/tests').then((r) => setTests(r.data.data?.tests || [])).catch(() => {}),
      api.get('/teacher/results').then((r) => setResults(r.data.data?.results || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const avgScore = results.length
    ? Math.round(results.reduce((acc, r) => acc + (parseFloat(r.percentage) || 0), 0) / results.length)
    : 0;
  const bestScore = results.length
    ? Math.round(Math.max(...results.map((r) => parseFloat(r.percentage) || 0)))
    : 0;

  return (
    <div className="fade-up">
      <div className="portal-hero">
        <div className="portal-hero-copy">
          <span className="portal-hero-kicker" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#047857' }}>
            <Sparkles size={13} /> Educator Excellence
          </span>
          <h1 className="portal-hero-title">Teacher Skill Dashboard</h1>
          <p className="portal-hero-desc">
            Attempt pedagogy and subject mastery tests, track accuracy trends, and sharpen classroom readiness.
          </p>
        </div>
        <div className="portal-hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/teacher/tests')}>
            Browse Tests <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid-4 mb-6">
        <KpiCard
          icon={ClipboardList}
          label="Tests Available"
          value={tests.length}
          badge="Active"
          accent="#059669"
          index={0}
          loading={loading}
          onClick={() => navigate('/teacher/tests')}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Tests Completed"
          value={results.length}
          badge="Submitted"
          accent="#6C63FF"
          index={1}
          loading={loading}
          onClick={() => navigate('/teacher/results')}
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg. Accuracy"
          value={avgScore}
          suffix="%"
          sub="Across completed tests"
          accent="#0EA5E9"
          index={2}
          loading={loading}
        />
        <KpiCard
          icon={Trophy}
          label="Best Score"
          value={bestScore}
          suffix="%"
          sub="Personal highest"
          accent="#D97706"
          index={3}
          loading={loading}
        />
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="page-header-row" style={{ marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--clr-text)' }}>
              Recommended Skill Tests
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Jump right into your latest assigned assessments</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/teacher/tests')}>
            View All ({tests.length}) <ArrowRight size={14} />
          </button>
        </div>

        {tests.length === 0 && !loading ? (
          <div className="coming-soon" style={{ minHeight: '22vh' }}>
            <div className="cs-icon-wrap"><ClipboardList size={26} /></div>
            <h3>No tests assigned yet</h3>
            <p>Published skill tests for teachers will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {tests.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="soft-item-card"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px' }}
              >
                <span className="badge badge-teacher" style={{ width: 'fit-content' }}>
                  {t.subject_name || 'Pedagogy'}
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)' }}>{t.title}</h4>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', color: 'var(--clr-text-dim)', marginTop: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} /> {t.duration_mins} mins
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Target size={14} /> {t.total_marks} marks
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-2"
                  style={{ width: '100%' }}
                  onClick={() => navigate(`/teacher/tests/${t.id}/take`)}
                >
                  Start Practice Test <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
