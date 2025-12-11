import { useState } from 'react';
import './index.css';

import { AccountsTab } from './components/features/AccountsTab';
import { CalendarTab } from './components/features/CalendarTab';
import { DashboardTab } from './components/features/DashboardTab';
import { SettingsTab } from './components/features/SettingsTab';
import { ProjectionsTab } from './components/features/ProjectionsTab';
import { Sidebar } from './components/layout/Sidebar';


function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'accounts':
        return <AccountsTab />;
      case 'projections':
        return <ProjectionsTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'settings':
        return <SettingsTab />;
      case 'transfers':
      case 'payments':
      case 'games':
      case 'tickets':
      case 'messages':
      case 'notifications':
      case 'settings':
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

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden h-screen">
        <div className="h-full w-full overflow-auto p-8">
          {renderContent()}
        </div>
      </main>


    </div>
  );
}

export default App;
