import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[JAR_ERROR_BOUNDARY] Caught component runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#0a0505] text-zinc-200 font-mono text-[11px] rounded-xl border border-red-500/40 shadow-2xl flex flex-col items-center justify-center min-h-[220px] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-300">
              {this.props.fallbackTitle || 'SUBSTRATE MODULE RECOVERY INTERCEPT'}
            </h3>
            <p className="text-[10px] text-zinc-400 max-w-md">
              A runtime computation error was contained safely by the system boundary without crashing the operating workspace.
            </p>
          </div>
          {this.state.error && (
            <div className="p-2.5 bg-black/80 rounded border border-red-900/60 max-w-lg text-[9px] text-red-200/90 text-left font-mono overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 border border-red-500/50 text-red-200 font-bold uppercase text-[9px] transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)]"
          >
            <RefreshCw size={12} />
            <span>RE-INITIALIZE MODULE</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
