import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, FolderOpen, Trash2, ZoomIn, ZoomOut, X,
  ChevronDown, Loader2, CheckCircle2, AlertCircle, Plus,
  Cpu, Database, GitBranch, Terminal, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type NodeType = 'input' | 'llm' | 'retriever' | 'router' | 'output';
type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface PipelineNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  config: Record<string, string | number | boolean>;
  output?: string;
  status: RunStatus;
}

interface Edge {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

interface SavedPipeline {
  name: string;
  nodes: PipelineNode[];
  edges: Edge[];
  savedAt: string;
}

/* ─── Node palette definitions ───────────────────────────────────────────────── */
const NODE_DEFS: Record<NodeType, {
  label: string;
  color: string;
  border: string;
  bg: string;
  textColor: string;
  icon: React.FC<{ className?: string }>;
  ports: { in: string[]; out: string[] };
  defaultConfig: Record<string, string | number | boolean>;
  configFields: { key: string; label: string; type: 'text' | 'select' | 'number' | 'textarea'; options?: string[] }[];
}> = {
  input: {
    label: 'Input', color: '#6B7280', border: 'rgba(107,114,128,0.35)', bg: 'rgba(107,114,128,0.06)',
    textColor: '#6B7280',
    icon: ({ className }) => <Terminal className={className} />,
    ports: { in: [], out: ['prompt'] },
    defaultConfig: { placeholder: 'User query goes here…' },
    configFields: [{ key: 'placeholder', label: 'Placeholder text', type: 'text' }],
  },
  llm: {
    label: 'LLM', color: '#5B00E8', border: 'rgba(91,0,232,0.35)', bg: 'rgba(91,0,232,0.06)',
    textColor: '#5B00E8',
    icon: ({ className }) => <Cpu className={className} />,
    ports: { in: ['context', 'prompt'], out: ['response'] },
    defaultConfig: { model: 'claude-sonnet-4', temperature: 0.7, max_tokens: 1024, system_prompt: 'You are a helpful assistant.' },
    configFields: [
      { key: 'model', label: 'Model', type: 'select', options: ['claude-sonnet-4', 'claude-opus-4', 'claude-haiku-4', 'gpt-4o', 'gpt-4o-mini', 'gemini-2.0-flash', 'deepseek-r1', 'llama-3.3-70b'] },
      { key: 'system_prompt', label: 'System prompt', type: 'textarea' },
      { key: 'temperature', label: 'Temperature', type: 'number' },
      { key: 'max_tokens', label: 'Max tokens', type: 'number' },
    ],
  },
  retriever: {
    label: 'Retriever', color: '#3B82F6', border: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.06)',
    textColor: '#3B82F6',
    icon: ({ className }) => <Database className={className} />,
    ports: { in: ['query'], out: ['context'] },
    defaultConfig: { strategy: 'hybrid', top_k: 5, chunk_size: 512 },
    configFields: [
      { key: 'strategy', label: 'Strategy', type: 'select', options: ['Dense Vector', 'BM25', 'Hybrid', 'Cross-Encoder'] },
      { key: 'top_k', label: 'Top-K results', type: 'number' },
      { key: 'chunk_size', label: 'Chunk size', type: 'number' },
    ],
  },
  router: {
    label: 'Router', color: '#D97706', border: 'rgba(217,119,6,0.35)', bg: 'rgba(217,119,6,0.06)',
    textColor: '#D97706',
    icon: ({ className }) => <GitBranch className={className} />,
    ports: { in: ['input'], out: ['route_a', 'route_b'] },
    defaultConfig: { strategy: 'Intent-based', label_a: 'Technical', label_b: 'General' },
    configFields: [
      { key: 'strategy', label: 'Routing strategy', type: 'select', options: ['Intent-based', 'Score-based', 'Round-robin'] },
      { key: 'label_a', label: 'Branch A label', type: 'text' },
      { key: 'label_b', label: 'Branch B label', type: 'text' },
    ],
  },
  output: {
    label: 'Output', color: '#059669', border: 'rgba(5,150,105,0.35)', bg: 'rgba(5,150,105,0.06)',
    textColor: '#059669',
    icon: ({ className }) => <CheckCircle2 className={className} />,
    ports: { in: ['result'], out: [] },
    defaultConfig: { label: 'Final Output', format: 'text' },
    configFields: [
      { key: 'label', label: 'Output label', type: 'text' },
      { key: 'format', label: 'Format', type: 'select', options: ['Text', 'JSON', 'Markdown'] },
    ],
  },
};

