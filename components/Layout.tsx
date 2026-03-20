import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MOCK_USER } from '../constants';
import { Bell, Search, Menu, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const topNavItems = [
    { icon: Trophy, label: 'Achievements', path: '/achievements' },
    { icon: TrendingUp, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Sparkles, label: 'Shop', path: '/shop' },
  ];
  
  // Load user from local storage to allow dynamic updates
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('eduq_user');
    return saved ? JSON.parse(saved) : MOCK_USER;
  });

  // Listen for user updates (e.g. from Settings page)
  useEffect(() => {
    const handleUserUpdate = () => {
        const saved = localStorage.getItem('eduq_user');
        if (saved) {
            setUser(JSON.parse(saved));
        }
    };
    
    // Listen for custom event
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
        window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const term = (e.target as HTMLInputElement).value;
        if(term.trim()) {
            alert(`Searching for: "${term}"\n(Search implementation pending backend)`);
        }
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className={`min-h-screen bg-background text-white transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-20'}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/65 backdrop-blur-xl border-b border-white/10 h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-subtext hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              title="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center glass-panel border border-white/15 rounded-xl px-4 py-1.5 w-96 focus-within:border-white/30 transition-all">
            <Search size={16} className="text-subtext mr-3" />
            <input 
              type="text" 
              placeholder="Search notes, code, or ask AI... (Press Enter)" 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-subtext"
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3">
            {topNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all group border ${
                    isActive
                      ? 'bg-white/10 text-white border-white/30'
                      : 'bg-white/5 text-subtext border-white/10 hover:text-white hover:border-white/20 hover:bg-white/8'
                  }`}
                  title={item.label}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <button 
                onClick={toggleNotifications}
                className="relative p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
            >
                <Bell size={20} className="text-subtext hover:text-white cursor-pointer transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-white/80 rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-64 glass-panel border border-white/15 rounded-xl shadow-xl p-4 animate-fade-in z-50">
                    <h4 className="text-sm font-bold mb-2">Notifications</h4>
                    <div className="space-y-2">
                        <div className="text-xs p-2 bg-white/5 rounded border-l-2 border-white/25">
                            <p className="font-semibold">Streak Saver!</p>
                            <p className="text-subtext">You reached a {user.streak}-day streak.</p>
                        </div>
                         <div className="text-xs p-2 bg-white/5 rounded border-l-2 border-white/15">
                            <p className="font-semibold">New Assignment</p>
                            <p className="text-subtext">Python lists quiz available.</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-subtext font-mono">{user.role} MEMBER</p>
            </div>
            
            <div 
              className="w-9 h-9 rounded-full bg-white/20 p-[1px] cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => navigate('/settings')}
            >
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-sm text-white">
                        {(user.name?.split(' ') ?? ['O']).map(n => n[0]).join('').substring(0,2)}
                    </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};