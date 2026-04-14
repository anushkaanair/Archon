import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Logo ─────────────────────────────────────────────────────────────────── */
const ArchonMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 24,10 14,18 4,10" fill="#5B00E8" />
    <polygon points="14,2 4,10 14,10"  fill="#1A0050" />
    <polygon points="14,2 24,10 14,10" fill="#8B3DFF" />
    <polygon points="4,10 14,18 14,10" fill="#2D0070" />
    <polygon points="24,10 14,18 14,10" fill="#C4A0FF" />
    <circle cx="14" cy="10" r="2.5" fill="#EDE5FF" opacity="0.7" />
  </svg>
);

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

const MODEL_SCORES = [
  { name: 'Claude Sonnet 4',  score: 96, bar: '96%' },
  { name: 'GPT-4o',           score: 93, bar: '93%' },
  { name: 'Gemini 2.0 Flash', score: 88, bar: '88%' },
  { name: 'Mistral Large 2',  score: 81, bar: '81%' },
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
                  color: stageIdx === i && !showScores ? '#D97706' : '#00A854',
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
            style={{ background: 'rgba(0,168,84,0.08)', border: '1px solid rgba(0,168,84,0.2)' }}
          >
            <span className="text-[#00A854] text-[11px] font-semibold">✓ blueprint complete</span>
            <span className="text-white/30 text-[10px] ml-auto">est. $0.60/mo · p95 4.1 s · score 0.94</span>
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div
        className="flex items-center justify-between px-5 py-2.5 text-[10px] border-t border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.015)' }}
      >
        <span className="text-white/25">claude-sonnet-4  ·  200K ctx</span>
        <span style={{ color: '#5B00E8' }}>archon v0.1</span>
        <span className="text-white/25">confidence: 0.94</span>
      </div>
    </div>
  );
}

/* ─── Marquee chips ─────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { label: 'Claude Sonnet 4', value: '96% match', color: '#5B00E8' },
  { label: 'P95 Latency',     value: '4.1 s',     color: '#D97706' },
  { label: 'Monthly Cost',    value: '$0.60',      color: '#00A854' },
  { label: 'RAGAs Score',     value: '0.94',       color: '#5B00E8' },
  { label: 'GPT-4o',          value: '93% match',  color: '#5B00E8' },
  { label: 'Context Window',  value: '200 K',      color: '#D97706' },
  { label: 'DeepSeek R1',     value: '87% match',  color: '#5B00E8' },
  { label: 'Blueprint',       value: '4.1 s',      color: '#D97706' },
  { label: 'Gemini 2 Flash',  value: '88% match',  color: '#5B00E8' },
  { label: 'Mistral Large',   value: '81% match',  color: '#5B00E8' },
  { label: 'Models Scored',   value: '24+',        color: '#5B00E8' },
  { label: 'Faithfulness',    value: '0.91',       color: '#00A854' },
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

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const duplicated = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
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

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'What you get', 'How it works', 'Docs'].map(l => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="text-[13px] font-medium transition-colors"
                style={{ color: 'rgba(10,0,37,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5B00E8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(10,0,37,0.5)')}
              >
                {l}
              </a>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#5B00E8,#8B3DFF)' }}
                >
                  {(user?.name || user?.email || 'A')[0].toUpperCase()}
                </div>
                <Link
                  to="/dashboard"
                  className="btn-violet h-9 px-4 text-[13px] rounded-lg"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-medium transition-colors"
                  style={{ color: 'rgba(10,0,37,0.6)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#5B00E8')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(10,0,37,0.6)')}
                >
                  Sign in
                </Link>
                <Link to="/login" className="btn-violet h-9 px-4 text-[13px] rounded-lg">
                  Get started
                </Link>
              </>
            )}
          </div>
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
              <Link to="/login" className="btn-violet h-11 px-6 text-[14px] rounded-lg flex items-center gap-2">
                Start building free <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-outline h-11 px-6 text-[14px] rounded-lg flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" style={{ fill: '#5B00E8' }} />
                Watch demo
              </a>
            </motion.div>

            {/* Stats pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-2 mt-8"
            >
              {[
                { v: '8', l: 'pipeline stages' },
                { v: '4.1s', l: 'avg generation' },
                { v: '30+', l: 'models scored' },
                { v: '$0.60', l: 'est/mo' },
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
                    style={{ background: 'rgba(0,168,84,0.06)', border: '1px solid rgba(0,168,84,0.2)', color: '#00A854' }}
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
                        <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 20, fontWeight: 600, color: s.amber ? '#D97706' : '#00A854' }}>{s.value}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(10,0,37,0.35)' }}>{s.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-5 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium"
                  style={{ background: 'rgba(0,168,84,0.06)', border: '1px solid rgba(0,168,84,0.15)', color: '#00A854' }}
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
      <section id="how-it-works" className="py-28" style={{ background: 'var(--bg2)' }}>
        <div className="absolute left-0 right-0 bg-grid-light opacity-40 pointer-events-none" style={{ height: '100%', position: 'absolute' }} />
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
                            color: status === 'done' ? '#00A854' : status === 'active' ? '#D97706' : 'rgba(255,255,255,0.2)',
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
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-14 px-10 rounded-xl font-bold text-[16px] transition-all"
              style={{ background: '#fff', color: '#5B00E8', boxShadow: '0 4px 32px rgba(255,255,255,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 48px rgba(255,255,255,0.25)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 32px rgba(255,255,255,0.15)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}
            >
              Start building for free →
            </Link>
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
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'API Docs'].map(l => (
              <a key={l} href="#" className="text-[12px] transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
