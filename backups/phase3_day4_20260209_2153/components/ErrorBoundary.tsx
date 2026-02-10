import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * [Phase 2] Global Error Boundary
 * React 컴포넌트 트리에서 발생하는 에러를 캐치하여
 * 사용자 친화적인 fallback UI를 제공
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // 에러 로깅
        console.error('[ErrorBoundary] 에러 발생:', error);
        console.error('[ErrorBoundary] 컴포넌트 스택:', errorInfo.componentStack);

        this.setState({
            error,
            errorInfo
        });

        // 부모 컴포넌트에 에러 알림 (선택적)
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // 개발 환경이 아닐 때만 토스트 표시
        if (process.env.NODE_ENV === 'production') {
            toast.error('일시적인 오류가 발생했습니다.', {
                description: '페이지를 새로고침해 주세요.',
                duration: 5000
            });
        }
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // 커스텀 fallback UI 제공 시 사용
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 기본 fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                            일시적인 오류가 발생했습니다
                        </h1>

                        <p className="text-gray-600 mb-6 text-sm">
                            죄송합니다. 페이지를 표시하는 중 문제가 발생했습니다.<br />
                            다시 시도해 주세요.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left overflow-auto">
                                <p className="text-xs font-mono text-red-600 mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw size={18} />
                                새로고침
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                <Home size={18} />
                                홈으로
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * [Phase 2] Async Error Boundary
 * 비동기 에러를 처리하기 위한 HOC
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
