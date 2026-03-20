/**
 * BossFightHUD.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained Boss-Fight overlay for the NeuroNex Coding Ground.
 * Drop it above the editor and pass the callbacks it needs — no changes to
 * the core editor logic required.
 *
 * Props:
 *   active        – Is Boss-Fight mode running?
 *   onActivate    – Called when the user clicks "Initiate Boss Fight"
 *   onDeactivate  – Called when the session ends (win/lose/flee)
 *   onRunCode     – Must be called by the parent instead of the normal run;
 *                   receives { passed: boolean, output: string }
 *   lastRunResult – Parent pushes the run result here so the HUD can react.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull, Heart, Zap, Shield, Timer, Swords, AlertTriangle,
  Trophy, X, ChevronRight, Radio,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BossFightResult {
  passed: boolean;   // did the code pass all test cases?
  hasError: boolean; // did it error/compile-fail?
}

export interface BossChallenge {
  id: string;
  bossName: string;
  bossIcon: string;
  tagline: string;
  techTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // seconds
  testCases: string[];
}

// ─── Boss catalogue ───────────────────────────────────────────────────────────

const BOSSES: BossChallenge[] = [
  {
    id: 'boss_array_reversal',
    bossName: 'The Mirror Daemon',
    bossIcon: '🪞',
    tagline: 'It reflects every mistake back at you. Reverse the data chain to shatter it.',
    techTag: 'Array / Linked List',
    difficulty: 'easy',
    timeLimit: 120,
    testCases: ['[1,2,3] → [3,2,1]', '[a,b,c,d] → [d,c,b,a]', 'empty → empty'],
  },
  {
    id: 'boss_missing_integer',
    bossName: 'NULL Phantom',
    bossIcon: '👻',
    tagline: 'A ghost in the sequence. Find the missing integer or it corrupts everything.',
    techTag: 'Math / HashSet',
    difficulty: 'easy',
    timeLimit: 90,
    testCases: ['[1,2,4,5] → 3', '[0,1,3] → 2', '[1] → 0 or 2'],
  },
  {
    id: 'boss_cycle_detection',
    bossName: 'The Infinite Looper',
    bossIcon: '🌀',
    tagline: 'Trapped in an endless loop. Deploy Floyd\'s algorithm to break the cycle.',
    techTag: 'Two Pointers',
    difficulty: 'medium',
    timeLimit: 150,
    testCases: ['cyclic list → True', 'linear list → False', 'single node → False'],
  },
  {
    id: 'boss_binary_search',
    bossName: 'The Binary Siege Engine',
    bossIcon: '⚙️',
    tagline: 'It lives in a sorted fortress. Halve the space. Find it in O(log n) or fail.',
    techTag: 'Binary Search',
    difficulty: 'medium',
    timeLimit: 120,
    testCases: ['[1..9], target=7 → idx 6', 'not found → -1', 'single elem → 0 or -1'],
  },
  {
    id: 'boss_tree_traversal',
    bossName: 'The Nested Hydra',
    bossIcon: '🐍',
    tagline: 'Every node spawns more heads. Traverse the binary tree to cut them all.',
    techTag: 'Tree / Recursion',
    difficulty: 'hard',
    timeLimit: 180,
    testCases: ['inorder: left→root→right', 'preorder: root first', 'postorder: root last'],
  },
  {
    id: 'boss_dynamic_strike',
    bossName: 'The Overlapping Titan',
    bossIcon: '💥',
    tagline: 'Brute force won\'t work. Cache results. Destroy the Titan with DP.',
    techTag: 'Dynamic Programming',
    difficulty: 'hard',
    timeLimit: 240,
    testCases: ['fibonacci(10) → 55', 'no redundant calls', 'bottom-up or memoized'],
  },
];

const DIFFICULTY_CONFIG = {
  easy:   { label: 'RECON',      color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', playerHP: 100, bossHP: 60 },
  medium: { label: 'INFILTRATE', color: 'text-yellow-400',  border: 'border-yellow-500/40',  bg: 'bg-yellow-500/10',  playerHP: 100, bossHP: 100 },
  hard:   { label: 'SABOTAGE',   color: 'text-rose-400',    border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    playerHP: 100, bossHP: 150 },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ─── Damage flash overlay ─────────────────────────────────────────────────────

const DamageFlash: React.FC<{ type: 'player' | 'boss' | null }> = ({ type }) => (
  <AnimatePresence>
    {type && (
      <motion.div
        key={type}
        initial={{ opacity: 0.55 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            type === 'player'
              ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.25) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(34,211,238,0.22) 0%, transparent 70%)',
        }}
      />
    )}
  </AnimatePresence>
);

// ─── Floating damage number ───────────────────────────────────────────────────

interface FloatNum { id: number; value: number; isPlayer: boolean; x: number }

const FloatingNumbers: React.FC<{ nums: FloatNum[] }> = ({ nums }) => (
  <>
    {nums.map((n) => (
      <motion.div
        key={n.id}
        initial={{ opacity: 1, y: 0, x: n.x }}
        animate={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`fixed top-1/3 z-50 text-2xl font-black pointer-events-none select-none ${
          n.isPlayer ? 'text-red-400' : 'text-cyan-300'
        }`}
        style={{ textShadow: n.isPlayer ? '0 0 12px #f87171' : '0 0 12px #67e8f9' }}
      >
        {n.isPlayer ? `-${n.value}` : `⚡ -${n.value}`}
      </motion.div>
    ))}
  </>
);

// ─── Health Bar ───────────────────────────────────────────────────────────────

const HealthBar: React.FC<{
  label: string; icon: React.ReactNode; current: number; max: number;
  color: string; glowColor: string; reversed?: boolean;
}> = ({ label, icon, current, max, color, glowColor, reversed }) => {
  const pct = Math.max(0, (current / max) * 100);
  const dangerPct = pct < 25;

  return (
    <div className={`flex flex-col gap-1 ${reversed ? 'items-end' : 'items-start'} flex-1`}>
      <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${reversed ? 'flex-row-reverse' : ''}`}>
        {icon}
        <span className="text-gray-400">{label}</span>
        <span className="text-white ml-1">{current}/{max}</span>
      </div>
      <div className={`w-full h-4 rounded-sm bg-black/50 border border-white/10 overflow-hidden ${reversed ? 'dir-rtl' : ''}`}>
        <motion.div
          className={`h-full rounded-sm ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            boxShadow: `0 0 12px ${glowColor}`,
            ...(reversed && { marginLeft: 'auto' }),
          }}
        />
      </div>
      {dangerPct && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="text-[9px] font-mono text-red-400"
        >
          ⚠ CRITICAL
        </motion.span>
      )}
    </div>
  );
};

// ─── Boss selection modal ─────────────────────────────────────────────────────

const BossSelectModal: React.FC<{ onSelect: (b: BossChallenge) => void; onClose: () => void }> = ({
  onSelect, onClose,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(3,7,18,0.97)', boxShadow: '0 0 60px rgba(6,182,212,0.12)' }}
    >
      {/* Modal header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skull size={18} className="text-rose-400" />
          <span className="font-bold text-white text-sm tracking-wide">Select Your Adversary</span>
          <span className="text-[9px] font-mono text-gray-600 ml-1 tracking-widest uppercase">/ Boss Fight Mode</span>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Boss list */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
        {BOSSES.map((boss) => {
          const diff = DIFFICULTY_CONFIG[boss.difficulty];
          return (
            <motion.button
              key={boss.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(boss)}
              className={`text-left p-4 rounded-xl border transition-all ${diff.border} ${diff.bg} hover:brightness-125`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{boss.bossIcon}</span>
                <span className={`text-[9px] font-bold tracking-widest ${diff.color} border ${diff.border} px-1.5 py-0.5 rounded`}>
                  {diff.label}
                </span>
              </div>
              <p className="font-bold text-white text-sm leading-tight">{boss.bossName}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{boss.tagline}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-violet-400">{boss.techTag}</span>
                <span className="text-gray-600 flex items-center gap-1">
                  <Timer size={9} /> {formatTime(boss.timeLimit)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  </motion.div>
);

// ─── Victory / Defeat screens ─────────────────────────────────────────────────

const OutcomeScreen: React.FC<{ outcome: 'win' | 'lose'; boss: BossChallenge; onClose: () => void }> = ({
  outcome, boss, onClose,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
  >
    {/* Particles */}
    {outcome === 'win' && Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * 360;
      const r = 140 + Math.random() * 80;
      return (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#a78bfa' : '#fbbf24', top: '50%', left: '50%' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos((angle * Math.PI) / 180) * r, y: Math.sin((angle * Math.PI) / 180) * r, opacity: 0, scale: 0 }}
          transition={{ duration: 1.1, delay: 0.1, ease: 'easeOut' }}
        />
      );
    })}

    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative z-10 text-center px-10 py-10 rounded-2xl border max-w-sm w-full mx-4"
      style={{
        background: 'rgba(3,7,18,0.97)',
        borderColor: outcome === 'win' ? '#22d3ee44' : '#f8717144',
        boxShadow: outcome === 'win'
          ? '0 0 60px rgba(34,211,238,0.2), 0 0 120px rgba(167,139,250,0.1)'
          : '0 0 60px rgba(239,68,68,0.2)',
      }}
    >
      <div className="text-5xl mb-3">{outcome === 'win' ? '🏆' : '💀'}</div>
      <h2 className={`text-2xl font-black mb-1 ${outcome === 'win' ? 'text-cyan-300' : 'text-red-400'}`}>
        {outcome === 'win' ? 'BOSS DEFEATED' : 'SYSTEM FAILURE'}
      </h2>
      <p className="text-xs font-mono text-gray-500 mb-1">
        {outcome === 'win' ? `${boss.bossIcon} ${boss.bossName} has been eliminated` : `${boss.bossIcon} ${boss.bossName} overwhelmed you`}
      </p>
      <p className="text-xs text-gray-600 mb-5">
        {outcome === 'win'
          ? 'Neural signature confirmed. XP payload incoming.'
          : 'Regroup. Study the pattern. Try again.'}
      </p>
      <button
        onClick={onClose}
        className={`w-full py-2.5 rounded-lg border font-bold text-sm tracking-wide transition-all ${
          outcome === 'win'
            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
            : 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
        }`}
      >
        {outcome === 'win' ? 'Claim Victory' : 'Retreat & Regroup'}
      </button>
    </motion.div>
  </motion.div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BossFightHUDProps {
  lastRunResult: BossFightResult | null;   // set by parent after each Run
  onBossFightStart: () => void;            // parent enters boss-fight mode
  onBossFightEnd: () => void;              // parent exits boss-fight mode
  isActive: boolean;                        // driven by parent
}

// ─── Main HUD ─────────────────────────────────────────────────────────────────

export const BossFightHUD: React.FC<BossFightHUDProps> = ({
  lastRunResult, onBossFightStart, onBossFightEnd, isActive,
}) => {
  const [showSelect, setShowSelect]   = useState(false);
  const [boss, setBoss]               = useState<BossChallenge | null>(null);
  const [playerHP, setPlayerHP]       = useState(100);
  const [bossHP, setBossHP]           = useState(100);
  const [maxPlayerHP, setMaxPlayerHP] = useState(100);
  const [maxBossHP, setMaxBossHP]     = useState(100);
  const [timeLeft, setTimeLeft]       = useState(120);
  const [outcome, setOutcome]         = useState<'win' | 'lose' | null>(null);
  const [flashType, setFlashType]     = useState<'player' | 'boss' | null>(null);
  const [floatNums, setFloatNums]     = useState<FloatNum[]>([]);
  const [shake, setShake]             = useState(false);
  const resultProcessed               = useRef<BossFightResult | null>(null);
  const timerRef                      = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── timer ──
  useEffect(() => {
    if (!isActive || outcome) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setOutcome('lose');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isActive, outcome]);

  // ── react to run result ──
  const spawnFloat = useCallback((value: number, isPlayer: boolean) => {
    const id = Date.now() + Math.random();
    const x = isPlayer ? window.innerWidth * 0.3 : window.innerWidth * 0.65;
    setFloatNums((prev) => [...prev, { id, value, isPlayer, x }]);
    setTimeout(() => setFloatNums((prev) => prev.filter((n) => n.id !== id)), 1000);
  }, []);

  useEffect(() => {
    if (!isActive || !lastRunResult || lastRunResult === resultProcessed.current) return;
    resultProcessed.current = lastRunResult;

    if (lastRunResult.hasError) {
      // Compile error → boss attacks player hard
      const dmg = Math.floor(Math.random() * 15) + 10;
      setPlayerHP((hp) => {
        const next = Math.max(0, hp - dmg);
        if (next === 0) setOutcome('lose');
        return next;
      });
      setFlashType('player');
      setShake(true);
      spawnFloat(dmg, true);
      setTimeout(() => { setFlashType(null); setShake(false); }, 500);
    } else if (lastRunResult.passed) {
      // Tests pass → player deals damage to boss
      const dmg = Math.floor(Math.random() * 25) + 20;
      setBossHP((hp) => {
        const next = Math.max(0, hp - dmg);
        if (next === 0) setOutcome('win');
        return next;
      });
      setFlashType('boss');
      spawnFloat(dmg, false);
      setTimeout(() => setFlashType(null), 500);
    } else {
      // Wrong answer → small player damage
      const dmg = Math.floor(Math.random() * 8) + 5;
      setPlayerHP((hp) => {
        const next = Math.max(0, hp - dmg);
        if (next === 0) setOutcome('lose');
        return next;
      });
      setFlashType('player');
      spawnFloat(dmg, true);
      setTimeout(() => setFlashType(null), 500);
    }
  }, [lastRunResult, isActive, spawnFloat]);

  const handleSelectBoss = (selected: BossChallenge) => {
    const diff = DIFFICULTY_CONFIG[selected.difficulty];
    setBoss(selected);
    setPlayerHP(diff.playerHP);
    setMaxPlayerHP(diff.playerHP);
    setBossHP(diff.bossHP);
    setMaxBossHP(diff.bossHP);
    setTimeLeft(selected.timeLimit);
    setOutcome(null);
    setShowSelect(false);
    resultProcessed.current = null;
    onBossFightStart();
  };

  const handleEnd = () => {
    clearInterval(timerRef.current!);
    setBoss(null);
    setOutcome(null);
    setShowSelect(false);
    onBossFightEnd();
  };

  // ── Not active: just show the "Initiate" banner ──
  if (!isActive || !boss) {
    return (
      <>
        <motion.div
          className="flex items-center justify-between px-4 py-2 rounded-lg border border-rose-500/20 bg-rose-500/5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <Skull size={14} className="text-rose-400" />
            <span className="text-xs font-bold text-rose-300 tracking-wide uppercase">Boss Fight Mode</span>
            <span className="text-[9px] font-mono text-gray-700 hidden sm:inline">— gamified challenge rounds</span>
          </div>
          <button
            onClick={() => setShowSelect(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all"
            style={{ boxShadow: '0 0 12px rgba(239,68,68,0.2)' }}
          >
            <Swords size={11} /> Initiate Boss Fight
          </button>
        </motion.div>

        <AnimatePresence>
          {showSelect && (
            <BossSelectModal onSelect={handleSelectBoss} onClose={() => setShowSelect(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  const diff = DIFFICULTY_CONFIG[boss.difficulty];
  const timerDanger = timeLeft <= 30;

  return (
    <>
      {/* Damage flash */}
      <DamageFlash type={flashType} />
      {/* Floating numbers */}
      <FloatingNumbers nums={floatNums} />

      {/* Outcome screens */}
      <AnimatePresence>
        {outcome && (
          <OutcomeScreen outcome={outcome} boss={boss} onClose={handleEnd} />
        )}
      </AnimatePresence>

      {/* ── HUD panel ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0, x: shake ? [-6, 6, -4, 4, 0] : 0 }}
        transition={{ duration: shake ? 0.3 : 0.3 }}
        className="rounded-xl border overflow-hidden"
        style={{
          background: 'rgba(3,7,18,0.95)',
          borderColor: 'rgba(239,68,68,0.25)',
          boxShadow: '0 0 30px rgba(239,68,68,0.08)',
        }}
      >
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-500" />

        <div className="px-4 py-3 space-y-3">
          {/* Boss title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xl"
              >
                {boss.bossIcon}
              </motion.span>
              <div>
                <p className="text-xs font-black text-white tracking-wide leading-tight">{boss.bossName}</p>
                <p className="text-[9px] font-mono text-gray-600">{boss.tagline.slice(0, 60)}…</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Timer */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-bold text-sm ${
                  timerDanger
                    ? 'border-red-500/60 bg-red-500/15 text-red-400'
                    : 'border-white/15 bg-white/5 text-white'
                }`}
                style={timerDanger ? { boxShadow: '0 0 10px rgba(239,68,68,0.3)' } : undefined}
              >
                <Timer size={12} className={timerDanger ? 'animate-pulse' : ''} />
                <motion.span
                  animate={timerDanger ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  {formatTime(timeLeft)}
                </motion.span>
              </div>

              {/* Difficulty */}
              <span className={`text-[9px] font-bold tracking-widest px-2 py-1 rounded border ${diff.color} ${diff.border} ${diff.bg}`}>
                {diff.label}
              </span>

              {/* Flee */}
              <button
                onClick={handleEnd}
                className="text-gray-700 hover:text-red-400 transition-colors"
                title="Flee the battle"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Health bars */}
          <div className="flex items-start gap-4">
            <HealthBar
              label="OPERATIVE"
              icon={<Heart size={11} className="text-emerald-400" />}
              current={playerHP}
              max={maxPlayerHP}
              color="bg-gradient-to-r from-emerald-500 to-green-400"
              glowColor="rgba(52,211,153,0.6)"
            />

            {/* VS divider */}
            <div className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-4">
              <Swords size={14} className="text-rose-500" />
              <span className="text-[8px] font-mono text-gray-700">VS</span>
            </div>

            <HealthBar
              label="BOSS HP"
              icon={<Skull size={11} className="text-rose-400" />}
              current={bossHP}
              max={maxBossHP}
              color="bg-gradient-to-r from-rose-600 to-red-500"
              glowColor="rgba(239,68,68,0.6)"
              reversed
            />
          </div>

          {/* Test cases hint */}
          <div className="flex items-start gap-1.5 pt-1 border-t border-white/5">
            <Radio size={9} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {boss.testCases.map((tc, i) => (
                <span key={i} className="text-[9px] font-mono text-gray-600">
                  <span className="text-violet-500">TC{i + 1}:</span> {tc}
                </span>
              ))}
            </div>
          </div>

          {/* Damage key */}
          <div className="flex gap-3 text-[9px] font-mono text-gray-700">
            <span className="flex items-center gap-1"><Zap size={8} className="text-cyan-400" /> Pass test → deal damage</span>
            <span className="flex items-center gap-1"><AlertTriangle size={8} className="text-red-400" /> Bug/error → take damage</span>
            <span className="flex items-center gap-1"><Shield size={8} className="text-yellow-400" /> Wrong answer → minor damage</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default BossFightHUD;
