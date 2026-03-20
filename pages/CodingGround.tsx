import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { SAMPLE_CODE_PYTHON, SAMPLE_CODE_JS, SAMPLE_CODE_TS } from '../constants';
import { BossFightHUD, BossFightResult } from '../components/BossFightHUD';
import { Play, Bug, Zap, BookOpen, GitGraph, FileCode, Terminal as TerminalIcon, X, Sparkles } from 'lucide-react';
import { debugCode, optimizeCode, explainCode } from '../services/aiService';
import { runCode } from '../services/codeRunnerService';

type Language = 'python' | 'javascript' | 'typescript';
type Tab = 'terminal' | 'debug' | 'explain' | 'optimize' | 'flow';

type FlowNodeType = 'start' | 'function' | 'decision' | 'action' | 'io' | 'end';

interface FlowNode {
    id: string;
    line: number;
    type: FlowNodeType;
    label: string;
    detail: string;
}

const getFlowNodeTypeLabel = (type: FlowNodeType): string => {
    switch (type) {
        case 'start':
            return 'Start';
        case 'function':
            return 'Function';
        case 'decision':
            return 'Decision';
        case 'action':
            return 'Action';
        case 'io':
            return 'Input/Output';
        case 'end':
            return 'End';
        default:
            return 'Step';
    }
};

const getFlowNodeColors = (type: FlowNodeType): { border: string; glow: string; bg: string; badge: string } => {
    switch (type) {
        case 'start':
            return { border: 'border-emerald-400/60', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.25)]', bg: 'from-emerald-500/12 to-emerald-700/8', badge: 'bg-emerald-400/20 text-emerald-200' };
        case 'function':
            return { border: 'border-sky-400/60', glow: 'shadow-[0_0_16px_rgba(56,189,248,0.24)]', bg: 'from-sky-500/12 to-sky-700/8', badge: 'bg-sky-400/20 text-sky-200' };
        case 'decision':
            return { border: 'border-amber-400/70', glow: 'shadow-[0_0_18px_rgba(245,158,11,0.28)]', bg: 'from-amber-500/16 to-amber-700/8', badge: 'bg-amber-400/25 text-amber-200' };
        case 'io':
            return { border: 'border-violet-400/60', glow: 'shadow-[0_0_16px_rgba(167,139,250,0.24)]', bg: 'from-violet-500/12 to-violet-700/8', badge: 'bg-violet-400/20 text-violet-200' };
        case 'end':
            return { border: 'border-rose-400/65', glow: 'shadow-[0_0_16px_rgba(251,113,133,0.24)]', bg: 'from-rose-500/12 to-rose-700/8', badge: 'bg-rose-400/20 text-rose-200' };
        default:
            return { border: 'border-primary/50', glow: 'shadow-[0_0_14px_rgba(194,150,62,0.22)]', bg: 'from-primary/14 to-primary/8', badge: 'bg-primary/20 text-primary' };
    }
};

const parseCodeToFlowNodes = (sourceCode: string, language: Language): FlowNode[] => {
    const nodes: FlowNode[] = [
        {
            id: 'start',
            line: 1,
            type: 'start',
            label: 'Program entry',
            detail: `Execution begins in ${language}.`,
        },
    ];

    const lines = sourceCode.split('\n');

    lines.forEach((rawLine, index) => {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) {
            return;
        }

        const lineNumber = index + 1;
        const maxLen = 74;
        const compactLine = line.length > maxLen ? `${line.slice(0, maxLen)}...` : line;

        const addNode = (type: FlowNodeType, label: string, detail: string) => {
            nodes.push({
                id: `line-${lineNumber}-${nodes.length}`,
                line: lineNumber,
                type,
                label,
                detail,
            });
        };

        const functionMatch = line.match(/^(def|function)\s+([a-zA-Z_$][\w$]*)|^const\s+([a-zA-Z_$][\w$]*)\s*=\s*\(/);
        if (functionMatch) {
            const name = functionMatch[2] || functionMatch[3] || 'anonymous';
            addNode('function', `Define function: ${name}`, compactLine);
            return;
        }

        if (/^(if|elif|else if|else|switch|case)\b/.test(line)) {
            addNode('decision', 'Branch condition', compactLine);
            return;
        }

        if (/^(for|while)\b/.test(line)) {
            addNode('decision', 'Loop iteration', compactLine);
            return;
        }

        if (/\b(print|console\.log|input|prompt|readline|process\.stdout|process\.stdin)\b/.test(line)) {
            addNode('io', 'Read/Write operation', compactLine);
            return;
        }

        if (/^return\b/.test(line)) {
            addNode('end', 'Return value', compactLine);
            return;
        }

        addNode('action', 'Execute statement', compactLine);
    });

    nodes.push({
        id: `end-${nodes.length}`,
        line: lines.length,
        type: 'end',
        label: 'Program exit',
        detail: 'Flow ends after the final statement.',
    });

    return nodes;
};

