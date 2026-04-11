import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Layers, Box, Cpu, Activity, Database, Zap, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ArchonMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <polygon points="14,2 24,10 14,18 4,10" fill="#534AB7" />
    <polygon points="14,2 4,10 14,10"  fill="#26215C" />
    <polygon points="14,2 24,10 14,10" fill="#7F77DD" />
    <polygon points="4,10 14,18 14,10" fill="#3C3489" />
    <polygon points="24,10 14,18 14,10" fill="#AFA9EC" />
    <circle cx="14" cy="10" r="2.5" fill="#EEEDFE" opacity="0.6" />
  </svg>
);

const ArchonLogoHero = () => (
  <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
    <div className="absolute inset-0 rounded-full opacity-20 spin-slow"
      style={{ border: '0.5px solid rgba(83,74,183,0.5)', borderRadius: '50%' }} />
    <div className="absolute inset-6 rounded-full opacity-15 spin-reverse"
      style={{ border: '0.5px solid rgba(175,169,236,0.4)', borderRadius: '50%' }} />
    <div className="absolute inset-12 rounded-full bg-archon-core/20 blur-xl animate-glowPulse" />
    <div className="relative z-10 animate-float drop-shadow-[0_0_32px_rgba(83,74,183,0.7)]">
      <svg width="72" height="72" viewBox="0 0 80 80">
        <polygon points="40,6 70,30 40,54 10,30" fill="#534AB7" />
        <polygon points="40,6 10,30 40,30" fill="#26215C" />
        <polygon points="40,6 70,30 40,30" fill="#7F77DD" />
        <polygon points="10,30 40,54 40,30" fill="#3C3489" />
        <polygon points="70,30 40,54 40,30" fill="#AFA9EC" />
        <circle cx="40" cy="30" r="5" fill="#EEEDFE" opacity="0.5" />
      </svg>
    </div>
  </div>
);

