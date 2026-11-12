import React, { useEffect, useState } from 'react';
import { Bell, AlertCircle, Check } from 'lucide-react';
import api from '../../services/api';

export default function Notifications() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/notifications')
      .then((res) => setNotices(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/parent/notifications/${id}/read`);
      setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch {
      // optimistic
    }
  };

  return (
    <div className="fade-up">
      <div className="page-header mb-6">
        <h2 className="page-title">Announcements &amp; Notices</h2>
        <p className="text-muted">Important circulars, board exam schedules, and academic updates</p>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>}

      {!loading && notices.length === 0 && (
        <div className="coming-soon glass-card" style={{ minHeight: '30vh' }}>
          <div className="cs-icon-wrap"><Bell size={28} /></div>
          <h3>No announcements</h3>
          <p>You&apos;re all caught up! When new circulars are posted, they will appear here.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {notices.map((n) => {
          const isUnread = !n.read_at;
          return (
            <div
              key={n.id}
              className="glass-card"
              style={{
                padding: '22px 24px',
                borderLeft: n.is_important
                  ? '4px solid var(--clr-danger)'
                  : isUnread
                    ? '4px solid var(--clr-primary)'
                    : '1px solid var(--clr-border)',
                background: isUnread ? '#FFFFFF' : '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {n.is_important && (
                    <span className="badge badge-danger">
                      <AlertCircle size={11} /> Urgent Alert
                    </span>
                  )}
                  {isUnread && <span className="badge badge-primary">New</span>}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>
                  {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '8px' }}>
                {n.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--clr-text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {n.body}
              </p>

              {isUnread && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <Check size={14} /> Mark as Read
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
