import { Activity, Cpu, ArrowRight, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { StatCard } from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { token } = useAuth();
  
  const [deployments, setDeployments] = useState([
    { name: 'Legal Q&A Bot', model: 'GPT-4o', status: 'Healthy', lat: '0.8s', req: '1.2k/min' },
    { name: 'Code Assistant Pro', model: 'Claude 3.5 Sonnet', status: 'Healthy', lat: '1.5s', req: '850/min' },
    { name: 'Internal Wiki Search', model: 'Mistral Large', status: 'Warning', lat: '2.4s', req: '4.5k/min' },
  ]);

  useEffect(() => {
    if (!token) return;
    
    fetch('/v1/models', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.models && data.models.length > 0) {
          // Just using the fetched models to create some deployments for demonstration
          setDeployments(data.models.map((m: any, i: number) => ({
            name: `${m.name} App`,
            model: m.name,
            status: m.is_active ? 'Healthy' : 'Warning',
            lat: `${m.avg_latency_ms}ms`,
            req: `${1000 - i * 100}/min`
          })));
        }
      })
      .catch(err => console.error("Failed to fetch models: ", err));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Platform Overview</h1>
        <p className="text-white/50 text-sm">Real-time metrics and routing decisions across your AI systems.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Systems" value="14" change="2 from last week" trend="up" />
        <StatCard title="Total Requests" value="2.4M" change="12% vs yesterday" trend="up" />
        <StatCard title="Avg P95 Latency" value="1.2s" change="0.1s slower" trend="down" />
        <StatCard title="Est. Monthly Cost" value="$4,250" change="On track" trend="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-archon-mist" />
              Active Deployments
            </h2>
            <button className="text-xs font-medium text-archon-mist hover:text-white transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="bg-surface/80 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
            <div className="grid grid-cols-5 px-6 py-3 bg-white/5 text-xs font-medium text-white/50 uppercase tracking-wider">
              <div className="col-span-2">System</div>
              <div>Primary Model</div>
              <div>Status</div>
              <div>Metrics</div>
            </div>
            {deployments.map((dep, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={dep.name} 
                className="grid grid-cols-5 px-6 py-4 items-center hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="col-span-2 font-medium text-sm text-white group-hover:text-archon-mist transition-colors">{dep.name}</div>
                <div className="text-sm text-white/70 flex items-center gap-2">
                  {dep.model}
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                    dep.status === 'Healthy' ? 'text-semantic-success bg-semantic-success/10' : 'text-semantic-warning bg-semantic-warning/10'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {dep.status}
                  </span>
                </div>
                <div className="text-xs text-white/50 font-mono">
                  <div>{dep.lat}</div>
                  <div>{dep.req}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-archon-mist" />
            Routing Health
          </h2>
          <div className="bg-surface/80 border border-white/5 rounded-xl p-6 h-[calc(100%-2rem)]">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">OpenAI Fallback Triggered</span>
                  <span className="text-white font-medium">12 times</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-semantic-warning h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Cache Hit Ratio</span>
                  <span className="text-white font-medium">84%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-archon-core h-1.5 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                <button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-lg text-sm transition-colors flex justify-center items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Analyze Node Topology
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
