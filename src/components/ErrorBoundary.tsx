import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? <ErrorFallback error={this.state.error} />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6 max-w-md">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{t("errorOccurred")}</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          {error?.message || t("unknownError")}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          {t("refreshPage")}
        </button>
      </div>
    </div>
  );
}
