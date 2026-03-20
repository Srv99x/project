import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import {
  Clock, Zap, Target, ArrowUpRight, PlayCircle, Mail,
  CheckCircle, AlertCircle, X, Calendar, Crown, Star,
  Plus, Trash2, Terminal, Cpu, BookOpen, ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_USER, INITIAL_NOTEBOOKS } from '../constants';
import { subscribeToNewsletter } from '../services/newsletterService';
import { UserRole, NotebookEntry } from '../types';

const data = [
  { name: 'Mon', hours: 2.5 },
  { name: 'Tue', hours: 3.8 },
  { name: 'Wed', hours: 1.5 },
  { name: 'Thu', hours: 4.2 },
  { name: 'Fri', hours: 3.0 },
  { name: 'Sat', hours: 5.5 },
  { name: 'Sun', hours: 2.0 },
];

interface ScheduleItem {
  id: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface StudySession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  dayKey: string;
}

const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: '1', topic: 'Advanced React Patterns', date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '11:30' },
  { id: '2', topic: 'System Design Basics', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], startTime: '14:00', endTime: '15:30' },
];

const STUDY_ACTIVE_KEY = 'neuronex_study_active_start';
const STUDY_SESSIONS_KEY = 'neuronex_study_sessions';

const getLocalDayKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─── Cyberpunk custom tooltip for bar chart ───────────────────────────────────
const CyberTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-lg border text-xs font-mono"
        style={{
          background: 'rgba(3,7,18,0.95)',
          borderColor: 'rgba(167,139,250,0.4)',
          boxShadow: '0 0 12px rgba(167,139,250,0.2)',
        }}
      >
        <p className="text-gray-500 tracking-widest uppercase mb-0.5">{label}</p>
        <p className="text-violet-300 font-bold">{payload[0].value}h active</p>
      </div>
    );
  }
  return null;
};

// ─── Recommended course card ──────────────────────────────────────────────────
const CourseCard: React.FC<{
  tag: string; tagColor: string; title: string; meta: string; onClick: () => void;
}> = ({ tag, tagColor, title, meta, onClick }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className="group cursor-pointer p-3 rounded-xl border border-white/6 bg-black/30 hover:border-white/15 transition-all"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
  >
    <div className="flex items-start justify-between mb-2">
      <span
        className="text-[10px] font-bold font-mono tracking-widest px-2 py-0.5 rounded border"
        style={{ color: tagColor, borderColor: `${tagColor}40`, background: `${tagColor}10` }}
      >
        {tag}
      </span>
      <ChevronRight
        size={14}
        className="text-gray-700 group-hover:text-gray-400 transition-colors mt-0.5"
      />
    </div>
    <p className="text-sm font-bold text-white leading-tight">{title}</p>
    <p className="text-[11px] text-gray-600 mt-1 font-mono">{meta}</p>
  </motion.div>
);