const ModelChip = ({ label, score, color }: { label: string; score: string; color: string }) => (
  <div className="flex items-center gap-3 px-4 py-2.5 rounded-full whitespace-nowrap"
    style={{ background: 'rgba(255,255,255,0.035)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
    <span className="text-[13px] font-medium text-white/75">{label}</span>
    <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md"
      style={{ color, background: `${color}18`, border: `0.5px solid ${color}30` }}>{score}</span>
  </div>
);

const InfiniteMarquee = ({ items, reverse = false }: { items: React.ReactNode[]; reverse?: boolean }) => {
  const all = [...items, ...items];
  return (
    <div className="marquee-container" style={{ maskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)' }}>
      <div className={`flex gap-4 pr-4 w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} will-change-transform`}>
        {all.map((item, i) => <div key={i}>{item}</div>)}
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, delay = 0 }: {
  title: string; desc: string; icon: any; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4 }}
    className="glass-card rounded-2xl p-6 group cursor-default"
  >
    <div className="mb-5 w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,rgba(83,74,183,0.2),rgba(83,74,183,0.08))', border: '0.5px solid rgba(83,74,183,0.25)' }}>
      <Icon className="w-5 h-5 text-archon-mist" strokeWidth={1.5} />
    </div>
    <h3 className="text-[15px] font-semibold text-white tracking-tight mb-2">{title}</h3>
    <p className="text-[13px] text-white/45 leading-relaxed">{desc}</p>
  </motion.div>
);

const FEATURES = [
  { icon: Activity, title: 'Semantic Task Analysis', desc: 'Auto-detect RAG pipelines, code generation, classification, and translation capabilities directly from natural language product descriptions.', delay: 0 },
  { icon: Cpu,      title: 'Model Strategy Engine',  desc: 'Score and rank LLMs on cost, latency, quality, and task-fit using a composite scoring engine. Never guess which model to route to.', delay: 0.07 },
  { icon: Layers,   title: 'Architecture Graphs',     desc: 'Instantly generate Mermaid.js architecture diagrams with modular nodes covering ingestion, retrieval, generation, and evaluation flows.', delay: 0.14 },
  { icon: Zap,      title: 'Cost & Latency Projections', desc: 'Extrapolated run rates and P95 latency benchmarks derived from real usage volumes — not estimates. Actionable budget controls included.', delay: 0.21 },
  { icon: Database, title: 'Hybrid RAG Vectorization', desc: 'Dense embedding + BM25 sparse lexical indexing unified under CrossEncoder reranking — production-grade retrieval from day one.', delay: 0.28 },
  { icon: Box,      title: 'RAGAs Eval Integration',  desc: 'Faithfulness, answer relevancy, context precision and recall evaluated automatically. Confidence flags trigger when scores fall below threshold.', delay: 0.35 },
];

const TRUST_ITEMS = [
  '8-stage automated pipeline',
  'P95 latency guarantees',
  'GDPR-friendly architecture',
  'Open-source model support',
  'No vendor lock-in',
  'JSON blueprint export',
];

function Home() {
  const row1 = [
    <ModelChip label="GPT-4o"            score="98% Match" color="#5DCAA5" />,
    <ModelChip label="Claude Sonnet 4"   score="96% Match" color="#5DCAA5" />,
    <ModelChip label="Gemini 1.5 Pro"    score="89% Match" color="#85B7EB" />,
    <ModelChip label="Llama 3 70B"       score="84% Match" color="#EF9F27" />,
    <ModelChip label="Mistral Large"     score="92% Match" color="#5DCAA5" />,
    <ModelChip label="Mixtral 8×22B"     score="87% Match" color="#85B7EB" />,
    <ModelChip label="Command R+"        score="91% Match" color="#5DCAA5" />,
    <ModelChip label="Qwen2 72B"         score="83% Match" color="#EF9F27" />,
  ];
  const row2 = [
    <ModelChip label="P95 Latency"   score="1.2 s"    color="#EEEDFE" />,
    <ModelChip label="Tokens / sec"  score="8.4 k"    color="#85B7EB" />,
    <ModelChip label="Cost / 1 k"    score="$0.005"   color="#5DCAA5" />,
    <ModelChip label="RAGAs Score"   score="0.89"     color="#EEEDFE" />,
    <ModelChip label="API Uptime"    score="99.9 %"   color="#5DCAA5" />,
    <ModelChip label="Failure Rate"  score="0.1 %"    color="#F09595" />,
    <ModelChip label="Context Win."  score="128 k"    color="#85B7EB" />,
    <ModelChip label="Blueprint / s" score="4.1 s"    color="#EEEDFE" />,
  ];

  return (
    <div className="min-h-screen bg-[#07060e] relative overflow-x-hidden flex flex-col font-sans">

      {/* ── Background layers ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]
          bg-[radial-gradient(ellipse_at_center,rgba(83,74,183,0.12),transparent_70%)]" />
        <div className="absolute top-[30%] right-0 w-[400px] h-[400px]
          bg-[radial-gradient(ellipse,rgba(63,52,137,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px]
          bg-[radial-gradient(ellipse,rgba(40,33,92,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-grid opacity-[0.35]" 
          style={{ maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,black,transparent)' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06]"
        style={{ background: 'rgba(7,6,14,0.75)', backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[62px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArchonMark size={22} />
            <span className="text-[15px] font-semibold tracking-tight text-white">Archon</span>
            <span className="hidden sm:block badge-purple ml-1">Beta</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-[13px] text-white/50 hover:text-white transition-colors">Docs</a>
            <a href="#" className="text-[13px] text-white/50 hover:text-white transition-colors">API</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-[13px]">Sign In</Link>
            <Link to="/login" className="btn-primary text-[13px] h-9 px-5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-20 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ArchonLogoHero />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 max-w-5xl"
        >
          {/* Pre-headline label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(83,74,183,0.1)', border: '0.5px solid rgba(83,74,183,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-archon-mist animate-pulse" />
            <span className="text-[11px] font-medium text-archon-mist tracking-wide uppercase">AI Infrastructure Design Engine</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] text-gradient leading-[1.05] mb-6">
            Design AI Systems.<br className="hidden lg:block" />
            At the Speed of Thought.
          </h1>

          <p className="text-[17px] text-white/45 max-w-2xl mx-auto leading-relaxed mb-10">
            Describe your product and instantly receive a fully scored architecture blueprint — 
            complete with model recommendations, cost estimates, latency projections, and a Mermaid diagram.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="btn-primary h-12 px-8 text-[15px] rounded-xl">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary h-12 px-8 text-[15px] rounded-xl">
              See Features
            </a>
          </div>

          {/* Trust strips */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
            {TRUST_ITEMS.map(item => (
              <div key={item} className="flex items-center gap-1.5 text-[12px] text-white/30">
                <CheckCircle className="w-3.5 h-3.5 text-archon-core/60" strokeWidth={2} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* ── Marquee ── */}
      <section className="relative z-10 py-10 flex flex-col gap-4 overflow-hidden"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)', borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <InfiniteMarquee items={row1} />
        <InfiniteMarquee items={row2} reverse />
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="badge-purple inline-flex mb-4">Capabilities</div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
            Everything your AI stack needs.<br className="hidden sm:block" />
            <span className="text-gradient-purple">In one blueprint.</span>
          </h2>
          <p className="text-[15px] text-white/40 max-w-xl mx-auto leading-relaxed">
            From task detection to architecture generation, Archon automates the entire design process so your team ships faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden p-10 text-center"
          style={{
            background: 'linear-gradient(135deg,rgba(83,74,183,0.18) 0%,rgba(40,33,92,0.12) 100%)',
            border: '0.5px solid rgba(83,74,183,0.3)',
          }}
        >
          {/* Top border beam */}
          <div className="absolute top-0 left-0 right-0 h-px border-beam" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(83,74,183,0.1),transparent_70%)] pointer-events-none" />

          <div className="relative z-10">
            <ArchonMark size={32} />
            <h3 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Ready to architect your AI stack?
            </h3>
            <p className="mt-3 text-[15px] text-white/45 max-w-lg mx-auto">
              Generate your first blueprint in under 10 seconds. No setup required.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/login" className="btn-primary h-12 px-8 text-[15px] rounded-xl">
                Get Started Free <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 px-6"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ArchonMark size={18} />
            <span className="text-[13px] font-medium text-white/50">Archon</span>
          </div>
          <p className="text-[12px] text-white/25">© 2026 Archon Intelligence Platforms · Built for enterprise AI teams</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'API Docs'].map(l => (
              <a key={l} href="#" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
