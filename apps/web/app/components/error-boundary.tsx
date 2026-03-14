"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="text-center">
            <h2 className="mb-2 text-lg font-semibold font-mono text-text-primary">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-text-muted">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-primary/10 px-4 py-2 text-sm font-mono text-primary transition-colors hover:bg-primary/20 brutalist-hover"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
