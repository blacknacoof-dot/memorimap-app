import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** 자동 복구 최대 횟수 (기본 3) */
    maxAutoRetries?: number;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    /** 자동 복구 시도 횟수 */
    retryCount: number;
    /** 자동 복구 카운트다운 (초) */
    countdown: number;
}

const MAX_AUTO_RETRIES = 3;

/**
 * Error Boundary — 자동 복구 기능 포함
 * 1) 컴포넌트 크래시 감지
 * 2) 자동 상태 리셋 시도 (최대 3회, 2초 간격)
 * 3) 자동 복구 실패 시 정적 에러 UI + 수동 버튼
 */
export class ErrorBoundary extends Component<Props, State> {
    private countdownTimer: ReturnType<typeof setInterval> | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            countdown: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        const maxRetries = this.props.maxAutoRetries ?? MAX_AUTO_RETRIES;

        // 자동 복구 가능하면 2초 후 리셋 시도
        if (this.state.retryCount < maxRetries) {
            this.startAutoRecovery();
        } else if (process.env.NODE_ENV === 'production') {
            toast.error('오류가 반복 발생합니다.', {
                description: '페이지를 새로고침해 주세요.',
                duration: 5000,
            });
        }
    }

    componentWillUnmount() {
        this.clearTimer();
    }

    clearTimer = () => {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    };

    startAutoRecovery = () => {
        this.clearTimer();
        this.setState({ countdown: 2 });

        this.countdownTimer = setInterval(() => {
            this.setState(prev => {
                const next = prev.countdown - 1;
                if (next <= 0) {
                    this.clearTimer();
                    return {
                        hasError: false,
                        error: null,
                        errorInfo: null,
                        retryCount: prev.retryCount + 1,
                        countdown: 0,
                    } as State;
                }
                return { countdown: next } as State;
            });
        }, 1000);
    };

    /** 수동 다시 시도 (상태 리셋, 새로고침 아님) */
    handleRetry = () => {
        this.clearTimer();
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            countdown: 0,
        });
    };

    handleRefresh = () => {
        window.location.href = '/';
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const maxRetries = this.props.maxAutoRetries ?? MAX_AUTO_RETRIES;
            const isAutoRecovering = this.state.retryCount < maxRetries && this.state.countdown > 0;

            // 자동 복구 중: 간단한 로딩 UI
            if (isAutoRecovering) {
                return (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-500">
                                자동 복구 중... ({this.state.countdown}초)
                            </p>
                        </div>
                    </div>
                );
            }

            // 자동 복구 실패: 정적 에러 UI
            return (
                <div className="min-h-[300px] flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                            일시적인 오류가 발생했습니다
                        </h1>

                        <p className="text-gray-600 mb-6 text-sm">
                            자동 복구에 실패했습니다. 아래 버튼을 눌러 다시 시도해 주세요.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-40">
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
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw size={18} />
                                다시 시도
                            </button>

                            <button
                                onClick={this.handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                새로고침
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                <Home size={18} />
                                홈
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
 * HOC: 컴포넌트를 ErrorBoundary로 감싸기
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
