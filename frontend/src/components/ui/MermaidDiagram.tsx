import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    background: '#0d0b18',
    primaryColor: '#534AB7',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#534AB7',
    lineColor: '#AFA9EC',
    secondaryColor: '#1a1730',
    tertiaryColor: '#0d0b18',
    edgeLabelBackground: '#0d0b18',
    nodeTextColor: '#ffffff',
    clusterBkg: '#1a1730',
  },
  flowchart: { curve: 'basis', useMaxWidth: false },
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
    const render = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError('');
      } catch (e) {
        setError('Diagram rendering failed.');
        console.error(e);
      }
    };
    render();
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-xl p-4 text-[13px]"
        style={{ background: 'rgba(217,119,6,0.06)', border: '1.5px solid rgba(217,119,6,0.2)', color: '#D97706' }}>
        <p className="font-semibold mb-2">⚠️ Diagram rendering failed</p>
        <pre className="text-[10px] text-[#9CA3AF] overflow-auto whitespace-pre-wrap leading-relaxed font-mono">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-40 text-[13px] text-[#9CA3AF]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-[#5B00E8] border-t-transparent animate-spin" />
          Rendering diagram…
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="w-full overflow-auto rounded-xl p-5"
      style={{ background: '#0F0E17', border: '1.5px solid rgba(91,0,232,0.15)' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
