import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Trophy,
  GraduationCap,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import PortalShell from '../common/PortalShell';
import KpiCard from '../common/KpiCard';
import TestList from '../common/TestList';
import TakeTest from '../common/TakeTest';
import MyResults from '../common/MyResults';
import api from '../../services/api';

const NAV = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/tests', icon: Target, label: 'Practice Tests' },
  { to: '/student/results', icon: Trophy, label: 'My Results' },
];

export default function StudentPortal() {
  const navigate = useNavigate();

  return (
    <PortalShell
      role="student"
      portalTitle="Student"
      portalSubtitle="Learning Hub"
      badgeLabel="Student"
      brandIcon={GraduationCap}
      avatarGradient="linear-gradient(135deg, #6C63FF, #BA68C8)"
      navItems={NAV}
    >
      <Routes>
        <Route index element={<StudentDashboard navigate={navigate} />} />
        <Route path="tests" element={<TestList role="student" />} />
        <Route path="tests/:testId/take" element={<TakeTest role="student" />} />
        <Route path="results" element={<MyResults role="student" />} />
      </Routes>
    </PortalShell>
  );
}

function StudentDashboard({ navigate }) {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/tests').then((r) => setTests(r.data.data?.tests || [])).catch(() => {}),
      api.get('/student/results').then((r) => setResults(r.data.data?.results || [])).catch(() => {}),
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
          <span className="portal-hero-kicker">
            <Sparkles size={13} /> Daily Exam Practice
          </span>
          <h1 className="portal-hero-title">My Learning Dashboard</h1>
          <p className="portal-hero-desc">
            Practice timed mock exams, monitor your accuracy score, and build confidence for board exams.
          </p>
        </div>
        <div className="portal-hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/student/tests')}>
            Start Practicing <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid-4 mb-6">
        <KpiCard
          icon={ClipboardList}
          label="Tests Available"
          value={tests.length}
          badge="Ready"
          accent="#6C63FF"
          index={0}
          loading={loading}
          onClick={() => navigate('/student/tests')}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Tests Completed"
          value={results.length}
          badge="Attempted"
          accent="#059669"
          index={1}
          loading={loading}
          onClick={() => navigate('/student/results')}
        />
        <KpiCard
          icon={TrendingUp}
          label="Average Score"
          value={avgScore}
          suffix="%"
          sub="Overall accuracy"
          accent="#7C3AED"
          index={2}
          loading={loading}
        />
        <KpiCard
          icon={Trophy}
          label="Highest Score"
          value={bestScore}
          suffix="%"
          sub="Personal best"
          accent="#D97706"
          index={3}
          loading={loading}
        />
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="page-header-row" style={{ marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--clr-text)' }}>
              Active Practice Tests
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Pick a mock test and start right away</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/student/tests')}>
            Browse All ({tests.length}) <ArrowRight size={14} />
          </button>
        </div>

        {tests.length === 0 && !loading ? (
          <div className="coming-soon" style={{ minHeight: '22vh' }}>
            <div className="cs-icon-wrap"><Target size={26} /></div>
            <h3>No practice tests currently available</h3>
            <p>Check back soon when your administrator publishes new mock tests.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {tests.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="soft-item-card"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-student">{t.subject_name || 'General'}</span>
                  {t.class_level && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--clr-text-dim)' }}>
                      Class {t.class_level}
                    </span>
                  )}
                </div>
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
                  onClick={() => navigate(`/student/tests/${t.id}/take`)}
                >
                  {t.my_status === 'in_progress' ? 'Resume Exam' : 'Start Exam'} <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
