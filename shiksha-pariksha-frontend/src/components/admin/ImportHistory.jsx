import React, { useEffect, useState } from 'react';
import { History, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

export default function ImportHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/question-imports/history')
      .then((r) => setHistory(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up">
      <div className="page-header mb-6">
        <h2 className="page-title">Question Import History</h2>
        <p className="text-muted">Audit log of all past Excel question sheet uploads and batch jobs</p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="coming-soon glass-card" style={{ minHeight: '30vh' }}>
          <div className="cs-icon-wrap"><History size={28} /></div>
          <h3>No Excel imports recorded yet</h3>
          <p>Upload a question bank spreadsheet from the &quot;Import Questions&quot; tab to see records here.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Exam Series</th>
                <th>Status</th>
                <th>Total Rows</th>
                <th>Imported</th>
                <th>Failed</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <FileSpreadsheet size={16} color="#059669" />
                      {h.file_name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--clr-text-muted)' }}>{h.exam_name || 'General Bank'}</td>
                  <td>
                    <span className={`badge ${h.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{h.total_rows}</td>
                  <td style={{ color: 'var(--clr-success)', fontWeight: 700 }}>{h.imported_rows}</td>
                  <td style={{ color: h.failed_rows > 0 ? 'var(--clr-danger)' : 'var(--clr-text-dim)', fontWeight: h.failed_rows > 0 ? 700 : 500 }}>
                    {h.failed_rows}
                  </td>
                  <td style={{ color: 'var(--clr-text-dim)', fontSize: '0.85rem' }}>
                    {new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
