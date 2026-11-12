import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Users,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  BarChart3,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ParticleCanvas from './ParticleCanvas';
import testIllustration from '../../assets/test.svg';
import './LoginPage.css';

const ROLES = [
  {
    id: 'admin',
    label: 'Admin',
    hindi: 'प्रशासक',
    Icon: ShieldCheck,
    desc: 'Manage questions, tests & platform',
    accent: '#E11D48',
    tint: 'rgba(225, 29, 72, 0.08)',
    borderTint: 'rgba(225, 29, 72, 0.24)',
    gradient: 'linear-gradient(135deg, #F43F5E, #FB7185)',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    hindi: 'शिक्षक',
    Icon: BookOpen,
    desc: 'Take practice tests & track progress',
    accent: '#059669',
    tint: 'rgba(5, 150, 105, 0.08)',
    borderTint: 'rgba(5, 150, 105, 0.24)',
    gradient: 'linear-gradient(135deg, #10B981, #14B8A6)',
  },
  {
    id: 'student',
    label: 'Student',
    hindi: 'छात्र',
    Icon: GraduationCap,
    desc: 'Practice tests & check your scores',
    accent: '#7C3AED',
    tint: 'rgba(124, 58, 237, 0.09)',
    borderTint: 'rgba(124, 58, 237, 0.28)',
    gradient: 'linear-gradient(135deg, #6C63FF, #BA68C8)',
  },
  {
    id: 'parent',
    label: 'Parent',
    hindi: 'अभिभावक',
    Icon: Users,
    desc: "Monitor child's progress & materials",
    accent: '#D97706',
    tint: 'rgba(217, 119, 6, 0.09)',
    borderTint: 'rgba(217, 119, 6, 0.24)',
    gradient: 'linear-gradient(135deg, #F59E0B, #F97316)',
  },
];

const HIGHLIGHTS = [
  { Icon: Clock, text: 'Timed Mock Tests' },
  { Icon: BarChart3, text: 'Instant Analytics' },
  { Icon: CheckCircle2, text: 'Bilingual Assessments' },
];

