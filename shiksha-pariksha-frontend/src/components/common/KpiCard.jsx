import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const SPARK_PATHS = [
  'M2 24 C 14 22, 22 12, 34 15 C 46 18, 54 6, 68 8 C 78 9, 86 3, 98 2',
  'M2 22 C 16 14, 26 20, 38 11 C 50 3, 62 14, 74 9 C 84 5, 92 4, 98 2',
  'M2 25 C 18 24, 28 16, 40 17 C 52 18, 60 10, 74 7 C 86 4, 92 6, 98 3',
  'M2 20 C 14 16, 26 22, 38 14 C 50 7, 62 12, 76 6 C 86 3, 92 5, 98 2',
];

export default function KpiCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  sub,
  badge,
  accent = '#6C63FF',
  index = 0,
  onClick,
  loading = false,
  progress,
}) {
  const numericTarget = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const [animatedNum, setAnimatedNum] = useState(0);

  useEffect(() => {
    if (loading || numericTarget === null || prefersReduced || numericTarget === 0) return;

    let frameId;
    const duration = 700;
    const startTime = performance.now();
    const isFloat = !Number.isInteger(numericTarget);

    const step = (now) => {
      const elapsed = now - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      const current = numericTarget * eased;
      setAnimatedNum(isFloat ? Number(current.toFixed(1)) : Math.round(current));
      if (progressRatio < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [numericTarget, loading, prefersReduced]);

  const displayNum = prefersReduced || numericTarget === 0 ? numericTarget : animatedNum;

  const formattedValue = loading
    ? '—'
    : numericTarget !== null
      ? `${displayNum.toLocaleString()}${suffix}`
      : `${value ?? '—'}${value !== null && value !== undefined && value !== '—' ? suffix : ''}`;

  const sparkPath = SPARK_PATHS[index % SPARK_PATHS.length];
  const areaPath = `${sparkPath} L 98 30 L 2 30 Z`;
  const gradId = `kpi-spark-grad-${index}`;
  const clampedProgress =
    typeof progress === 'number'
      ? Math.max(0, Math.min(100, progress))
      : suffix === '%' && numericTarget !== null
        ? Math.max(0, Math.min(100, numericTarget))
        : null;

  return (
    <motion.div
      className={`kpi-pro-card ${onClick ? 'is-clickable' : ''}`}
      style={{ '--kpi-accent': accent }}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="kpi-pro-top-bar" aria-hidden="true" />
      <div className="kpi-pro-glow" aria-hidden="true" />
      <div className="kpi-pro-shine" aria-hidden="true" />

      <div className="kpi-pro-head">
        {Icon && (
          <div className="kpi-pro-icon">
            <Icon size={20} strokeWidth={2.2} color="#FFFFFF" />
          </div>
        )}

        <div className="kpi-pro-head-right">
          {badge && (
            <span className="kpi-pro-badge">
              <span className="kpi-pro-badge-dot" aria-hidden="true" />
              {badge}
            </span>
          )}
          {onClick && (
            <span className="kpi-pro-arrow" aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          )}
        </div>
      </div>

      <div className="kpi-pro-main">
        <div className="kpi-pro-body">
          <span className="kpi-pro-label">{label}</span>
          <div className="kpi-pro-value">{formattedValue}</div>
          {sub && <div className="kpi-pro-sub">{sub}</div>}
        </div>

        {/* Decorative Animated Micro-Sparkline */}
        <svg
          className="kpi-pro-spark"
          viewBox="0 0 100 30"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
          <motion.path
            d={sparkPath}
            stroke={accent}
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={prefersReduced ? false : { pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 0.85, delay: 0.12 + index * 0.06, ease: 'easeOut' }}
          />
        </svg>
      </div>

      {clampedProgress !== null && (
        <div className="kpi-pro-progress-track" aria-hidden="true">
          <motion.div
            className="kpi-pro-progress-fill"
            initial={prefersReduced ? false : { width: 0 }}
            animate={{ width: `${loading ? 0 : clampedProgress}%` }}
            transition={{ duration: 0.8, delay: 0.18 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
    </motion.div>
  );
}
