import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { POWER_UPS } from '../gamificationConstants';
import gamificationService from '../services/gamificationService';
import { UserGameProfile, PowerUp } from '../types';
import {
  Zap, Gem, ShoppingBag, Palette, Shield, Star, Lock,
  CheckCircle2, AlertTriangle, Cpu, Sparkles, Package,
} from 'lucide-react';

// ─── Extended cosmetic catalogue (IDE Themes + Profile Borders) ───────────────
// These sit on top of POWER_UPS from gamificationConstants.

interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ide-theme' | 'profile-border' | 'power' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  costGems: number;
  costXP?: number;          // Some items cost XP instead of gems
  preview: string;          // Tailwind gradient / colour string for preview swatch
  effect: string;
}

const COSMETIC_CATALOGUE: CosmeticItem[] = [
  // ── IDE Themes ──────────────────────────────────────────────────────────────
  {
    id: 'theme_midnight_circuit',
    name: 'Midnight Circuit',
    description: 'Deep navy IDE theme with neon-cyan highlights. Perfect for late-night exploits.',
    icon: '🌑',
    category: 'ide-theme',
    rarity: 'rare',
    costGems: 120,
    preview: 'from-[#0a0f1e] via-[#0d1f3c] to-cyan-900',
    effect: 'ui_theme_midnight_circuit',
  },
  {
    id: 'theme_synthwave',
    name: 'Synthwave Grid',
    description: 'Retro-futuristic pink & purple palette inspired by 80s hacker aesthetics.',
    icon: '🌅',
    category: 'ide-theme',
    rarity: 'epic',
    costGems: 200,
    preview: 'from-purple-900 via-pink-900 to-rose-800',
    effect: 'ui_theme_synthwave',
  },
  {
    id: 'theme_toxic_green',
    name: 'Biohazard Terminal',
    description: 'Toxic lime-green on pitch-black. Every line of code feels like a security breach.',
    icon: '☢️',
    category: 'ide-theme',
    rarity: 'rare',
    costGems: 150,
    preview: 'from-black via-green-950 to-lime-900',
    effect: 'ui_theme_biohazard',
  },
  {
    id: 'theme_solar_flare',
    name: 'Solar Flare',
    description: 'Warm amber and orange tones. High contrast for daytime focus sessions.',
    icon: '☀️',
    category: 'ide-theme',
    rarity: 'common',
    costGems: 80,
    preview: 'from-orange-900 via-amber-800 to-yellow-700',
    effect: 'ui_theme_solar_flare',
  },
  {
    id: 'theme_void_protocol',
    name: 'Void Protocol',
    description: 'Absolute darkness with blood-red accents. Only for the most elite operatives.',
    icon: '🩸',
    category: 'ide-theme',
    rarity: 'legendary',
    costGems: 400,
    preview: 'from-black via-red-950 to-rose-950',
    effect: 'ui_theme_void_protocol',
  },

  // ── Profile Borders ──────────────────────────────────────────────────────────
  {
    id: 'border_neon_pulse',
    name: 'Neon Pulse',
    description: 'Animated cyan border that pulses with your XP rhythm.',
    icon: '💫',
    category: 'profile-border',
    rarity: 'rare',
    costGems: 100,
    preview: 'from-cyan-400 to-blue-500',
    effect: 'border_neon_pulse',
  },
  {
    id: 'border_gold_circuit',
    name: 'Gold Circuit',
    description: 'PCB-traced golden border. Only equipped by top-ranked operatives.',
    icon: '🥇',
    category: 'profile-border',
    rarity: 'epic',
    costGems: 180,
    preview: 'from-yellow-400 via-amber-500 to-orange-500',
    effect: 'border_gold_circuit',
  },
  {
    id: 'border_plasma_ring',
    name: 'Plasma Ring',
    description: 'Rotating violet plasma ring. Your profile will be impossible to ignore.',
    icon: '🌀',
    category: 'profile-border',
    rarity: 'legendary',
    costGems: 350,
    preview: 'from-violet-500 via-purple-600 to-fuchsia-600',
    effect: 'border_plasma_ring',
  },
  {
    id: 'border_ghost_chain',
    name: 'Ghost Chain',
    description: 'Faint silver chainlink border that appears only when hovered.',
    icon: '👻',
    category: 'profile-border',
    rarity: 'common',
    costGems: 60,
    preview: 'from-gray-400 to-slate-500',
    effect: 'border_ghost_chain',
  },
];

