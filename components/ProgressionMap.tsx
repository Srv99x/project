import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Zap, Brain, Code, BookOpen, Star, Shield } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeStatus = 'locked' | 'unlocked' | 'active' | 'completed';

export interface MapNode {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: NodeStatus;
  /** percentage [0-100] within the container */
  position: { x: number; y: number };
  prerequisites: string[];
  xp?: number;
}

interface ProgressionMapProps {
  nodes?: MapNode[];
  className?: string;
}

// ─── Default demo data ────────────────────────────────────────────────────────

const DEFAULT_NODES: MapNode[] = [
  {
    id: 'root',
    label: 'Initiation',
    description: 'Begin your journey into the NeuroNex grid.',
    icon: <Star size={20} />,
    status: 'completed',
    position: { x: 50, y: 8 },
    prerequisites: [],
    xp: 0,
  },
  {
    id: 'syntax',
    label: 'Syntax Core',
    description: 'Master the language primitives that power the system.',
    icon: <Code size={20} />,
    status: 'completed',
    position: { x: 22, y: 28 },
    prerequisites: ['root'],
    xp: 100,
  },
  {
    id: 'logic',
    label: 'Logic Engine',
    description: 'Control flow, conditionals, and branching paths.',
    icon: <Zap size={20} />,
    status: 'active',
    position: { x: 50, y: 28 },
    prerequisites: ['root'],
    xp: 120,
  },
  {
    id: 'data',
    label: 'Data Matrix',
    description: 'Structures that hold and transform information.',
    icon: <Brain size={20} />,
    status: 'unlocked',
    position: { x: 78, y: 28 },
    prerequisites: ['root'],
    xp: 150,
  },
  {
    id: 'functions',
    label: 'Function Net',
    description: 'Reusable blocks woven into the neural fabric.',
    icon: <BookOpen size={20} />,
    status: 'unlocked',
    position: { x: 22, y: 55 },
    prerequisites: ['syntax', 'logic'],
    xp: 200,
  },
  {
    id: 'oop',
    label: 'Object Grid',
    description: 'Classes and objects modelling the real world.',
    icon: <Shield size={20} />,
    status: 'locked',
    position: { x: 50, y: 55 },
    prerequisites: ['logic', 'data'],
    xp: 300,
  },
  {
    id: 'algorithms',
    label: 'Algorithm Nexus',
    description: 'Elite search, sort, and graph traversal protocols.',
    icon: <Brain size={20} />,
    status: 'locked',
    position: { x: 78, y: 55 },
    prerequisites: ['data', 'oop'],
    xp: 400,
  },
  {
    id: 'mastery',
    label: 'Neural Mastery',
    description: 'Convergence point — become one with the grid.',
    icon: <Star size={20} />,
    status: 'locked',
    position: { x: 50, y: 82 },
    prerequisites: ['functions', 'oop', 'algorithms'],
    xp: 600,
  },
];

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  NodeStatus,
  { ring: string; bg: string; glow: string; textColor: string; label: string }
> = {
  completed: {
    ring: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    glow: '0 0 18px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.25)',
    textColor: '#86efac',
    label: 'Completed',
  },
  active: {
    ring: '#06b6d4',
    bg: 'rgba(6,182,212,0.18)',
    glow: '0 0 22px rgba(6,182,212,0.8), 0 0 50px rgba(6,182,212,0.3)',
    textColor: '#67e8f9',
    label: 'Active',
  },
  unlocked: {
    ring: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    glow: '0 0 16px rgba(167,139,250,0.5), 0 0 36px rgba(167,139,250,0.2)',
    textColor: '#c4b5fd',
    label: 'Unlocked',
  },
  locked: {
    ring: '#374151',
    bg: 'rgba(55,65,81,0.35)',
    glow: 'none',
    textColor: '#4b5563',
    label: 'Locked',
  },
};

// ─── Radar Ping (active node only) ───────────────────────────────────────────

