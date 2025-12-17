import { LayoutDashboard, Wallet, TrendingUp, Calendar as CalendarIcon, Bell, Settings, LogOut, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo.png';
import { logout } from '../../services/auth';

export function Sidebar({ activeTab, onTabChange }) {
    const handleLogout = async () => {
        try {
            await logout();
            window.location.reload(); // Reload to clear state/context
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const menuItems = {
        main: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'accounts', label: 'Accounts', icon: Wallet },
            { id: 'projections', label: 'Projections', icon: TrendingUp },
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        ],
        personal: [
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings },
        ]
    };

    const SidebarItem = ({ item, isActive }) => (
        <button
            onClick={() => onTabChange(item.id)}
            className={cn(
                "flex items-center gap-3 px-6 py-3 w-full text-sm transition-all duration-200 relative",
                isActive
                    ? "bg-gray-100 text-black font-bold border-l-4 border-black"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium border-l-4 border-transparent"
            )}
        >
            <item.icon size={20} className={isActive ? "text-black" : "text-gray-400"} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
        </button>
    );

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Precious" className="w-auto" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-2">
                <div className="mb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    General
                </div>
                <div className="space-y-1 mb-8">
                    {menuItems.main.map((item) => (
                        <SidebarItem
                            key={item.id}
                            item={item}
                            isActive={activeTab === item.id}
                        />
                    ))}
                </div>

                <div className="mb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Personal
                </div>
                <div className="space-y-1">
                    {menuItems.personal.map((item) => (
                        <SidebarItem
                            key={item.id}
                            item={item}
                            isActive={activeTab === item.id}
                        />
                    ))}
                </div>
            </div>

            <div className="p-6 border-t border-gray-50 space-y-2">
                {/* Sync Status Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-full px-2 py-2 rounded-md hover:bg-gray-50"
                >
                    <LogOut size={18} />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    );
}
