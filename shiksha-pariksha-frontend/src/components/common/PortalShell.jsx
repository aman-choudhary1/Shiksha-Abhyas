import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../admin/Portal.css';

export default function PortalShell({
  role,
  portalTitle,
  portalSubtitle,
  badgeLabel,
  brandIcon: BrandIcon,
  avatarGradient,
  navItems,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <div className="brand-icon-box" style={{ background: avatarGradient }}>
          {BrandIcon && <BrandIcon size={20} color="#ffffff" strokeWidth={2.2} />}
        </div>
        <div>
          <span className="brand-name">{portalTitle}</span>
          <span className="brand-sub">{portalSubtitle}</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar" style={{ background: avatarGradient }}>
          {user?.name?.charAt(0)?.toUpperCase() || portalTitle.charAt(0)}
        </div>
        <div className="user-meta">
          <p className="user-name" title={user?.name}>{user?.name || badgeLabel}</p>
          <span className={`badge badge-${role}`}>{badgeLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label={`${portalTitle} Navigation`}>
        {navItems.map((n) => {
          const NavIcon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end ?? n.to === `/${role}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">
                <NavIcon size={18} strokeWidth={2.1} />
              </span>
              <span>{n.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={16} strokeWidth={2.1} />
        <span>Sign Out</span>
      </button>
    </>
  );

  return (
    <div className={`portal-layout portal-role-${role}`}>
      {/* Mobile Header Bar */}
      <header className="portal-mobile-bar">
        <div className="mobile-bar-brand">
          <div className="brand-icon-box sm" style={{ background: avatarGradient }}>
            {BrandIcon && <BrandIcon size={17} color="#ffffff" strokeWidth={2.2} />}
          </div>
          <div>
            <span className="brand-name">{portalTitle}</span>
            <span className="brand-sub">Shiksha Abhyas</span>
          </div>
        </div>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sticky Sidebar */}
      <aside className={`portal-sidebar sidebar-${role} desktop-only`}>
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className={`portal-sidebar sidebar-${role} mobile-drawer`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="portal-main">
        <div className="portal-main-inner">{children}</div>
      </main>
    </div>
  );
}