export const CodingGround: React.FC = () => {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState(SAMPLE_CODE_PYTHON);
  
  const [activeTab, setActiveTab] = useState<Tab>('terminal');
  const [output, setOutput] = useState<string>(''); // For execution output
  const [aiContent, setAiContent] = useState<string>(''); // For AI Analysis results
  const [isProcessing, setIsProcessing] = useState(false);
        const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
        const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
        const [flowGeneratedAt, setFlowGeneratedAt] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState('');
    const [editorPaneWidth, setEditorPaneWidth] = useState(70);
    const [activeLine, setActiveLine] = useState(1);
    const [isDesktop, setIsDesktop] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= 1024;
    });

    // ── Boss Fight state ──
    const [bossFightActive, setBossFightActive] = useState(false);
    const [bossFightResult, setBossFightResult] = useState<BossFightResult | null>(null);

    const workbenchRef = useRef<HTMLDivElement>(null);
    const terminalOutputRef = useRef<HTMLDivElement>(null);
    const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    const prismLanguageMap: Record<Language, string> = {
        python: 'python',
        javascript: 'javascript',
        typescript: 'typescript',
    };

    const highlightCode = (inputCode: string) => {
        const prismLanguage = prismLanguageMap[language];
        const grammar = Prism.languages[prismLanguage] || Prism.languages.javascript;
        return inputCode
            .split('\n')
            .map((line, index) => {
                const lineNumber = index + 1;
                const content = line.length > 0 ? line : ' ';
                const highlighted = Prism.highlight(content, grammar, prismLanguage);
                const isActive = lineNumber === activeLine;
                return `<div class="editor-line${isActive ? ' editor-line-active' : ''}" data-line="${lineNumber}" style="height: 24px; line-height: 24px; display: block;">${highlighted}</div>`;
            })
            .join('');
    };

    const normalizeLineEndings = (value: string): string => value.replace(/\r\n?/g, '\n');

    const handleCodeChange = (nextValue: string) => {
        // Preserve unlimited input while keeping line breaks consistent across platforms.
        setCode(normalizeLineEndings(nextValue));
    };

  // Update code when language changes
  useEffect(() => {
    switch (language) {
      case 'python': setCode(SAMPLE_CODE_PYTHON); break;
      case 'javascript': setCode(SAMPLE_CODE_JS); break;
      case 'typescript': setCode(SAMPLE_CODE_TS); break;
    }
    setOutput('');
    setAiContent('');
    setActiveTab('terminal');
  }, [language]);

  const executeAIAction = async (action: Tab) => {
        if (action === 'flow') {
                return;
        }

    setIsProcessing(true);
    setActiveTab(action);
    setStatusMessage('Processing...');
    
    try {
        let result = '';
        switch (action) {
            case 'terminal':
                setStatusMessage('Running code...');
                result = await runCode(code, language);
                setOutput(result);
                // Feed run result into Boss Fight HUD
                if (bossFightActive) {
                  const hasError = /error|exception|traceback|syntaxerror/i.test(result);
                  const passed   = !hasError && result.trim().length > 0;
                  setBossFightResult({ passed, hasError });
                }
                break;
            case 'debug':
                setStatusMessage('Analyzing code for bugs...');
                result = await debugCode(code, language);
                setAiContent(result);
                break;
            case 'optimize':
                setStatusMessage('Generating optimizations...');
                result = await optimizeCode(code, language);
                setAiContent(result);
                break;
            case 'explain':
                setStatusMessage('Generating explanation...');
                result = await explainCode(code, language);
                setAiContent(result);
                break;
        }
        } catch (e) {
                const message = e instanceof Error ? e.message : 'Error processing request.';
                if (action === 'terminal') {
                    setOutput(message);
                } else {
                    setAiContent(message);
                }
    } finally {
        setIsProcessing(false);
        setStatusMessage('');
    }
  };

    const handleGenerateFlow = () => {
        setStatusMessage('Generating flow map...');
        const generatedNodes = parseCodeToFlowNodes(code, language);
        setFlowNodes(generatedNodes);
        setFlowGeneratedAt(new Date().toLocaleTimeString());
        setIsFlowModalOpen(true);
        window.setTimeout(() => setStatusMessage(''), 900);
    };

  // Line Numbers Logic
  const lineNumbers = code.split('\n').map((_, i) => i + 1);

    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const textarea = document.getElementById('coding-ground-editor') as HTMLTextAreaElement | null;
        if (!textarea) return;

        editorTextareaRef.current = textarea;
        textarea.removeAttribute('maxlength');
        textarea.wrap = 'off';
        textarea.style.overflow = 'auto';
        textarea.style.whiteSpace = 'pre';
        textarea.style.lineHeight = '24px';
        textarea.style.fontSize = '13px';
        textarea.style.padding = '16px';
        textarea.style.margin = '0';
        textarea.style.fontFamily = 'JetBrains Mono, monospace';

        const updateActiveLine = () => {
            const cursorPos = textarea.selectionStart || 0;
            const currentLine = textarea.value.slice(0, cursorPos).split('\n').length;
            setActiveLine(currentLine);
        };

        updateActiveLine();
        textarea.addEventListener('keyup', updateActiveLine);
        textarea.addEventListener('click', updateActiveLine);
        textarea.addEventListener('input', updateActiveLine);
        textarea.addEventListener('select', updateActiveLine);

        return () => {
            textarea.removeEventListener('keyup', updateActiveLine);
            textarea.removeEventListener('click', updateActiveLine);
            textarea.removeEventListener('input', updateActiveLine);
            textarea.removeEventListener('select', updateActiveLine);
            if (editorTextareaRef.current === textarea) {
                editorTextareaRef.current = null;
            }
        };
    }, [code, language]);

    useEffect(() => {
        const textarea = editorTextareaRef.current;
        if (!textarea) return;

        const handlePaste = (event: ClipboardEvent) => {
            const pastedRaw = event.clipboardData?.getData('text');
            if (typeof pastedRaw !== 'string') return;

            event.preventDefault();

            const pastedText = normalizeLineEndings(pastedRaw);
            const start = textarea.selectionStart ?? 0;
            const end = textarea.selectionEnd ?? start;
            const current = code;
            const updated = `${current.slice(0, start)}${pastedText}${current.slice(end)}`;

            setCode(updated);

            const nextCursor = start + pastedText.length;
            window.requestAnimationFrame(() => {
                const liveTextarea = editorTextareaRef.current;
                if (!liveTextarea) return;
                liveTextarea.focus();
                liveTextarea.setSelectionRange(nextCursor, nextCursor);
            });
        };

        textarea.addEventListener('paste', handlePaste);
        return () => textarea.removeEventListener('paste', handlePaste);
    }, [code]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const node = workbenchRef.current;
            if (!node) return;
            const bounds = node.getBoundingClientRect();
            const relative = ((event.clientX - bounds.left) / bounds.width) * 100;
            const clamped = Math.min(82, Math.max(52, relative));
            setEditorPaneWidth(clamped);
        };

        const stopDragging = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopDragging);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        const startDragging = () => {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', stopDragging);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };

        const splitters = document.querySelectorAll('[data-splitter="editor"]');
        splitters.forEach((splitter) => splitter.addEventListener('mousedown', startDragging));

        return () => {
            splitters.forEach((splitter) => splitter.removeEventListener('mousedown', startDragging));
            stopDragging();
        };
    }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Boss Fight HUD — rendered above the toolbar */}
      <BossFightHUD
        lastRunResult={bossFightResult}
        isActive={bossFightActive}
        onBossFightStart={() => setBossFightActive(true)}
        onBossFightEnd={() => { setBossFightActive(false); setBossFightResult(null); }}
      />

      {/* Header / Toolbar */}
    <div className="flex justify-between items-center bg-surface border border-white/5 p-3 rounded-sm transition-all hover:border-primary/35 hover:shadow-[0_0_10px_rgba(194,150,62,0.12)]">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-bold px-2">
                <FileCode size={20} />
                <span>Coding Ground</span>
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer"
            >
                <option value="python">Python 3.11</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="typescript">TypeScript</option>
            </select>
        </div>
        <div className="flex gap-2">
             <Button 
                variant="primary" 
                size="md" 
                onClick={() => executeAIAction('terminal')} 
                isLoading={isProcessing && activeTab === 'terminal'}
                className="flex items-center gap-2"
            >
                <Play size={16} />
                Run Code
            </Button>
        </div>
      </div>

    <div ref={workbenchRef} className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
        
        {/* Code Editor */}
        <div
            className="flex flex-col h-full bg-[#0B0B0F] border border-white/10 rounded-sm overflow-hidden shadow-2xl relative transition-colors hover:border-primary/35"
            style={isDesktop ? { width: `min(100%, ${editorPaneWidth}%)` } : undefined}
        >
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex flex-1 overflow-hidden bg-[#0B0B0F]">
                    {/* Line Numbers - Inside Editor */}
                    <div
                        className="bg-[#0B0B0F] text-subtext/50 text-right pr-4 text-[13px] font-mono select-none flex-shrink-0"
                        style={{
                            padding: '16px 8px',
                            lineHeight: '24px',
                            width: 'fit-content',
                            minWidth: '3rem',
                        }}
                    >
                        {lineNumbers.map(num => (
                            <div
                                key={num}
                                className={`${num === activeLine ? 'text-primary' : ''}`}
                                style={{
                                    height: '24px',
                                    lineHeight: '24px',
                                    display: 'block',
                                }}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                    
                    {/* Textarea */}
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            value={code}
                            onValueChange={handleCodeChange}
                            highlight={highlightCode}
                            padding={16}
                            textareaId="coding-ground-editor"
                            textareaClassName="editor-textarea"
                            preClassName="editor-pre"
                            className="editor-root"
                            spellCheck={false}
                            tabSize={2}
                            insertSpaces={true}
                            style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 13,
                                lineHeight: '24px',
                                height: '100%',
                                background: 'transparent',
                                margin: 0,
                                WebkitFontSmoothing: 'antialiased',
                            }}
                        />
                    </div>
                </div>
            </div>
            
            {/* Status Bar */}
            <div className="bg-[#141419] border-t border-white/5 px-4 py-1 flex justify-between items-center text-xs text-subtext">
                <span>{language.toUpperCase()} • {lineNumbers.length} lines • Scroll to navigate</span>
                <span>UTF-8 • LF</span>
            </div>
        </div>

        <div
            data-splitter="editor"
            className="hidden lg:flex w-2 cursor-col-resize bg-white/10 hover:bg-primary/40 transition-colors items-center justify-center"
            title="Drag to resize panels"
        >
            <div className="h-14 w-[2px] bg-white/45"></div>
        </div>

        {/* Right Panel: Tools & Output */}
        <div
            className="flex-1 lg:flex-none flex flex-col h-full gap-4 overflow-hidden transition-colors hover:border-primary/30"
            style={isDesktop ? { width: `max(320px, calc(${100 - editorPaneWidth}% - 12px))` } : undefined}
        >
            
            {/* Tab Navigation */}
            <div className="flex bg-white/5 p-1 rounded-sm border border-white/10 overflow-x-auto custom-scrollbar">
                {[
                    { id: 'terminal', icon: TerminalIcon, label: 'Output' },
                    { id: 'debug', icon: Bug, label: 'Debug' },
                    { id: 'explain', icon: BookOpen, label: 'Explain' },
                    { id: 'optimize', icon: Zap, label: 'Optimize' },
                    { id: 'flow', icon: GitGraph, label: 'Flow' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex-1 flex flex-col xl:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-sm text-xs font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-primary text-black shadow-lg' 
                            : 'text-subtext hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon size={14} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden bg-surface/50">
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <span className="font-bold text-sm text-white capitalize flex items-center gap-2">
                        {activeTab === 'terminal' && <TerminalIcon size={14} className="text-primary"/>}
                        {activeTab === 'debug' && <Bug size={14} className="text-red-400"/>}
                        {activeTab === 'explain' && <BookOpen size={14} className="text-blue-400"/>}
                        {activeTab === 'optimize' && <Zap size={14} className="text-yellow-400"/>}
                        {activeTab === 'flow' && <GitGraph size={14} className="text-purple-400"/>}
                        {activeTab === 'terminal' ? 'Console Output' : `${activeTab} Analysis`}
                    </span>
                    {statusMessage && (
                        <span className="text-xs text-primary animate-pulse">{statusMessage}</span>
                    )}
                </div>

                {/* Panel Body */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0D0D11] font-mono text-sm">
                    {activeTab === 'terminal' ? (
                        output ? (
                            <div
                                ref={terminalOutputRef}
                                onWheel={(e) => {
                                    const target = terminalOutputRef.current;
                                    if (!target) return;
                                    e.preventDefault();
                                    target.scrollTop += e.deltaY;
                                }}
                                className="rounded-sm p-3 whitespace-pre-wrap min-h-[220px] max-h-[70vh] overflow-auto custom-scrollbar bg-transparent border border-white/10"
                            >
                                <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-gray-200">{output}</pre>
                            </div>
                        ) : (
                            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-subtext/40 border border-white/10 rounded-sm bg-white/5">
                                <TerminalIcon size={32} className="mb-2 opacity-50" />
                                <p>Ready to execute.</p>
                            </div>
                        )
                    ) : activeTab === 'flow' ? (
                        <div className="h-full min-h-[260px] flex flex-col gap-4">
                            <div className="rounded-sm border border-primary/30 bg-gradient-to-br from-primary/15 via-white/5 to-white/0 p-4">
                                <p className="text-white font-semibold mb-1">Code Flow Visualizer</p>
                                <p className="text-subtext text-xs leading-relaxed">
                                    Analyze the current editor code and open a full-screen flow map with linked nodes and summary cards.
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleGenerateFlow}
                                        className="inline-flex items-center gap-2"
                                    >
                                        <GitGraph size={14} />
                                        Flow My Code
                                    </Button>
                                    {flowNodes.length > 0 && (
                                        <span className="text-xs text-subtext">{flowNodes.length} steps detected</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-sm border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs uppercase tracking-wide text-subtext mb-1">What You Get</p>
                                    <p className="text-sm text-gray-200">A vertical flowchart with branch markers and line references.</p>
                                </div>
                                <div className="rounded-sm border border-white/10 bg-white/5 p-3">
                                    <p className="text-xs uppercase tracking-wide text-subtext mb-1">Use Case</p>
                                    <p className="text-sm text-gray-200">Trace logic quickly before debugging or optimization.</p>
                                </div>
                            </div>

                            <div className="rounded-sm border border-white/10 bg-black/20 p-3 mt-auto">
                                <p className="text-xs text-subtext mb-2">Recent Flow Snapshot</p>
                                {flowNodes.length > 0 ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-200">Generated at {flowGeneratedAt || 'just now'}</span>
                                        <button
                                            onClick={() => setIsFlowModalOpen(true)}
                                            className="text-xs text-primary hover:text-white transition-colors"
                                        >
                                            Open Full Flow
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-subtext">No flow generated yet.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        // AI Content
                        aiContent ? (
                            <div className="animate-fade-in text-gray-300 space-y-2 leading-relaxed whitespace-pre-wrap">
                                {aiContent}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-subtext/40 text-center px-6">
                                {activeTab === 'debug' && <Bug size={32} className="mb-2 opacity-50" />}
                                {activeTab === 'optimize' && <Zap size={32} className="mb-2 opacity-50" />}
                                {activeTab === 'explain' && <BookOpen size={32} className="mb-2 opacity-50" />}
                                <p>Select this tab to {activeTab} your code.</p>
                            </div>
                        )
                    )}
                </div>
            </GlassCard>
        </div>
      </div>

      {isFlowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-4 md:p-6 lg:p-8">
            <div className="h-full w-full max-w-7xl mx-auto border border-white/15 bg-[#08090d] rounded-sm overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/5 via-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-primary/20 text-primary flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <p className="text-white font-semibold">Code Flow Map</p>
                            <p className="text-xs text-subtext">{language.toUpperCase()} • {flowNodes.length} steps • Generated {flowGeneratedAt || 'now'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsFlowModalOpen(false)}
                        className="w-8 h-8 border border-white/15 rounded-sm bg-white/5 text-subtext hover:text-white hover:border-primary/40 transition-colors flex items-center justify-center"
                        aria-label="Close flow modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[minmax(280px,360px)_1fr]">
                    <div className="border-r border-white/10 bg-white/[0.02] overflow-y-auto custom-scrollbar p-4 space-y-3">
                        <p className="text-xs uppercase tracking-wide text-subtext">Flow Cards</p>
                        {flowNodes.map((node, idx) => {
                            const nodeColor = getFlowNodeColors(node.type);
                            return (
                                <div key={node.id} className={`rounded-sm border ${nodeColor.border} ${nodeColor.glow} bg-gradient-to-br ${nodeColor.bg} p-3`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-1 rounded-sm text-[10px] uppercase tracking-wide ${nodeColor.badge}`}>
                                            {getFlowNodeTypeLabel(node.type)}
                                        </span>
                                        <span className="text-[11px] text-subtext">Step {idx + 1}</span>
                                    </div>
                                    <p className="text-sm text-white font-semibold leading-snug">{node.label}</p>
                                    <p className="text-xs text-subtext mt-1 leading-relaxed">{node.detail}</p>
                                    <p className="text-[11px] text-subtext mt-2">Code line: {node.line}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-5 lg:p-6">
                        <div className="mx-auto max-w-2xl space-y-0">
                            {flowNodes.map((node, idx) => {
                                const nodeColor = getFlowNodeColors(node.type);
                                const isLast = idx === flowNodes.length - 1;
                                return (
                                    <div key={`${node.id}-chart`} className="flex flex-col items-center">
                                        <div className={`w-full rounded-sm border ${nodeColor.border} ${nodeColor.glow} bg-gradient-to-br ${nodeColor.bg} px-4 py-3`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-white text-sm font-semibold">{node.label}</p>
                                                    <p className="text-xs text-subtext mt-1">{node.detail}</p>
                                                </div>
                                                <span className={`text-[10px] uppercase px-2 py-1 rounded-sm ${nodeColor.badge}`}>
                                                    {getFlowNodeTypeLabel(node.type)}
                                                </span>
                                            </div>
                                        </div>
                                        {!isLast && (
                                            <div className="h-12 w-px bg-gradient-to-b from-primary/70 via-primary/40 to-primary/0 relative">
                                                <span className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 text-primary text-xs">▼</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};