import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileSpreadsheet,
  History,
  BookOpen,
  Bell,
  Settings,
} from 'lucide-react';
import PortalShell from '../common/PortalShell';

// Admin Sub-pages
import AdminDashboard from './AdminDashboard';
import ExcelImport from './ExcelImport';
import ManageTests from './ManageTests';
import CreateTest from './CreateTest';
import UploadMaterial from './UploadMaterial';
import NotificationsManager from './NotificationsManager';
import ImportHistory from './ImportHistory';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tests', icon: ClipboardList, label: 'Practice Tests' },
  { to: '/admin/import', icon: FileSpreadsheet, label: 'Import Questions' },
  { to: '/admin/history', icon: History, label: 'Import History' },
  { to: '/admin/materials', icon: BookOpen, label: 'Study Materials' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

export default function AdminPortal() {
  return (
    <PortalShell
      role="admin"
      portalTitle="Admin"
      portalSubtitle="Control Panel"
      badgeLabel="Administrator"
      brandIcon={Settings}
      avatarGradient="linear-gradient(135deg, #F43F5E, #FB7185)"
      navItems={NAV}
    >
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="tests" element={<ManageTests />} />
        <Route path="tests/create" element={<CreateTest />} />
        <Route path="import" element={<ExcelImport />} />
        <Route path="history" element={<ImportHistory />} />
        <Route path="materials" element={<UploadMaterial />} />
        <Route path="notifications" element={<NotificationsManager />} />
      </Routes>
    </PortalShell>
  );
}
