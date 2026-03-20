import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { SAMPLE_DAILY_QUESTS, SAMPLE_WEEKLY_QUESTS, STORY_QUESTS } from '../gamificationConstants';
import gamificationService from '../services/gamificationService';
import { UserGameProfile, Quest } from '../types';
import {
  Zap, Shield, Skull, Crosshair, Radio, AlertTriangle,
  CheckCircle2, Lock, Terminal, Gem, Star, Cpu, FlaskConical,
} from 'lucide-react';

// ─── Mission flavour maps ─────────────────────────────────────────────────────

// Each entry maps 1:1 to a standard DSA/coding concept wrapped in an EduVanta scenario.
const OPERATION_NAMES = [
  'Operation: Mirror',          // Array / Linked List Reversal
  'Operation: Null Byte',       // Missing Number in Sequence
  'Operation: Phantom Loop',    // Cycle Detection (Floyd's)
  'Operation: Recursive Descent', // Tree Traversal
  'Operation: Hash Collision',  // HashMap / HashSet
  'Operation: Serpent Protocol', // Python fundamentals
  'Operation: Collapsed Stack', // Stack Overflow / Recursion
  'Operation: Binary Siege',    // Binary Search
  'Operation: Merge Protocol',  // Merge Sort / Merge Intervals
  'Operation: Graph Recon',     // BFS / DFS / Graph traversal
  'Operation: Heap Breach',     // Min/Max Heap, Priority Queue
  'Operation: Dynamic Strike',  // Dynamic Programming
];

// Narrative descriptions — each wraps the actual coding concept in a high-stakes scenario.
const NARRATIVES = [
  // Array Reversal
  "The firewall's data stream is directional. Write a script to reverse the encrypted data chain and bounce the signal back to gain access.",
  // Missing Number
  "Data Corruption Detected. A critical packet is missing from the server logs. Reconstruct the integer sequence and isolate the missing value before the next transmission window closes.",
  // Cycle Detection
  "An infinite loop ghost is cycling through the node network, consuming bandwidth. Deploy a two-pointer sweep (Floyd's Tortoise & Hare) to detect and neutralise the cycle.",
  // Tree Traversal
  "An enemy AI has buried its kill-switch inside a nested binary tree. Traverse every node — in-order, pre-order, post-order — and extract the root-level cipher before the countdown reaches zero.",
  // HashMap
  "The adversary's encryption relies on predictable hash collisions. Build a custom hashmap, exploit the collision pattern, and plant your payload inside the lookup table.",
  // Python / Functions
  "The EduVanta core is running a corrupted Python daemon. Rewrite the function stack and purge the serpent's logic before it propagates to secondary systems.",
  // Recursion / Stack
  "A malformed recursive payload has overflowed the call stack. Restructure the execution tree and prevent catastrophic stack unwind before the network goes dark.",
  // Binary Search
  "A rogue value has been injected into a sorted data silo. Deploy a binary siege — halve the search space each cycle — and isolate the target in O(log n) operations.",
];

const TECH_TAGS: Record<string, string[]> = {
  easy:   ['Python', 'HTML/CSS', 'Scratch'],
  medium: ['Data Structures', 'JavaScript', 'React', 'SQL'],
  hard:   ['Algorithms', 'TypeScript', 'Machine Learning', 'System Design'],
};

