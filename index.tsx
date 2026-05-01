import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import './lib/analytics';
import { Capacitor } from '@capacitor/core';
import { ClerkProviderWrapper } from './lib/auth';
import { installChunkRecoveryHandlers } from './lib/chunkRecovery';

const isNativeApp = Capacitor.isNativePlatform();

if (isNativeApp) {
  document.documentElement.classList.add('native-app');
  document.body.classList.add('native-app');
  try {
    window.localStorage.setItem('memorimap_welcome_seen_v1', 'true');
  } catch {
    // Native startup should not be blocked when localStorage is unavailable.
  }
  void import('./src/native/native-app.css');
  void import('./src/native/appViewport').then(({ installNativeViewportVars }) => {
    installNativeViewportVars();
  });
}

installChunkRecoveryHandlers({
  currentEntryUrl: import.meta.url,
});

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch runtime errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
          <h1>Application Error</h1>
          <p>앱을 실행하는 중 예기치 않은 오류가 발생했습니다.</p>
          <div style={{ background: '#eee', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            <strong>{this.state.error?.toString()}</strong>
            <br />
            <pre style={{ fontSize: '10px', marginTop: '10px' }}>{this.state.error?.stack}</pre>
          </div>
          <button onClick={() => { window.location.href = '/'; }} style={{ marginTop: '20px', padding: '10px' }}>
            홈으로 이동
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ClerkProviderWrapper>
          <div className={isNativeApp ? 'native-app-shell' : undefined} data-debug={isNativeApp ? 'app-shell' : undefined}>
            <App />
          </div>
        </ClerkProviderWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
