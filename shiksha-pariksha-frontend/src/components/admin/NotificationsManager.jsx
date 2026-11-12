import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function NotificationsManager() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [isImportant, setIsImportant] = useState(false);

  const loadNotices = useCallback(() => {
    api.get('/admin/notifications')
      .then((r) => setNotifications(r.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    if (!body.trim()) return setError('Body text is required');

    setPosting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/notifications', {
        title: title.trim(),
        body: body.trim(),
        target_role: targetRole,
        is_important: isImportant,
      });

      setSuccess('Announcement broadcasted successfully!');
      setTitle('');
      setBody('');
      setIsImportant(false);
      loadNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fade-up">
      <div className="page-header mb-6">
        <h2 className="page-title">Broadcast Announcements &amp; Notices</h2>
        <p className="text-muted">Post important updates, exam alerts, and guidelines to targeted user roles</p>
      </div>

      <div className="builder-grid">
        {/* Post Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', marginBottom: '16px' }}>
            New Announcement
          </h3>

          {error && <div className="form-error mb-3">⚠️ {error}</div>}
          {success && (
            <div className="form-success mb-3">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Announcement Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Class 10 Mock Exam Dates Released"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Message Body *</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Full details of the announcement..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Target Audience</label>
              <select className="input-field" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                <option value="all">Everyone (All Roles)</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--clr-text)' }}>
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
              />
              <span>Mark as High Priority / Urgent</span>
            </label>

            <button type="submit" className="btn btn-primary mt-2" disabled={posting}>
              <Send size={15} />
              <span>{posting ? 'Posting...' : 'Broadcast Notice'}</span>
            </button>
          </form>
        </div>

        {/* Existing Notices Feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.12rem', marginBottom: '16px' }}>
            Broadcast History ({notifications.length})
          </h3>

          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>}

          {!loading && notifications.length === 0 && (
            <div className="coming-soon" style={{ minHeight: '24vh' }}>
              <div className="cs-icon-wrap"><Bell size={26} /></div>
              <h3>No notices published yet</h3>
              <p>Create an announcement on the left to notify students, teachers, or parents.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                className="soft-item-card"
                style={{
                  padding: '16px 18px',
                  borderColor: n.is_important ? '#FECDD3' : undefined,
                  background: n.is_important ? '#FFF1F2' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {n.is_important && (
                      <span className="badge badge-danger">
                        <AlertCircle size={11} /> Urgent
                      </span>
                    )}
                    <span className="badge badge-muted">
                      Audience: {n.target_role || 'All'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)' }}>
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '5px' }}>
                  {n.title}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
