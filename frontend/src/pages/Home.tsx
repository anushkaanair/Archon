import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, CheckCircle, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ArchonMark from '../components/ui/ArchonMark';

/* ─── Typewriter terminal ───────────────────────────────────────────────────── */
const PROMPTS = [
  'Build a legal Q&A bot with citation tracking and hallucination detection.',
  'Customer support agent that routes tickets by urgency and product area.',
  'Real-time code review system with security vulnerability scanning.',
  'Multi-language document summarization pipeline for a law firm.',
  'Personalized learning assistant with adaptive quiz generation.',
  'E-commerce recommendation engine with hybrid RAG + reranking.',
];

const PIPELINE_STAGES = [
  { id: 'semantic_analysis', label: 'semantic_analysis', ms: '142 ms' },
  { id: 'rag_retrieval',     label: 'rag_retrieval',     ms: '891 ms' },
  { id: 'model_scoring',     label: 'model_scoring',     ms: '234 ms' },
  { id: 'architecture_gen',  label: 'architecture_gen',  ms: '612 ms' },
  { id: 'cost_estimation',   label: 'cost_estimation',   ms: '88 ms'  },
  { id: 'ragas_evaluation',  label: 'ragas_evaluation',  ms: '408 ms' },
];

// Illustrative ranking — your dashboard pulls live scores at generation time.
const MODEL_SCORES = [
  { name: 'Claude Opus 4.5',     score: 92, bar: '92%' },
  { name: 'GPT-4o',              score: 89, bar: '89%' },
  { name: 'Gemini 2.5 Pro',      score: 87, bar: '87%' },
  { name: 'DeepSeek V3',         score: 81, bar: '81%' },
];

