import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import BadgeDisplay from '../components/BadgeDisplay';
import { BADGES } from '../gamificationConstants';
import gamificationService from '../services/gamificationService';
import { UserGameProfile, Badge } from '../types';
import { Trophy, Lock, Sparkles } from 'lucide-react';

export const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserGameProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'learning' | 'coding' | 'streaks' | 'social' | 'hidden'>('all');

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'default_user';
    const userProfile = gamificationService.getGameProfile(userId);
    setProfile(userProfile);
  }, []);

  const categories: Array<{
    id: 'all' | 'learning' | 'coding' | 'streaks' | 'social' | 'hidden';
    label: string;
    icon: string;
    color: string;
  }> = [
    { id: 'all', label: 'All Badges', icon: '🏆', color: 'from-yellow-500 to-orange-500' },
    { id: 'learning', label: 'Learning', icon: '📚', color: 'from-blue-500 to-cyan-500' },
    { id: 'coding', label: 'Coding', icon: '💻', color: 'from-green-500 to-emerald-500' },
    { id: 'streaks', label: 'Streaks', icon: '🔥', color: 'from-red-500 to-orange-500' },
    { id: 'social', label: 'Lifestyle', icon: '🌟', color: 'from-purple-500 to-pink-500' },
    { id: 'hidden', label: 'Hidden', icon: '🥚', color: 'from-gray-500 to-slate-500' },
  ];

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return BADGES;
    return BADGES.filter((b) => b.category === selectedCategory);
  }, [selectedCategory]);

  const totalEarned = profile?.badges.length || 0;
  const totalAvailable = BADGES.length;
  const recentBadges = profile?.badges.slice(-3) || [];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-subtext">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Achievements 🏅</h1>
          <p className="text-subtext mt-2">Earn badges across different learning categories</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{totalEarned}/{totalAvailable}</p>
          <p className="text-sm text-subtext">Badges Earned</p>
          <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${totalAvailable > 0 ? (totalEarned / totalAvailable) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recently Earned */}
      {recentBadges.length > 0 && (
        <GlassCard glowColor="primary" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-white">Recently Earned</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {recentBadges.map((badgeId) => {
              const badge = BADGES.find((b) => b.id === badgeId);
              return badge ? (
                <BadgeDisplay key={badge.id} badge={badge} earned={true} />
              ) : null;
            })}
          </div>
        </GlassCard>
      )}

      {/* Category Filter */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <div className="text-lg mb-1">{cat.icon}</div>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {filteredBadges.map((badge) => {
          const isEarned = profile.badges.includes(badge.id);
          return (
            <div key={badge.id} className="flex justify-center">
              <BadgeDisplay badge={badge} earned={isEarned} />
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <GlassCard className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">{totalEarned}</p>
          <p className="text-sm text-subtext mt-1">Earned Badges</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-secondary">{totalAvailable - totalEarned}</p>
          <p className="text-sm text-subtext mt-1">Remaining</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{Math.round((totalEarned / totalAvailable) * 100)}%</p>
          <p className="text-sm text-subtext mt-1">Collection</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-400">
            {recentBadges.length > 0 ? BADGES.find((b) => b.id === recentBadges[0])?.rarity : 'N/A'}
          </p>
          <p className="text-sm text-subtext mt-1">Latest Rarity</p>
        </div>
      </GlassCard>
    </div>
  );
};

export default Achievements;