// Convert POWER_UPS from gamificationConstants to CosmeticItem shape
const convertedPowerUps: CosmeticItem[] = POWER_UPS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  icon: p.icon,
  category: p.category === 'theme' ? 'ide-theme' : p.category === 'special' ? 'special' : 'power',
  rarity: 'rare' as const,
  costGems: p.cost,
  preview: 'from-purple-900 to-indigo-900',
  effect: p.effect,
}));

const ALL_ITEMS: CosmeticItem[] = [...COSMETIC_CATALOGUE, ...convertedPowerUps];

// ─── Config ───────────────────────────────────────────────────────────────────

const RARITY_CONFIG = {
  common:    { label: 'COMMON',    color: 'text-gray-400',    border: 'border-gray-600/50',    bg: 'bg-gray-600/10',    glow: '' },
  rare:      { label: 'RARE',      color: 'text-blue-400',    border: 'border-blue-500/50',    bg: 'bg-blue-500/8',     glow: '0 0 20px rgba(59,130,246,0.2)' },
  epic:      { label: 'EPIC',      color: 'text-violet-400',  border: 'border-violet-500/50',  bg: 'bg-violet-500/8',   glow: '0 0 24px rgba(139,92,246,0.25)' },
  legendary: { label: 'LEGENDARY', color: 'text-yellow-400',  border: 'border-yellow-500/50',  bg: 'bg-yellow-500/8',   glow: '0 0 30px rgba(234,179,8,0.3)' },
};

type CategoryFilter = 'all' | 'ide-theme' | 'profile-border' | 'power' | 'special';

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all',            label: 'All Items',       icon: <Package size={13} /> },
  { id: 'ide-theme',      label: 'IDE Themes',       icon: <Palette size={13} /> },
  { id: 'profile-border', label: 'Profile Borders',  icon: <Shield size={13} /> },
  { id: 'power',          label: 'Power-Ups',         icon: <Zap size={13} /> },
  { id: 'special',        label: 'Special',           icon: <Sparkles size={13} /> },
];

// ─── Purchase Success Overlay ─────────────────────────────────────────────────

const PurchaseSuccessOverlay: React.FC<{ item: CosmeticItem; onDone: () => void }> = ({ item, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = Array.from({ length: 14 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      {/* Particle burst */}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const distance = 120 + Math.random() * 80;
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: i % 2 === 0 ? '#22d3ee' : '#a78bfa', top: '50%', left: '50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * distance,
              y: Math.sin(rad) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
          />
        );
      })}

      {/* Card */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative z-10 text-center px-10 py-8 rounded-2xl border"
        style={{
          background: 'rgba(3,7,18,0.95)',
          borderColor: '#22d3ee55',
          boxShadow: '0 0 60px rgba(34,211,238,0.25), 0 0 120px rgba(167,139,250,0.15)',
        }}
      >
        {/* Ring animation */}
        <motion.div
          className="w-24 h-24 mx-auto rounded-full border-4 border-cyan-400 flex items-center justify-center mb-4"
          animate={{ boxShadow: ['0 0 10px #22d3ee', '0 0 30px #22d3ee', '0 0 10px #22d3ee'] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle2 size={40} className="text-cyan-400" />
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-mono tracking-widest text-cyan-500 uppercase mb-1"
        >
          Transaction Confirmed
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-white mb-1"
        >
          {item.icon} {item.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-500 font-mono"
        >
          {item.costGems} GEMS deducted — item unlocked in your arsenal
        </motion.p>

        {/* Progress bar auto-close */}
        <motion.div
          className="mt-4 h-0.5 rounded-full bg-cyan-500/20 overflow-hidden"
        >
          <motion.div
            className="h-full bg-cyan-400"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 2.4, ease: 'linear' }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// ─── Error Toast ──────────────────────────────────────────────────────────────

const ErrorToast: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: -20, x: '-50%' }}
    className="fixed top-6 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono"
    style={{
      background: 'rgba(15,0,0,0.95)',
      borderColor: '#f8717155',
      boxShadow: '0 0 20px rgba(248,113,113,0.2)',
      color: '#fca5a5',
    }}
  >
    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
    {message}
  </motion.div>
);

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: CosmeticItem;
  owned: boolean;
  canAfford: boolean;
  onBuy: () => void;
}