const CARD_VARIANTS = {
  hidden: { y: 16, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const selectedRole = ROLES.find((r) => r.id === role);

  const handleRoleSelect = (r) => {
    setRole(r.id);
    setError('');
    setForm({ identifier: '', password: '' });
    setShowPass(false);
  };

  const handleBack = () => {
    setRole(null);
    setError('');
    setShowPass(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) {
      setError('Please enter both your email/phone and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(form.identifier.trim(), form.password);
      if (user.role !== role) {
        setError(`This account is registered as "${user.role}". Please select the correct role.`);
        setLoading(false);
        return;
      }
      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoEmail = role ? `${role}@shiksha.local` : '';
  const demoPassword = role
    ? `${role.charAt(0).toUpperCase() + role.slice(1)}@123`
    : '';

  const fillDemo = () => {
    setForm({ identifier: demoEmail, password: demoPassword });
    setError('');
  };

  return (
    <div className="login-page">
      {/* Interactive Light-Mode Particle Network */}
      <ParticleCanvas />

      {/* Soft Pastel Ambient Glows */}
      <div className="login-ambient" aria-hidden="true">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
        <div className="ambient-blob blob-3" />
      </div>

      <motion.div
        className="login-shell"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Left Showcase Column (Vector Illustration + Value Props) ── */}
        <section className="login-showcase" aria-label="Platform Overview">
          <div className="showcase-badge">
            <Sparkles size={14} />
            <span>VSK Education Initiative · Online Assessment</span>
          </div>

          <div className="showcase-copy">
            <h2 className="showcase-title">
              Practice Today. <span>Excel Tomorrow.</span>
            </h2>
            <p className="showcase-subtitle">
              निरंतर अभ्यास, उत्कृष्ट परिणाम — Empowering students, teachers, and parents with structured online mock tests.
            </p>
          </div>

          <div className="showcase-stage">
            <div className="stage-halo" aria-hidden="true" />
            <motion.img
              src={testIllustration}
              alt="Online test assessment illustration"
              className="showcase-svg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="showcase-highlights">
            {HIGHLIGHTS.map(({ Icon, text }) => (
              <div key={text} className="highlight-pill">
                <Icon size={15} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right Auth Column (Role Selection & Sign-In Card) ── */}
        <section className="login-panel-col">
          <div className="login-panel">
            {/* Brand Header */}
            <header className="login-brand">
              <div className="brand-mark">
                <GraduationCap size={26} strokeWidth={2.2} />
              </div>
              <div className="brand-text">
                <h1 className="brand-title">Shiksha Abhyas</h1>
                <p className="brand-hindi">शिक्षा अभ्यास</p>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {!role ? (
                /* ── Step 1: Role Selector ─────────────────────────── */
                <motion.div
                  key="role-select"
                  className="role-section"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="panel-heading">
                    <h2>Welcome back</h2>
                    <p>Select your portal role to sign in</p>
                  </div>

                  <div className="role-cards">
                    {ROLES.map((r, i) => {
                      const RoleIcon = r.Icon;
                      return (
                        <motion.button
                          key={r.id}
                          type="button"
                          className="role-card"
                          custom={i}
                          variants={CARD_VARIANTS}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRoleSelect(r)}
                          style={{
                            '--role-accent': r.accent,
                            '--role-tint': r.tint,
                            '--role-border-tint': r.borderTint,
                          }}
                          aria-label={`Login as ${r.label}`}
                        >
                          <div className="role-card-top">
                            <div className="role-icon-wrap" style={{ background: r.gradient }}>
                              <RoleIcon size={20} color="#ffffff" strokeWidth={2.2} />
                            </div>
                            <ArrowRight size={16} className="role-arrow" />
                          </div>
                          <div className="role-info">
                            <div className="role-name-row">
                              <span className="role-label">{r.label}</span>
                              <span className="role-hindi">{r.hindi}</span>
                            </div>
                            <span className="role-desc">{r.desc}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* ── Step 2: Sign-In Form ──────────────────────────── */
                <motion.div
                  key="login-form"
                  className="form-section"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="form-top-row">
                    <button
                      type="button"
                      className="back-btn"
                      onClick={handleBack}
                    >
                      <ArrowLeft size={15} />
                      <span>All Roles</span>
                    </button>

                    <div
                      className="form-role-badge"
                      style={{
                        '--role-accent': selectedRole.accent,
                        '--role-tint': selectedRole.tint,
                        '--role-border-tint': selectedRole.borderTint,
                      }}
                    >
                      <selectedRole.Icon size={15} />
                      <span>{selectedRole.label} · {selectedRole.hindi}</span>
                    </div>
                  </div>

                  <div className="panel-heading">
                    <h2>Sign in as {selectedRole.label}</h2>
                    <p>{selectedRole.desc}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="form-group">
                      <label className="form-label" htmlFor="identifier">
                        Email or Phone
                      </label>
                      <div className="input-wrap">
                        <Mail size={17} className="input-icon" aria-hidden="true" />
                        <input
                          id="identifier"
                          className="input"
                          type="text"
                          placeholder="Enter your email or phone"
                          value={form.identifier}
                          onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                          autoComplete="username"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="password">
                        Password
                      </label>
                      <div className="input-wrap">
                        <Lock size={17} className="input-icon" aria-hidden="true" />
                        <input
                          id="password"
                          className="input input-has-toggle"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={form.password}
                          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="pass-toggle"
                          onClick={() => setShowPass((s) => !s)}
                          aria-label={showPass ? 'Hide password' : 'Show password'}
                        >
                          {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          className="form-error"
                          role="alert"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                        >
                          <AlertCircle size={16} className="error-icon" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      className="login-submit-btn"
                      disabled={loading}
                      style={{ background: selectedRole.gradient }}
                      id={`login-submit-${role}`}
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="spinner-sm" />
                          <span>Signing in...</span>
                        </span>
                      ) : (
                        <>
                          <span>Sign in as {selectedRole.label}</span>
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Demo credentials hint (development only) */}
                  {import.meta.env.DEV && (
                    <div className="demo-hint">
                      <div className="demo-hint-text">
                        <span>Demo:</span> <code>{demoEmail}</code> / <code>{demoPassword}</code>
                      </div>
                      <button type="button" className="demo-fill-btn" onClick={fillDemo}>
                        Auto-fill
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="login-footer">
            © 2026 Shiksha Abhyas (शिक्षा अभ्यास) · VSK Education Initiative
          </p>
        </section>
      </motion.div>
    </div>
  );
}
