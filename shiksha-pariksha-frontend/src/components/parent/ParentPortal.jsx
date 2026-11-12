import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Bell,
  Users,
  Sparkles,
  ArrowRight,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import PortalShell from '../common/PortalShell';
import KpiCard from '../common/KpiCard';
import ChildReport from './ChildReport';
import StudyMaterials from './StudyMaterials';
import Notifications from './Notifications';
import api from '../../services/api';

const NAV = [
  { to: '/parent', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/parent/report', icon: TrendingUp, label: "Child's Report" },
  { to: '/parent/materials', icon: BookOpen, label: 'Study Materials' },
  { to: '/parent/notifications', icon: Bell, label: 'Notifications' },
];

export default function ParentPortal() {
  const navigate = useNavigate();

  return (
    <PortalShell
      role="parent"
      portalTitle="Parent"
      portalSubtitle="Family Portal"
      badgeLabel="Parent"
      brandIcon={Users}
      avatarGradient="linear-gradient(135deg, #F59E0B, #F97316)"
      navItems={NAV}
    >
      <Routes>
        <Route index element={<ParentDashboard navigate={navigate} />} />
        <Route path="report" element={<ChildReport />} />
        <Route path="materials" element={<StudyMaterials />} />
        <Route path="notifications" element={<Notifications />} />
      </Routes>
    </PortalShell>
  );
}

function ParentDashboard({ navigate }) {
  const [children, setChildren] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/parent/children').then((r) => setChildren(r.data.data || [])).catch(() => {}),
      api.get('/parent/materials').then((r) => setMaterials(r.data.data?.materials || [])).catch(() => {}),
      api.get('/parent/notifications').then((r) => setNotices(r.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up">
      <div className="portal-hero">
        <div className="portal-hero-copy">
          <span className="portal-hero-kicker" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#B45309' }}>
            <Sparkles size={13} /> Guardian Insights
          </span>
          <h1 className="portal-hero-title">Parent Overview</h1>
          <p className="portal-hero-desc">
            Stay connected with your child&apos;s practice test performance, revision guides, and school circulars.
          </p>
        </div>
        <div className="portal-hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/parent/report')}>
            <BarChart3 size={16} /> View Child Report
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid-3 mb-6">
        <KpiCard
          icon={Users}
          label="Linked Children"
          value={children.length}
          sub={children[0]?.full_name || 'Student Profile'}
          accent="#D97706"
          index={0}
          loading={loading}
          onClick={() => navigate('/parent/report')}
        />
        <KpiCard
          icon={BookOpen}
          label="Study Materials"
          value={materials.length}
          sub="PDF revision sheets"
          accent="#6C63FF"
          index={1}
          loading={loading}
          onClick={() => navigate('/parent/materials')}
        />
        <KpiCard
          icon={Bell}
          label="Announcements"
          value={notices.length}
          sub="School circulars & alerts"
          accent="#E11D48"
          index={2}
          loading={loading}
          onClick={() => navigate('/parent/notifications')}
        />
      </div>

      <div className="split-2col">
        {/* Child Quick Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="page-header-row" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem' }}>Child Progress</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('report')}>
              Detailed Report <ArrowRight size={14} />
            </button>
          </div>

          {children.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {children.map((c) => (
                <div
                  key={c.id}
                  className="soft-item-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6C63FF, #BA68C8)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {c.full_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--clr-text)' }}>{c.full_name}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                        Class {c.class_level || 10}-{c.section || 'A'} · {c.school_name || 'School'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/parent/report')}
                  >
                    Open Report <BarChart3 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No child linked to this account yet.</p>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="page-header-row" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem' }}>Latest Circulars</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/parent/notifications')}>
              All Notices <ArrowRight size={14} />
            </button>
          </div>

          {notices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notices.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  className="soft-item-card"
                  style={{
                    padding: '13px 15px',
                    borderColor: n.is_important ? '#FECDD3' : undefined,
                    background: n.is_important ? '#FFF1F2' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--clr-text)' }}>{n.title}</span>
                    {n.is_important && (
                      <span className="badge badge-danger">
                        <AlertCircle size={11} /> Urgent
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No circulars posted.</p>
          )}
        </div>
      </div>
    </div>
  );
}