const RadarPing: React.FC = () => (
  <>
    {[0, 0.6, 1.2].map((delay) => (
      <motion.div
        key={delay}
        className="absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none"
        initial={{ opacity: 0.8, scale: 1 }}
        animate={{ opacity: 0, scale: 2.6 }}
        transition={{
          duration: 2,
          delay,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

// ─── Pulse overlay (unlocked / completed) ────────────────────────────────────

const NodePulse: React.FC<{ color: string }> = ({ color }) => (
  <motion.div
    className="absolute inset-0 rounded-full pointer-events-none"
    animate={{ boxShadow: [`0 0 8px ${color}80`, `0 0 22px ${color}cc`, `0 0 8px ${color}80`] }}
    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
  />
);

// ─── Single Node ──────────────────────────────────────────────────────────────

interface NodeProps {
  node: MapNode;
  isHovered: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
}

const NODE_SIZE = 60; // px

const SkillNode: React.FC<NodeProps> = ({ node, isHovered, onClick, onHover }) => {
  const cfg = STATUS_CONFIG[node.status];
  const isLocked = node.status === 'locked';
  const isActive = node.status === 'active';
  const isCompleted = node.status === 'completed';
  const isUnlocked = node.status === 'unlocked';

  return (
    <motion.div
      className="absolute"
      style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: Math.random() * 0.3 }}
    >
      {/* Outer positioning wrapper — centered */}
      <div
        className="relative flex flex-col items-center cursor-pointer select-none"
        style={{ transform: 'translate(-50%, -50%)' }}
        onClick={onClick}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Radar ping for active */}
        {isActive && (
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{ width: NODE_SIZE, height: NODE_SIZE }}
          >
            <RadarPing />
          </div>
        )}

        {/* Node circle */}
        <motion.div
          whileHover={!isLocked ? { scale: 1.15 } : {}}
          style={{
            width: NODE_SIZE,
            height: NODE_SIZE,
            borderRadius: '50%',
            background: cfg.bg,
            border: `2px solid ${cfg.ring}`,
            boxShadow: isHovered && !isLocked ? cfg.glow : isLocked ? 'none' : cfg.glow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {/* Pulse on completed / unlocked */}
          {(isCompleted || isUnlocked) && <NodePulse color={cfg.ring} />}

          {/* Inner ring */}
          <div
            style={{
              width: NODE_SIZE - 14,
              height: NODE_SIZE - 14,
              borderRadius: '50%',
              background: isLocked ? 'rgba(17,24,39,0.8)' : `${cfg.ring}22`,
              border: `1px solid ${cfg.ring}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: isLocked ? '#374151' : cfg.textColor }}>
              {isLocked ? <Lock size={18} /> : isCompleted ? <CheckCircle size={18} /> : node.icon}
            </span>
          </div>

          {/* Completed checkmark badge */}
          {isCompleted && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 8px rgba(34,197,94,0.7)' }}
            >
              <CheckCircle size={11} className="text-white" />
            </div>
          )}
        </motion.div>

        {/* Label */}
        <motion.div
          animate={{ opacity: isLocked ? 0.35 : 1 }}
          className="mt-2 text-center"
          style={{ maxWidth: 90 }}
        >
          <p
            className="text-[11px] font-semibold leading-tight tracking-wide"
            style={{ color: cfg.textColor, textShadow: `0 0 10px ${cfg.ring}` }}
          >
            {node.label}
          </p>
          {node.xp !== undefined && !isLocked && (
            <p className="text-[9px] mt-0.5" style={{ color: `${cfg.ring}99` }}>
              {node.xp} XP
            </p>
          )}
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 pointer-events-none"
              style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)', minWidth: 160 }}
            >
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{
                  background: 'rgba(3,7,18,0.92)',
                  borderColor: `${cfg.ring}55`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.ring}22`,
                }}
              >
                <p className="font-bold mb-0.5" style={{ color: cfg.textColor }}>
                  {node.label}
                </p>
                <p className="text-gray-400 leading-snug">{node.description}</p>
                <div
                  className="mt-1.5 pt-1.5 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${cfg.ring}33` }}
                >
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${cfg.ring}20`, color: cfg.textColor }}
                  >
                    {cfg.label}
                  </span>
                  {node.xp !== undefined && (
                    <span className="text-[10px] text-gray-500">{node.xp} XP</span>
                  )}
                </div>
              </div>
              {/* Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-1.5 overflow-hidden"
              >
                <div
                  className="w-3 h-3 rotate-45 -translate-y-1.5"
                  style={{
                    background: 'rgba(3,7,18,0.92)',
                    border: `1px solid ${cfg.ring}55`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── SVG Edge ────────────────────────────────────────────────────────────────

interface EdgeProps {
  from: MapNode;
  to: MapNode;
  containerWidth: number;
  containerHeight: number;
}

const Edge: React.FC<EdgeProps> = ({ from, to, containerWidth, containerHeight }) => {
  const x1 = (from.position.x / 100) * containerWidth;
  const y1 = (from.position.y / 100) * containerHeight;
  const x2 = (to.position.x / 100) * containerWidth;
  const y2 = (to.position.y / 100) * containerHeight;

  // Mid-control point for curve
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Offset the control point orthogonally to make a beautiful bezier arc
  const mx = x1 + dx / 2 - dy * 0.15;
  const my = y1 + dy / 2 + dx * 0.15;

  const isActive =
    from.status === 'completed' && (to.status === 'active' || to.status === 'unlocked');
  const isCompleted = from.status === 'completed' && to.status === 'completed';
  const isLocked = to.status === 'locked';

  const strokeColor = isCompleted
    ? '#22c55e'
    : isActive
    ? '#8b5cf6'
    : isLocked
    ? '#1f2937'
    : '#4b5563';
  const strokeOpacity = isLocked ? 0.3 : isCompleted ? 0.75 : 0.55;
  const strokeWidth = isCompleted ? 2 : 1.5;

  const pathD = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const id = `edge-${from.id}-${to.id}`;

  return (
    <g>
      {/* Glow layer */}
      {!isLocked && (
        <path
          d={pathD}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 3}
          strokeOpacity={0.12}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* Main line */}
      <motion.path
        d={pathD}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: strokeOpacity }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      {/* Moving dot for active paths */}
      {isActive && (
        <motion.circle r={3} fill="#8b5cf6" opacity={0.9}>
          <animateMotion dur="2.5s" repeatCount="indefinite" path={pathD} />
        </motion.circle>
      )}
    </g>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProgressionMap: React.FC<ProgressionMapProps> = ({
  nodes = DEFAULT_NODES,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Build edge pairs
  const edges: { from: MapNode; to: MapNode }[] = [];
  nodes.forEach((node) => {
    node.prerequisites.forEach((prereqId) => {
      const prereq = nodes.find((n) => n.id === prereqId);
      if (prereq) edges.push({ from: prereq, to: node });
    });
  });

  const stats = {
    completed: nodes.filter((n) => n.status === 'completed').length,
    unlocked: nodes.filter((n) => n.status === 'unlocked').length,
    locked: nodes.filter((n) => n.status === 'locked').length,
    total: nodes.length,
  };

  return (
    <div className={`space-y-4 ${className} h-full overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold tracking-wide"
            style={{
              background: 'linear-gradient(90deg, #67e8f9, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Neural Progression Grid
          </h2>
          <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">
            Skill acquisition pathway — cybernetic overlay active
          </p>
        </div>

        {/* Stats bar */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          {[
            { label: 'Completed', value: stats.completed, color: '#22c55e' },
            { label: 'Unlocked', value: stats.unlocked, color: '#a78bfa' },
            { label: 'Locked', value: stats.locked, color: '#374151' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold" style={{ color: s.color, textShadow: `0 0 12px ${s.color}` }}>
                {s.value}
              </p>
              <p className="text-gray-600 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full" style={{ background: '#0f172a' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #22c55e, #06b6d4, #a78bfa)',
            boxShadow: '0 0 10px rgba(6,182,212,0.6)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${((stats.completed + stats.unlocked) / stats.total) * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      {/* Map canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden flex-1 min-h-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(167,139,250,0.06) 0%, transparent 55%), #030712',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.04 }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Corner decorations */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
          <div key={pos} className={`absolute ${pos} w-8 h-8 opacity-20`}>
            <div className="w-full h-0.5 bg-cyan-400" />
            <div className="w-0.5 h-full bg-cyan-400 absolute top-0 left-0" />
          </div>
        ))}

        {/* Scan line animation */}
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)',
          }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* SVG edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {edges.map(({ from, to }) => (
            <Edge
              key={`${from.id}-${to.id}`}
              from={from}
              to={to}
              containerWidth={dims.width}
              containerHeight={dims.height}
            />
          ))}
        </svg>

        {/* Nodes */}
        <div className="absolute inset-0 z-10">
          {nodes.map((node) => (
            <SkillNode
              key={node.id}
              node={node}
              isHovered={hoveredId === node.id}
              onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
              onHover={setHoveredId}
            />
          ))}
        </div>

        {/* HUD label */}
        <div className="absolute top-4 right-4 text-[9px] font-mono tracking-widest opacity-30 text-cyan-400 uppercase pointer-events-none">
          sys::progression_map v2.7 / neural_grid
        </div>

        {/* Detail panel OVERLAID inside map canvas */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-6 left-6 max-w-sm rounded-xl border p-5 z-20"
              style={{
                background: 'rgba(3,7,18,0.95)',
                borderColor: `${STATUS_CONFIG[selectedNode.status].ring}44`,
                backdropFilter: 'blur(16px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${STATUS_CONFIG[selectedNode.status].ring}33, inset 0 0 24px rgba(0,0,0,0.4)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: STATUS_CONFIG[selectedNode.status].bg,
                      border: `1.5px solid ${STATUS_CONFIG[selectedNode.status].ring}55`,
                    }}
                  >
                    <span style={{ color: STATUS_CONFIG[selectedNode.status].textColor }}>
                      {selectedNode.icon}
                    </span>
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base leading-tight"
                      style={{ color: STATUS_CONFIG[selectedNode.status].textColor }}
                    >
                      {selectedNode.label}
                    </h3>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-mono mt-1 inline-block"
                      style={{
                        background: `${STATUS_CONFIG[selectedNode.status].ring}20`,
                        color: STATUS_CONFIG[selectedNode.status].textColor,
                      }}
                    >
                      {STATUS_CONFIG[selectedNode.status].label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-500 hover:text-white transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-300 text-sm mt-4 leading-relaxed">{selectedNode.description}</p>

              {selectedNode.xp !== undefined && (
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
                   <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 tracking-widest uppercase">
                     <Zap size={10} className="text-yellow-500" />
                     <span>XP VALUE</span>
                   </div>
                   <span className="text-white font-bold text-sm tracking-wider">{selectedNode.xp}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ProgressionMap;
