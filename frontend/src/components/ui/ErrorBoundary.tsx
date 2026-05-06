import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

/**
 * Class-based error boundary — catches unhandled render errors and
 * shows a polished fallback UI instead of a blank screen. Wrap any
 * subtree that might throw (e.g., Mermaid diagrams, external data).
 *
 * @example
 * <ErrorBoundary>
 *   <MermaidDiagram chart={...} />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-2xl p-8 flex flex-col items-center text-center"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.15)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
          <p className="text-[15px] font-bold text-[#0D0D0D] mb-2">Something went wrong</p>
          <p className="text-[12px] text-[#9CA3AF] mb-1 max-w-xs leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred in this section.'}
          </p>
          <p className="text-[10px] font-mono text-[#CBD5E1] mb-5">Check the browser console for details.</p>
          <div className="flex gap-3">
            <button onClick={this.reset}
              className="flex items-center gap-2 h-8 px-4 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: 'rgba(91,0,232,0.08)', border: '1.5px solid rgba(91,0,232,0.18)', color: '#5B00E8' }}
              onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(91,0,232,0.14)'; }}
              onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(91,0,232,0.08)'; }}>
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
            <a href="/dashboard"
              className="flex items-center gap-2 h-8 px-4 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.15)', color: '#374151' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F4F2FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
              <Home className="w-3.5 h-3.5" /> Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
