import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Code, Bot, PieChart, Settings, LogOut, ClipboardList, Target, X } from 'lucide-react';
import { APP_NAME } from '../constants';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'Notebook', path: '/notebook' },
    { icon: Code, label: 'Coding Ground', path: '/code' },
    { icon: ClipboardList, label: 'Quizzes', path: '/quizzes' },
    { icon: Bot, label: 'AI Tutor', path: '/tutor' },
    { icon: Target, label: 'Quests', path: '/quests' },
    { icon: PieChart, label: 'Analytics', path: '/analytics' },
  ];

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
        console.log("User signed out");
        alert("Signed out successfully.");
        // Logic to clear token/redirect would go here
    }
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background/68 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} overflow-hidden`}>
      <div className="p-6 flex items-center justify-center gap-3 relative">
        <div className="w-8 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white/90 font-bold text-lg">N</span>
        </div>
        <div className={`flex-1 flex items-center gap-3 transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">{APP_NAME}</span>
        </div>
        <button 
          onClick={onClose}
          className={`text-subtext hover:text-white transition-all duration-300 flex-shrink-0 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}
        >
          <X size={20} />
        </button>
      </div>

      <nav className={`flex-1 ${isOpen ? 'px-4 py-4 space-y-2' : 'px-2 py-4 space-y-3'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center ${isOpen ? 'gap-3 px-4 py-3' : 'justify-center w-10 h-10 mx-auto'} rounded-xl transition-all duration-200 group border ${
                isActive 
                  ? 'bg-white/10 text-white border-white/30' 
                  : 'bg-white/3 text-subtext border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20'
              }`}
              title={isOpen ? '' : item.label}
            >
              <item.icon size={20} className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-subtext group-hover:text-white'}`} />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className={`border-t border-white/5 ${isOpen ? 'p-4' : 'p-2'}`}>
        <NavLink 
            to="/settings"
            className={({ isActive }) => `flex items-center ${isOpen ? 'gap-3 px-4 py-3' : 'justify-center w-10 h-10 mx-auto'} transition-all rounded-xl mb-1 border ${
              isActive ? 'text-white bg-white/10 border-white/30' : 'text-subtext bg-white/3 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20'
            }`}
            title={isOpen ? '' : 'Settings'}
        >
          <Settings size={20} className="flex-shrink-0" />
          {isOpen && <span>Settings</span>}
        </NavLink>
        <button 
            onClick={handleSignOut}
            className={`flex items-center ${isOpen ? 'gap-3 px-4 py-3 w-full' : 'justify-center w-10 h-10 mx-auto'} text-subtext hover:text-red-400 transition-all rounded-xl border border-red-500/20 bg-white/3 hover:bg-red-500/5 hover:border-red-500/30`}
            title={isOpen ? '' : 'Sign Out'}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
