import { motion } from 'framer-motion'
import { ArrowRight, Layers, Box, Cpu, Activity, Database, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

// Main animated Logo component based on the provided archon reference
const ArchonLogoFull = () => (
  <div className="relative flex items-center justify-center w-[200px] h-[200px] mx-auto text-white group scale-75 md:scale-100">
    <div className="absolute rounded-full border-[0.5px] border-archon-core/20 w-[190px] h-[190px] animate-pulse [animation-delay:0s]" />
    <div className="absolute rounded-full border-[0.5px] border-archon-core/20 w-[150px] h-[150px] animate-pulse [animation-delay:1s]" />
    <div className="absolute rounded-full border-[0.5px] border-archon-core/20 w-[115px] h-[115px] animate-pulse [animation-delay:2s]" />
    <div className="absolute w-[110px] h-[110px] rounded-full bg-archon-core/10 blur-[20px] animate-glowPulse" />
    
    <div className="relative z-10 animate-float drop-shadow-[0_0_28px_rgba(83,74,183,0.55)]">
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
        <polygon points="40,6 70,30 40,54 10,30" fill="#534AB7"/>
        <polygon points="40,6 10,30 40,30" fill="#26215C"/>
        <polygon points="40,6 70,30 40,30" fill="#7F77DD"/>
        <polygon points="10,30 40,54 40,30" fill="#3C3489"/>
        <polygon points="70,30 40,54 40,30" fill="#AFA9EC"/>
        <circle cx="40" cy="30" r="5" fill="#EEEDFE" opacity="0.45"/>
      </svg>
    </div>
  </div>
)

// Small inline logo mark
const ArchonMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28">
    <polygon points="14,2 24,10 14,18 4,10" fill="#534AB7"/>
    <polygon points="14,2 4,10 14,10" fill="#26215C"/>
    <polygon points="14,2 24,10 14,10" fill="#7F77DD"/>
    <polygon points="4,10 14,18 14,10" fill="#3C3489"/>
    <polygon points="24,10 14,18 14,10" fill="#AFA9EC"/>
    <circle cx="14" cy="10" r="2.5" fill="#EEEDFE" opacity="0.6"/>
  </svg>
)

const InfiniteMarquee = ({ items, reverse = false, speedClass = "animate-marquee" }: { items: React.ReactNode[], reverse?: boolean, speedClass?: string }) => {
  return (
    <div className="marquee-container opacity-60 hover:opacity-100 transition-opacity duration-500">
      <div className={`flex gap-6 pr-6 w-max ${reverse ? 'animate-[marquee-reverse_30s_linear_infinite]' : 'animate-[marquee_30s_linear_infinite]'} will-change-transform`}>
        {items.map((item, idx) => (
          <div key={`m1-${idx}`} className="">{item}</div>
        ))}
      </div>
      <div aria-hidden="true" className={`flex gap-6 pr-6 w-max ${reverse ? 'animate-[marquee-reverse_30s_linear_infinite]' : 'animate-[marquee_30s_linear_infinite]'} will-change-transform absolute top-0 ${reverse ? 'right-[-100%]' : 'left-[100%]'}`}>
        {items.map((item, idx) => (
          <div key={`m2-${idx}`} className="">{item}</div>
        ))}
      </div>
    </div>
  )
}

const FeatureCard = ({ title, desc, icon: Icon }: { title: string, desc: string, icon: any }) => (
  <motion.div 
    whileHover={{ translateY: -4 }}
    className="relative flex flex-col items-start gap-4 p-6 glass-panel shiny-border rounded-xl w-full min-w-[280px]"
  >
    <div className="p-3 rounded-lg bg-surface border border-white/5">
      <Icon className="w-6 h-6 text-archon-mist" />
    </div>
    <div className="text-left w-full space-y-1">
      <h3 className="text-lg font-medium tracking-tight text-white">{title}</h3>
      <p className="text-sm font-normal text-white/50">{desc}</p>
    </div>
  </motion.div>
)

const ModelChip = ({ label, score, color }: { label: string, score: string, color: string }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-surface/80 border border-white/5 rounded-full whitespace-nowrap">
    <span className="text-sm font-medium text-white/80">{label}</span>
    <span className={`text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-sm self-center leading-relaxed`} style={{ color: color, backgroundColor: `${color}15` }}>
      {score}
    </span>
  </div>
)

