import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Flag,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  Trophy,
  BarChart3,
} from 'lucide-react';
import api from '../../services/api';
import './TakeTest.css';

export default function TakeTest({ role = 'student' }) {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptId, setAttemptId] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);

  // 1. Start or resume attempt and load questions
  useEffect(() => {
    let isMounted = true;
    async function initExam() {
      try {
        const startRes = await api.post(`/${role}/attempts/start`, { test_id: testId });
        const { attemptId: attId, test: testMeta } = startRes.data.data;
        if (!isMounted) return;

        setAttemptId(attId);
        setTest(testMeta);

        const qRes = await api.get(`/${role}/attempts/${attId}/questions`);
        if (!isMounted) return;

        const { questions: qList } = qRes.data.data;
        setQuestions(qList || []);

        const initialAnswers = {};
        (qList || []).forEach((q) => {
          if (q.selected_key) initialAnswers[q.id] = q.selected_key;
        });
        setAnswers(initialAnswers);

        const durationSec = (testMeta.duration_mins || 30) * 60;
        setTimeLeft(durationSec);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load test. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initExam();
    return () => { isMounted = false; };
  }, [testId, role]);

  // 2. Auto-submit on timer expiry
  const handleAutoSubmit = useCallback(async () => {
    if (submitting || result || !attemptId) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/${role}/attempts/${attemptId}/submit`);
      setResult(res.data.data);
    } catch {
      // fallback
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [attemptId, role, submitting, result]);

  // 3. Countdown timer
  useEffect(() => {
    if (loading || result || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, result, timeLeft, handleAutoSubmit]);

  // 4. Select answer
  const handleSelectOption = useCallback(async (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || result) return;

    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionKey }));

    try {
      await api.post(`/${role}/attempts/${attemptId}/answer`, {
        question_id: currentQ.id,
        selected_key: optionKey,
        time_spent_sec: 10,
      });
    } catch {
      // optimistic
    }
  }, [questions, currentIndex, result, role, attemptId]);

  // 5. Keyboard navigation (ArrowLeft / ArrowRight / A-D)
  useEffect(() => {
    if (loading || result || showSubmitModal || !questions.length) return;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      } else {
        const keyMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', a: 'A', b: 'B', c: 'C', d: 'D' };
        const mapped = keyMap[e.key.toLowerCase()];
        const currentQ = questions[currentIndex];
        if (mapped && currentQ?.options?.some((o) => o.key === mapped)) {
          handleSelectOption(mapped);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, result, showSubmitModal, questions, currentIndex, handleSelectOption]);

  // 6. Clear answer
  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  };

  // 7. Toggle review mark
  const handleToggleMark = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarked((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  // 8. Manual submit
  const handleSubmitConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/${role}/attempts/${attemptId}/submit`);
      setResult(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Submission error');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="exam-loading-screen glass-card">
        <div className="spinner" />
        <p className="text-muted">Preparing your question paper...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-error-screen glass-card">
        <div className="cs-icon-wrap" style={{ background: '#FFF1F2', color: '#BE123C' }}>
          <AlertTriangle size={28} />
        </div>
        <h2>Unable to Start Test</h2>
        <p className="text-muted">{error}</p>
        <button type="button" className="btn btn-primary mt-2" onClick={() => navigate(`/${role}/tests`)}>
          Back to Tests
        </button>
      </div>
    );
  }

  // ── Result Screen ────────────────────────────────────────────────
  if (result) {
    const isPassing = (result.percentage || 0) >= 50;
    return (
      <motion.div
        className="exam-result-container"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="result-card">
          <div
            className="result-badge-icon"
            style={{
              background: isPassing ? '#ECFDF5' : '#EEF2FF',
              color: isPassing ? '#059669' : '#6C63FF',
            }}
          >
            {isPassing ? <Trophy size={34} /> : <BarChart3 size={34} />}
          </div>
          <h2 className="result-title">{isPassing ? 'Excellent Effort!' : 'Test Completed'}</h2>
          <p className="result-subtitle">{test?.title}</p>

          <div className="result-stats-row">
            <div className="result-stat-box">
              <span className="stat-num" style={{ color: 'var(--clr-primary)' }}>
                {result.score} / {result.totalMarks}
              </span>
              <span className="stat-lbl">Marks Earned</span>
            </div>
            <div className="result-stat-box">
              <span className="stat-num" style={{ color: isPassing ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                {result.percentage}%
              </span>
              <span className="stat-lbl">Accuracy</span>
            </div>
            <div className="result-stat-box">
              <span className="stat-num" style={{ color: '#0EA5E9' }}>
                {Math.floor((result.timeTakenSec || 0) / 60)}m {(result.timeTakenSec || 0) % 60}s
              </span>
              <span className="stat-lbl">Time Taken</span>
            </div>
          </div>

          <div className="result-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/${role}/results`)}>
              View All Results
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/${role}/tests`)}>
              Take Another Test
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.values(marked).filter(Boolean).length;
  const isTimerCritical = timeLeft < 120;
  const isTimerWarning = timeLeft >= 120 && timeLeft < 300;

  return (
    <div className="exam-mode-container">
      {/* ── Top Exam Navigation Header ───────────────────────────── */}
      <header className="exam-header">
        <div className="exam-header-left">
          <span className="exam-badge">{test?.class_level ? `Class ${test.class_level}` : 'Mock Test'}</span>
          <h1 className="exam-title">{test?.title}</h1>
        </div>

        <div className="exam-header-center">
          <span className="q-progress-text">
            Question <strong>{currentIndex + 1}</strong> of {questions.length} · <strong>{answeredCount}</strong> answered
          </span>
          <div className="q-progress-bar-bg">
            <div
              className="q-progress-bar-fill"
              style={{ width: `${questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="exam-header-right">
          <div className={`exam-timer-pill ${isTimerCritical ? 'critical' : isTimerWarning ? 'warning' : ''}`}>
            <Clock size={17} />
            <span className="timer-digits">{formatTimer(timeLeft)}</span>
          </div>
          <button type="button" className="btn-finish" onClick={() => setShowSubmitModal(true)}>
            <Send size={15} /> Submit Test
          </button>
        </div>
      </header>

      {/* ── Main Exam Body: Split View ────────────────────────────── */}
      <div className="exam-body">
        {/* Left: Active Question Card */}
        <main className="exam-question-area">
          {currentQ ? (
            <motion.div
              className="question-card"
              key={currentQ.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="question-meta-bar">
                <div className="q-meta-left">
                  <span className="q-number-pill">Question {currentIndex + 1}</span>
                  <span className="q-marks-pill">+{currentQ.marks || 1} mark</span>
                </div>
                <button
                  type="button"
                  className={`btn-flag ${marked[currentQ.id] ? 'active' : ''}`}
                  onClick={handleToggleMark}
                  title="Mark for Review"
                >
                  <Flag size={14} />
                  <span>{marked[currentQ.id] ? 'Marked for Review' : 'Mark Review'}</span>
                </button>
              </div>

              {/* Bilingual Question Text */}
              <div className="question-text-box">
                {currentQ.question_text_en && (
                  <p className="q-text-en">{currentQ.question_text_en}</p>
                )}
                {currentQ.question_text_hi && (
                  <p className="q-text-hi">{currentQ.question_text_hi}</p>
                )}
              </div>

              {/* Options List */}
              <div className="options-grid">
                {currentQ.options?.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.key;
                  return (
                    <button
                      type="button"
                      key={opt.key}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(opt.key)}
                    >
                      <div className="opt-key-circle">{opt.key}</div>
                      <div className="opt-text-wrap">
                        {opt.text_en && <div className="opt-en">{opt.text_en}</div>}
                        {opt.text_hi && <div className="opt-hi">{opt.text_hi}</div>}
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="opt-check-badge" />}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Card Controls */}
              <div className="q-footer-controls">
                <button
                  type="button"
                  className="btn-clear"
                  onClick={handleClearAnswer}
                  disabled={!answers[currentQ.id]}
                >
                  Clear Choice
                </button>

                <div className="q-nav-buttons">
                  <button
                    type="button"
                    className="btn-nav"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                  >
                    <ArrowLeft size={15} /> Previous
                  </button>
                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                    >
                      Next Question <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-finish"
                      onClick={() => setShowSubmitModal(true)}
                    >
                      Review & Submit <Send size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="kbd-hint">
                Tip: Use ← / → arrow keys to navigate questions and A–D keys to select an answer.
              </div>
            </motion.div>
          ) : (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p className="text-muted">No questions found in this test.</p>
            </div>
          )}
        </main>

        {/* Right: Question Palette Navigator */}
        <aside className="exam-palette-sidebar">
          <h3 className="palette-title">Question Palette</h3>

          <div className="palette-legend">
            <div className="leg-item"><span className="dot dot-answered" /> Answered ({answeredCount})</div>
            <div className="leg-item"><span className="dot dot-marked" /> Marked ({markedCount})</div>
            <div className="leg-item"><span className="dot dot-skipped" /> Not Answered ({questions.length - answeredCount})</div>
          </div>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const isAns = !!answers[q.id];
              const isMkd = !!marked[q.id];
              const isCur = idx === currentIndex;

              let dotClass = 'dot-unvisited';
              if (isAns) dotClass = 'dot-answered';
              if (isMkd) dotClass = 'dot-marked';
              if (isCur) dotClass += ' dot-current';

              return (
                <button
                  type="button"
                  key={q.id}
                  className={`palette-num-btn ${dotClass}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-footer-summary">
            <button
              type="button"
              className="btn-finish w-full"
              style={{ justifyContent: 'center' }}
              onClick={() => setShowSubmitModal(true)}
            >
              <Send size={15} /> Submit Exam
            </button>
          </div>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ────────────────────────────── */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <motion.div
            className="modal-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Ready to Submit?</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Review your test progress before final submission:
            </p>

            <div className="modal-summary-grid">
              <div className="sum-box">
                <span className="sum-val" style={{ color: 'var(--clr-success)' }}>{answeredCount}</span>
                <span className="sum-lbl">Answered</span>
              </div>
              <div className="sum-box">
                <span className="sum-val" style={{ color: 'var(--clr-warning)' }}>
                  {questions.length - answeredCount}
                </span>
                <span className="sum-lbl">Unanswered</span>
              </div>
              <div className="sum-box">
                <span className="sum-val" style={{ color: 'var(--clr-primary)' }}>
                  {markedCount}
                </span>
                <span className="sum-lbl">Marked</span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-dim)', textAlign: 'center' }}>
              Once submitted, you will immediately see your score and accuracy summary.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Continue Test
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleSubmitConfirm}
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
