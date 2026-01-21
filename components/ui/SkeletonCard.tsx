export function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-100">
            <div className="h-48 bg-gray-200 w-full" />
            <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="flex gap-2 mb-4">
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-10 bg-gray-200 rounded-lg w-full" />
            </div>
        </div>
    );
}
