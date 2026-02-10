import React from 'react';

const LoadingFallback: React.FC = () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-gray-400 text-sm">로딩중...</p>
        </div>
    </div>
);

export default LoadingFallback;
