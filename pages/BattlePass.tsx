import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, Crown, Gem, Flame } from 'lucide-react';
import { SEASON_1 } from '../constants/battlePassData';
import { useBattlePass } from '../hooks/useBattlePass';

export const BattlePass: React.FC = () => {
  const { currentLevel, progressPct, isPremium, setPremium, claimedRewards, claimReward } = useBattlePass();
  const [showRewardClaim, setShowRewardClaim] = useState<any>(null);

  const maxLevel = 10;
  const allLevels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  const handleClaim = (trackName: string, reward: any, level: number) => {
    claimReward(level);
    setShowRewardClaim(reward);
    setTimeout(() => setShowRewardClaim(null), 2000);
  };

  return (
    <div className="relative space-y-6 max-w-5xl mx-auto p-4 md:p-6 lg:p-8" style={{ zIndex: 1 }}>
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: '250px',
          width: 'calc(100vw - 250px)',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      >
        <img
          src="/battlepass-character.png"
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            opacity: 0.20,
          }}
        />
      </motion.div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-6 md:p-8"
           style={{ background: 'rgba(22, 22, 30, 0.60)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', position: 'relative', zIndex: 1 }}>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            SEASON 1
          </h1>
          <h2 className="text-[#9b8aff] font-bold tracking-widest uppercase mb-4">
            {SEASON_1.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-black/50 px-3 py-1.5 rounded-md inline-block border border-white/5">
            ENDS: {SEASON_1.endDate}
          </div>
        </div>

        {/* Current Level Info */}
        <div className="flex flex-col items-center bg-[#0e0e14] border border-[#2a2a3a] p-6 rounded-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} color="#f5c842" />
            <div className="text-xs text-gray-500 font-bold tracking-widest uppercase">CURRENT LEVEL</div>
            <Flame size={16} color="#f5c842" />
          </div>
          <div className="text-4xl text-[#f5c842]" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            {currentLevel}
          </div>
          <div className="w-full mt-4">
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1.5">
              <span>PROGRESS</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#16161e] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#f5c842]" 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 10px rgba(245,200,66,0.5)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Call to action */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-[#9b8aff]/20 to-[#9b8aff]/5 border border-[#9b8aff]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
             style={{ background: 'rgba(22, 22, 30, 0.60)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#9b8aff]/20 rounded-full flex items-center justify-center text-[#9b8aff]">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Upgrade to Premium Pass</h3>
              <p className="text-sm text-gray-400">Unlock exclusive cosmetics, XP boosts, and the Legendary Title!</p>
            </div>
          </div>
          <button 
            onClick={() => setPremium(true)}
            className="whitespace-nowrap bg-[#9b8aff] hover:bg-[#806fff] text-white px-6 py-3 rounded-xl font-bold tracking-widest transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(155,138,255,0.4)]"
          >
            <Gem size={18} />
            Unlock for {SEASON_1.premiumCost}
          </button>
        </div>
      )}

      {/* Reward Track Header */}
      <div className="grid grid-cols-12 gap-4 text-center font-bold tracking-widest text-[10px] md:text-xs text-gray-500 uppercase mt-8 mb-4 rounded-xl p-3"
           style={{ background: 'rgba(22, 22, 30, 0.60)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', position: 'relative', zIndex: 1 }}>
        <div className="col-span-2 hidden md:block">Level</div>
        <div className="col-span-12 md:col-span-5 text-gray-300 bg-white/5 py-2 rounded-lg">Free Rewards</div>
        <div className="col-span-12 md:col-span-5 text-[#9b8aff] flex items-center justify-center gap-1 bg-[#9b8aff]/10 py-2 rounded-lg border border-[#9b8aff]/20">
          <Crown size={14} /> Premium Rewards
        </div>
      </div>

      {/* Reward Track */}
      <div className="space-y-3">
        {allLevels.map(level => {
          const isUnlocked = level <= currentLevel;
          const isClaimed = claimedRewards.includes(level);
          const freeReward = SEASON_1.freeTracks.find(r => r.level === level);
          const premiumReward = SEASON_1.premiumTracks.find(r => r.level === level);

          if (!freeReward && !premiumReward) return null;

          return (
            <div key={level} className={`grid grid-cols-12 gap-4 items-center bg-[#16161e] p-2 md:p-3 rounded-xl transition-all border ${
              isUnlocked ? 'border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'border-[#2a2a3a] opacity-50 bg-[#0e0e14]'
            }`}
            style={{
              background: 'rgba(22, 22, 30, 0.60)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              position: 'relative',
              zIndex: 1
            }}>
              
              {/* Level Indicator */}
              <div className="col-span-12 md:col-span-2 flex items-center md:justify-center justify-between mb-2 md:mb-0 px-2 md:px-0">
                <span className="md:hidden text-[10px] text-gray-500 font-bold uppercase tracking-widest">Level</span>
                <span className={`text-xl font-bold ${isUnlocked ? 'text-[#f5c842]' : 'text-gray-600'}`} style={{ fontFamily: "'Press Start 2P', cursive" }}>
                  {level}
                </span>
              </div>

              {/* Free Track */}
              <div className="col-span-6 md:col-span-5 relative group">
                <div className={`border rounded-lg p-3 h-full min-h-[80px] flex flex-col md:flex-row gap-3 items-center md:justify-start justify-center ${
                  isUnlocked ? 'bg-[#0e0e14] border-[#2a2a3a]' : 'bg-[#080d18] border-transparent'
                }`}>
                  {freeReward ? (
                    <>
                      <div className="text-2xl">{freeReward.icon}</div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] md:text-xs text-gray-400 font-mono mb-1">{freeReward.type.toUpperCase()}</div>
                        <div className="text-xs md:text-sm font-bold text-gray-200">{freeReward.name}</div>
                      </div>
                      
                      {isUnlocked && !isClaimed && (
                        <button 
                          onClick={() => handleClaim('free', freeReward, level)}
                          className="bg-[#f5c842] text-black px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(245,200,66,0.3)] mt-2 md:mt-0 w-full md:w-auto"
                        >
                          CLAIM
                        </button>
                      )}
                      {isClaimed && (
                        <div className="mt-2 md:mt-0 text-[#4ade80] flex items-center gap-1 text-[10px] font-bold tracking-widest">
                          <CheckCircle2 size={16} /> CLAIMED
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full flex justify-center text-gray-700 items-center gap-2 text-xs font-mono">
                       <Lock size={14} /> NO REWARD
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Track */}
              <div className="col-span-6 md:col-span-5 relative group">
                <div className={`border rounded-lg p-3 h-full min-h-[80px] flex flex-col md:flex-row gap-3 items-center md:justify-start justify-center ${
                  isPremium && isUnlocked 
                    ? 'bg-[#1a1435] border-[#9b8aff]/50 shadow-[0_0_15px_rgba(155,138,255,0.1)]' 
                    : 'bg-[#0e0e14] border-[#2a2a3a]'
                }`}>
                  {premiumReward ? (
                    <>
                      <div className="text-2xl">{premiumReward.icon}</div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] md:text-xs text-[#9b8aff] font-mono mb-1">{premiumReward.type.toUpperCase()}</div>
                        <div className={`text-xs md:text-sm font-bold ${isPremium ? 'text-white' : 'text-gray-400'}`}>{premiumReward.name}</div>
                      </div>
                      
                      {isPremium && isUnlocked && !isClaimed && (
                        <button 
                          onClick={() => handleClaim('premium', premiumReward, level)}
                          className="bg-[#9b8aff] text-white px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest hover:bg-[#806fff] transition-colors shadow-[0_0_15px_rgba(155,138,255,0.4)] mt-2 md:mt-0 w-full md:w-auto"
                        >
                          CLAIM
                        </button>
                      )}
                      {isPremium && isClaimed && (
                        <div className="mt-2 md:mt-0 text-[#9b8aff] flex items-center gap-1 text-[10px] font-bold tracking-widest">
                          <CheckCircle2 size={16} /> CLAIMED
                        </div>
                      )}
                      {!isPremium && (
                        <div className="mt-2 md:mt-0 text-gray-600 flex items-center gap-1 text-[10px] font-bold tracking-widest">
                           <Lock size={14} /> LOCKED
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full flex justify-center text-gray-700 items-center gap-2 text-xs font-mono">
                       <Lock size={14} /> NO REWARD
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Reward claim popup */}
      <AnimatePresence>
        {showRewardClaim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-[#0e0e14] border-2 border-[#f5c842] rounded-2xl p-8 shadow-[0_0_60px_rgba(245,200,66,0.3)] text-center w-full max-w-sm flex flex-col items-center">
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="text-6xl mb-4"
               >
                 {showRewardClaim.icon}
               </motion.div>
               <h3 className="text-[#f5c842] text-xl font-bold mb-2 tracking-wide uppercase">Item Unlocked!</h3>
               <p className="text-white font-mono">{showRewardClaim.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
