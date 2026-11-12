import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  ClipboardList,
  BookOpenCheck,
  GraduationCap,
  Users,
  BookOpen,
  FileSpreadsheet,
  PlusCircle,
  UploadCloud,
  BellPlus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import KpiCard from '../common/KpiCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      icon: HelpCircle,
      label: 'Total Questions',
      value: stats?.questions ?? 0,
      badge: 'Bank',
      sub: 'Bilingual MCQ repository',
      accent: '#6C63FF',
      onClick: () => navigate('/admin/import'),
    },
    {
      icon: ClipboardList,
      label: 'Practice Tests',
      value: stats?.tests?.total ?? 0,
      badge: 'Live',
      sub: `${stats?.tests?.published ?? 0} published & active`,
      accent: '#059669',
      onClick: () => navigate('/admin/tests'),
    },
    {
      icon: BookOpenCheck,
      label: 'Teachers',
      value: stats?.users?.teachers ?? 0,
      badge: 'Educators',
      sub: 'Active faculty accounts',
      accent: '#E11D48',
    },
    {
      icon: GraduationCap,
      label: 'Students',
      value: stats?.users?.students ?? 0,
      badge: 'Learners',
      sub: 'Enrolled exam candidates',
      accent: '#7C3AED',
    },
    {
      icon: Users,
      label: 'Parents',
      value: stats?.users?.parents ?? 0,
      badge: 'Guardians',
      sub: 'Linked family portals',
      accent: '#D97706',
    },
    {
      icon: BookOpen,
      label: 'Study Materials',
      value: stats?.materials ?? 0,
      badge: 'Resources',
      sub: 'Revision PDFs & notes',
      accent: '#0EA5E9',
      onClick: () => navigate('/admin/materials'),
    },
  ];

  const quickActions = [
    {
      icon: FileSpreadsheet,
      title: 'Import Questions',
      sub: 'Upload & validate Excel sheets',
      path: '/admin/import',
      accent: '#6C63FF',
      bg: 'rgba(108, 99, 255, 0.1)',
    },
    {
      icon: PlusCircle,
      title: 'Create Practice Test',
      sub: 'Assemble MCQs & publish exams',
      path: '/admin/tests/create',
      accent: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
    },
    {
      icon: UploadCloud,
      title: 'Upload Study Material',
      sub: 'Share PDFs & revision notes',
      path: '/admin/materials',
      accent: '#D97706',
      bg: 'rgba(217, 119, 6, 0.1)',
    },
    {
      icon: BellPlus,
      title: 'Post Notification',
      sub: 'Broadcast notices to portals',
      path: '/admin/notifications',
      accent: '#E11D48',
      bg: 'rgba(225, 29, 72, 0.1)',
    },
  ];

  return (
    <div className="fade-up">
      {/* Hero Banner */}
      <div className="portal-hero">
        <div className="portal-hero-copy">
          <span className="portal-hero-kicker">
            <Sparkles size={13} /> Platform Command Center
          </span>
          <h1 className="portal-hero-title">Admin Dashboard</h1>
          <p className="portal-hero-desc">
            Monitor question banks, manage mock tests, upload study materials, and coordinate announcements across all portals.
          </p>
        </div>
        <div className="portal-hero-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/import')}
          >
            <FileSpreadsheet size={16} /> Import Excel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/admin/tests/create')}
          >
            <PlusCircle size={16} /> Create Test
          </button>
        </div>
      </div>

      {/* Animated KPI Cards */}
      <div className="stats-grid stats-grid-6 mb-6">
        {kpis.map((k, idx) => (
          <KpiCard key={k.label} {...k} index={idx} loading={loading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="section-label">Quick Actions</h3>
        <div className="quick-actions-grid">
          {quickActions.map((a) => {
            const ActionIcon = a.icon;
            return (
              <button
                key={a.title}
                type="button"
                className="quick-action-card"
                onClick={() => navigate(a.path)}
              >
                <div className="qa-icon" style={{ background: a.bg, color: a.accent }}>
                  <ActionIcon size={21} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="qa-title">{a.title}</span>
                  <span className="qa-sub">{a.sub}</span>
                </div>
                <ArrowRight size={16} color="#94A3B8" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
