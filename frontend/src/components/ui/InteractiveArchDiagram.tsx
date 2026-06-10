/**
 * InteractiveArchDiagram — Playground-style visual graph for blueprint
 * architectures. View-only (no dragging), but every node is clickable and
 * highlights when selected so the right rail can show its details.
 *
 * Renders the same arch_json shape the backend returns from /v1/architect:
 *   { nodes: [{ id, type, label, description }], edges: [{ from, to }] }
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal, Database, GitBranch, Cpu, CheckCircle2,
  Sparkles, Box, Filter,
} from 'lucide-react';

interface ArchNode {
  id: string;
  type: string;
  label?: string;
  description?: string;
  [k: string]: any;
}
interface ArchEdge {
  from: string;
  to: string;
  [k: string]: any;
}
export interface ArchJson {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

/* ─── Style maps ────────────────────────────────────────────────────── */

const STYLE: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  input:       { color: '#64748B', bg: '#F1F5F9', border: '#94A3B8', icon: Terminal },
  query:       { color: '#64748B', bg: '#F1F5F9', border: '#94A3B8', icon: Terminal },
  user_input:  { color: '#64748B', bg: '#F1F5F9', border: '#94A3B8', icon: Terminal },
  retriever:   { color: '#2563EB', bg: '#EFF6FF', border: '#60A5FA', icon: Database },
  rag:         { color: '#2563EB', bg: '#EFF6FF', border: '#60A5FA', icon: Database },
  vector_store:{ color: '#2563EB', bg: '#EFF6FF', border: '#60A5FA', icon: Database },
  router:      { color: '#D97706', bg: '#FFFBEB', border: '#FBBF24', icon: GitBranch },
  classifier:  { color: '#D97706', bg: '#FFFBEB', border: '#FBBF24', icon: Filter },
  llm:         { color: '#5B00E8', bg: '#F4F2FF', border: '#A78BFA', icon: Cpu },
  model:       { color: '#5B00E8', bg: '#F4F2FF', border: '#A78BFA', icon: Cpu },
  reasoner:    { color: '#5B00E8', bg: '#F4F2FF', border: '#A78BFA', icon: Sparkles },
  output:      { color: '#059669', bg: '#ECFDF5', border: '#34D399', icon: CheckCircle2 },
  response:    { color: '#059669', bg: '#ECFDF5', border: '#34D399', icon: CheckCircle2 },
  result:      { color: '#059669', bg: '#ECFDF5', border: '#34D399', icon: CheckCircle2 },
  default:     { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', icon: Box },
};

function styleFor(type: string) {
  const key = (type || 'default').toLowerCase();
  return STYLE[key] ?? STYLE.default;
}

/* ─── Layout: simple left-to-right BFS columns ────────────────────────── */

function layout(arch: ArchJson, cellW: number, cellH: number, padX = 60, padY = 50) {
  const nodes = arch.nodes ?? [];
  const edges = arch.edges ?? [];

  // Compute depth (longest path from a root) for each node — gives clean columns.
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  nodes.forEach(n => { incoming.set(n.id, []); outgoing.set(n.id, []); });
  edges.forEach(e => {
    incoming.get(e.to)?.push(e.from);
    outgoing.get(e.from)?.push(e.to);
  });

  const depth = new Map<string, number>();
  const visit = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0; // cycle guard
    seen.add(id);
    const parents = incoming.get(id) ?? [];
    const d = parents.length === 0 ? 0 : 1 + Math.max(...parents.map(p => visit(p, seen)));
    depth.set(id, d);
    return d;
  };
  nodes.forEach(n => visit(n.id));

  const cols = new Map<number, string[]>();
  nodes.forEach(n => {
    const d = depth.get(n.id) ?? 0;
    if (!cols.has(d)) cols.set(d, []);
    cols.get(d)!.push(n.id);
  });

  const positions = new Map<string, { x: number; y: number }>();
  const sortedCols = [...cols.entries()].sort((a, b) => a[0] - b[0]);
  sortedCols.forEach(([d, ids]) => {
    const colX = padX + d * (cellW + 80);
    const totalH = ids.length * cellH + (ids.length - 1) * 24;
    const startY = padY + Math.max(0, (260 - totalH) / 2);
    ids.forEach((id, i) => {
      positions.set(id, { x: colX, y: startY + i * (cellH + 24) });
    });
  });

  const maxX = Math.max(...[...positions.values()].map(p => p.x)) + cellW + padX;
  const maxY = Math.max(...[...positions.values()].map(p => p.y)) + cellH + padY;
  return { positions, width: maxX, height: Math.max(360, maxY) };
}

