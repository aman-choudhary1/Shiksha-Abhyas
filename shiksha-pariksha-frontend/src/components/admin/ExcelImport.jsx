import React, { useState, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  X,
  SearchCheck,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Rows3,
} from 'lucide-react';
import api from '../../services/api';
import KpiCard from '../common/KpiCard';
import './ExcelImport.css';

export default function ExcelImport() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [examName, setExamName] = useState('');
  const [examYear, setExamYear] = useState('');
  const [mode, setMode] = useState('strict');
  const [duplicatePolicy, setDuplicatePolicy] = useState('reject_duplicates');
  const [confirmReplace, setConfirmReplace] = useState(false);

  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  const selectFile = useCallback((selected) => {
    if (!selected.name.toLowerCase().endsWith('.xlsx')) {
      setAlert({ type: 'danger', message: 'Invalid file format. Please upload a Microsoft Excel workbook (.xlsx).' });
      return;
    }
    setFile(selected);
    setValidationReport(null);
    setAlert(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) selectFile(droppedFile);
  }, [selectFile]);

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setValidationReport(null);
    setAlert(null);
  };

  const handleDownloadTemplate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get('/admin/question-imports/template', { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'CGTET2016_Minimal_Question_Upload.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.location.href = '/api/admin/question-imports/template';
    }
  };

  // 1. Dry-Run Validation
  const handleValidate = async () => {
    if (!file) return;

    setValidating(true);
    setAlert(null);

    const formData = new FormData();
    formData.append('file', file);
    if (examName.trim()) formData.append('exam_name', examName.trim());
    if (examYear.trim()) formData.append('year', examYear.trim());

    try {
      const res = await api.post('/admin/question-imports/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setValidationReport(res.data.data);
      if (res.data.data?.summary?.invalidRows > 0) {
        setAlert({
          type: 'warning',
          message: `Validation completed with warnings. ${res.data.data.summary.invalidRows} defective row(s) found. Check the report below.`,
        });
      } else {
        setAlert({
          type: 'success',
          message: `Validation successful! All ${res.data.data?.summary?.validRows || 0} questions are valid and ready for ingestion.`,
        });
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Validation failed. Please verify the Excel sheet structure.',
      });
    } finally {
      setValidating(false);
    }
  };

  // 2. Transactional Database Import
  const handleImport = async () => {
    if (!file) return;

    if (duplicatePolicy === 'replace_exam' && !confirmReplace) {
      setAlert({
        type: 'warning',
        message: 'Please check the confirmation box below to authorize replacing existing exam questions.',
      });
      return;
    }

    setImporting(true);
    setAlert(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    formData.append('duplicate_policy', duplicatePolicy);
    if (confirmReplace) formData.append('confirm_replace', 'true');
    if (examName.trim()) formData.append('exam_name', examName.trim());
    if (examYear.trim()) formData.append('year', examYear.trim());

    try {
      const res = await api.post('/admin/question-imports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data.data;
      setAlert({
        type: 'success',
        message: `Success! ${data.importedQuestions || data.imported_rows || 0} questions imported for exam "${data.examName || examName || 'Question Bank'}" (${data.examYear || examYear || '2026'}). Status: ${data.status}`,
      });

      setValidationReport(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Import failed';
      const detail = err.response?.data?.errors?.invalidRows?.length
        ? ` (${err.response.data.errors.invalidRows.length} invalid rows found)`
        : '';
      setAlert({ type: 'danger', message: `Import Error: ${msg}${detail}` });
    } finally {
      setImporting(false);
    }
  };

  const step1Done = !!file;
  const step2Done = !!validationReport;

  return (
    <div className="excel-import-wrap fade-up">
      {/* ── Top Header Actions Bar ──────────────────────────────── */}
      <div className="import-top-bar">
        <div>
          <h2 className="page-title">Import Bilingual Questions</h2>
          <p className="text-muted">
            Upload an <code>.xlsx</code> workbook with bilingual questions in <strong>Questions</strong> and metadata in <strong>Upload_Metadata</strong>.
          </p>
        </div>

        <div className="import-header-actions">
          <div className="status-pill">
            <span className="status-dot" />
            <span>DB Connected: shiksha_pariksha</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="btn btn-secondary"
            title="Download official Excel template with sample questions"
          >
            <Download size={16} /> Download Template (.xlsx)
          </button>
        </div>
      </div>

      {/* ── Main Upload Card ─────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '26px' }}>
        {/* Stepper */}
        <div className="import-steps">
          <span className={`import-step-pill ${step1Done ? 'done' : 'active'}`}>
            1. Select Workbook
          </span>
          <span className={`import-step-pill ${step2Done ? 'done' : step1Done ? 'active' : ''}`}>
            2. Dry-Run Validate
          </span>
          <span className={`import-step-pill ${step2Done ? 'active' : ''}`}>
            3. Import to Bank
          </span>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`demo-dropzone ${dragging ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('demo-excel-input').click()}
        >
          <input
            id="demo-excel-input"
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
          />
          <div className="dropzone-icon-wrap">
            <UploadCloud size={28} />
          </div>
          <div className="dropzone-text">
            <h3>Drag and drop your Excel file here, or click to browse</h3>
            <p>Supported format: Microsoft Excel (.xlsx) · Max size: 10 MB</p>
          </div>

          {file && (
            <div className="file-info-badge">
              <FileSpreadsheet size={16} />
              <span>{file.name}</span>
              <span style={{ opacity: 0.7 }}>({(file.size / 1024).toFixed(1)} KB)</span>
              <button
                type="button"
                className="btn-clear-file"
                onClick={handleClearFile}
                title="Remove selected file"
                aria-label="Remove selected file"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Form Grid: Metadata & Import Configurations */}
        <div className="demo-form-grid">
          <div className="demo-form-group">
            <label>Exam Name (Optional Override)</label>
            <input
              type="text"
              className="demo-form-control"
              placeholder="e.g. CGTET / State Board"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
          </div>

          <div className="demo-form-group">
            <label>Exam Year (Optional Override)</label>
            <input
              type="number"
              className="demo-form-control"
              placeholder="e.g. 2026"
              min={1990}
              max={2100}
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
            />
          </div>

          <div className="demo-form-group">
            <label>Import Mode</label>
            <select
              className="demo-form-control"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="strict">Strict (Fail on any error - Recommended)</option>
              <option value="partial">Partial (Import valid rows, report errors)</option>
            </select>
          </div>

          <div className="demo-form-group">
            <label>Duplicate Policy</label>
            <select
              className="demo-form-control"
              value={duplicatePolicy}
              onChange={(e) => setDuplicatePolicy(e.target.value)}
            >
              <option value="reject_duplicates">Reject if Duplicates Exist</option>
              <option value="skip_existing">Skip Existing Database Records</option>
              <option value="replace_exam">Replace All Exam Questions</option>
            </select>
          </div>
        </div>

        {/* Destructive Replace Confirmation Checkbox */}
        {duplicatePolicy === 'replace_exam' && (
          <div className="replace-confirm-box fade-up">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={confirmReplace}
                onChange={(e) => setConfirmReplace(e.target.checked)}
              />
              <span>
                <strong>Confirm destructive replacement:</strong> I authorize deleting existing questions for this exam and replacing them with this upload.
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="actions-bar">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!file || validating || importing}
            onClick={handleValidate}
          >
            <SearchCheck size={16} /> Validate File (Dry-Run)
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!file || validating || importing}
            onClick={handleImport}
          >
            <Rocket size={16} /> Import Questions to Database
          </button>

          {(validating || importing) && (
            <span style={{ color: 'var(--clr-primary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              {validating ? 'Analyzing workbook and validating question rows...' : 'Executing transactional database import...'}
            </span>
          )}
        </div>
      </div>

      {/* ── Status Alert Box ─────────────────────────────────────── */}
      {alert && (
        <div className={`alert-box alert-${alert.type} fade-up`}>
          {alert.type === 'success' ? (
            <CheckCircle2 size={19} style={{ flexShrink: 0, marginTop: 1 }} />
          ) : alert.type === 'warning' ? (
            <AlertTriangle size={19} style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <XCircle size={19} style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <span style={{ flex: 1, lineHeight: 1.5 }}>{alert.message}</span>
        </div>
      )}

      {/* ── Validation Report & Question Preview Section ────────── */}
      {validationReport && (
        <div className="glass-card fade-up" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--clr-text)' }}>
              Validation Report & Question Preview
            </h3>
            <p className="text-muted" style={{ fontSize: '0.86rem', marginTop: '4px' }}>
              Examination: <strong>{validationReport.metadata?.exam_name || examName || 'N/A'}</strong> · Year: <strong>{validationReport.metadata?.year || examYear || 'N/A'}</strong>
            </p>
          </div>

          {/* Animated KPI Row */}
          <div className="stats-grid stats-grid-4 mb-6">
            <KpiCard
              icon={Rows3}
              label="Total Rows"
              value={validationReport.summary?.totalRows ?? 0}
              accent="#3B82F6"
              index={0}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Valid Questions"
              value={validationReport.summary?.validRows ?? 0}
              accent="#059669"
              index={1}
            />
            <KpiCard
              icon={XCircle}
              label="Invalid Rows"
              value={validationReport.summary?.invalidRows ?? 0}
              accent="#DC2626"
              index={2}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Warnings"
              value={validationReport.summary?.warningRows ?? 0}
              accent="#D97706"
              index={3}
            />
          </div>

          {/* Invalid Rows Table (if any) */}
          {validationReport.invalidRows?.length > 0 && (
            <div style={{ marginBottom: '26px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#BE123C', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Defective Rows Requiring Correction
              </h4>
              <div className="data-table-wrap" style={{ borderColor: '#FECDD3' }}>
                <table className="data-table" style={{ minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: '#FFF1F2' }}>
                      <th>Excel Row</th>
                      <th>Question #</th>
                      <th>Subject</th>
                      <th>Validation Issue(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationReport.invalidRows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>Row {r.excelRow}</td>
                        <td>{r.question_no || '—'}</td>
                        <td>{r.subject || '—'}</td>
                        <td style={{ color: '#BE123C', fontWeight: 500 }}>
                          {r.errors?.map((errStr, idx) => (
                            <div key={idx}>• {errStr}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Duplicate Warnings (if any) */}
          {validationReport.duplicateWarnings?.length > 0 && (
            <div className="alert-box alert-warning mb-4">
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Potential Duplicate Questions Flagged:</strong>
                <ul style={{ marginLeft: '18px', marginTop: '6px', fontSize: '0.85rem' }}>
                  {validationReport.duplicateWarnings.map((w, idx) => (
                    <li key={idx}>{w.message} (Row {w.excelRow})</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Sample Questions Preview Cards */}
          <div style={{ marginTop: '18px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: '14px' }}>
              Sample Questions Preview
            </h4>

            {(!validationReport.preview || validationReport.preview.length === 0) ? (
              <p className="text-muted">No valid preview questions available.</p>
            ) : (
              <div className="questions-preview-list">
                {validationReport.preview.map((q, idx) => {
                  const correctKey = q.correct_answer || '';
                  return (
                    <article key={idx} className="q-preview-card">
                      <div className="q-header-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="q-badge">Question #{q.question_no || q.question_number || idx + 1}</span>
                          <span className="q-subject-pill">{q.subject || q.subject_name || 'General'}</span>
                        </div>
                        {correctKey && (
                          <span className="key-badge">Key: Option {correctKey}</span>
                        )}
                      </div>

                      {q.question_en && <div className="q-text-en">{q.question_en}</div>}
                      {q.question_hi && <div className="q-text-hi">{q.question_hi}</div>}

                      <div className="options-preview-grid">
                        {q.options?.map((opt) => {
                          const isCorrect = opt.key === correctKey || opt.is_correct;
                          return (
                            <div key={opt.key} className={`opt-pill ${isCorrect ? 'is-correct' : ''}`}>
                              <div className="opt-key-circle">{opt.key}</div>
                              <div style={{ minWidth: 0 }}>
                                {opt.text_en && <div style={{ fontWeight: 500 }}>{opt.text_en}</div>}
                                {opt.text_hi && <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem' }}>{opt.text_hi}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
