import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, FolderOpen, Trash2, ZoomIn, ZoomOut, X,
  ChevronDown, Loader2, CheckCircle2, Plus,
  Cpu, Database, GitBranch, Terminal, ArrowRight, Maximize2,
  Lightbulb, AlertTriangle, Sparkles, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type NodeType = 'input' | 'llm' | 'retriever' | 'router' | 'output';
type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface PipelineNode {
  id: string; type: NodeType; x: number; y: number;
  config: Record<string, string | number | boolean>;
  output?: string; status: RunStatus;
}
interface Edge { id: string; fromNode: string; fromPort: string; toNode: string; toPort: string; }
interface SavedPipeline { name: string; nodes: PipelineNode[]; edges: Edge[]; savedAt: string; }

/* ─── Node definitions ──────────────────────────────────────────────────── */
const NODE_DEFS: Record<NodeType, {
  label: string; color: string; border: string; bg: string; textColor: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  ports: { in: string[]; out: string[] };
  defaultConfig: Record<string, string | number | boolean>;
  configFields: { key: string; label: string; type: 'text' | 'select' | 'number' | 'textarea'; options?: string[] }[];
}> = {
  input: {
    label: 'Input', color: '#64748B', border: 'rgba(100,116,139,0.3)', bg: 'rgba(100,116,139,0.06)', textColor: '#64748B',
    icon: ({ className }) => <Terminal className={className} />,
    ports: { in: [], out: ['prompt'] },
    defaultConfig: { placeholder: 'User query goes here…' },
    configFields: [{ key: 'placeholder', label: 'Placeholder text', type: 'text' }],
  },
  llm: {
    label: 'LLM', color: '#5B00E8', border: 'rgba(91,0,232,0.3)', bg: 'rgba(91,0,232,0.06)', textColor: '#5B00E8',
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
    label: 'Retriever', color: '#2563EB', border: 'rgba(37,99,235,0.3)', bg: 'rgba(37,99,235,0.06)', textColor: '#2563EB',
    icon: ({ className }) => <Database className={className} />,
    ports: { in: ['query'], out: ['context'] },
    defaultConfig: { strategy: 'Hybrid', top_k: 5, chunk_size: 512 },
    configFields: [
      { key: 'strategy', label: 'Strategy', type: 'select', options: ['Dense Vector', 'BM25', 'Hybrid', 'Cross-Encoder'] },
      { key: 'top_k', label: 'Top-K results', type: 'number' },
      { key: 'chunk_size', label: 'Chunk size', type: 'number' },
    ],
  },
  router: {
    label: 'Router', color: '#D97706', border: 'rgba(217,119,6,0.3)', bg: 'rgba(217,119,6,0.06)', textColor: '#D97706',
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
    label: 'Output', color: '#059669', border: 'rgba(5,150,105,0.3)', bg: 'rgba(5,150,105,0.06)', textColor: '#059669',
    icon: ({ className }) => <CheckCircle2 className={className} />,
    ports: { in: ['result'], out: [] },
    defaultConfig: { label: 'Final Output', format: 'Text' },
    configFields: [
      { key: 'label', label: 'Output label', type: 'text' },
      { key: 'format', label: 'Format', type: 'select', options: ['Text', 'JSON', 'Markdown'] },
    ],
  },
};

/* ─── Canvas constants ──────────────────────────────────────────────────── */
const NODE_W    = 236;
const NODE_H    = 120;
const GRID      = 20;
const PORT_R    = 6;
const PORT_HIT  = 14;

const snap = (v: number) => Math.round(v / GRID) * GRID;

function getSubtitle(node: PipelineNode): string {
  const raw =
    node.type === 'llm'       ? String(node.config.model || 'claude-sonnet-4') :
    node.type === 'retriever' ? `${node.config.strategy || 'Hybrid'} · k=${node.config.top_k ?? 5}` :
    node.type === 'router'    ? String(node.config.strategy || 'Intent-based') :
    node.type === 'output'    ? String(node.config.label || 'Output') : 'User input';
  return raw.length > 22 ? raw.slice(0, 21) + '…' : raw;
}