/* ─── Bezier edge path ────────────────────────────────────────────────── */

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

/* ─── Component ──────────────────────────────────────────────────────── */

interface Props {
  arch: ArchJson;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function InteractiveArchDiagram({ arch, selectedId, onSelect }: Props) {
  const CELL_W = 200;
  const CELL_H = 76;

  const { positions, width, height } = useMemo(
    () => layout(arch, CELL_W, CELL_H),
    [arch],
  );

  const nodes = arch.nodes ?? [];
  const edges = arch.edges ?? [];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FAFAFC 0%, #F4F2FF 100%)',
        border: '1.5px solid rgba(91,0,232,0.12)',
        minHeight: 360,
      }}
    >
      {/* Dot grid bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(91,0,232,0.12) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          opacity: 0.4,
        }} />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="relative w-full"
        style={{ display: 'block', maxHeight: 460 }}
        onClick={() => onSelect(null)}
      >
        {/* Edges */}
        <g>
          {edges.map((e, i) => {
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            const x1 = a.x + CELL_W;
            const y1 = a.y + CELL_H / 2;
            const x2 = b.x;
            const y2 = b.y + CELL_H / 2;
            const active = selectedId && (selectedId === e.from || selectedId === e.to);
            return (
              <g key={`edge-${i}`}>
                <path
                  d={bezier(x1, y1, x2, y2)}
                  fill="none"
                  stroke={active ? '#5B00E8' : 'rgba(91,0,232,0.35)'}
                  strokeWidth={active ? 2.2 : 1.5}
                />
                <circle cx={x1} cy={y1} r={3.2} fill={active ? '#5B00E8' : 'rgba(91,0,232,0.55)'} />
                <circle cx={x2} cy={y2} r={3.2} fill={active ? '#5B00E8' : 'rgba(91,0,232,0.55)'} />
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((n, i) => {
            const pos = positions.get(n.id);
            if (!pos) return null;
            const s = styleFor(n.type);
            const Icon = s.icon;
            const isSelected = selectedId === n.id;
            const label = n.label || n.id;

            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); onSelect(n.id); }}
              >
                {/* Glow if selected */}
                {isSelected && (
                  <rect
                    x={-6} y={-6} width={CELL_W + 12} height={CELL_H + 12}
                    rx={16}
                    fill="none"
                    stroke={s.color}
                    strokeOpacity={0.25}
                    strokeWidth={8}
                  />
                )}
                {/* Card */}
                <rect
                  width={CELL_W} height={CELL_H} rx={12}
                  fill="white"
                  stroke={isSelected ? s.color : s.border}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                {/* Top accent strip */}
                <rect width={CELL_W} height={6} rx={12} fill={s.color} opacity={0.9} />
                <rect y={3} width={CELL_W} height={3} fill={s.color} opacity={0.9} />

                {/* Type chip */}
                <foreignObject x={12} y={16} width={CELL_W - 24} height={24}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                      <Icon className="w-3 h-3" style={{ color: s.color }} />
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: s.color }}>
                      {n.type || 'node'}
                    </span>
                  </div>
                </foreignObject>

                {/* Label */}
                <foreignObject x={12} y={42} width={CELL_W - 24} height={CELL_H - 50}>
                  <div className="text-[12px] font-semibold text-[#0D0D0D] leading-tight"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {label}
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}
        </g>
      </svg>

      {/* Hint */}
      <div className="absolute bottom-3 right-4 text-[10px] text-[#9CA3AF] font-medium select-none pointer-events-none">
        Click any node for details
      </div>
    </div>
  );
}