const NODE_W = 200;
const NODE_H_BASE = 80;
const GRID = 20;
const PORT_R = 5;

const snap = (v: number) => Math.round(v / GRID) * GRID;

function portPos(node: PipelineNode, portId: string, side: 'left' | 'right') {
  const def = NODE_DEFS[node.type];
  const list = side === 'left' ? def.ports.in : def.ports.out;
  const idx = list.indexOf(portId);
  const count = list.length;
  const y = NODE_H_BASE / 2 + ((idx - (count - 1) / 2) * 22);
  const x = side === 'left' ? 0 : NODE_W;
  return { x: node.x + x, y: node.y + y };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

const STARTER_NODES: PipelineNode[] = [
  { id: 'n1', type: 'input',     x: 60,  y: 180, config: { placeholder: 'Enter your query…' }, status: 'idle' },
  { id: 'n2', type: 'retriever', x: 320, y: 120, config: { strategy: 'Hybrid', top_k: 5, chunk_size: 512 }, status: 'idle' },
  { id: 'n3', type: 'llm',       x: 580, y: 160, config: { model: 'claude-sonnet-4', temperature: 0.7, max_tokens: 1024, system_prompt: 'You are a helpful assistant.' }, status: 'idle' },
  { id: 'n4', type: 'output',    x: 840, y: 200, config: { label: 'Final Output', format: 'Text' }, status: 'idle' },
];

const STARTER_EDGES: Edge[] = [
  { id: 'e1', fromNode: 'n1', fromPort: 'prompt',   toNode: 'n2', toPort: 'query' },
  { id: 'e2', fromNode: 'n1', fromPort: 'prompt',   toNode: 'n3', toPort: 'prompt' },
  { id: 'e3', fromNode: 'n2', fromPort: 'context',  toNode: 'n3', toPort: 'context' },
  { id: 'e4', fromNode: 'n3', fromPort: 'response', toNode: 'n4', toPort: 'result' },
];

/* ─── Node component (light theme SVG) ──────────────────────────────────────── */
function NodeCard({
  node, selected, onSelect, onDragStart, onPortMouseDown, onPortMouseUp,
}: {
  node: PipelineNode; selected: boolean;
  onSelect: () => void; onDragStart: (e: React.MouseEvent) => void;
  onPortMouseDown: (portId: string, side: 'left' | 'right', e: React.MouseEvent) => void;
  onPortMouseUp: (portId: string, side: 'left' | 'right') => void;
  zoom: number;
}) {
  const def = NODE_DEFS[node.type];
  const Icon = def.icon;

  const statusColor =
    node.status === 'running' ? '#D97706' :
    node.status === 'done'    ? '#059669' :
    node.status === 'error'   ? '#EF4444' : 'rgba(107,114,128,0.25)';

  return (
    <g transform={`translate(${node.x}, ${node.y})`} style={{ cursor: 'grab' }}
      onMouseDown={e => { e.stopPropagation(); onSelect(); onDragStart(e); }}>

      {/* Drop shadow */}
      <rect x={2} y={4} width={NODE_W} height={NODE_H_BASE} rx={12} fill="rgba(91,0,232,0.08)" />

      {/* Card background */}
      <rect width={NODE_W} height={NODE_H_BASE} rx={12} fill="white"
        stroke={selected ? def.color : def.border}
        strokeWidth={selected ? 2 : 1.5} />

      {/* Top color bar */}
      <clipPath id={`clip-${node.id}`}>
        <rect width={NODE_W} height={8} rx={12} />
      </clipPath>
      <rect width={NODE_W} height={8} rx={4} fill={def.color} opacity={0.85} clipPath={`url(#clip-${node.id})`} />

      {/* Status dot */}
      <circle cx={NODE_W - 14} cy={22} r={5} fill={statusColor} />
      {node.status === 'running' && (
        <circle cx={NODE_W - 14} cy={22} r={5} fill={def.color} opacity={0.4}>
          <animate attributeName="r" values="5;9;5" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Type label */}
      <text x={12} y={22} fill={def.color} fontSize={8} fontWeight={700} fontFamily="Inter, sans-serif" letterSpacing={1}>
        {def.label.toUpperCase()}
      </text>

      {/* Model/strategy subtitle */}
      <text x={12} y={50} fill="#374151" fontSize={12} fontWeight={600} fontFamily="Inter, sans-serif">
        {node.type === 'llm'       ? String(node.config.model || 'claude-sonnet-4') :
         node.type === 'retriever' ? `${node.config.strategy || 'Hybrid'} · k=${node.config.top_k ?? 5}` :
         node.type === 'router'    ? String(node.config.strategy || 'Intent-based') :
         node.type === 'output'    ? String(node.config.label || 'Output') :
         'User input'}
      </text>

      {/* Output snippet */}
      {node.output && node.status === 'done' && (
        <>
          <rect y={NODE_H_BASE - 2} width={NODE_W} height={28} rx={0} fill="rgba(5,150,105,0.05)" />
          <rect y={NODE_H_BASE + 26} width={NODE_W} height={4} rx={2} fill="rgba(5,150,105,0.05)" />
          <text x={10} y={NODE_H_BASE + 17} fill="#059669" fontSize={10} fontFamily="IBM Plex Mono, monospace">
            {node.output.slice(0, 28)}{node.output.length > 28 ? '…' : ''}
          </text>
        </>
      )}

      {/* Input ports (left) */}
      {def.ports.in.map((port, i) => {
        const count = def.ports.in.length;
        const py = NODE_H_BASE / 2 + (i - (count - 1) / 2) * 22;
        return (
          <g key={port}
            onMouseUp={e => { e.stopPropagation(); onPortMouseUp(port, 'left'); }}
            style={{ cursor: 'crosshair' }}>
            <circle cx={0} cy={py} r={PORT_R + 4} fill="transparent" />
            <circle cx={0} cy={py} r={PORT_R} fill="white" stroke={def.border} strokeWidth={1.5} />
            <text x={9} y={py + 4} fill="#9CA3AF" fontSize={9} fontFamily="IBM Plex Mono, monospace">{port}</text>
          </g>
        );
      })}

      {/* Output ports (right) */}
      {def.ports.out.map((port, i) => {
        const count = def.ports.out.length;
        const py = NODE_H_BASE / 2 + (i - (count - 1) / 2) * 22;
        return (
          <g key={port}
            onMouseDown={e => { e.stopPropagation(); onPortMouseDown(port, 'right', e); }}
            style={{ cursor: 'crosshair' }}>
            <circle cx={NODE_W} cy={py} r={PORT_R + 4} fill="transparent" />
            <circle cx={NODE_W} cy={py} r={PORT_R} fill={def.color} strokeWidth={0} opacity={0.85} />
            <text x={NODE_W - 9} y={py + 4} fill="#9CA3AF" fontSize={9} fontFamily="IBM Plex Mono, monospace" textAnchor="end">{port}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ─── Config panel (light theme) ─────────────────────────────────────────────── */
function ConfigPanel({ node, onUpdate, onClose, onDelete }: {
  node: PipelineNode; onUpdate: (key: string, value: string | number) => void;
  onClose: () => void; onDelete: () => void;
}) {
  const def = NODE_DEFS[node.type];
  const Icon = def.icon;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 top-0 bottom-0 w-[280px] flex flex-col bg-white"
      style={{ borderLeft: '1.5px solid rgba(91,0,232,0.12)', zIndex: 30, boxShadow: '-4px 0 24px rgba(91,0,232,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: def.bg, border: `1px solid ${def.border}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: def.color } as React.CSSProperties} />
        </div>
        <span className="text-[13px] font-semibold text-[#0D0D0D] flex-1">{def.label} Config</span>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {def.configFields.map(field => (
          <div key={field.key}>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={String(node.config[field.key] ?? '')}
                onChange={e => onUpdate(field.key, e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-[12px] text-[#0D0D0D] outline-none cursor-pointer"
                style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }}
              >
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={String(node.config[field.key] ?? '')}
                onChange={e => onUpdate(field.key, e.target.value)}
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-[12px] text-[#0D0D0D] outline-none resize-none"
                style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }}
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={String(node.config[field.key] ?? '')}
                onChange={e => onUpdate(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-[12px] text-[#0D0D0D] outline-none"
                style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }}
              />
            )}
          </div>
        ))}

        {node.output && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[#059669]">Last Output</label>
            <pre className="text-[11px] text-[#374151] rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap"
              style={{ background: 'rgba(5,150,105,0.04)', border: '1.5px solid rgba(5,150,105,0.2)' }}>
              {node.output}
            </pre>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="px-4 py-3" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)' }}>
        <button onClick={onDelete}
          className="w-full h-8 rounded-lg text-[12px] font-medium flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.15)', color: '#EF4444' }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.05)'; }}>
          <Trash2 className="w-3.5 h-3.5" /> Delete node
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Run modal (light theme) ─────────────────────────────────────────────────── */
function RunModal({ onRun, onClose }: { onRun: (prompt: string) => void; onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl p-6 bg-white"
        style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 24px 64px rgba(91,0,232,0.15)' }}>
        <h3 className="font-display text-[16px] font-bold text-[#0D0D0D] mb-1">Run Pipeline</h3>
        <p className="text-[12px] text-[#9CA3AF] mb-4">Enter a prompt to send through your pipeline</p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
          placeholder="What are the latest advances in quantum computing?"
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-[13px] text-[#0D0D0D] outline-none resize-none mb-4"
          style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }}
          onFocus={e => { e.target.style.borderColor = '#5B00E8'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(91,0,232,0.2)'; }}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-medium text-[#374151] transition-all"
            style={{ border: '1.5px solid rgba(91,0,232,0.15)', background: 'white' }}>
            Cancel
          </button>
          <button
            onClick={() => prompt.trim() && onRun(prompt.trim())}
            disabled={!prompt.trim()}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background: '#5B00E8', boxShadow: '0 2px 12px rgba(91,0,232,0.3)' }}>
            <Play className="w-3.5 h-3.5" /> Run
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────────── */
export default function Playground() {
  const { token } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes]           = useState<PipelineNode[]>(STARTER_NODES);
  const [edges, setEdges]           = useState<Edge[]>(STARTER_EDGES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom]             = useState(1);
  const [pan, setPan]               = useState({ x: 0, y: 0 });

  const dragging = useRef<{ id: string; ox: number; oy: number; startX: number; startY: number } | null>(null);
  const panning  = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const [drawingEdge, setDrawingEdge] = useState<{ fromNode: string; fromPort: string; mx: number; my: number } | null>(null);

  const [showRunModal, setShowRunModal] = useState(false);
  const [isRunning, setIsRunning]       = useState(false);

  const [pipelines, setPipelines]       = useState<SavedPipeline[]>([]);
  const [pipelineName, setPipelineName] = useState('My Pipeline');
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('archon_pipelines') || '[]'); setPipelines(saved); } catch { /* ignore */ }
  }, []);

  const savePipeline = () => {
    const entry: SavedPipeline = { name: pipelineName, nodes, edges, savedAt: new Date().toISOString() };
    const updated = [...pipelines.filter(p => p.name !== pipelineName), entry];
    setPipelines(updated);
    localStorage.setItem('archon_pipelines', JSON.stringify(updated));
    setShowSaveMenu(false);
  };

  const loadPipeline = (p: SavedPipeline) => {
    setNodes(p.nodes); setEdges(p.edges); setPipelineName(p.name);
    setSelectedId(null); setShowLoadMenu(false);
  };

  const svgCoord = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  const addNode = (type: NodeType) => {
    const def = NODE_DEFS[type];
    const id = `n${Date.now()}`;
    setNodes(prev => [...prev, { id, type, x: snap(80 + Math.random() * 200), y: snap(100 + Math.random() * 200), config: { ...def.defaultConfig }, status: 'idle' }]);
    setSelectedId(id);
  };

  const startDrag = useCallback((id: string, e: React.MouseEvent) => {
    const node = nodes.find(n => n.id === id)!;
    dragging.current = { id, ox: node.x, oy: node.y, startX: e.clientX, startY: e.clientY };
  }, [nodes]);

  const startPan = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      panning.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const dx = (e.clientX - dragging.current.startX) / zoom;
      const dy = (e.clientY - dragging.current.startY) / zoom;
      setNodes(prev => prev.map(n => n.id === dragging.current!.id ? { ...n, x: snap(dragging.current!.ox + dx), y: snap(dragging.current!.oy + dy) } : n));
    }
    if (panning.current) {
      setPan({ x: panning.current.panX + (e.clientX - panning.current.startX), y: panning.current.panY + (e.clientY - panning.current.startY) });
    }
    if (drawingEdge) {
      const c = svgCoord(e.clientX, e.clientY);
      setDrawingEdge(prev => prev ? { ...prev, mx: c.x, my: c.y } : null);
    }
  }, [zoom, svgCoord, drawingEdge]);

  const onMouseUp = useCallback(() => {
    dragging.current = null; panning.current = null;
    if (drawingEdge) setDrawingEdge(null);
  }, [drawingEdge]);

  const onPortMouseDown = useCallback((nodeId: string, portId: string, side: 'left' | 'right', e: React.MouseEvent) => {
    if (side === 'right') { const c = svgCoord(e.clientX, e.clientY); setDrawingEdge({ fromNode: nodeId, fromPort: portId, mx: c.x, my: c.y }); }
  }, [svgCoord]);

  const onPortMouseUp = useCallback((nodeId: string, portId: string, side: 'left' | 'right') => {
    if (drawingEdge && side === 'left' && nodeId !== drawingEdge.fromNode) {
      setEdges(prev => [...prev, { id: `e${Date.now()}`, fromNode: drawingEdge.fromNode, fromPort: drawingEdge.fromPort, toNode: nodeId, toPort: portId }]);
      setDrawingEdge(null);
    }
  }, [drawingEdge]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !(e.target as Element).closest('input,textarea,select')) {
        setNodes(prev => prev.filter(n => n.id !== selectedId));
        setEdges(prev => prev.filter(ed => ed.fromNode !== selectedId && ed.toNode !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  };

  const runPipeline = async (prompt: string) => {
    setShowRunModal(false); setIsRunning(true);
    const order = ['input', 'retriever', 'router', 'llm', 'output'] as NodeType[];
    const sortedNodes = [...nodes].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const MOCK_OUTPUTS: Record<NodeType, string> = {
      input:     prompt,
      retriever: `Retrieved 5 chunks.\n[1] Context about ${prompt.split(' ').slice(0, 3).join(' ')}...\n[2] Related docs...`,
      router:    `Routed to: ${Math.random() > 0.5 ? 'Technical' : 'General'} branch`,
      llm:       `Here is a comprehensive answer about "${prompt.slice(0, 40)}…"\n\nKey aspects: core principles, recent developments, practical applications.`,
      output:    `✓ Response delivered. Tokens: ${Math.floor(Math.random() * 400 + 200)} · Latency: ${(Math.random() * 2 + 0.8).toFixed(1)}s`,
    };
    for (const node of sortedNodes) {
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'running', output: undefined } : n));
      await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'done', output: MOCK_OUTPUTS[node.type] } : n));
    }
    setIsRunning(false);
  };

  const clearCanvas = () => { setNodes([]); setEdges([]); setSelectedId(null); };
  const selectedNode = nodes.find(n => n.id === selectedId) ?? null;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Toolbar ── */}
      <div className="h-[52px] flex-shrink-0 flex items-center justify-between px-4 gap-3 bg-white"
        style={{ borderBottom: '1.5px solid rgba(91,0,232,0.1)', zIndex: 20 }}>

        {/* Left: name + save/load */}
        <div className="flex items-center gap-2">
          <input
            value={pipelineName}
            onChange={e => setPipelineName(e.target.value)}
            className="text-[13px] font-semibold text-[#0D0D0D] bg-transparent outline-none border-b border-transparent focus:border-[#5B00E8] transition-colors px-1"
            style={{ minWidth: 120 }}
          />

          <div className="relative">
            <button onClick={() => { setShowSaveMenu(v => !v); setShowLoadMenu(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: '#F4F2FF', border: '1.5px solid rgba(91,0,232,0.2)', color: '#5B00E8' }}>
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            {showSaveMenu && (
              <div className="absolute top-10 left-0 rounded-xl p-3 w-52 z-50 bg-white"
                style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 8px 32px rgba(91,0,232,0.12)' }}>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-2">Save as</p>
                <input value={pipelineName} onChange={e => setPipelineName(e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 text-[12px] text-[#0D0D0D] outline-none mb-2"
                  style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }} />
                <button onClick={savePipeline} className="w-full h-8 rounded-lg text-[12px] font-semibold text-white"
                  style={{ background: '#5B00E8' }}>
                  Save pipeline
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowLoadMenu(v => !v); setShowSaveMenu(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.15)', color: '#374151' }}>
              <FolderOpen className="w-3.5 h-3.5" /> Load <ChevronDown className="w-3 h-3" />
            </button>
            {showLoadMenu && (
              <div className="absolute top-10 left-0 rounded-xl p-2 w-56 z-50 bg-white"
                style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 8px 32px rgba(91,0,232,0.12)' }}>
                {pipelines.length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF] px-2 py-3 text-center">No saved pipelines yet</p>
                ) : pipelines.map(p => (
                  <button key={p.name} onClick={() => loadPipeline(p)}
                    className="w-full text-left px-3 py-2 rounded-lg transition-colors"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F4F2FF'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <p className="text-[12px] font-medium text-[#374151]">{p.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{new Date(p.savedAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={clearCanvas} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-[#EF4444] transition-all"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.15)' }}>
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>

        {/* Center: zoom */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#5B00E8] transition-all"
            style={{ background: '#F4F2FF' }}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-[#6B7280] w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#5B00E8] transition-all"
            style={{ background: '#F4F2FF' }}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: run */}
        <button
          onClick={() => setShowRunModal(true)}
          disabled={isRunning || nodes.length === 0}
          className="flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: '#5B00E8', boxShadow: '0 2px 12px rgba(91,0,232,0.3)' }}>
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Running…' : 'Run Pipeline'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Node palette (left sidebar) ── */}
        <div className="w-[176px] flex-shrink-0 flex flex-col gap-1.5 p-3 overflow-y-auto bg-white"
          style={{ borderRight: '1.5px solid rgba(91,0,232,0.1)' }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] px-2 mb-1 mt-1">Node Types</p>
          {(Object.entries(NODE_DEFS) as [NodeType, typeof NODE_DEFS[NodeType]][]).map(([type, def]) => {
            const Icon = def.icon;
            return (
              <button key={type} onClick={() => addNode(type)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left bg-white transition-all group"
                style={{ border: `1.5px solid ${def.border}` }}
                onMouseEnter={e => { (e.currentTarget).style.background = def.bg; }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'white'; }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: def.bg }}>
                  <Icon className="w-3 h-3" style={{ color: def.color } as React.CSSProperties} />
                </div>
                <p className="text-[12px] font-semibold text-[#374151]">{def.label}</p>
                <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: def.color }} />
              </button>
            );
          })}
          <div className="mt-4 px-2">
            <p className="text-[9px] text-[#9CA3AF] leading-relaxed">
              Click to add. Drag to arrange. Connect output ports (●) to input ports. Delete key removes selected.
            </p>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#F4F2FF' }}>
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(91,0,232,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(91,0,232,0.05) 1px, transparent 1px)',
              backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }} />

          <svg ref={svgRef} className="w-full h-full"
            onMouseDown={e => { if (e.target === svgRef.current) { startPan(e); setSelectedId(null); setShowSaveMenu(false); setShowLoadMenu(false); } }}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onWheel={onWheel}>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

              {/* Edges */}
              {edges.map(edge => {
                const fromNode = nodes.find(n => n.id === edge.fromNode);
                const toNode   = nodes.find(n => n.id === edge.toNode);
                if (!fromNode || !toNode) return null;
                const def = NODE_DEFS[fromNode.type];
                const from = portPos(fromNode, edge.fromPort, 'right');
                const to   = portPos(toNode,   edge.toPort,   'left');
                return (
                  <path key={edge.id} d={bezierPath(from.x, from.y, to.x, to.y)}
                    fill="none" stroke={def.color} strokeWidth={1.5} strokeOpacity={0.5}
                    onDoubleClick={() => setEdges(prev => prev.filter(e => e.id !== edge.id))}
                    style={{ cursor: 'pointer' }} />
                );
              })}

              {/* In-progress edge */}
              {drawingEdge && (() => {
                const fromNode = nodes.find(n => n.id === drawingEdge.fromNode);
                if (!fromNode) return null;
                const from = portPos(fromNode, drawingEdge.fromPort, 'right');
                return <path d={bezierPath(from.x, from.y, drawingEdge.mx, drawingEdge.my)}
                  fill="none" stroke="rgba(91,0,232,0.5)" strokeWidth={1.5} strokeDasharray="6 4" />;
              })()}

              {/* Nodes */}
              {nodes.map(node => (
                <NodeCard key={node.id} node={node} selected={selectedId === node.id}
                  onSelect={() => setSelectedId(node.id)}
                  onDragStart={e => startDrag(node.id, e)}
                  onPortMouseDown={(port, side, e) => onPortMouseDown(node.id, port, side, e)}
                  onPortMouseUp={(port, side) => onPortMouseUp(node.id, port, side)}
                  zoom={zoom} />
              ))}
            </g>
          </svg>

          {/* Empty hint */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
                  <ArrowRight className="w-8 h-8 text-[#5B00E8] opacity-40" />
                </div>
                <p className="text-[14px] font-medium text-[#6B7280]">Click a node type in the left panel to start</p>
                <p className="text-[12px] text-[#9CA3AF] mt-1">Then connect nodes by dragging from output ports (●)</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Config panel ── */}
        <AnimatePresence>
          {selectedNode && (
            <ConfigPanel node={selectedNode}
              onUpdate={(key, val) => setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, config: { ...n.config, [key]: val } } : n))}
              onClose={() => setSelectedId(null)}
              onDelete={() => {
                setNodes(prev => prev.filter(n => n.id !== selectedId));
                setEdges(prev => prev.filter(e => e.fromNode !== selectedId && e.toNode !== selectedId));
                setSelectedId(null);
              }} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Run modal ── */}
      <AnimatePresence>
        {showRunModal && <RunModal onRun={runPipeline} onClose={() => setShowRunModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
