import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, X, Swords, Skull, Shield } from 'lucide-react';
import { BotOpponent } from '../services/botOpponent';
import { PVP_QUESTIONS } from '../constants/pvpQuestions';

type ScreenState = 'lobby' | 'matchmaking' | 'game' | 'result';

export const PvpQuiz: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('lobby');
  
  // Player Stats
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('eduq_pvp_wins') || '0'));
  const [losses, setLosses] = useState(() => parseInt(localStorage.getItem('eduq_pvp_losses') || '0'));
  const totalGames = wins + losses;
  const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // Game State
  const [botOpponent] = useState(() => new BotOpponent());
  const [questions, setQuestions] = useState<typeof PVP_QUESTIONS>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [playerHP, setPlayerHP] = useState(100);
  const [botHP, setBotHP] = useState(100);
  const [timeLeft, setTimeLeft] = useState(15);
  
  // Answer State
  const [playerAns, setPlayerAns] = useState<number | null>(null);
  const [botAns, setBotAns] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Results State
  const [matchResult, setMatchResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioning = useRef(false);

  // Matchmaking
  const handleFindMatch = () => {
    setScreen('matchmaking');
    setTimeout(() => {
      // Initialize Game
      const shuffled = [...PVP_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
      setQuestions(shuffled);
      setPlayerHP(100);
      setBotHP(100);
      setCurrentQIdx(0);
      setMatchResult(null);
      setScreen('game');
    }, 2500);
  };

  // Game Timer
  useEffect(() => {
    if (screen === 'game' && !showResult && playerAns === null) {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      } else {
        // Time's up
        handleEvaluateRound(null);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [screen, timeLeft, playerAns, showResult]);

  // Bot Turn
  useEffect(() => {
    if (screen === 'game' && !showResult && botAns === null && !isTransitioning.current) {
      let isMounted = true;
      const currentQ = questions[currentQIdx];
      
      botOpponent.getAnswer(currentQ.correct, currentQ.options.length)
        .then(ans => {
          if (isMounted && !showResult) {
            setBotAns(ans);
          }
        });
        
      return () => { isMounted = false; };
    }
  }, [screen, currentQIdx, showResult, botAns, botOpponent, questions]);

  // Evaluate when both have answered or timer is 0
  useEffect(() => {
    if (screen === 'game' && !showResult && !isTransitioning.current) {
      if (playerAns !== null && botAns !== null) {
        handleEvaluateRound(playerAns); // Player answered first or second
      } else if (timeLeft <= 0) {
        handleEvaluateRound(playerAns); // Timer ran out, evaluate whatever answers exist
      }
    }
  }, [playerAns, botAns, timeLeft, screen, showResult]);

  const handleEvaluateRound = (pAns: number | null) => {
    isTransitioning.current = true;
    setShowResult(true);
    const correct = questions[currentQIdx].correct;
    
    let pDamage = 0;
    let bDamage = 0;

    if (pAns !== correct) pDamage = 20;
    if (botAns !== correct) bDamage = 20;

    setPlayerHP(prev => Math.max(0, prev - pDamage));
    setBotHP(prev => Math.max(0, prev - bDamage));

    // Wait 2.5s then go to next question or end
    setTimeout(() => {
      const nextPHP = Math.max(0, playerHP - pDamage);
      const nextBHP = Math.max(0, botHP - bDamage);

      if (nextPHP <= 0 || nextBHP <= 0 || currentQIdx === 4) {
        // Game Over
        finishGame(nextPHP, nextBHP);
      } else {
        setCurrentQIdx(prev => prev + 1);
        setPlayerAns(null);
        setBotAns(null);
        setTimeLeft(15);
        setShowResult(false);
        isTransitioning.current = false;
      }
    }, 2500);
  };

  const finishGame = (finalPHP: number, finalBHP: number) => {
    let outcome: 'victory' | 'defeat' | 'draw' = 'draw';
    if (finalPHP > finalBHP) outcome = 'victory';
    else if (finalBHP > finalPHP) outcome = 'defeat';
    
    setMatchResult(outcome);
    setScreen('result');
    isTransitioning.current = false;
    
    // Save stats
    if (outcome === 'victory') {
      const newWins = wins + 1;
      setWins(newWins);
      localStorage.setItem('eduq_pvp_wins', newWins.toString());
      setXpEarned(150);
    } else if (outcome === 'defeat') {
      const newLosses = losses + 1;
      setLosses(newLosses);
      localStorage.setItem('eduq_pvp_losses', newLosses.toString());
      setXpEarned(30);
    } else {
      setXpEarned(50);
    }
  };

  const resetToLobby = () => {
    setScreen('lobby');
    setPlayerAns(null);
    setBotAns(null);
    setShowResult(false);
    setTimeLeft(15);
  };

  return (
    <div className="relative overflow-hidden max-w-4xl mx-auto p-4 md:p-6 lg:p-8 min-h-[80vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.6 }}
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
      >
        <img
          src="/pvp-character.png"
          alt=""
          aria-hidden="true"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.25 }}
        />
      </motion.div>

      <div className="relative z-10 flex-1 flex flex-col justify-center">
      <AnimatePresence mode="wait">
        
        {/* LOBBY SCREEN */}
        {screen === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl p-8 flex flex-col items-center text-center"
          style={{
            background: 'rgba(22, 22, 30, 0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 1,
          }}
          >
            <div className="w-16 h-16 bg-[#f5c842]/10 rounded-full flex items-center justify-center mb-6 border border-[#f5c842]/30">
              <Swords size={32} className="text-[#f5c842]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>PvP ARENA</h1>
            <p className="text-gray-400 font-mono text-sm mb-8">Test your logic against simulated rogue AI and other operatives.</p>
            
            <div className="flex gap-4 md:gap-8 mb-10 w-full justify-center">
              <div className="bg-[#16161e] p-4 rounded-xl border border-[#2a2a3a] min-w-[100px]">
                <div className="text-[#4ade80] text-2xl font-bold font-mono">{wins}</div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Wins</div>
              </div>
              <div className="bg-[#16161e] p-4 rounded-xl border border-[#2a2a3a] min-w-[100px]">
                <div className="text-rose-400 text-2xl font-bold font-mono">{losses}</div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Losses</div>
              </div>
              <div className="bg-[#16161e] p-4 rounded-xl border border-[#2a2a3a] min-w-[100px]">
                <div className="text-[#9b8aff] text-2xl font-bold font-mono">{winrate}%</div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Win Rate</div>
              </div>
            </div>

            <button 
              onClick={handleFindMatch}
              className="px-8 py-4 bg-[#f5c842] hover:bg-yellow-400 text-black font-bold tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(245,200,66,0.3)] flex items-center gap-3 w-full max-w-sm justify-center"
              style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
            >
              FIND MATCH
            </button>
          </motion.div>
        )}

        {/* MATCHMAKING SCREEN */}
        {screen === 'matchmaking' && (
          <motion.div 
            key="matchmaking"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 border-2 border-t-[#f5c842] border-[#2a2a3a] rounded-full mb-8"
            />
            <h2 className="text-xl text-[#f5c842] font-bold animate-pulse" style={{ fontFamily: "'Press Start 2P', cursive" }}>SEARCHING...</h2>
            <p className="text-gray-500 font-mono mt-4">Scanning network for worthy opponents</p>
          </motion.div>
        )}

        {/* GAME SCREEN */}
        {screen === 'game' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Fighter Cards */}
            <div className="flex justify-between items-center mb-8 gap-4 px-2">
              <div className="flex-1 bg-[#16161e] border border-[#2a2a3a] p-4 rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-end mb-2 relative z-10">
                  <div className="text-xs font-bold text-white tracking-widest">YOU</div>
                  <div className="text-[10px] text-[#4ade80] font-mono">{playerHP} HP</div>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden relative z-10">
                  <motion.div animate={{ width: `${playerHP}%` }} className={`h-full ${playerHP > 30 ? 'bg-[#4ade80]' : 'bg-red-500'}`} />
                </div>
                {showResult && playerAns !== questions[currentQIdx].correct && (
                  <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 bg-red-500/20" />
                )}
              </div>

              <div className="text-2xl text-gray-600 font-bold px-2">VS</div>

              <div className="flex-1 bg-[#16161e] border border-[#2a2a3a] p-4 rounded-xl relative overflow-hidden text-right">
                <div className="flex justify-between items-end mb-2 relative z-10">
                  <div className="text-[10px] text-rose-400 font-mono">{botHP} HP</div>
                  <div className="text-xs font-bold text-white tracking-widest">{botOpponent.name}</div>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden relative z-10 flex justify-end">
                  <motion.div animate={{ width: `${botHP}%` }} className={`h-full ${botHP > 30 ? 'bg-rose-400' : 'bg-red-500'}`} />
                </div>
                {showResult && botAns !== questions[currentQIdx].correct && (
                   <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 bg-red-500/20" />
                )}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#0e0e14] border border-[#2a2a3a] rounded-2xl p-6 md:p-10 mb-6 relative shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] tracking-widest text-[#9b8aff] font-mono uppercase bg-[#9b8aff]/10 px-3 py-1 rounded">
                  {questions[currentQIdx].topic}
                </span>
                <span className={`text-xl font-bold flex items-center gap-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#f5c842]'}`} style={{ fontFamily: "'Press Start 2P', cursive" }}>
                  <Clock size={20} /> {timeLeft}s
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2 leading-relaxed">
                {questions[currentQIdx].q}
              </h2>
              <div className="text-xs text-gray-500 font-mono mt-4">Question {currentQIdx + 1}/5</div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentQIdx].options.map((opt, i) => {
                const isSelected = playerAns === i;
                const isCorrect = i === questions[currentQIdx].correct;
                let btnStyle = 'bg-[#16161e] border-[#2a2a3a] text-gray-300 hover:border-gray-500';
                
                if (showResult) {
                  if (isCorrect) btnStyle = 'bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80]';
                  else if (isSelected) btnStyle = 'bg-red-500/10 border-red-500 text-red-500';
                  else btnStyle = 'bg-[#16161e] border-[#2a2a3a] opacity-40 text-gray-500';
                } else if (isSelected) {
                  btnStyle = 'bg-[#f5c842]/10 border-[#f5c842] shadow-[0_0_15px_rgba(245,200,66,0.2)] text-[#f5c842]';
                }

                return (
                  <button
                    key={i}
                    disabled={playerAns !== null || showResult}
                    onClick={() => {
                        if (!showResult && playerAns === null) setPlayerAns(i);
                    }}
                    className={`p-4 md:p-6 rounded-xl border text-left font-mono transition-all duration-300 ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs opacity-50">{['A', 'B', 'C', 'D'][i]}</span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* RESULTS SCREEN */}
        {screen === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-[#0e0e14] border border-[#2a2a3a] rounded-2xl p-10 flex flex-col items-center text-center shadow-2xl"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 text-4xl border-4 ${
              matchResult === 'victory' ? 'bg-[#f5c842]/20 border-[#f5c842] shadow-[0_0_50px_rgba(245,200,66,0.3)] text-[#f5c842]' :
              matchResult === 'defeat' ? 'bg-red-500/20 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-red-500' :
              'bg-gray-500/20 border-gray-500 text-gray-400'
            }`}>
              {matchResult === 'victory' ? <Trophy size={48} /> : 
               matchResult === 'defeat' ?  <Skull size={48} /> : <Shield size={48} />}
            </div>
            
            <h1 className={`text-4xl font-bold mb-4 uppercase tracking-widest ${
              matchResult === 'victory' ? 'text-[#f5c842]' : matchResult === 'defeat' ? 'text-red-500' : 'text-gray-400'
            }`} style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '24px' }}>
              {matchResult}
            </h1>
            
            <p className="text-gray-400 font-mono mb-8">
              {matchResult === 'victory' ? 'Opponent logic outmaneuvered.' : 
               matchResult === 'defeat' ? 'Neural link shattered.' : 'Standstill detected.'}
            </p>

            <div className="flex items-center gap-2 bg-[#16161e] border border-[#2a2a3a] px-6 py-3 rounded-lg mb-8">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Rewards:</span>
              <span className="text-[#4ade80] font-mono font-bold ml-2">+{xpEarned} XP</span>
            </div>

            <button 
              onClick={resetToLobby}
              className="px-8 py-3 bg-[#16161e] border border-[#2a2a3a] hover:bg-white/5 hover:text-white text-gray-400 font-bold tracking-widest rounded-xl transition-all font-mono uppercase text-xs"
            >
              Return to Lobby
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
