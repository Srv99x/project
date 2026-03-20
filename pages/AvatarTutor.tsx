import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Mic, MicOff, Volume2, VolumeX, Send, RefreshCw, MessageSquare, Sparkles } from 'lucide-react';
import { chatWithTutor } from '../services/aiService';

interface VoiceLanguageOption {
  id: string;
  label: string;
  lang: string;
  voiceHints?: string[];
}

type UserInputSource = 'voice' | 'text';

const VOICE_LANGUAGE_STORAGE_KEY = 'neuronex_voice_language';

export const AvatarTutor: React.FC = () => {
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceLanguageOptions, setVoiceLanguageOptions] = useState<VoiceLanguageOption[]>([]);
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState('en-US');
  
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Suggested Topics
  const suggestions = [
    "Explain recursion simply",
    "Quiz me on Python Lists",
    "What is Big O notation?",
    "How do React hooks work?"
  ];

  useEffect(() => {
    const loadVoiceLanguages = async () => {
      try {
        const response = await fetch('/voice-languages.json');
        if (!response.ok) return;

        const data = (await response.json()) as VoiceLanguageOption[];
        if (!Array.isArray(data) || data.length === 0) return;

        const normalized = data.filter((item) => item?.label && item?.lang);
        if (normalized.length === 0) return;

        setVoiceLanguageOptions(normalized);

        const savedLang = localStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY);
        const selected = normalized.find((item) => item.lang === savedLang)?.lang || normalized[0].lang;
        setSelectedVoiceLanguage(selected);
      } catch (error) {
        console.error('Failed to load voice languages:', error);
      }
    };

    loadVoiceLanguages();
  }, []);

  useEffect(() => {
    localStorage.setItem(VOICE_LANGUAGE_STORAGE_KEY, selectedVoiceLanguage);
  }, [selectedVoiceLanguage]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedVoiceLanguage;

      recognitionRef.current.onstart = () => setIsListening(true);
      
      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setIsListening(false);
        handleUserMessage(text, 'voice');
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech error", event);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [selectedVoiceLanguage]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Audio Visualizer Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      // Resize canvas to match display size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      
      // Determine wave properties based on state
      let amplitude = 5;
      let frequency = 0.02;
      let speed = 0.05;
      let color = 'rgba(255, 255, 255, 0.1)';

      if (isListening) {
        amplitude = 30;
        frequency = 0.05;
        speed = 0.2;
        color = '#C08952'; // Primary
      } else if (isSpeaking) {
        amplitude = 20;
        frequency = 0.03;
        speed = 0.1;
        color = '#8B5E3C'; // Secondary
      } else if (isProcessing) {
        amplitude = 10;
        frequency = 0.1;
        speed = 0.15;
        color = '#ffffff';
      }

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let x = 0; x < width; x++) {
        // Sine wave formula
        const y = centerY + Math.sin(x * frequency + phase) * amplitude * Math.sin(x / width * Math.PI); 
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();

      // Second wave for depth (ghost wave)
      ctx.strokeStyle = color.replace('1)', '0.3)').replace('rgb', 'rgba').replace('#C08952', 'rgba(192, 137, 82, 0.3)').replace('#8B5E3C', 'rgba(139, 94, 60, 0.3)');
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let x = 0; x < width; x++) {
         const y = centerY + Math.sin(x * frequency + phase + 1.5) * (amplitude * 0.7) * Math.sin(x / width * Math.PI); 
         ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += speed;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isListening, isSpeaking, isProcessing]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleUserMessage = async (text: string, source: UserInputSource = 'text') => {
    if (!text.trim()) return;

    if (source !== 'voice' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setInputText('');
    setIsProcessing(true);

    // Call AI Service with route and optional quest context
    const activeQuest = localStorage.getItem('active_quest') || undefined;
    const responseText = await chatWithTutor(newMessages, text, location.pathname, activeQuest);
    
    setMessages(prev => [...prev, { role: 'model' as const, text: responseText }]);
    setIsProcessing(false);
    
    // Text to Speech
    if (source === 'voice' && !isMuted && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.lang = selectedVoiceLanguage;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      // Select best voice from configured language and optional hints.
      const voices = window.speechSynthesis.getVoices();
      const selectedOption = voiceLanguageOptions.find((option) => option.lang === selectedVoiceLanguage);
      const preferredVoice = voices.find((voice) => {
        const langMatches = voice.lang?.toLowerCase().startsWith(selectedVoiceLanguage.toLowerCase());
        if (!langMatches) return false;
        if (!selectedOption?.voiceHints?.length) return true;
        return selectedOption.voiceHints.some((hint) => voice.name.includes(hint));
      }) || voices.find((voice) => voice.lang?.toLowerCase().startsWith(selectedVoiceLanguage.toLowerCase()));

      if (preferredVoice) utterance.voice = preferredVoice;
      
      // Improve rate/pitch for "AI" feel
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserMessage(inputText, 'text');
  };

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Panel: Avatar & Visualizer (4 cols) */}
      <GlassCard className="lg:col-span-4 flex flex-col items-center justify-between p-8 relative overflow-hidden bg-gradient-to-b from-surface/50 to-black/50">
         {/* Status Indicator */}
         <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-white animate-pulse' : isListening ? 'bg-primary animate-pulse' : isSpeaking ? 'bg-secondary' : 'bg-subtext/30'}`}></div>
            <span className="text-xs font-mono uppercase text-subtext">
                {isProcessing ? 'Thinking...' : isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready'}
            </span>
         </div>

         <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
             <div className="flex items-center gap-2">
                <label className="text-[10px] uppercase tracking-wide text-subtext hidden sm:block">Voice</label>
                <select
                  value={selectedVoiceLanguage}
                  onChange={(e) => setSelectedVoiceLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-sm px-2 py-1 text-xs text-white focus:outline-none focus:border-primary/60"
                >
                  {(voiceLanguageOptions.length > 0 ? voiceLanguageOptions : [{ id: 'fallback-en', label: 'English (US)', lang: 'en-US' }]).map((option) => (
                    <option key={option.id} value={option.lang}>
                      {option.label}
                    </option>
                  ))}
                </select>
             </div>

             <button onClick={() => setIsMuted(!isMuted)} className="text-subtext hover:text-white transition-colors" title="Toggle Voice Output">
      <GlassCard className="lg:col-span-4 flex flex-col items-center justify-start p-8 relative overflow-hidden bg-gradient-to-b from-surface/50 to-black/50">
         <div className="absolute top-6 right-6">
             <button onClick={() => setIsMuted(!isMuted)} className="text-subtext hover:text-white transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
         </div>

         <div className="absolute top-6 left-6 flex items-center gap-2 z-50">
            <label className="text-[10px] uppercase tracking-wide text-subtext">Voice</label>
            <select
              value={selectedVoiceLanguage}
              onChange={(e) => setSelectedVoiceLanguage(e.target.value)}
              className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
            >
              {(voiceLanguageOptions.length > 0 ? voiceLanguageOptions : [{ id: 'fallback-en', label: 'English (US)', lang: 'en-US' }]).map((option) => (
                <option key={option.id} value={option.lang}>
                  {option.label}
                </option>
              ))}
            </select>
         </div>

        {/* Central Avatar Visual */}
        <div className="flex-1 flex flex-col items-center justify-start w-full z-10 pt-16">
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${isSpeaking ? 'scale-110 shadow-[0_0_80px_rgba(139,94,60,0.35)]' : 'shadow-[0_0_30px_rgba(255,255,255,0.05)]'}`}>
                {/* Background Glow */}
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${isListening ? 'bg-primary' : 'bg-secondary'}`}></div>
                
                {/* Core Sphere */}
                <div className="w-40 h-40 rounded-full bg-black border border-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-md">
                     {/* Inner pulsing core */}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-tr from-white to-transparent opacity-80 blur-md transition-all duration-300 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100'}`}></div>
                </div>
                
                {/* Orbiting Ring */}
                <div className={`absolute inset-0 border border-white/10 rounded-full w-56 h-56 -m-4 border-dashed animate-[spin_10s_linear_infinite] opacity-30`}></div>
            </div>
        </div>

        {/* Audio Visualizer Canvas */}
        <div className="w-full h-24 relative z-0 mt-12">
             <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Voice Controls */}
        <div className="mt-4 z-10">
             <Button 
                variant={isListening ? "danger" : "primary"} 
                className={`rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-2xl transition-all duration-300 ${isListening ? 'scale-110' : 'hover:scale-105'}`}
                onClick={toggleListening}
             >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
             </Button>
             <p className="text-xs text-center mt-3 text-subtext">
                {isListening ? 'Tap to stop' : 'Tap to speak'}
             </p>
        </div>
      </GlassCard>

      {/* Right Panel: Chat Interface (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full gap-4 overflow-hidden">
        {/* Chat History */}
        <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden bg-black/20">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-secondary" />
                    <span className="text-sm font-semibold">Transcript</span>
                </div>
                <Button variant="glass" size="sm" onClick={() => setMessages([])} className="text-xs h-7">
                    <RefreshCw size={12} className="mr-1" /> Clear
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <Sparkles size={40} className="text-primary mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">How can I help you learn?</h3>
                        <p className="text-sm text-subtext max-w-xs mb-8">
                            Start a conversation by speaking or typing. I can explain complex topics, quiz you, or debug your code.
                        </p>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                            {suggestions.map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => handleUserMessage(s, 'text')}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-left transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-white/10 text-white rounded-br-none border border-white/5' 
                            : 'bg-secondary/10 text-gray-100 border border-secondary/20 rounded-bl-none shadow-[0_0_15px_rgba(139,94,60,0.14)]'
                        }`}>
                            {msg.role === 'model' && <p className="text-[10px] text-secondary font-bold mb-1 uppercase tracking-wider">Nova</p>}
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isProcessing && (
                     <div className="flex justify-start">
                        <div className="bg-secondary/10 px-4 py-3 rounded-2xl rounded-bl-none border border-secondary/10">
                            <div className="flex gap-1.5 items-center">
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface border-t border-white/5">
                <form onSubmit={handleSubmitText} className="relative flex gap-2">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/30 focus:bg-white/10 transition-all placeholder:text-subtext/40"
                    />
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={!inputText.trim() || isProcessing}
                        className="rounded-xl px-4"
                    >
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </GlassCard>
      </div>
    </div>
  );
};