const ShopItemCard: React.FC<ItemCardProps> = ({ item, owned, canAfford, onBuy }) => {
  const rarity = RARITY_CONFIG[item.rarity];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="relative flex flex-col rounded-xl overflow-hidden border"
      style={{
        borderColor: owned
          ? 'rgba(34,197,94,0.4)'
          : hovered && !owned
          ? `${rarity.border.replace('border-', '').replace('/50', '')}88`
          : 'rgba(255,255,255,0.06)',
        background: owned ? 'rgba(5,46,22,0.5)' : 'rgba(5,8,22,0.85)',
        boxShadow: hovered && !owned ? rarity.glow : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview swatch */}
      <div className={`h-20 bg-gradient-to-br ${item.preview} relative overflow-hidden`}>
        {/* Scanline */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)',
        }} />
        {/* Rarity shimmer for legendary */}
        {item.rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{item.icon}</div>

        {/* Owned badge */}
        {owned && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[9px] font-bold tracking-widest bg-emerald-500/90 text-white px-1.5 py-0.5 rounded">
            <CheckCircle2 size={9} /> OWNED
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Rarity + name */}
        <div>
          <span className={`text-[9px] font-bold tracking-widest ${rarity.color} uppercase`}>
            {rarity.label}
          </span>
          <h3 className="text-sm font-bold text-white leading-tight mt-0.5">{item.name}</h3>
          <p className="text-[11px] text-gray-500 leading-snug mt-1 line-clamp-2">{item.description}</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + buy button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Gem size={12} className="text-cyan-400" />
            <span className={`text-sm font-bold ${canAfford || owned ? 'text-cyan-300' : 'text-red-400'}`}>
              {item.costGems}
            </span>
          </div>

          {owned ? (
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={10} /> Unlocked
            </div>
          ) : (
            <motion.button
              whileTap={canAfford ? { scale: 0.92 } : {}}
              onClick={onBuy}
              disabled={!canAfford}
              className={`flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg border transition-all ${
                canAfford
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400'
                  : 'border-gray-700/50 bg-gray-800/20 text-gray-600 cursor-not-allowed'
              }`}
            >
              {canAfford ? (
                <><ShoppingBag size={10} /> Buy</>
              ) : (
                <><Lock size={10} /> Locked</>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PowerUpShop: React.FC = () => {
  const [profile, setProfile] = useState<UserGameProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [successItem, setSuccessItem] = useState<CosmeticItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'default_user';
    setProfile(gamificationService.getGameProfile(userId));
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const handleBuy = useCallback((item: CosmeticItem) => {
    if (!profile) return;
    if (ownedIds.has(item.id)) return;

    if (profile.gems < item.costGems) {
      showError(`Insufficient gems — need ${item.costGems} 💎, you have ${profile.gems}`);
      return;
    }

    const updated = gamificationService.spendGems(profile, item.costGems, `purchase_${item.id}`);
    setProfile(updated);
    setOwnedIds((prev) => new Set(prev).add(item.id));
    setSuccessItem(item);
  }, [profile, ownedIds]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-2">
          <ShoppingBag size={32} className="mx-auto text-cyan-500 animate-pulse" />
          <p className="text-xs font-mono text-gray-500 tracking-widest uppercase">Loading arsenal…</p>
        </div>
      </div>
    );
  }

  const filtered = activeCategory === 'all'
    ? ALL_ITEMS
    : ALL_ITEMS.filter((i) => i.category === activeCategory);

  const xpProgress = ((profile.currentLevelXP ?? 0) / 500) * 100;

  return (
    <div className="space-y-6">
      {/* Purchase success overlay */}
      <AnimatePresence>
        {successItem && (
          <PurchaseSuccessOverlay
            item={successItem}
            onDone={() => setSuccessItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {errorMsg && <ErrorToast message={errorMsg} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-violet-500 tracking-widest uppercase animate-pulse">● MARKETPLACE ONLINE</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #a78bfa, #67e8f9, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Arsenal Shop
          </h1>
          <p className="text-[11px] font-mono text-gray-600 mt-1 tracking-widest uppercase">
            Cosmetics &amp; Power-Ups / Operative: {profile.title}
          </p>
        </div>
      </div>

      {/* ── Balance cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* XP Balance */}
        <div
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{
            background: 'rgba(234,179,8,0.06)',
            borderColor: 'rgba(234,179,8,0.2)',
            boxShadow: '0 0 20px rgba(234,179,8,0.07)',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">XP Balance</p>
            <p className="text-xl font-bold text-yellow-300">{profile.totalXP.toLocaleString()}</p>
            {/* Mini level progress */}
            <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[9px] text-gray-700 mt-0.5 font-mono">LVL {profile.level} → {profile.level + 1}</p>
          </div>
        </div>

        {/* Gem Balance */}
        <div
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{
            background: 'rgba(6,182,212,0.06)',
            borderColor: 'rgba(6,182,212,0.2)',
            boxShadow: '0 0 20px rgba(6,182,212,0.07)',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Gem size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Gem Balance</p>
            <p className="text-xl font-bold text-cyan-300">{profile.gems.toLocaleString()}</p>
            <p className="text-[9px] text-gray-700 font-mono">Available to spend</p>
          </div>
        </div>

        {/* Items owned */}
        <div
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{
            background: 'rgba(139,92,246,0.06)',
            borderColor: 'rgba(139,92,246,0.2)',
            boxShadow: '0 0 20px rgba(139,92,246,0.07)',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Unlocked</p>
            <p className="text-xl font-bold text-violet-300">{ownedIds.size}</p>
            <p className="text-[9px] text-gray-700 font-mono">of {ALL_ITEMS.length} items</p>
          </div>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
        {CATEGORY_TABS.map((tab) => {
          const count = tab.id === 'all' ? ALL_ITEMS.length : ALL_ITEMS.filter((i) => i.category === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeCategory === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${activeCategory === tab.id ? 'bg-white/20' : 'bg-white/5 text-gray-700'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[9px] font-mono text-gray-700 tracking-widest uppercase">
          {filtered.length} items available
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Item Grid ── */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            <ShopItemCard
              item={item}
              owned={ownedIds.has(item.id)}
              canAfford={profile.gems >= item.costGems}
              onBuy={() => handleBuy(item)}
            />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package size={28} className="mx-auto text-gray-700 mb-2" />
          <p className="text-xs font-mono text-gray-700 tracking-widest uppercase">No items in this category</p>
        </div>
      )}

      {/* ── Footer tip ── */}
      <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[9px] font-mono text-gray-800 tracking-widest uppercase">
        <span>eduvanta arsenal marketplace v1.0</span>
        <span className="flex items-center gap-1">
          <Cpu size={9} />
          complete missions to earn gems
        </span>
      </div>
    </div>
  );
};

export default PowerUpShop;
