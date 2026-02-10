import React, { useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { openInExternalBrowser, getBrowserInfo } from '../utils/browserDetection';

export const ExternalBrowserGuidePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const browser = searchParams.get('browser') || 'kakaotalk';
    const redirectUrl = searchParams.get('redirect') || window.location.origin;
    const [showDebug, setShowDebug] = useState(false);

    const browserGuides: Record<string, { name: string; icon: string; steps: string[] }> = {
        kakaotalk: {
            name: '카카오톡',
            icon: '💬',
            steps: [
                '화면 우측 상단의 ⋯ (더보기) 버튼을 누르세요',
                '\'다른 브라우저로 열기\' 또는 \'Safari에서 열기\'를 선택하세요',
            ],
        },
        naver: {
            name: '네이버',
            icon: '🟢',
            steps: [
                '화면 우측 하단의 ⋯ 버튼을 누르세요',
                '\'Safari에서 열기\' 또는 \'Chrome에서 열기\'를 선택하세요',
            ],
        },
        instagram: {
            name: '인스타그램',
            icon: '📷',
            steps: [
                '화면 우측 상단의 ⋯ 버튼을 누르세요',
                '\'브라우저에서 열기\'를 선택하세요',
            ],
        },
        facebook: {
            name: '페이스북',
            icon: '👍',
            steps: [
                '화면 우측 상단의 ⋯ 버튼을 누르세요',
                '\'브라우저에서 열기\'를 선택하세요',
            ],
        },
        line: {
            name: '라인',
            icon: '💚',
            steps: [
                '화면 우측 상단의 ⋯ 버튼을 누르세요',
                '\'Safari에서 열기\'를 선택하세요',
            ],
        },
    };

    const guide = browserGuides[browser] || browserGuides.kakaotalk;

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(redirectUrl);
            toast.success('✅ 링크가 복사되었습니다! Safari나 Chrome을 열고 주소창에 붙여넣기하세요.');
        } catch (error) {
            // Clipboard API 실패 시 폴백
            const textarea = document.createElement('textarea');
            textarea.value = redirectUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success('✅ 링크가 복사되었습니다!');
        }
    };

    const handleAutoOpen = () => {
        openInExternalBrowser(redirectUrl);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-center">
                    <div className="text-6xl mb-3">{guide.icon}</div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        외부 브라우저에서<br />열어주세요
                    </h1>
                    <p className="text-pink-100 text-sm">
                        {guide.name} 앱에서는 로그인이 제한됩니다
                    </p>
                </div>

                {/* 본문 */}
                <div className="p-6 space-y-6">
                    {/* 안내 박스 */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <span>📱</span>
                            {guide.name}에서 외부 브라우저로 여는 방법
                        </p>
                        <ol className="space-y-2 text-sm text-blue-800">
                            {guide.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-2">
                                    <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="space-y-3">
                        {/* 자동 열기 (Android 주로 작동) */}
                        <button
                            onClick={handleAutoOpen}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <span className="text-lg">🚀</span> 외부 브라우저로 자동 열기
                        </button>

                        {/* URL 복사 */}
                        <button
                            onClick={handleCopyUrl}
                            className="w-full py-4 bg-white border-2 border-pink-500 text-pink-500 font-bold rounded-xl hover:bg-pink-50 transition-all"
                        >
                            <span className="text-lg">📋</span> 링크 복사하기
                        </button>
                    </div>

                    {/* 추가 팁 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <span className="font-bold">💡 복사한 링크 사용법:</span>
                            <br />
                            Safari나 Chrome 브라우저를 열고 주소창에 붙여넣기(Ctrl+V) 하면 정상적으로 이용할 수 있습니다.
                        </p>
                    </div>

                    {/* 디버그 정보 (개발 모드) */}
                    {import.meta.env.DEV && (
                        <div className="border-t pt-4">
                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                {showDebug ? '디버그 정보 숨기기 ▲' : '디버그 정보 보기 ▼'}
                            </button>

                            {showDebug && (
                                <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono">
                                    {/* getBrowserInfo needs to be imported, added import to top */}
                                    <pre className="whitespace-pre-wrap break-all">
                                        {JSON.stringify(getBrowserInfo(), null, 2)}
                                    </pre>
                                    <div className="mt-2 pt-2 border-t border-gray-300">
                                        <p className="font-bold mb-1">Redirect URL:</p>
                                        <p className="break-all text-blue-600">{redirectUrl}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
