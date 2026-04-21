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
      <div className="text-semantic-warning text-sm p-4 bg-semantic-warning/10 rounded-lg border border-semantic-warning/20">
        {error}
        <pre className="mt-2 text-xs text-white/40 overflow-auto">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-40 text-white/30 text-sm animate-pulse">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="w-full overflow-auto rounded-xl bg-[#0a0818] p-4 border border-white/5"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
