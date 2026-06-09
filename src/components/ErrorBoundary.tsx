import { Component, type ReactNode } from "react";
<<<<<<< HEAD
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
=======

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
>>>>>>> 8147ed699500e19414a75bf5b1453de5dd0d55b4
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

<<<<<<< HEAD
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">出错了</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {this.state.error?.message || "应用发生未知错误，请刷新重试。"}
=======
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-xl font-bold mb-2">出错了</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              {this.state.error?.message ?? "未知错误"}
>>>>>>> 8147ed699500e19414a75bf5b1453de5dd0d55b4
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              刷新页面
            </button>
          </div>
<<<<<<< HEAD
        </div>
=======
        )
>>>>>>> 8147ed699500e19414a75bf5b1453de5dd0d55b4
      );
    }
    return this.props.children;
  }
}