function Terminal() {
  const [promptIdx, setPromptIdx]     = useState(0);
  const [displayed, setDisplayed]     = useState('');
  const [phase, setPhase]             = useState<'type'|'pause'|'delete'>('type');
  const [stageIdx, setStageIdx]       = useState(-1);
  const [showScores, setShowScores]   = useState(false);
  const [showResult, setShowResult]   = useState(false);

  const prompt = PROMPTS[promptIdx];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (phase === 'type') {
      if (displayed.length < prompt.length) {
        timeout = setTimeout(() => setDisplayed(prompt.slice(0, displayed.length + 1)), 28);
      } else {
        timeout = setTimeout(() => setPhase('pause'), 900);
      }
    } else if (phase === 'pause') {
      setStageIdx(-1); setShowScores(false); setShowResult(false);
      // Animate pipeline stages
      let i = 0;
      const runStage = () => {
        if (i < PIPELINE_STAGES.length) {
          setStageIdx(i);
          i++;
          timeout = setTimeout(runStage, 480);
        } else {
          setShowScores(true);
          timeout = setTimeout(() => { setShowResult(true); }, 600);
          timeout = setTimeout(() => setPhase('delete'), 4000);
        }
      };
      timeout = setTimeout(runStage, 400);
    } else if (phase === 'delete') {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 12);
      } else {
        setPromptIdx(i => (i + 1) % PROMPTS.length);
        setStageIdx(-1); setShowScores(false); setShowResult(false);
        setPhase('type');
      }
    }
    return () => clearTimeout(timeout);
  }, [phase, displayed, prompt]);

  return (
    <div
      className="rounded-2xl overflow-hidden font-mono text-[12px] leading-relaxed flex-1"
      style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}
    >
      {/* Traffic lights */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-white/30 text-[11px]">archon — pipeline runner</span>
      </div>

      <div className="p-5 space-y-3 min-h-[320px]">
        {/* Prompt */}
        <div>
          <span className="text-[#5B00E8]">❯ </span>
          <span className="text-white/80">{displayed}</span>
          {phase === 'type' && <span className="inline-block w-1.5 h-4 bg-violet/80 ml-0.5 animate-blink" style={{ background: '#5B00E8', verticalAlign: 'middle' }} />}
        </div>

        {/* Stages */}
        {PIPELINE_STAGES.map((stage, i) => (
          stageIdx >= i && (
            <div key={stage.id} className="flex items-center gap-3">
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: stageIdx === i && !showScores ? 'rgba(217,119,6,0.15)' : 'rgba(0,168,84,0.12)',
                  color: stageIdx === i && !showScores ? '#D97706' : '#059669',
                }}
              >
                {stageIdx === i && !showScores ? 'RUN' : ' OK'}
              </span>
              <span className="text-white/50">{stage.label}</span>
              <span className="ml-auto text-white/25 text-[10px]">{stage.ms}</span>
            </div>
          )
        ))}

        {/* Scores table */}
        {showScores && (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/30" style={{ background: 'rgba(255,255,255,0.03)' }}>
              model scores
            </div>
            {MODEL_SCORES.map(m => (
              <div key={m.name} className="flex items-center gap-3 px-3 py-1.5 border-t border-white/[0.04]">
                <span className="text-white/60 w-32 truncate">{m.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: m.bar, background: 'linear-gradient(90deg, #5B00E8, #8B3DFF)', transition: 'width 0.6s ease' }}
                  />
                </div>
                <span className="text-[#5B00E8] font-semibold text-[11px] w-8 text-right">{m.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Blueprint result */}
        {showResult && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)' }}
          >
            <span className="text-[11px] font-semibold" style={{ color: 'var(--green)' }}>✓ blueprint complete</span>
            <span className="text-white/30 text-[10px] ml-auto">architecture · cost · latency ready</span>
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div
        className="flex items-center justify-between px-5 py-2.5 text-[10px] border-t border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.015)' }}
      >
        <span className="text-white/25">archon pipeline runner</span>
        <span style={{ color: '#5B00E8' }}>archon v0.1</span>
        <span className="text-white/25">live · 6 stages</span>
      </div>
    </div>
  );
}

/* ─── Marquee chips ─────────────────────────────────────────────────────────── */
// Real model identifiers Archon ranks at generation time. No fabricated benchmarks.
const MARQUEE_ITEMS = [
  { label: 'Claude Opus 4.5',  value: 'Top quality',  color: '#5B00E8' },
  { label: 'GPT-4o',           value: 'Vision + fn',  color: '#059669' },
  { label: 'Gemini 2.5 Pro',   value: '2M context',   color: '#2563EB' },
  { label: 'Claude Sonnet 4.5',value: 'Best value',   color: '#5B00E8' },
  { label: 'Llama 3.3 70B',    value: 'Open weights', color: '#059669' },
  { label: 'DeepSeek V3',      value: 'Low cost',     color: '#7C3AED' },
  { label: 'Gemini 2.0 Flash', value: 'Fast & cheap', color: '#D97706' },
  { label: 'Mistral Large 2',  value: 'EU residency', color: '#2563EB' },
  { label: 'GPT-4.1',          value: 'Long context', color: '#059669' },
  { label: 'RAGAs Eval',       value: '6 metrics',    color: '#5B00E8' },
  { label: 'Hybrid RAG',       value: 'BM25 + Dense', color: '#D97706' },
  { label: 'Architecture',     value: 'Mermaid.js',   color: '#5B00E8' },
];

/* ─── How It Works steps ────────────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    n: '01',
    title: 'Describe your product',
    desc: 'Type a natural-language description of your AI product. Archon extracts intent, tasks, and domain context.',
    activeStages: [0],
    output: 'Detected: RAG pipeline · Legal domain · Q&A task type · Citation requirement → routing to hybrid retrieval strategy.',
  },
  {
    n: '02',
    title: 'Retrieve context & score models',
    desc: 'Archon searches its knowledge base for relevant AI patterns, then scores every model on cost, latency, and domain fit.',
    activeStages: [1, 2],
    output: 'Retrieved 12 relevant architecture patterns. Scored 24 models. Claude Sonnet 4: 96 · GPT-4o: 93 · Gemini 2.0 Flash: 88.',
  },
  {
    n: '03',
    title: 'Generate architecture & evaluate quality',
    desc: 'A complete pipeline architecture is generated and evaluated with RAGAs — measuring faithfulness, relevancy, and context precision.',
    activeStages: [3, 4, 5],
    output: 'Architecture: Query → BM25+Dense → CrossEncoder → Claude Sonnet 4 → Citation check → Output. RAGAs: 0.94.',
  },
  {
    n: '04',
    title: 'Blueprint ready',
    desc: 'Download your complete blueprint as JSON — model recommendations, cost projections, latency estimates, and architecture diagram.',
    activeStages: [0,1,2,3,4,5],
    output: 'Blueprint complete. Est. $0.60/mo at 10K queries. P95 latency 4.1 s. Export as JSON or Mermaid diagram.',
  },
];

const STAGE_LABELS = [
  'semantic_analysis',
  'rag_retrieval',
  'model_scoring',
  'architecture_gen',
  'cost_estimation',
  'ragas_evaluation',
];

/* ─── Section fade-in wrapper ───────────────────────────────────────────────── */
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Demo modal — "coming soon" placeholder ────────────────────────────────── */
// Replace this component with a real YouTube embed once the demo video is recorded.
// Set DEMO_VIDEO_ID to the YouTube video ID and swap DemoModal back to an iframe.

function DemoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.22 }}
          className="relative z-10 w-full max-w-lg"
        >
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] font-medium transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" /> Close
          </button>
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: '#0F0F1A', border: '1px solid rgba(91,0,232,0.3)' }}
          >
            {/* Camera icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(91,0,232,0.15)', border: '1.5px solid rgba(91,0,232,0.3)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B3DFF" strokeWidth="1.8">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h3
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 12 }}
            >
              Demo coming soon
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              We're recording a full walkthrough of the Builder, Playground,
              and report generator. In the meantime, sign up and try it live —
              it only takes 30 seconds.
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 h-11 px-8 rounded-xl font-bold text-[14px] transition-all"
              style={{ background: '#5B00E8', color: '#fff', boxShadow: '0 4px 20px rgba(91,0,232,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4800BA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#5B00E8'; }}
            >
              Try it now →
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const duplicated = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <>
    {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    <div className="page-light min-h-screen overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: navScrolled ? 'rgba(244,242,255,0.85)' : 'rgba(244,242,255,0.6)',
          backdropFilter: 'blur(16px)',
          borderBottom: navScrolled ? '1px solid rgba(91,0,232,0.08)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[64px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <ArchonMark size={22} />
            <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 17, color: '#0A0025' }}>
              Archon
            </span>
          </div>

          {/* Links — only anchor to real sections on this page */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features',     href: '#features' },
              { label: 'What you get', href: '#what-you-get' },
              { label: 'How it works', href: '#how-it-works' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[13px] font-medium transition-colors hover:text-[#5B00E8] focus-visible:text-[#5B00E8]"
                style={{ color: 'rgba(10,0,37,0.5)' }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Auth — single user-icon button. Click takes you to dashboard if signed in, OAuth login if not. */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            aria-label={isAuthenticated ? 'Open dashboard' : 'Sign in'}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isAuthenticated
                ? 'linear-gradient(135deg,#5B00E8,#8B3DFF)'
                : 'rgba(91,0,232,0.08)',
              border: isAuthenticated ? 'none' : '1.5px solid rgba(91,0,232,0.2)',
              boxShadow: isAuthenticated ? '0 2px 12px rgba(91,0,232,0.3)' : 'none',
              color: isAuthenticated ? 'white' : '#5B00E8',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            <UserIcon className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-[64px]">
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-light pointer-events-none" />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(91,0,232,0.06), transparent)' }}
        />

        <div className="max-w-7xl mx-auto px-6 w-full py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'var(--violet-lt)', border: '1px solid rgba(91,0,232,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#5B00E8' }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#5B00E8' }}>
                AI Infrastructure Design
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(44px,5vw,66px)', lineHeight: 1.06, letterSpacing: '-0.03em', color: '#0A0025' }}
            >
              Design AI /{' '}
              <span style={{ color: 'rgba(10,0,37,0.35)' }}>systems</span>{' '}
              /<br />
              <span style={{ color: '#5B00E8' }}>that ship.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-[15px] leading-relaxed max-w-[480px]"
              style={{ color: 'rgba(10,0,37,0.55)' }}
            >
              Describe your product and get a complete AI architecture blueprint — model scores, cost projections, latency estimates, and a Mermaid diagram. In under 5 seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-3 mt-8"
            >
              <Link
                to={isAuthenticated ? '/builder' : '/login'}
                className="btn-violet h-11 px-6 text-[14px] rounded-lg flex items-center gap-2"
              >
                {isAuthenticated ? 'Open Builder' : 'Start building free'} <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-outline h-11 px-6 text-[14px] rounded-lg flex items-center gap-2"
                aria-label="See how it works"
              >
                See how it works <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Social proof — capability chips only, no fake counts */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-8"
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { v: '47+',        l: 'models ranked' },
                  { v: '6-stage',   l: 'pipeline analysis' },
                  { v: 'RAGAs',     l: 'quality evaluation' },
                  { v: 'Mermaid',   l: 'architecture diagram' },
                ].map(p => (
                  <div
                    key={p.l}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]"
                    style={{ background: '#fff', border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 1px 4px rgba(91,0,232,0.06)' }}
                  >
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#5B00E8' }}>{p.v}</span>
                    <span style={{ color: 'rgba(10,0,37,0.45)' }}>{p.l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — terminal */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex"
          >
            <Terminal />
          </motion.div>
        </div>
      </section>

      {/* ─── Marquee ─────────────────────────────────────────────────────────── */}
      <div
        style={{ background: '#EAE6FF', borderTop: '1px solid rgba(91,0,232,0.1)', borderBottom: '1px solid rgba(91,0,232,0.1)' }}
        className="py-4 overflow-hidden"
      >
        <div className="flex animate-marquee" style={{ width: 'max-content' }}>
          {duplicated.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 mx-3 px-4 py-2 rounded-full text-[12px] font-medium whitespace-nowrap"
              style={{ background: '#fff', border: '1px solid rgba(91,0,232,0.12)', boxShadow: '0 1px 4px rgba(91,0,232,0.06)' }}
            >
              <span style={{ color: 'rgba(10,0,37,0.5)' }}>{item.label}</span>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 600,
                  color: item.color,
                  background: `${item.color}10`,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── What You Get ────────────────────────────────────────────────────── */}
      <section id="what-you-get" className="relative py-28">
        <div className="absolute inset-0 bg-grid-light opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <FadeIn className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[11px] font-semibold uppercase tracking-widest"
              style={{ background: 'var(--violet-lt)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}
            >
              What you get
            </div>
            <h2
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(32px,3.5vw,46px)', color: '#0A0025', letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              Everything you need to ship AI,<br />
              <span style={{ color: '#5B00E8' }}>nothing you don't.</span>
            </h2>
          </FadeIn>

          {/* Asymmetric card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Full-width card — Model Scoring */}
            <FadeIn className="lg:col-span-3" delay={0}>
              <div
                className="rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8"
                style={{ background: '#fff', border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}
              >
                <div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: 'var(--violet-lt)', color: '#5B00E8' }}
                  >
                    Model Scoring
                  </div>
                  <h3
                    style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 22, color: '#0A0025', marginBottom: 16 }}
                  >
                    Ranked model recommendations
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Claude Sonnet 4', score: 96, rec: true },
                      { name: 'GPT-4o', score: 93, rec: false },
                      { name: 'Gemini 2.0 Flash', score: 88, rec: false },
                      { name: 'Mistral Large 2', score: 81, rec: false },
                    ].map(m => (
                      <div key={m.name} className="flex items-center gap-3">
                        <span className="text-[13px] w-40 shrink-0" style={{ color: 'rgba(10,0,37,0.7)', fontWeight: m.rec ? 600 : 400 }}>{m.name}</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(91,0,232,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${m.score}%`, background: m.rec ? 'linear-gradient(90deg,#5B00E8,#8B3DFF)' : 'rgba(91,0,232,0.35)' }}
                          />
                        </div>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: m.rec ? '#5B00E8' : 'rgba(10,0,37,0.4)', fontWeight: 600 }}>{m.score}</span>
                        {m.rec && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: '#5B00E8', color: '#fff' }}>REC</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3
                    style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 18, color: '#0A0025', marginBottom: 16 }}
                  >
                    4-metric breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Cost fit', value: '94', note: 'vs budget' },
                      { label: 'Latency',  value: '91', note: 'p95 4.1 s', amber: true },
                      { label: 'Quality',  value: '96', note: 'RAGAs 0.94' },
                      { label: 'Domain fit', value: '98', note: 'legal / RAG' },
                    ].map(metric => (
                      <div
                        key={metric.label}
                        className="rounded-xl p-4"
                        style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.1)' }}
                      >
                        <p className="text-[11px] font-medium mb-1" style={{ color: 'rgba(10,0,37,0.5)' }}>{metric.label}</p>
                        <p
                          style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 24, fontWeight: 600, color: metric.amber ? '#D97706' : '#5B00E8', lineHeight: 1 }}
                        >
                          {metric.value}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: 'rgba(10,0,37,0.35)' }}>{metric.note}</p>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: 'rgba(0,168,84,0.06)', border: '1px solid rgba(0,168,84,0.2)', color: '#059669' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Claude Sonnet 4 — highest score for your use case
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Bottom-left — Architecture Diagram */}
            <FadeIn className="lg:col-span-2" delay={0.1}>
              <div
                className="rounded-2xl p-8 h-full"
                style={{ background: '#fff', border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}
              >
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: 'var(--violet-lt)', color: '#5B00E8' }}
                >
                  Architecture Diagram
                </div>
                <h3
                  style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 20, color: '#0A0025', marginBottom: 20 }}
                >
                  Generated pipeline
                </h3>
                {/* Vertical pipeline nodes */}
                <div className="flex flex-col items-start gap-0 max-w-xs">
                  {[
                    { label: 'User Query', icon: '⟳' },
                    { label: 'Qdrant + BM25', icon: '⊕' },
                    { label: 'CrossEncoder Reranker', icon: '↕' },
                    { label: 'Claude Sonnet 4', icon: '◈', highlight: true },
                    { label: 'Output', icon: '✓' },
                  ].map((node, i, arr) => (
                    <div key={node.label} className="flex flex-col items-start">
                      <div
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                        style={{
                          background: node.highlight ? '#5B00E8' : 'rgba(91,0,232,0.06)',
                          color: node.highlight ? '#fff' : '#5B00E8',
                          border: `1.5px solid ${node.highlight ? '#5B00E8' : 'rgba(91,0,232,0.2)'}`,
                          minWidth: 220,
                        }}
                      >
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14 }}>{node.icon}</span>
                        {node.label}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="ml-6 w-0.5 h-5" style={{ background: 'rgba(91,0,232,0.2)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Bottom-right — Cost + Latency */}
            <FadeIn delay={0.15}>
              <div
                className="rounded-2xl p-8 h-full"
                style={{ background: '#fff', border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}
              >
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: 'var(--violet-lt)', color: '#5B00E8' }}
                >
                  Cost + Latency
                </div>
                <h3
                  style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 20, color: '#0A0025', marginBottom: 20 }}
                >
                  Real projections
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Dev cost', value: '$0.02', sub: '/day · 100 queries', green: true },
                    { label: 'Prod cost', value: '$18', sub: '/mo · 30K queries', green: true },
                    { label: 'P95 latency', value: '4.1 s', sub: 'end-to-end', amber: true },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: 'rgba(10,0,37,0.4)' }}>{s.label}</p>
                        <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 20, fontWeight: 600, color: s.amber ? '#D97706' : '#059669' }}>{s.value}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(10,0,37,0.35)' }}>{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-5 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium"
                  style={{ background: 'rgba(0,168,84,0.06)', border: '1px solid rgba(0,168,84,0.15)', color: '#059669' }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Cheapest with highest score
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 relative" style={{ background: 'var(--bg2)' }}>
        <div className="absolute inset-0 bg-grid-light opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <FadeIn className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[11px] font-semibold uppercase tracking-widest"
              style={{ background: 'var(--violet-lt)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}
            >
              How it works
            </div>
            <h2
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(32px,3.5vw,46px)', color: '#0A0025', letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              From idea to blueprint<br />
              <span style={{ color: '#5B00E8' }}>in 4 steps.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Step list */}
            <div className="space-y-3">
              {HOW_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="w-full text-left rounded-2xl p-6 transition-all"
                  style={{
                    background: activeStep === i ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: activeStep === i ? '2px solid #5B00E8' : '1.5px solid rgba(91,0,232,0.1)',
                    boxShadow: activeStep === i ? '0 4px 24px rgba(91,0,232,0.12)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 12, color: activeStep === i ? '#5B00E8' : 'rgba(10,0,37,0.3)', lineHeight: 1.8 }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <h4
                        style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 16, color: '#0A0025', marginBottom: 4 }}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[13px]" style={{ color: 'rgba(10,0,37,0.5)', lineHeight: 1.6 }}>
                        {step.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto shrink-0 mt-1" style={{ color: activeStep === i ? '#5B00E8' : 'rgba(10,0,37,0.2)' }} />
                  </div>
                </button>
              ))}
            </div>

            {/* Sticky pipeline panel */}
            <div className="lg:sticky lg:top-24">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
              >
                {/* Traffic lights */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  <span className="ml-3 text-white/30 text-[11px] font-mono">pipeline trace</span>
                </div>

                <div className="p-5 space-y-2.5 font-mono text-[12px]">
                  {STAGE_LABELS.map((stage, i) => {
                    const active = HOW_STEPS[activeStep].activeStages.includes(i);
                    const isLast = activeStep === HOW_STEPS.length - 1;
                    const status = isLast ? 'done' : (active ? 'active' : 'dim');
                    return (
                      <div key={stage} className="flex items-center gap-3 transition-all">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded w-[38px] text-center"
                          style={{
                            background: status === 'done' ? 'rgba(0,168,84,0.12)' : status === 'active' ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.04)',
                            color: status === 'done' ? '#059669' : status === 'active' ? '#D97706' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {status === 'done' ? ' OK' : status === 'active' ? 'RUN' : ' --'}
                        </span>
                        <span style={{ color: status === 'dim' ? 'rgba(255,255,255,0.2)' : status === 'active' ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}

                  {/* Output */}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {HOW_STEPS[activeStep].output}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features strip ─────────────────────────────────────────────────── */}
      <section id="features" className="py-20" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: '#5B00E8' }}>Everything in one tool</p>
            <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(28px,3vw,42px)', color: '#0A0025', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Build, evaluate, visualise.<br />
              <span style={{ color: '#5B00E8' }}>All in your browser.</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🧠', title: 'Blueprint Builder', desc: 'Describe your product in plain English. Get a ranked architecture with cost + latency estimates.' },
              { icon: '🔬', title: 'Pipeline Playground', desc: 'Drag-and-drop visual node editor. Wire LLMs, retrievers, and routers together and run them live.' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Track cost, P95 latency, and RAGAs quality scores across all your blueprints over time.' },
              { icon: '⚙️', title: 'Model Registry', desc: 'Compare 30+ models by cost, speed, and domain. Request unlisted models directly from the app.' },
            ].map(f => (
              <FadeIn key={f.title} delay={0.05}>
                <div className="rounded-2xl p-6 h-full transition-all cursor-default group"
                  style={{ border: '1.5px solid rgba(91,0,232,0.1)', background: 'rgba(91,0,232,0.02)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.25)'; (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.02)'; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-[15px] mb-2" style={{ color: '#0A0025', fontFamily: 'Bricolage Grotesque, sans-serif' }}>{f.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(10,0,37,0.5)' }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden" style={{ background: 'var(--violet-deep)' }}>
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-dark opacity-100 pointer-events-none" />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.35), transparent 70%)' }}
        />

        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <FadeIn>
            <h2
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(36px,4vw,56px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}
            >
              Ready to design your AI stack?
            </h2>
            <p className="text-[16px] mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
              No credit card required · Free tier available
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 h-14 px-10 rounded-xl font-bold text-[16px] transition-all"
                style={{ background: '#fff', color: '#5B00E8', boxShadow: '0 4px 32px rgba(255,255,255,0.15)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 48px rgba(255,255,255,0.25)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 32px rgba(255,255,255,0.15)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}
              >
                Start building for free →
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl font-semibold text-[15px] transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)'; }}>
                See how it works
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6" style={{ background: 'var(--violet-deep)' }}>
        <div
          className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2.5">
            <ArchonMark size={18} />
            <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>
              Archon
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Archon Intelligence Platforms
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
