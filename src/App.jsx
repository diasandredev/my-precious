import { useState, useEffect } from 'react';
import './index.css';

import { AccountsTab } from './components/features/AccountsTab';
import { CalendarTab } from './components/features/CalendarTab';
import { DashboardTab } from './components/features/DashboardTab';
import { SettingsTab } from './components/features/SettingsTab';
import { ProjectionsTab } from './components/features/ProjectionsTab';
import { InsightsTab } from './components/features/InsightsTab';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { onAuthChange } from './services/auth';
import { Loader2 } from 'lucide-react';

import { startSyncScheduler, stopSyncScheduler } from './services/sync';


// ... (existing imports)

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'accounts':
        return <AccountsTab />;
      case 'projections':
        return <ProjectionsTab />;
      case 'insights':
        return <InsightsTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'settings':
        return <SettingsTab />;
      case 'recurring':
        return <RecurringTransactionsList />;
      case 'transfers':
      case 'payments':
      case 'games':
      case 'tickets':
      case 'messages':
      case 'notifications':

        return (
          <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
              <p>The {activeTab} feature is implementing.</p>
            </div>
          </div>
        );
      default:
        return <DashboardTab />;
    }
  };

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
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden h-screen relative">
        <div className="h-full w-full overflow-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
