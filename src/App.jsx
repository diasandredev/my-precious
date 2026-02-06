import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';

import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { onAuthChange } from './services/auth';
import { Loader2 } from 'lucide-react';
import { startSyncScheduler, stopSyncScheduler } from './services/sync';

// Lazy load feature modules
const DashboardTab = lazy(() => import('./components/features/DashboardTab').then(module => ({ default: module.DashboardTab })));
const AccountsTab = lazy(() => import('./components/features/AccountsTab').then(module => ({ default: module.AccountsTab })));
const ProjectionsTab = lazy(() => import('./components/features/ProjectionsTab').then(module => ({ default: module.ProjectionsTab })));
const InsightsTab = lazy(() => import('./components/features/InsightsTab').then(module => ({ default: module.InsightsTab })));
const CalendarTab = lazy(() => import('./components/features/CalendarTab').then(module => ({ default: module.CalendarTab })));
const SettingsTab = lazy(() => import('./components/features/SettingsTab').then(module => ({ default: module.SettingsTab })));
const RecurringTransactionsList = lazy(() => import('./components/features/RecurringTransactionsList').then(module => ({ default: module.RecurringTransactionsList })));

const PlaceholderPage = ({ title }) => (
  <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
      <p>The {title} feature is implementing.</p>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    startSyncScheduler();
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => {
      unsubscribe();
      stopSyncScheduler();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-mono text-gray-900">
      <Sidebar />

      <main className="flex-1 overflow-hidden h-screen relative">
        <div className={`h-full w-full overflow-auto ${location.pathname === '/' ? '' : 'p-8'}`}>
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<DashboardTab />} />
              <Route path="/accounts" element={<AccountsTab />} />
              <Route path="/projections" element={<ProjectionsTab />} />
              <Route path="/insights" element={<InsightsTab />} />
              <Route path="/calendar" element={<CalendarTab />} />
              <Route path="/settings" element={<SettingsTab />} />
              <Route path="/recurring" element={<RecurringTransactionsList />} />
              
              {/* Placeholders */}
              <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;