// ─── HUD stat card ────────────────────────────────────────────────────────────
const HudCard: React.FC<{
  icon: React.ReactNode; value: string; label: string;
  badge?: string; glowColor: string; borderColor: string; bgColor: string;
  onClick?: () => void; clickable?: boolean;
}> = ({ icon, value, label, badge, glowColor, borderColor, bgColor, onClick, clickable }) => (
  <motion.div
    whileHover={clickable ? { scale: 1.02 } : {}}
    whileTap={clickable ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`relative flex flex-col justify-between h-32 rounded-xl border p-4 overflow-hidden ${clickable ? 'cursor-pointer' : ''}`}
    style={{ background: bgColor, borderColor, boxShadow: `0 0 20px ${glowColor}` }}
  >
    {/* Scanline texture */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
      backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.5) 3px,rgba(255,255,255,0.5) 4px)',
    }} />
    <div className="relative flex justify-between items-start">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${glowColor.replace('0.12', '0.15')}` }}
      >
        {icon}
      </div>
      {badge && (
        <span
          className="text-[9px] font-bold font-mono tracking-widest px-1.5 py-0.5 rounded"
          style={{ background: borderColor, color: '#000' }}
        >
          {badge}
        </span>
      )}
    </div>
    <div className="relative">
      <p className="text-2xl font-black text-white leading-tight">{value}</p>
      <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('neuronex_user');
    return saved ? JSON.parse(saved) : MOCK_USER;
  });

  const [notebooks, setNotebooks] = useState<NotebookEntry[]>(() => {
    try {
      const saved = localStorage.getItem('neuronex_notebooks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTEBOOKS;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('neuronex_schedule');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
    } catch (e) { return INITIAL_SCHEDULE; }
  });

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ topic: '', date: '', startTime: '', endTime: '' });
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem(STUDY_SESSIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeStudyStart, setActiveStudyStart] = useState<number | null>(() => {
    const raw = localStorage.getItem(STUDY_ACTIVE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [activeElapsedSeconds, setActiveElapsedSeconds] = useState(0);
  const activeStudyRef = useRef<number | null>(activeStudyStart);

  const totalXP = '900';
  const quizAccuracy = '88%';

  useEffect(() => { localStorage.setItem('neuronex_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { activeStudyRef.current = activeStudyStart; }, [activeStudyStart]);

  useEffect(() => {
    if (!activeStudyStart) { setActiveElapsedSeconds(0); return; }
    const update = () => setActiveElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeStudyStart) / 1000)));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [activeStudyStart]);

  useEffect(() => {
    const autoStop = () => {
      const start = activeStudyRef.current;
      if (!start) return;
      const end = Date.now();
      const duration = Math.max(1, Math.floor((end - start) / 1000));
      const newSession: StudySession = { id: `s_${start}`, startedAt: start, endedAt: end, durationSeconds: duration, dayKey: getLocalDayKey(start) };
      try {
        const raw = localStorage.getItem(STUDY_SESSIONS_KEY);
        const existing: StudySession[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify([...existing, newSession]));
      } catch {}
      localStorage.removeItem(STUDY_ACTIVE_KEY);
    };
    window.addEventListener('beforeunload', autoStop);
    window.addEventListener('pagehide', autoStop);
    return () => { window.removeEventListener('beforeunload', autoStop); window.removeEventListener('pagehide', autoStop); };
  }, []);

  const stopStudySession = (endTime = Date.now()) => {
    if (!activeStudyStart) return;
    const duration = Math.max(1, Math.floor((endTime - activeStudyStart) / 1000));
    setSessions(prev => [...prev, { id: `s_${activeStudyStart}`, startedAt: activeStudyStart, endedAt: endTime, durationSeconds: duration, dayKey: getLocalDayKey(activeStudyStart) }]);
    setActiveStudyStart(null);
    setActiveElapsedSeconds(0);
    activeStudyRef.current = null;
    localStorage.removeItem(STUDY_ACTIVE_KEY);
  };

  const startStudySession = () => {
    if (activeStudyStart) return;
    const start = Date.now();
    setActiveStudyStart(start);
    activeStudyRef.current = start;
    localStorage.setItem(STUDY_ACTIVE_KEY, String(start));
    const sorted = [...notebooks].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    navigate(sorted.length > 0 ? '/notebook' : '/notebook', { state: sorted.length > 0 ? { noteId: sorted[0].id } : undefined });
  };

  const handleResumeStudy = () => { activeStudyStart ? stopStudySession() : startStudySession(); };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setStatus('error'); setMessage('Please enter a valid email address.'); return; }
    setStatus('loading'); setMessage('');
    try {
      const result = await subscribeToNewsletter(email);
      setStatus('success'); setMessage(result.message); setEmail('');
    } catch (error: any) {
      setStatus('error'); setMessage(error.message || 'Something went wrong');
    }
  };

  const handleUpgradeConfirm = () => {
    const updatedUser = { ...user, role: UserRole.PRO };
    setUser(updatedUser);
    localStorage.setItem('neuronex_user', JSON.stringify(updatedUser));
    setShowUpgrade(false);
    alert('Welcome to Pro! You now have unlimited access.');
  };

  const handleAddEvent = () => {
    if (!newEvent.topic || !newEvent.date || !newEvent.startTime) { alert('Please fill in the topic, date, and start time.'); return; }
    setSchedule([...schedule, { id: Date.now().toString(), topic: newEvent.topic, date: newEvent.date, startTime: newEvent.startTime, endTime: newEvent.endTime || newEvent.startTime }]);
    setIsAddingEvent(false);
    setNewEvent({ topic: '', date: '', startTime: '', endTime: '' });
  };

  const handleDeleteEvent = (id: string) => setSchedule(schedule.filter(s => s.id !== id));

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return { day: date.getDate(), month: date.toLocaleString('default', { month: 'short' }).toUpperCase() };
  };

  const todayKey = getLocalDayKey(Date.now());
  const todayCompletedSessions = sessions.filter(s => s.dayKey === todayKey);
  const completedSecondsToday = todayCompletedSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const activeSecondsToday = activeStudyStart && getLocalDayKey(activeStudyStart) === todayKey ? activeElapsedSeconds : 0;
  const totalSecondsToday = completedSecondsToday + activeSecondsToday;
  const studyHours = (totalSecondsToday / 3600).toFixed(1);
  const sessionsTodayCount = todayCompletedSessions.length;

  const BAR_COLORS = ['#4ADE80', '#F87171', '#FACC15', '#FB923C', '#22D3EE', '#A78BFA', '#60A5FA'];

  return (
    <div className="space-y-4 h-[calc(100vh-130px)] flex flex-col justify-between overflow-hidden pb-2">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase animate-pulse">● SYSTEM ONLINE</span>
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
            Hello, Operative {user.name} 👋
          </h1>
          <p className="text-[11px] font-mono text-gray-600 mt-1 tracking-widest uppercase">
            {activeStudyStart
              ? `● STUDYING NOW: ${formatDuration(activeElapsedSeconds)} `
              : `12-day streak active`}
            {` • sessions today: ${sessionsTodayCount}`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 transition-all font-mono"
          >
            <Calendar size={11} /> View Schedule
          </button>
          <button
            onClick={handleResumeStudy}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all font-mono"
            style={{ boxShadow: '0 0 14px rgba(6,182,212,0.2)' }}
          >
            <Zap size={11} />
            {activeStudyStart ? 'Stop Study' : 'Resume Study'}
          </button>
        </div>
      </div>

      {/* ── HUD Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HudCard
          icon={<Zap size={16} className="text-yellow-400" />}
          value={`${totalXP} XP`}
          label="Total Gained"
          badge="+12%"
          glowColor="rgba(234,179,8,0.12)"
          borderColor="rgba(234,179,8,0.25)"
          bgColor="rgba(234,179,8,0.04)"
        />
        <HudCard
          icon={<Clock size={16} className="text-cyan-400" />}
          value={`${studyHours}h`}
          label="Study Time"
          glowColor="rgba(6,182,212,0.1)"
          borderColor="rgba(6,182,212,0.2)"
          bgColor="rgba(6,182,212,0.03)"
        />
        <HudCard
          icon={<Target size={16} className="text-emerald-400" />}
          value={quizAccuracy}
          label="Precision"
          glowColor="rgba(52,211,153,0.1)"
          borderColor="rgba(52,211,153,0.2)"
          bgColor="rgba(52,211,153,0.03)"
        />
        <HudCard
          icon={user.role === UserRole.PRO ? <Crown size={16} className="text-violet-400" /> : <ArrowUpRight size={16} className="text-violet-400" />}
          value={user.role === UserRole.PRO ? 'Pro Active' : 'Go Pro'}
          label={user.role === UserRole.PRO ? 'Legend Status' : 'Unlock unlimited AI'}
          glowColor="rgba(139,92,246,0.12)"
          borderColor="rgba(139,92,246,0.25)"
          bgColor="rgba(139,92,246,0.04)"
          onClick={() => user.role !== UserRole.PRO && setShowUpgrade(true)}
          clickable={user.role !== UserRole.PRO}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* Bar Chart */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div
            className="flex-1 min-h-0 rounded-xl border p-4 flex flex-col bg-background"
            style={{
              background: 'rgba(5,8,22,0.85)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Terminal size={12} className="text-violet-500" />
                  <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Node Pulse Monitor</span>
                </div>
                <p className="text-sm font-bold text-white">Learning Activity</p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                live
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={22}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CyberTooltip />} cursor={{ fill: 'rgba(167,139,250,0.05)' }} />
                  <Bar dataKey="hours" radius={[4, 4, 4, 4]}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1 space-y-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">

          {/* Recommended courses */}
          <div
            className="rounded-xl border p-4"
            style={{
              background: 'rgba(5,8,22,0.85)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={12} className="text-cyan-500" />
              <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Recommended Intel</span>
            </div>
            <p className="text-sm font-bold text-white mb-3">Recommended for you</p>
            <div className="space-y-2">
              <CourseCard
                tag="PYTHON"
                tagColor="#22d3ee"
                title="Advanced List Comprehensions"
                meta="15 min · Intermediate"
                onClick={() => navigate('/code')}
              />
              <CourseCard
                tag="REACT"
                tagColor="#c2963e"
                title="Custom Hooks Deep Dive"
                meta="25 min · Advanced"
                onClick={() => navigate('/notebook')}
              />
            </div>
          </div>

          {/* Newsletter */}
          <div
            className="rounded-xl border p-4 relative overflow-hidden"
            style={{
              background: 'rgba(5,8,22,0.85)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            {/* Watermark icon */}
            <div className="absolute top-0 right-0 p-3 opacity-[0.04] pointer-events-none">
              <Mail size={80} className="text-white" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Cpu size={12} className="text-violet-500" />
              <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Uplink Channel</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Stay Updated</h3>
            <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
              Latest challenges, platform updates, and intel drops — straight to your inbox.
            </p>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg p-3 flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/8"
              >
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Uplink Established!</p>
                  <p className="text-[10px] text-gray-600">Check your inbox soon.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
                  <input
                    type="email"
                    placeholder="operative@eduvanta.io"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status === 'error') { setStatus('idle'); setMessage(''); } }}
                    required
                    className={`w-full text-[11px] font-mono bg-black/40 border rounded-lg py-2 pl-8 pr-3 text-white focus:outline-none transition-colors placeholder:text-gray-700 ${
                      status === 'error' ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/8 focus:border-violet-500/40'
                    }`}
                  />
                </div>
                {status === 'error' && (
                  <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-mono">
                    <AlertCircle size={10} />
                    <span>{message}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2 rounded-lg border border-violet-500/40 bg-violet-500/8 text-violet-300 text-[10px] font-bold tracking-widest uppercase hover:bg-violet-500/15 transition-all disabled:opacity-50 font-mono"
                >
                  {status === 'loading' ? 'Transmitting…' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Terminal footer ── */}
      <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[9px] font-mono text-gray-800 tracking-widest uppercase">
        <span>eduvanta field ops terminal v3.1</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          uplink secure
        </span>
      </div>

      {/* ── Schedule Modal ── */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border overflow-hidden"
              style={{ background: 'rgba(3,7,18,0.97)', borderColor: 'rgba(34,211,238,0.2)', boxShadow: '0 0 40px rgba(34,211,238,0.08)' }}
            >
              <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-transparent" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-400" />
                    <p className="font-bold text-white text-sm tracking-wide">Upcoming Schedule</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isAddingEvent && (
                      <button
                        onClick={() => setIsAddingEvent(true)}
                        className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/8 text-cyan-300 hover:bg-cyan-500/15 transition-all font-mono"
                      >
                        <Plus size={10} /> Add
                      </button>
                    )}
                    <button onClick={() => setShowSchedule(false)} className="text-gray-600 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {isAddingEvent ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Topic', key: 'topic', type: 'text', placeholder: 'e.g. Python Basics' },
                      { label: 'Date', key: 'date', type: 'date', placeholder: '' },
                      { label: 'Start Time', key: 'startTime', type: 'time', placeholder: '' },
                      { label: 'End Time', key: 'endTime', type: 'time', placeholder: '' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="text-[9px] font-mono text-gray-600 uppercase tracking-widest block mb-1">{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={(newEvent as any)[key]}
                          onChange={(e) => setNewEvent({ ...newEvent, [key]: e.target.value })}
                          className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/40"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleAddEvent} className="flex-1 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/8 text-cyan-300 text-[10px] font-bold tracking-widest uppercase font-mono hover:bg-cyan-500/15 transition-all">Save</button>
                      <button onClick={() => setIsAddingEvent(false)} className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-[10px] font-bold tracking-widest uppercase font-mono hover:bg-white/8 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {schedule.length === 0 ? (
                      <div className="text-center py-10">
                        <Calendar size={24} className="mx-auto text-gray-700 mb-2" />
                        <p className="text-xs font-mono text-gray-700">No ops scheduled. Plan your week.</p>
                      </div>
                    ) : (
                      schedule
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((item) => {
                          const { day, month } = formatDateDisplay(item.date);
                          return (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-black/30 group">
                              <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/8 flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[9px] text-gray-600 font-mono">{month}</span>
                                <span className="font-bold text-white text-sm">{day}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{item.topic}</p>
                                <p className="text-[10px] text-gray-600 font-mono">{item.startTime}{item.endTime ? ` — ${item.endTime}` : ''}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteEvent(item.id)}
                                className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upgrade Modal ── */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl border overflow-hidden"
              style={{ background: 'rgba(3,7,18,0.97)', borderColor: 'rgba(167,139,250,0.25)', boxShadow: '0 0 60px rgba(139,92,246,0.12)' }}
            >
              <div className="h-0.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-transparent" />
              <button onClick={() => setShowUpgrade(false)} className="absolute top-4 right-4 text-gray-600 hover:text-white z-10">
                <X size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8 border-r border-white/5">
                  <div className="w-10 h-10 bg-violet-500/10 rounded-xl border border-violet-500/30 flex items-center justify-center mb-4">
                    <Crown size={20} className="text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Upgrade to Pro</h2>
                  <p className="text-xs text-gray-600 mb-5 leading-relaxed">Unleash full operative capabilities with unlimited AI firepower.</p>
                  <div className="space-y-2">
                    {['Unlimited AI Explanations', 'Advanced Code Debugging', 'Voice Tutor Access', 'Personalized Study Plan'].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <CheckCircle size={12} className="text-violet-400 flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest mb-2">Limited Time</span>
                  <div className="flex items-end gap-1 mb-5">
                    <span className="text-4xl font-black text-white">$12</span>
                    <span className="text-gray-600 mb-1 text-sm">/mo</span>
                  </div>
                  <button
                    onClick={handleUpgradeConfirm}
                    className="w-full py-3 rounded-xl border border-violet-500/50 bg-violet-500/10 text-violet-300 font-bold tracking-widest uppercase text-sm hover:bg-violet-500/20 transition-all mb-2"
                    style={{ boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}
                  >
                    Get Pro Access
                  </button>
                  <p className="text-[9px] text-gray-700 font-mono">Cancel anytime. Secure payment via Stripe.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
