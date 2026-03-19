import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function Builder() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    
    setLoading(true);
    try {
      // Mocked endpoint call since full architect endpoint might be complex
      const res = await fetch('/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer arch_test_key'
        },
        body: JSON.stringify({ description: prompt })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Architecture Builder</h1>
        <p className="text-white/50 text-sm">Describe your product idea and our engine will design the optimal AI stack.</p>
      </header>

      {!result && (
        <form onSubmit={handleBuild} className="bg-surface/80 border border-white/5 rounded-2xl p-8 max-w-3xl relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-archon-core/5 rounded-full blur-[80px] group-hover:bg-archon-core/10 transition-colors pointer-events-none" />
          
          <div className="relative z-10">
            <label className="block text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-archon-bright" />
              Product Description
            </label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-[#110e1f] border border-white/10 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-archon-core focus:ring-1 focus:ring-archon-core/50 transition-all placeholder:text-white/20 text-white min-h-[160px] resize-y leading-relaxed"
              placeholder="E.g., A legal document Q&A bot for law firms that requires high precision, tracks citations, and uses RAG for internal PDF knowledge bases."
              required
            />
            
            <div className="flex justify-end mt-6">
              <button 
                type="submit" 
                disabled={loading || !prompt}
                className="h-11 px-6 bg-archon-core hover:bg-archon-bright disabled:bg-surface disabled:text-white/30 disabled:border disabled:border-white/5 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(83,74,183,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Requirements...
                  </>
                ) : (
                  <>
                    Generate Blueprint <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-surface/80 border border-white/5 rounded-2xl p-8 max-w-4xl">
            <h2 className="text-xl font-medium text-white mb-6 border-b border-white/5 pb-4">Analysis Results</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">Detected Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {result.capabilities?.map((cap: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-archon-mist">
                      {cap}
                    </span>
                  ))}
                  {(!result.capabilities || result.capabilities.length === 0) && (
                    <span className="text-sm text-white/30">No specific capabilities detected.</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">System Entities</h3>
                <div className="flex flex-wrap gap-2">
                  {result.entities?.map((ent: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-sm text-white/80">
                      {ent}
                    </span>
                  ))}
                   {(!result.entities || result.entities.length === 0) && (
                    <span className="text-sm text-white/30">No entities detected.</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">System Complexity</h3>
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  {result.complexity_score || 0}/10
                </span>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex gap-4">
              <button onClick={() => setResult(null)} className="h-10 px-4 bg-surface hover:bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                New Design
              </button>
              <button className="h-10 px-4 bg-archon-core hover:bg-archon-bright rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2">
                Continue to Model Strategy <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