const DIFFICULTY_CONFIG = {
  easy:   { label: 'RECON',       color: 'text-emerald-400',  border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', icon: <Shield size={13} />,    glow: 'rgba(52,211,153,0.35)' },
  medium: { label: 'INFILTRATE',  color: 'text-yellow-400',   border: 'border-yellow-500/40',  bg: 'bg-yellow-500/10',  icon: <Crosshair size={13} />, glow: 'rgba(251,191,36,0.35)' },
  hard:   { label: 'SABOTAGE',    color: 'text-rose-400',     border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    icon: <Skull size={13} />,     glow: 'rgba(251,113,133,0.4)' },
};

type TabId = 'daily' | 'weekly' | 'story';

const TABS: { id: TabId; label: string; codename: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'daily',  label: 'Active Bounties',       codename: 'SEC-ALPHA', icon: <Radio size={14} />,       accent: 'from-cyan-500 to-blue-600' },
  { id: 'weekly', label: 'Weekly Infiltrations',   codename: 'SEC-BRAVO', icon: <AlertTriangle size={14} />, accent: 'from-violet-500 to-purple-700' },
  { id: 'story',  label: 'Deep Cover Ops',         codename: 'SEC-OMEGA', icon: <Skull size={14} />,       accent: 'from-rose-500 to-red-700' },
];

// ─── Accept button with radar ping ───────────────────────────────────────────

