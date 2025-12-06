import { useState } from 'react';
import { LayoutDashboard, Wallet, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import './index.css';

import { AccountsTab } from './components/features/AccountsTab';
import { BalancesTab } from './components/features/BalancesTab';
import { CalendarTab } from './components/features/CalendarTab';
import { DashboardTab } from './components/features/DashboardTab';
import { cn } from './lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'accounts':
        return <AccountsTab />;
      case 'balances':
        return <BalancesTab />;
      case 'calendar':
        return <CalendarTab />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              MP
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              My <span className="text-primary">Precious</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border bg-card/50 p-1">
            <NavButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard size={16} />}
              label="Overview"
            />
            <NavButton
              active={activeTab === 'accounts'}
              onClick={() => setActiveTab('accounts')}
              icon={<Wallet size={16} />}
              label="Accounts"
            />
            <NavButton
              active={activeTab === 'balances'}
              onClick={() => setActiveTab('balances')}
              icon={<TrendingUp size={16} />}
              label="Balances"
            />
            <NavButton
              active={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
              icon={<CalendarIcon size={16} />}
              label="Calendar"
            />
          </nav>

          <div className="text-sm text-muted-foreground font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full container mx-auto p-4 md:p-8 overflow-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex justify-around p-4 border-t bg-background">
        <NavButtonMobile
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard size={20} />}
        />
        <NavButtonMobile
          active={activeTab === 'accounts'}
          onClick={() => setActiveTab('accounts')}
          icon={<Wallet size={20} />}
        />
        <NavButtonMobile
          active={activeTab === 'balances'}
          onClick={() => setActiveTab('balances')}
          icon={<TrendingUp size={20} />}
        />
        <NavButtonMobile
          active={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
          icon={<CalendarIcon size={20} />}
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(251,191,36,0.3)]"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function NavButtonMobile({ active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground"
      )}
    >
      {icon}
    </button>
  );
}

export default App;
