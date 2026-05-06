import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    /* Canvas */
    background: '#ffffff',
    /* Nodes */
    primaryColor: '#EDE9FF',
    primaryTextColor: '#0D0D0D',
    primaryBorderColor: '#5B00E8',
    /* Edges */
    lineColor: '#7C3AED',
    edgeLabelBackground: '#F4F2FF',
    /* Secondary / cluster */
    secondaryColor: '#F4F2FF',
    tertiaryColor: '#F9FAFB',
    clusterBkg: '#F4F2FF',
    clusterBorder: 'rgba(91,0,232,0.25)',
    nodeTextColor: '#0D0D0D',
    /* Typography */
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '13px',
  },
  flowchart: {
    curve: 'basis',
    useMaxWidth: true,
    htmlLabels: true,
    padding: 20,
  },
});

interface MermaidDiagramProps {
  chart: string;
}

let diagramId = 0;

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const id = useRef(`mermaid-${++diagramId}`).current;

  useEffect(() => {
    if (!chart) return;
    setSvg('');
    setError('');
    const render = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (e) {
        setError('Diagram rendering failed.');
        console.error(e);
      }
    };
    render();
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-2xl p-4 text-[13px]"
        style={{ background: 'rgba(217,119,6,0.06)', border: '1.5px solid rgba(217,119,6,0.2)', color: '#D97706' }}>
        <p className="font-semibold mb-2">⚠️ Diagram rendering failed</p>
        <pre className="text-[10px] text-[#9CA3AF] overflow-auto whitespace-pre-wrap leading-relaxed font-mono">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-48 text-[13px] text-[#9CA3AF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(91,0,232,0.15)', borderTopColor: '#5B00E8' }} />
          <span>Rendering diagram…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid-wrap w-full rounded-2xl overflow-x-auto"
      style={{
        background: '#ffffff',
        border: '1.5px solid rgba(91,0,232,0.12)',
        padding: '28px 24px',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