/* portPos uses the same vertical formula as NodeCard */
function portPos(node: PipelineNode, portId: string, side: 'left' | 'right') {
  const def   = NODE_DEFS[node.type];
  const list  = side === 'left' ? def.ports.in : def.ports.out;
  const idx   = list.indexOf(portId);
  const count = list.length;
  const py    = NODE_H / 2 + (idx - (count - 1) / 2) * 28;
  return { x: node.x + (side === 'left' ? 0 : NODE_W), y: node.y + py };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

const STARTER_NODES: PipelineNode[] = [
  { id: 'n1', type: 'input',     x: 60,  y: 200, config: { placeholder: 'Enter your query…' }, status: 'idle' },
  { id: 'n2', type: 'retriever', x: 340, y: 140, config: { strategy: 'Hybrid', top_k: 5, chunk_size: 512 }, status: 'idle' },
  { id: 'n3', type: 'llm',       x: 620, y: 160, config: { model: 'claude-sonnet-4', temperature: 0.7, max_tokens: 1024, system_prompt: 'You are a helpful assistant.' }, status: 'idle' },
  { id: 'n4', type: 'output',    x: 900, y: 210, config: { label: 'Final Output', format: 'Text' }, status: 'idle' },
];
const STARTER_EDGES: Edge[] = [
  { id: 'e1', fromNode: 'n1', fromPort: 'prompt',   toNode: 'n2', toPort: 'query' },
  { id: 'e2', fromNode: 'n1', fromPort: 'prompt',   toNode: 'n3', toPort: 'prompt' },
  { id: 'e3', fromNode: 'n2', fromPort: 'context',  toNode: 'n3', toPort: 'context' },
  { id: 'e4', fromNode: 'n3', fromPort: 'response', toNode: 'n4', toPort: 'result' },
];

/* ─── Node card (SVG) ───────────────────────────────────────────────────── */
function NodeCard({ node, selected, onSelect, onDragStart, onPortMouseDown, onPortMouseUp }: {
  node: PipelineNode; selected: boolean;
  onSelect: () => void; onDragStart: (e: React.MouseEvent) => void;
  onPortMouseDown: (portId: string, side: 'left' | 'right', e: React.MouseEvent) => void;
  onPortMouseUp: (portId: string, side: 'left' | 'right') => void;
}) {
  const def = NODE_DEFS[node.type];
  const subtitle = getSubtitle(node);

  const statusColor =
    node.status === 'running' ? '#F59E0B' :
    node.status === 'done'    ? '#10B981' :
    node.status === 'error'   ? '#EF4444' : 'rgba(148,163,184,0.4)';

  return (
    <g transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: 'grab', filter: selected ? `drop-shadow(0 0 8px ${def.color}40)` : 'drop-shadow(0 2px 8px rgba(91,0,232,0.08))' }}
      onMouseDown={e => { e.stopPropagation(); onSelect(); onDragStart(e); }}>

      {/* Clip path for top bar rounding */}
      <clipPath id={`topclip-${node.id}`}>
        <rect width={NODE_W} height={10} rx={12} />
      </clipPath>
      {/* Clip path for content text */}
      <clipPath id={`textclip-${node.id}`}>
        <rect x={12} y={38} width={NODE_W - 24} height={NODE_H - 48} />
      </clipPath>

      {/* Card background */}
      <rect width={NODE_W} height={NODE_H} rx={12}
        fill="white"
        stroke={selected ? def.color : def.border}
        strokeWidth={selected ? 2 : 1.5} />

      {/* Colored top accent bar */}
      <rect width={NODE_W} height={10} clipPath={`url(#topclip-${node.id})`}
        fill={def.color} opacity={0.92} />
      {/* Square off bottom half of bar */}
      <rect y={5} width={NODE_W} height={5} fill={def.color} opacity={0.92} />

      {/* Status indicator */}
      <circle cx={NODE_W - 15} cy={27} r={4.5} fill={statusColor} />
      {node.status === 'running' && (
        <circle cx={NODE_W - 15} cy={27} r={4.5} fill={def.color} opacity={0.35}>
          <animate attributeName="r" values="4.5;9;4.5" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Type label */}
      <text x={14} y={28} fill={def.color} fontSize={9} fontWeight={700}
        fontFamily="Inter, system-ui, sans-serif" letterSpacing={1.2}>
        {def.label.toUpperCase()}
      </text>

      {/* Divider */}
      <line x1={12} y1={37} x2={NODE_W - 12} y2={37}
        stroke="rgba(0,0,0,0.06)" strokeWidth={1} />

      {/* Main value — clipped so it can't overflow the card */}
      <text clipPath={`url(#textclip-${node.id})`}
        x={14} y={82} fill="#1E293B" fontSize={13} fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif">
        {subtitle}
      </text>

      {/* Done output strip */}
      {node.output && node.status === 'done' && (
        <>
          <rect y={NODE_H - 24} width={NODE_W} height={24}
            fill={`${def.color}08`} rx={0} />
          <rect y={NODE_H - 24} width={NODE_W} height={1}
            fill={`${def.color}15`} />
          <text x={12} y={NODE_H - 9} fill={def.color} fontSize={9.5}
            fontFamily="'IBM Plex Mono', monospace">
            {node.output.slice(0, 30)}{node.output.length > 30 ? '…' : ''}
          </text>
        </>
      )}

      {/* ── Input ports (left) ── */}
      {def.ports.in.map((port, i) => {
        const count = def.ports.in.length;
        const py = NODE_H / 2 + (i - (count - 1) / 2) * 28;
        return (
          <g key={port}
            onMouseUp={e => { e.stopPropagation(); onPortMouseUp(port, 'left'); }}
            style={{ cursor: 'crosshair' }}>
            {/* Larger hit area */}
            <circle cx={0} cy={py} r={PORT_HIT} fill="transparent" />
            {/* Port dot */}
            <circle cx={0} cy={py} r={PORT_R} fill="white"
              stroke={def.border} strokeWidth={2} />
            {/* Label OUTSIDE the card, to the left */}
            <text x={-11} y={py + 3.5} fill="#94A3B8" fontSize={9}
              fontFamily="'IBM Plex Mono', monospace" textAnchor="end">
              {port}
            </text>
          </g>
        );
      })}

      {/* ── Output ports (right) ── */}
      {def.ports.out.map((port, i) => {
        const count = def.ports.out.length;
        const py = NODE_H / 2 + (i - (count - 1) / 2) * 28;
        return (
          <g key={port}
            onMouseDown={e => { e.stopPropagation(); onPortMouseDown(port, 'right', e); }}
            style={{ cursor: 'crosshair' }}>
            <circle cx={NODE_W} cy={py} r={PORT_HIT} fill="transparent" />
            <circle cx={NODE_W} cy={py} r={PORT_R} fill={def.color} opacity={0.9} />
            {/* Label OUTSIDE the card, to the right */}
            <text x={NODE_W + 11} y={py + 3.5} fill="#94A3B8" fontSize={9}
              fontFamily="'IBM Plex Mono', monospace" textAnchor="start">
              {port}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ─── Smart Tips ────────────────────────────────────────────────────────── */
interface Tip { icon: string; text: string; level: 'info' | 'warn' | 'great'; }

function getNodeTips(node: PipelineNode): Tip[] {
  const tips: Tip[] = [];
  const cfg = node.config;

  if (node.type === 'llm') {
    const model = String(cfg.model || '');
    const temp  = Number(cfg.temperature ?? 0.7);
    const tok   = Number(cfg.max_tokens  ?? 1024);

    if (model.includes('gpt-4o') && !model.includes('mini'))
      tips.push({ icon: '💸', text: 'GPT-4o is powerful but pricey — $5/M input tokens. Consider gpt-4o-mini for drafts.', level: 'warn' });
    if (model.includes('gpt-4o-mini'))
      tips.push({ icon: '💰', text: 'Smart pick! GPT-4o-mini costs 15× less than GPT-4o with ~90% of the quality.', level: 'great' });
    if (model.includes('claude-haiku') || model.includes('haiku'))
      tips.push({ icon: '⚡', text: 'Haiku is blazing fast (200 tok/s) and ultra-cheap. Perfect for real-time apps!', level: 'great' });
    if (model.includes('claude-sonnet'))
      tips.push({ icon: '✨', text: 'Great choice! Sonnet hits the sweet spot — strong reasoning at reasonable cost.', level: 'great' });
    if (model.includes('claude-opus'))
      tips.push({ icon: '🧠', text: 'Opus = maximum intelligence. Costly at ~$15/M — reserve for complex reasoning.', level: 'warn' });
    if (model.includes('deepseek'))
      tips.push({ icon: '🔥', text: 'Oh wow, DeepSeek R1! Near-GPT-4 quality at fraction of the cost. Great call!', level: 'great' });
    if (model.includes('llama'))
      tips.push({ icon: '🦙', text: 'Open-source champion! Run locally for zero API cost + full data privacy.', level: 'great' });
    if (model.includes('gemini'))
      tips.push({ icon: '♊', text: 'Gemini Flash has a massive 1M context window — ideal for huge documents.', level: 'info' });

    if (temp > 0.85)
      tips.push({ icon: '🎲', text: `Temperature ${temp} is high → creative but unpredictable. Use <0.3 for factual tasks.`, level: 'warn' });
    if (temp < 0.2)
      tips.push({ icon: '🎯', text: `Low temperature (${temp}) → very consistent. Great for structured outputs & JSON.`, level: 'info' });
    if (tok > 3000)
      tips.push({ icon: '📏', text: `Max tokens ${tok} = higher cost per call. Only use if you need long responses.`, level: 'warn' });
    if (tok <= 512)
      tips.push({ icon: '✂️', text: `${tok} max tokens is tight — responses will be cut short if too long.`, level: 'warn' });
  }

  if (node.type === 'retriever') {
    const strategy = String(cfg.strategy || '');
    const topK     = Number(cfg.top_k ?? 5);
    const chunk    = Number(cfg.chunk_size ?? 512);

    if (strategy === 'Hybrid')
      tips.push({ icon: '🏆', text: 'Hybrid search combines dense vectors + BM25 — consistently best retrieval accuracy!', level: 'great' });
    if (strategy === 'Dense Vector')
      tips.push({ icon: '🔢', text: 'Dense vectors excel at semantic similarity. Add BM25 (Hybrid) for keyword matches too.', level: 'info' });
    if (strategy === 'BM25')
      tips.push({ icon: '🔤', text: 'BM25 is fast & keyword-exact. Misses paraphrased queries — consider Hybrid.', level: 'info' });
    if (strategy === 'Cross-Encoder')
      tips.push({ icon: '🎓', text: 'Cross-encoder = highest precision but slowest. Best as a re-ranking step after dense retrieval.', level: 'info' });
    if (topK > 10)
      tips.push({ icon: '⚠️', text: `Top-K ${topK} is high — more context tokens sent to LLM = higher cost + slower. Try 5–7.`, level: 'warn' });
    if (topK <= 3)
      tips.push({ icon: '🎯', text: `Top-K ${topK} is very selective. Great for precision, but may miss relevant context.`, level: 'info' });
    if (chunk < 256)
      tips.push({ icon: '🧩', text: `Chunk size ${chunk} is small — fine-grained retrieval. Good for Q&A, less for summaries.`, level: 'info' });
    if (chunk > 1024)
      tips.push({ icon: '📦', text: `Chunk size ${chunk} is large — more context per chunk. May dilute relevance scores.`, level: 'warn' });
  }

  if (node.type === 'router') {
    const strategy = String(cfg.strategy || '');
    if (strategy === 'Intent-based')
      tips.push({ icon: '🧠', text: 'Intent routing uses an LLM classifier — smart but adds latency. Great for complex flows.', level: 'info' });
    if (strategy === 'Score-based')
      tips.push({ icon: '📊', text: 'Score-based routing is fast & deterministic. Perfect for confidence threshold decisions.', level: 'great' });
    if (strategy === 'Round-robin')
      tips.push({ icon: '🔄', text: 'Round-robin distributes load evenly — useful for A/B testing different model configs.', level: 'info' });
    tips.push({ icon: '💡', text: 'Routers save cost! Route simple queries to cheap models, complex ones to powerful models.', level: 'great' });
  }

  if (node.type === 'input') {
    tips.push({ icon: '📥', text: 'The Input node is your pipeline\'s entry point. Connect its output to LLM prompt or Retriever query ports.', level: 'info' });
    tips.push({ icon: '💡', text: 'Tip: Add a Retriever between Input → LLM to build a RAG pipeline that grounds answers in your docs.', level: 'info' });
  }

  if (node.type === 'output') {
    const format = String(cfg.format || 'Text');
    if (format === 'JSON')
      tips.push({ icon: '📋', text: 'JSON output — make sure your LLM system prompt instructs it to respond in valid JSON.', level: 'info' });
    if (format === 'Markdown')
      tips.push({ icon: '✍️', text: 'Markdown output is great for chat UIs. Pair with a renderer like react-markdown.', level: 'info' });
    tips.push({ icon: '🏁', text: 'Output node captures the final result. Connect from your last LLM or Router node.', level: 'info' });
  }

  return tips.slice(0, 3); // max 3 tips
}

function SmartTips({ node }: { node: PipelineNode }) {
  const tips = getNodeTips(node);
  if (tips.length === 0) return null;

  const levelStyle: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    great: { bg: 'rgba(5,150,105,0.05)',  border: 'rgba(5,150,105,0.2)',  icon: <Sparkles className="w-3 h-3 text-[#059669]" /> },
    warn:  { bg: 'rgba(217,119,6,0.05)',  border: 'rgba(217,119,6,0.2)',  icon: <AlertTriangle className="w-3 h-3 text-[#D97706]" /> },
    info:  { bg: 'rgba(91,0,232,0.04)',   border: 'rgba(91,0,232,0.14)',  icon: <Lightbulb className="w-3 h-3 text-[#5B00E8]" /> },
  };

  return (
    <div className="px-4 pb-4 space-y-2.5">
      <div className="flex items-center gap-1.5 pt-1">
        <Zap className="w-3 h-3 text-[#5B00E8]" />
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Smart Tips</p>
      </div>
      <AnimatePresence mode="popLayout">
        {tips.map((tip, i) => {
          const style = levelStyle[tip.level];
          return (
            <motion.div key={tip.text}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
              className="rounded-xl px-3 py-2.5 flex gap-2.5 items-start"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}>
              <span className="text-[13px] flex-shrink-0 leading-none mt-0.5">{tip.icon}</span>
              <p className="text-[11px] leading-relaxed text-[#374151]">{tip.text}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─── Config panel ──────────────────────────────────────────────────────── */
function ConfigPanel({ node, onUpdate, onClose, onDelete }: {
  node: PipelineNode; onUpdate: (key: string, value: string | number) => void;
  onClose: () => void; onDelete: () => void;
}) {
  const def  = NODE_DEFS[node.type];
  const Icon = def.icon;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute right-0 top-0 bottom-0 w-72 flex flex-col"
      style={{ background: '#FAFAFA', borderLeft: '1.5px solid rgba(91,0,232,0.1)', zIndex: 30, boxShadow: '-6px 0 32px rgba(91,0,232,0.07)' }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5"
        style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)', background: 'white' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: def.bg, border: `1.5px solid ${def.border}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: def.color } as React.CSSProperties} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#0D0D0D]">{def.label}</p>
          <p className="text-[10px]" style={{ color: def.color }}>Configure node</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F4F2FF] transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {def.configFields.map(field => (
          <div key={field.key}>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-1.5">
              {field.label}
            </label>
            {field.type === 'select' ? (
              <div className="relative">
                <select
                  value={String(node.config[field.key] ?? '')}
                  onChange={e => onUpdate(field.key, e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[12px] text-[#0D0D0D] outline-none appearance-none cursor-pointer pr-8"
                  style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' }}>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none" />
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                value={String(node.config[field.key] ?? '')}
                onChange={e => onUpdate(field.key, e.target.value)}
                rows={4}
                className="w-full rounded-xl px-3 py-2.5 text-[12px] text-[#0D0D0D] outline-none resize-none"
                style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' }}
                onFocus={e => { e.target.style.borderColor = '#5B00E8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,0,232,0.07)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(91,0,232,0.18)'; e.target.style.boxShadow = 'none'; }}
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={String(node.config[field.key] ?? '')}
                onChange={e => onUpdate(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-[12px] text-[#0D0D0D] outline-none"
                style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.18)' }}
                onFocus={e => { e.target.style.borderColor = '#5B00E8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,0,232,0.07)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(91,0,232,0.18)'; e.target.style.boxShadow = 'none'; }}
              />
            )}
          </div>
        ))}

        {/* Ports info */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.1)' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Port connections</p>
          {def.ports.in.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              <span className="text-[9px] text-[#9CA3AF] mr-1">IN:</span>
              {def.ports.in.map(p => (
                <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8' }}>{p}</span>
              ))}
            </div>
          )}
          {def.ports.out.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] text-[#9CA3AF] mr-1">OUT:</span>
              {def.ports.out.map(p => (
                <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${def.color}12`, color: def.color }}>{p}</span>
              ))}
            </div>
          )}
        </div>

        {node.output && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-[#059669]">
              Last output
            </label>
            <pre className="text-[10.5px] text-[#374151] rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap"
              style={{ background: 'rgba(5,150,105,0.04)', border: '1.5px solid rgba(5,150,105,0.18)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {node.output}
            </pre>
          </div>
        )}
      </div>

      {/* Smart Tips */}
      <SmartTips node={node} />

      {/* Delete */}
      <div className="px-4 py-3 mt-auto" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)' }}>
        <button onClick={onDelete}
          className="w-full h-9 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.15)', color: '#EF4444' }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.05)'; }}>
          <Trash2 className="w-3.5 h-3.5" /> Delete node
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Run modal ─────────────────────────────────────────────────────────── */
function RunModal({ onRun, onClose }: { onRun: (prompt: string) => void; onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(13,13,26,0.5)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl p-7"
        style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 32px 80px rgba(91,0,232,0.18)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(91,0,232,0.08)', border: '1.5px solid rgba(91,0,232,0.2)' }}>
            <Play className="w-4 h-4 text-[#5B00E8]" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#0D0D0D]">Run Pipeline</h3>
            <p className="text-[12px] text-[#9CA3AF]">Enter a prompt to send through your pipeline</p>
          </div>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
          placeholder="What are the latest advances in quantum computing?"
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-[13px] text-[#0D0D0D] outline-none resize-none mb-5"
          style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }}
          onFocus={e => { e.target.style.borderColor = '#5B00E8'; e.target.style.boxShadow = '0 0 0 3px rgba(91,0,232,0.08)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(91,0,232,0.2)'; e.target.style.boxShadow = 'none'; }}
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl text-[13px] font-medium text-[#374151] transition-all"
            style={{ border: '1.5px solid rgba(91,0,232,0.15)', background: 'white' }}
            onMouseEnter={e => { (e.currentTarget).style.background = '#F4F2FF'; }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'white'; }}>
            Cancel
          </button>
          <button
            onClick={() => prompt.trim() && onRun(prompt.trim())}
            disabled={!prompt.trim()}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 2px 16px rgba(91,0,232,0.35)' }}>
            <Play className="w-3.5 h-3.5" /> Run pipeline
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Keyboard help modal ───────────────────────────────────────────────── */
function KeyboardHelpModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'Delete / Backspace', desc: 'Remove selected node' },
    { key: 'Scroll wheel',       desc: 'Zoom in / out' },
    { key: 'Drag canvas',        desc: 'Pan the viewport' },
    { key: 'Drag node',          desc: 'Move node' },
    { key: '● drag → ○',        desc: 'Draw edge between ports' },
    { key: 'Dbl-click edge',     desc: 'Delete that edge' },
    { key: 'Esc',                desc: 'Deselect node' },
    { key: '?',                  desc: 'Toggle this help' },
  ];
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(13,13,26,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="rounded-2xl p-6 w-80"
        style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 24px 64px rgba(91,0,232,0.18)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-[#0D0D0D]">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F4F2FF] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between py-1.5"
              style={{ borderBottom: '1px solid rgba(91,0,232,0.06)' }}>
              <span className="text-[12px] text-[#6B7280]">{s.desc}</span>
              <kbd className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                style={{ background: '#F4F2FF', border: '1px solid rgba(91,0,232,0.18)', color: '#5B00E8' }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-4 text-center">Click anywhere or press ? to close</p>
      </motion.div>
    </div>
  );
}

/* ─── Main Playground ───────────────────────────────────────────────────── */
export default function Playground() {
  useAuth();
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes]           = useState<PipelineNode[]>(STARTER_NODES);
  const [edges, setEdges]           = useState<Edge[]>(STARTER_EDGES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom]             = useState(1);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [showHelp, setShowHelp]     = useState(false);

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
    setNodes(prev => [...prev, {
      id, type,
      x: snap(120 + Math.random() * 260),
      y: snap(80 + Math.random() * 220),
      config: { ...def.defaultConfig }, status: 'idle',
    }]);
    setSelectedId(id);
  };

  const startDrag = useCallback((id: string, e: React.MouseEvent) => {
    const node = nodes.find(n => n.id === id)!;
    dragging.current = { id, ox: node.x, oy: node.y, startX: e.clientX, startY: e.clientY };
  }, [nodes]);

  const startPan = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'svg') {
      panning.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const dx = (e.clientX - dragging.current.startX) / zoom;
      const dy = (e.clientY - dragging.current.startY) / zoom;
      setNodes(prev => prev.map(n => n.id === dragging.current!.id
        ? { ...n, x: snap(dragging.current!.ox + dx), y: snap(dragging.current!.oy + dy) } : n));
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
      const inInput = (e.target as Element).closest('input,textarea,select');
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !inInput) {
        setNodes(prev => prev.filter(n => n.id !== selectedId));
        setEdges(prev => prev.filter(ed => ed.fromNode !== selectedId && ed.toNode !== selectedId));
        setSelectedId(null);
      }
      if (e.key === 'Escape' && !inInput) { setSelectedId(null); setShowHelp(false); }
      if (e.key === '?' && !inInput) setShowHelp(v => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(2.5, z - e.deltaY * 0.0008)));
  };

  const fitView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const runPipeline = async (prompt: string) => {
    setShowRunModal(false); setIsRunning(true);
    const order: NodeType[] = ['input', 'retriever', 'router', 'llm', 'output'];
    const sortedNodes = [...nodes].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const MOCK: Record<NodeType, string> = {
      input:     prompt,
      retriever: `Retrieved 5 chunks.\n[1] Context about "${prompt.split(' ').slice(0, 3).join(' ')}"…\n[2] Related docs…`,
      router:    `Routed → ${Math.random() > 0.5 ? 'Technical' : 'General'} branch`,
      llm:       `Here is a comprehensive answer about "${prompt.slice(0, 38)}…"\n\nKey aspects: core principles, recent developments, practical applications.`,
      output:    `✓ Delivered · Tokens: ${Math.floor(Math.random() * 400 + 200)} · Latency: ${(Math.random() * 2 + 0.8).toFixed(1)}s`,
    };
    for (const node of sortedNodes) {
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'running', output: undefined } : n));
      await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'done', output: MOCK[node.type] } : n));
    }
    setIsRunning(false);
  };

  const clearCanvas = () => { setNodes([]); setEdges([]); setSelectedId(null); };
  const selectedNode = nodes.find(n => n.id === selectedId) ?? null;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Toolbar ── */}
      <div className="h-[52px] flex-shrink-0 flex items-center justify-between px-4 gap-3 bg-white"
        style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)', boxShadow: '0 1px 8px rgba(91,0,232,0.04)', zIndex: 20 }}>

        {/* Left group */}
        <div className="flex items-center gap-2">
          <input
            value={pipelineName}
            onChange={e => setPipelineName(e.target.value)}
            className="text-[13px] font-bold text-[#0D0D0D] bg-transparent outline-none border-b-2 border-transparent focus:border-[#5B00E8] transition-colors px-1 min-w-[110px]"
          />

          {/* Save */}
          <div className="relative">
            <button onClick={() => { setShowSaveMenu(v => !v); setShowLoadMenu(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: 'rgba(91,0,232,0.06)', border: '1.5px solid rgba(91,0,232,0.18)', color: '#5B00E8' }}>
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <AnimatePresence>
              {showSaveMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-10 left-0 rounded-xl p-3 w-52 z-50 bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 12px 40px rgba(91,0,232,0.14)' }}>
                  <p className="text-[9px] text-[#9CA3AF] uppercase tracking-widest mb-2">Save as</p>
                  <input value={pipelineName} onChange={e => setPipelineName(e.target.value)}
                    className="w-full rounded-lg px-3 py-1.5 text-[12px] text-[#0D0D0D] outline-none mb-2"
                    style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.2)' }} />
                  <button onClick={savePipeline} className="w-full h-8 rounded-lg text-[12px] font-semibold text-white"
                    style={{ background: '#5B00E8' }}>
                    Save pipeline
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Load */}
          <div className="relative">
            <button onClick={() => { setShowLoadMenu(v => !v); setShowSaveMenu(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
              style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.12)', color: '#374151' }}>
              <FolderOpen className="w-3.5 h-3.5" /> Load <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
            <AnimatePresence>
              {showLoadMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-10 left-0 rounded-xl p-2 w-56 z-50 bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 12px 40px rgba(91,0,232,0.14)' }}>
                  {pipelines.length === 0 ? (
                    <p className="text-[12px] text-[#9CA3AF] px-2 py-4 text-center">No saved pipelines</p>
                  ) : pipelines.map(p => (
                    <button key={p.name} onClick={() => loadPipeline(p)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-all"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F4F2FF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <p className="text-[12px] font-semibold text-[#374151]">{p.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{new Date(p.savedAt).toLocaleDateString()}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={clearCanvas}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.15)', color: '#EF4444' }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(239,68,68,0.05)'; }}>
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>

        {/* Center zoom */}
        <div className="flex items-center gap-1 rounded-xl px-2 py-1"
          style={{ background: '#F4F2FF', border: '1px solid rgba(91,0,232,0.12)' }}>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#5B00E8] transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[#6B7280] w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#5B00E8] transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(91,0,232,0.15)' }} />
          <button onClick={fitView}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#5B00E8] transition-colors"
            title="Fit to view">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Help button */}
        <button onClick={() => setShowHelp(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#5B00E8] hover:bg-[#F4F2FF] transition-all"
          title="Keyboard shortcuts (?)">
          <span className="text-[13px] font-bold">?</span>
        </button>

        {/* Run */}
        <button
          onClick={() => setShowRunModal(true)}
          disabled={isRunning || nodes.length === 0}
          className="flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: isRunning ? '#7C3AED' : 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 2px 14px rgba(91,0,232,0.35)' }}
          onMouseEnter={e => { if (!isRunning) (e.currentTarget).style.boxShadow = '0 4px 20px rgba(91,0,232,0.5)'; }}
          onMouseLeave={e => { (e.currentTarget).style.boxShadow = '0 2px 14px rgba(91,0,232,0.35)'; }}>
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Running…' : 'Run Pipeline'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Node palette ── */}
        <div className="w-[172px] flex-shrink-0 flex flex-col gap-1 p-3 overflow-y-auto bg-white"
          style={{ borderRight: '1.5px solid rgba(91,0,232,0.08)' }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] px-2 mb-2 mt-1">
            Node Types
          </p>
          {(Object.entries(NODE_DEFS) as [NodeType, typeof NODE_DEFS[NodeType]][]).map(([type, def]) => {
            const Icon = def.icon;
            return (
              <button key={type} onClick={() => addNode(type)}
                className="group flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all"
                style={{ border: `1.5px solid ${def.border}`, background: 'white' }}
                onMouseEnter={e => { (e.currentTarget).style.background = def.bg; (e.currentTarget).style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { (e.currentTarget).style.background = 'white'; (e.currentTarget).style.transform = ''; }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: def.bg, border: `1px solid ${def.border}` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: def.color } as React.CSSProperties} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#374151] leading-none">{def.label}</p>
                  <p className="text-[9px] text-[#9CA3AF] mt-0.5">
                    {def.ports.in.length}in · {def.ports.out.length}out
                  </p>
                </div>
                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0"
                  style={{ color: def.color }} />
              </button>
            );
          })}

          <div className="mt-4 px-2 pt-3" style={{ borderTop: '1px solid rgba(91,0,232,0.08)' }}>
            <p className="text-[9px] text-[#9CA3AF] leading-relaxed">
              <span className="font-semibold">Click</span> to add node<br />
              <span className="font-semibold">Drag</span> to rearrange<br />
              <span className="font-semibold">●→○</span> to connect ports<br />
              <span className="font-semibold">Delete</span> to remove selected
            </p>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#F4F2FF' }}>
          {/* Grid dots pattern */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(91,0,232,0.12) 1px, transparent 1px)`,
              backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
              backgroundPosition: `${pan.x % (GRID * zoom)}px ${pan.y % (GRID * zoom)}px`,
            }} />

          <svg ref={svgRef} className="w-full h-full" style={{ cursor: 'default' }}
            onMouseDown={e => { startPan(e); setSelectedId(null); setShowSaveMenu(false); setShowLoadMenu(false); }}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onWheel={onWheel}>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

              {/* Edges */}
              {edges.map(edge => {
                const fromNode = nodes.find(n => n.id === edge.fromNode);
                const toNode   = nodes.find(n => n.id === edge.toNode);
                if (!fromNode || !toNode) return null;
                const def  = NODE_DEFS[fromNode.type];
                const from = portPos(fromNode, edge.fromPort, 'right');
                const to   = portPos(toNode,   edge.toPort,   'left');
                const isDone = fromNode.status === 'done';
                return (
                  <g key={edge.id}>
                    {/* Glow for done state */}
                    {isDone && (
                      <path d={bezierPath(from.x, from.y, to.x, to.y)}
                        fill="none" stroke={def.color} strokeWidth={6} strokeOpacity={0.08} />
                    )}
                    <path d={bezierPath(from.x, from.y, to.x, to.y)}
                      fill="none" stroke={def.color} strokeWidth={isDone ? 2 : 1.5}
                      strokeOpacity={isDone ? 0.7 : 0.4}
                      onDoubleClick={() => setEdges(prev => prev.filter(e => e.id !== edge.id))}
                      style={{ cursor: 'pointer' }} />
                  </g>
                );
              })}

              {/* In-progress edge */}
              {drawingEdge && (() => {
                const fromNode = nodes.find(n => n.id === drawingEdge.fromNode);
                if (!fromNode) return null;
                const from = portPos(fromNode, drawingEdge.fromPort, 'right');
                return (
                  <path d={bezierPath(from.x, from.y, drawingEdge.mx, drawingEdge.my)}
                    fill="none" stroke="#5B00E8" strokeWidth={2} strokeDasharray="6 4" strokeOpacity={0.6} />
                );
              })()}

              {/* Nodes */}
              {nodes.map(node => (
                <NodeCard key={node.id} node={node} selected={selectedId === node.id}
                  onSelect={() => setSelectedId(node.id)}
                  onDragStart={e => startDrag(node.id, e)}
                  onPortMouseDown={(port, side, e) => onPortMouseDown(node.id, port, side, e)}
                  onPortMouseUp={(port, side) => onPortMouseUp(node.id, port, side)} />
              ))}
            </g>
          </svg>

          {/* Empty hint */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 bg-white"
                  style={{ border: '2px solid rgba(91,0,232,0.12)', boxShadow: '0 8px 32px rgba(91,0,232,0.1)' }}>
                  <ArrowRight className="w-9 h-9 text-[#5B00E8] opacity-30" />
                </div>
                <p className="text-[16px] font-semibold text-[#374151] mb-1">Your canvas is empty</p>
                <p className="text-[13px] text-[#9CA3AF]">Click a node type on the left panel to get started</p>
              </motion.div>
            </div>
          )}

          {/* Node count badge */}
          {nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] bg-white"
                style={{ border: '1px solid rgba(91,0,232,0.12)', boxShadow: '0 2px 8px rgba(91,0,232,0.06)', color: '#6B7280' }}>
                <span className="font-semibold text-[#5B00E8]">{nodes.length}</span> nodes ·
                <span className="font-semibold text-[#5B00E8]">{edges.length}</span> edges
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

      {/* ── Keyboard help modal ── */}
      <AnimatePresence>
        {showHelp && <KeyboardHelpModal onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </div>
  );
}