const AcceptButton: React.FC<{ accepted: boolean; completed: boolean; onClick: () => void }> = ({
  accepted, completed, onClick,
}) => (
  <div className="relative inline-flex items-center justify-center">
    {/* Radar ping rings */}
    {!accepted && !completed && (
      <>
        {[0, 0.5, 1.0].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-lg border border-cyan-400 pointer-events-none"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.9 }}
            transition={{ duration: 1.8, delay, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      </>
    )}

    <button
      onClick={onClick}
      disabled={completed}
      className={`relative z-10 flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        completed
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
          : accepted
          ? 'border-violet-500/60 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
          : 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_14px_rgba(6,182,212,0.35)]'
      }`}
    >
      {completed ? (
        <><CheckCircle2 size={13} /> Extracted</>
      ) : accepted ? (
        <><Zap size={13} /> Claim Reward</>
      ) : (
        <><Crosshair size={13} /> Accept Mission</>
      )}
    </button>
  </div>
);

// ─── Single mission card ──────────────────────────────────────────────────────

interface MissionCardProps {
  quest: Quest;
  index: number;
  operationName: string;
  narrative: string;
  techTag: string;
  onAccept: (id: string) => void;
  accepted: boolean;
}

const MissionCard: React.FC<MissionCardProps> = ({
  quest, index, operationName, narrative, techTag, onAccept, accepted,
}) => {
  const diff = DIFFICULTY_CONFIG[quest.difficulty];
  const progressPct = Math.min((quest.progress / quest.target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <div
        className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
          quest.completed
            ? 'border-emerald-500/30 bg-emerald-950/20'
            : accepted
            ? 'border-violet-500/30 bg-violet-950/15'
            : 'border-white/8 bg-[#080d18] hover:border-cyan-500/30'
        }`}
        style={{
          boxShadow: quest.completed
            ? '0 0 20px rgba(52,211,153,0.07)'
            : accepted
            ? '0 0 20px rgba(139,92,246,0.08)'
            : '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top accent bar */}
        <div
          className={`h-0.5 w-full ${
            quest.completed
              ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-transparent'
              : accepted
              ? 'bg-gradient-to-r from-violet-500 via-purple-400 to-transparent'
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent'
          }`}
        />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {/* Mission ID + operation name */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono text-gray-600 tracking-widest uppercase">
                  MID-{String(index + 1).padStart(3, '0')} /{' '}
                </span>
                <span className="text-[9px] font-mono text-cyan-600 tracking-widest">
                  {quest.icon} {quest.type.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-white text-base leading-tight tracking-wide truncate">
                {operationName}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{narrative}</p>
            </div>

            {/* Difficulty badge */}
            <div
              className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold tracking-widest ${diff.color} ${diff.border} ${diff.bg}`}
            >
              {diff.icon}
              {diff.label}
            </div>
          </div>

          {/* Original quest title (subtle) */}
          <p className="text-[11px] text-gray-600 mb-3 font-mono">
            ▸ {quest.title}
          </p>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Tech tag */}
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300 font-mono">
              <Cpu size={9} /> {techTag}
            </span>
            {/* Quest type tag */}
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 font-mono">
              <Terminal size={9} /> {quest.type}
            </span>
            {quest.completed && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono">
                <CheckCircle2 size={9} /> COMPLETE
              </span>
            )}
            {!quest.completed && !quest.completed && progressPct > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-mono">
                <Zap size={9} /> IN PROGRESS
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] font-mono mb-1.5">
              <span className="text-gray-600">MISSION PROGRESS</span>
              <span className={progressPct >= 100 ? 'text-emerald-400' : 'text-gray-500'}>
                {quest.progress}/{quest.target} — {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  quest.completed
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.06 + 0.2 }}
                style={{
                  boxShadow: quest.completed
                    ? '0 0 8px rgba(52,211,153,0.6)'
                    : '0 0 8px rgba(6,182,212,0.5)',
                }}
              />
            </div>
          </div>

          {/* Reward payload + action */}
          <div className="flex items-center justify-between gap-3">
            {/* Reward payload */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-yellow-500/25 bg-yellow-500/8">
                <Zap size={11} className="text-yellow-400" />
                <span className="text-yellow-300 text-xs font-bold font-mono">+{quest.xpReward} XP</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-cyan-500/25 bg-cyan-500/8">
                <Gem size={11} className="text-cyan-400" />
                <span className="text-cyan-300 text-xs font-bold font-mono">+{quest.gemReward} GEM</span>
              </div>
            </div>

            <AcceptButton
              accepted={accepted && !quest.completed}
              completed={quest.completed}
              onClick={() => onAccept(quest.id)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Quests: React.FC = () => {
  const [profile, setProfile] = useState<UserGameProfile | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabId>('daily');
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [claimedReward, setClaimedReward] = useState<{ xp: number; gems: number; title: string } | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'default_user';
    setProfile(gamificationService.getGameProfile(userId));
  }, []);

  const createQuestFromData = (data: any, type: 'daily' | 'weekly' | 'story', index: number): Quest => {
    const target = data.target || 100;
    const baseProgress = profile?.completedQuests.includes(data.id) ? target : Math.floor(Math.random() * target);
    return {
      id: data.id,
      type,
      title: data.title,
      description: data.description,
      icon: data.icon,
      progress: baseProgress,
      target,
      xpReward: data.xpReward,
      gemReward: data.gemReward,
      difficulty: (['easy', 'medium', 'hard'] as const)[index % 3],
      completed: profile?.completedQuests.includes(data.id) || false,
    };
  };

  const quests = {
    daily:  SAMPLE_DAILY_QUESTS.map((q, i) => createQuestFromData(q, 'daily', i)),
    weekly: SAMPLE_WEEKLY_QUESTS.map((q, i) => createQuestFromData(q, 'weekly', i)),
    story:  STORY_QUESTS.map((q, i) => createQuestFromData(q, 'story', i)),
  };

  const activeQuests = quests[selectedTab];
  const completedCount = activeQuests.filter((q) => q.completed).length;
  const totalXP  = activeQuests.reduce((s, q) => s + q.xpReward, 0);
  const totalGems = activeQuests.reduce((s, q) => s + q.gemReward, 0);

  const handleAccept = (questId: string) => {
    if (!profile) return;
    const quest = activeQuests.find((q) => q.id === questId);
    if (!quest) return;

    if (acceptedIds.has(questId) && (quest.progress / quest.target) >= 1) {
      // Claim reward
      if (!quest.completed) {
        const updated = gamificationService.completeQuest(profile, questId, quest.xpReward, quest.gemReward);
        setProfile(updated);
        setClaimedReward({ xp: quest.xpReward, gems: quest.gemReward, title: quest.title });
        setTimeout(() => setClaimedReward(null), 4000);
      }
    } else {
      setAcceptedIds((prev) => new Set(prev).add(questId));
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-2">
          <Terminal size={32} className="mx-auto text-cyan-500 animate-pulse" />
          <p className="text-xs font-mono text-gray-500 tracking-widest uppercase">Connecting to mission terminal…</p>
        </div>
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.id === selectedTab)!;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase animate-pulse">
              ● SYSTEM ONLINE
            </span>
            <span className="text-[9px] font-mono text-gray-700">/ EDUVANTA FIELD OPS /</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #67e8f9, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Mission Terminal
          </h1>
          <p className="text-[11px] font-mono text-gray-600 mt-1 tracking-widest uppercase">
            clearance level: {profile.level} / operative: {profile.title}
          </p>
        </div>

        {/* Live stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {[
            { label: 'Active', value: activeQuests.length - completedCount, color: 'text-cyan-400' },
            { label: 'Extracted', value: completedCount, color: 'text-emerald-400' },
            { label: 'XP Pool', value: `+${totalXP}`, color: 'text-yellow-400' },
            { label: 'Gems', value: `+${totalGems}`, color: 'text-violet-400' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-700 uppercase tracking-widest text-[9px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
              selectedTab === tab.id
                ? `bg-gradient-to-r ${tab.accent} text-white shadow-lg`
                : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden font-mono text-[9px]">{tab.codename}</span>
          </button>
        ))}
      </div>

      {/* ── Sector label ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[9px] font-mono text-gray-700 tracking-widest uppercase px-2">
          {activeTab.codename} / {activeTab.label} / {activeQuests.length} ops
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Mission cards ── */}
      <motion.div
        key={selectedTab}
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <AnimatePresence mode="wait">
          {activeQuests.map((quest, i) => (
            <MissionCard
              key={quest.id}
              quest={quest}
              index={i}
              operationName={OPERATION_NAMES[i % OPERATION_NAMES.length]}
              narrative={NARRATIVES[i % NARRATIVES.length]}
              techTag={TECH_TAGS[quest.difficulty][i % TECH_TAGS[quest.difficulty].length]}
              onAccept={handleAccept}
              accepted={acceptedIds.has(quest.id)}
            />
          ))}
        </AnimatePresence>

        {activeQuests.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <Lock size={28} className="mx-auto text-gray-700" />
            <p className="text-xs font-mono text-gray-700 tracking-widest uppercase">No ops available in this sector</p>
          </div>
        )}
      </motion.div>

      {/* ── Reward Modal / HUD Overlay ── */}
      <AnimatePresence>
        {claimedReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-[#080d18] border border-emerald-500/40 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(52,211,153,0.3)] text-center relative overflow-hidden flex flex-col items-center">
              {/* Radar rings */}
              <motion.div animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} className="absolute w-32 h-32 border border-emerald-500/30 rounded-full" />
              
              <CheckCircle2 size={48} className="text-emerald-400 mb-4 relative z-10" />
              
              <h2 className="text-2xl font-bold tracking-tight text-white mb-1 relative z-10">Bounty Extracted!</h2>
              <p className="text-[11px] font-mono text-gray-400 mb-6 uppercase tracking-widest relative z-10">{claimedReward.title}</p>
              
              <div className="flex items-center justify-center gap-4 w-full relative z-10">
                <div className="flex-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg py-3 px-2 flex flex-col items-center justify-center">
                   <Zap size={20} className="text-yellow-400 mb-1" />
                   <span className="text-yellow-400 font-bold font-mono text-lg">+{claimedReward.xp}</span>
                   <span className="text-[9px] text-yellow-500/70 font-mono tracking-widest">XP</span>
                </div>
                <div className="flex-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg py-3 px-2 flex flex-col items-center justify-center">
                   <Gem size={20} className="text-cyan-400 mb-1" />
                   <span className="text-cyan-400 font-bold font-mono text-lg">+{claimedReward.gems}</span>
                   <span className="text-[9px] text-cyan-500/70 font-mono tracking-widest">GEMS</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Terminal footer ── */}
      <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[9px] font-mono text-gray-800 tracking-widest uppercase">
        <span>eduvanta field ops terminal v3.1</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          uplink secure
        </span>
      </div>
    </div>
  );
};

export default Quests;