function Home() {
  const modelsRow1 = [
    <ModelChip label="GPT-4o" score="98% Match" color="#5DCAA5" />,
    <ModelChip label="Claude 3.5 Sonnet" score="96% Match" color="#5DCAA5" />,
    <ModelChip label="Gemini 1.5 Pro" score="89% Match" color="#85B7EB" />,
    <ModelChip label="Llama 3 70B" score="84% Match" color="#EF9F27" />,
    <ModelChip label="Mistral Large" score="92% Match" color="#5DCAA5" />,
    <ModelChip label="Mixtral 8x22B" score="87% Match" color="#85B7EB" />,
  ]

  const metricsRow = [
    <ModelChip label="P95 Latency" score="1.2s" color="#EEEDFE" />,
    <ModelChip label="Tokens/sec" score="8.4k" color="#85B7EB" />,
    <ModelChip label="Cost per 1k" score="$0.005" color="#5DCAA5" />,
    <ModelChip label="RAGAs Eval" score="0.89" color="#EEEDFE" />,
    <ModelChip label="API Uptime" score="99.9%" color="#5DCAA5" />,
    <ModelChip label="Failure Rate" score="0.1%" color="#F09595" />,
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-sans selection:bg-archon-core/30">
      
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(83,74,183,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(8,7,15,1)_80%)] pointer-events-none z-0" />
      <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-archon-core/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-[#3C3489]/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArchonMark size={24} />
            <span className="text-lg font-medium tracking-tight text-white">Archon</span>
            <span className="ml-2 hidden sm:block text-[10px] uppercase font-mono tracking-widest text-[#534AB7] px-2 py-0.5 rounded bg-[#534AB7]/10">Preview</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-sm font-medium text-white/50 hover:text-white transition-colors">API</a>
            <Link to="/login" className="flex items-center justify-center h-9 px-4 rounded-lg bg-surface text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors shadow-sm">
              Sign In
            </Link>
            <Link to="/login" className="flex items-center justify-center h-9 px-4 rounded-lg bg-archon-core text-white text-sm font-medium hover:bg-archon-bright transition-colors shadow-[0_0_14px_rgba(83,74,183,0.4)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-24 text-center px-6">
        <ArchonLogoFull />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 max-w-4xl"
        >
          <div className="relative inline-block mb-4">
            <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-archon-mist pb-1">
              Design AI Systems. <br className="hidden md:block" /> 
              At the Speed of Thought.
            </h1>
          </div>
          <p className="mt-6 text-lg md:text-xl font-normal tracking-tight text-white/50 max-w-2xl mx-auto leading-relaxed">
            API-first design engine for modern AI workloads. Describe your product idea and instantly get a fully scored architecture blueprint, cost estimations, and latency projections.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="h-12 px-8 rounded-xl bg-archon-core text-white text-[15px] font-medium hover:bg-archon-bright hover:-translate-y-0.5 transition-all shadow-[0_0_24px_rgba(83,74,183,0.3)] flex items-center gap-2">
              Start Building
              <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
            </Link>
            <button className="h-12 px-8 rounded-xl bg-surface border border-white/10 text-white text-[15px] font-medium hover:bg-white/5 hover:border-white/20 hover:-translate-y-0.5 transition-all">
              View Blueprint Example
            </button>
          </div>
        </motion.div>
      </main>

      {/* Parallel Scrolling Data Feeds */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-surface/30 backdrop-blur-sm overflow-hidden flex flex-col gap-6">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-20" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-20" />
        
        <InfiniteMarquee items={modelsRow1} />
        <InfiniteMarquee items={metricsRow} reverse />
      </section>

      {/* Feature Grid matching aesthetic */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-32">
        <div className="text-center mb-16">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.14em] text-archon-mist mb-3">Intelligent Architecture</h2>
          <h3 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">Everything an AI system needs.</h3>
          <p className="text-lg text-white/40 max-w-lg mx-auto">Generate production-ready graphs incorporating routing, retrieval, generation, and evals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            title="Semantic Task Analysis" 
            desc="Auto-detect RAG, code gen, translation, and parsing capabilities from natural language."
            icon={Activity}
          />
          <FeatureCard 
            title="Model Strategy Engine" 
            desc="Score live API models on cost, latency, quality, and fit. Never guess exactly which LLM to route to."
            icon={Cpu}
          />
          <FeatureCard 
            title="Architecture Graphs" 
            desc="Instantly plot Mermaid graphs with modular node structures detailing flow patterns."
            icon={Layers}
          />
          <FeatureCard 
            title="Cost & Latency Projections" 
            desc="Extrapolated run rates and P95 latency guarantees benchmarked live against real workloads."
            icon={Zap}
          />
          <FeatureCard 
            title="Hybrid RAG Vectorization" 
            desc="Dense embedding plus BM25 sparse lexical indexing unified with CrossEncoder reranking."
            icon={Database}
          />
          <FeatureCard 
            title="RAGAs Eval Integration" 
            desc="Ensure faithfulness, relevancy, precision, and recall out of the box with confidence metrics."
            icon={Box}
          />
        </div>
      </section>

      {/* Dark Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 text-center text-sm text-white/30 bg-background flex flex-col items-center">
        <ArchonMark size={20} />
        <p className="mt-4">&copy; 2026 Archon Intelligence Platforms. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Home
