import React, { useState, useRef, useEffect } from 'react';
import { ViewState, Facility } from '../../types';
import { useFacilities } from '../../hooks/useFacilities';
import { useUser, useClerk } from '../../lib/auth'; // For side menu props
import { Menu, Search, X, Crosshair } from 'lucide-react';

// Components
import MapComponent, { MapRef } from '../MapContainer';
import { SideMenu } from '../SideMenu';
import { FacilitySheet } from '../FacilitySheet';
import { RecommendationStarter } from '../RecommendationStarter';
import { ChatInterface } from '../AI/ChatInterface';

interface MapViewProps {
    viewState: ViewState;
    setViewState: (state: ViewState) => void;
}

const MapView: React.FC<MapViewProps> = ({ viewState, setViewState }) => {
    // 1. Data & State
    const { facilities, loadFacilityDetails } = useFacilities();
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('전체');
    const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatIntent, setChatIntent] = useState<'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general' | null>(null);

    // Auth State for SideMenu
    const { isSignedIn, user } = useUser();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { openSignIn } = useClerk();

    // Map Ref
    const mapRef = useRef<MapRef>(null);

    // 2. Filter Logic
    const filteredFacilities = facilities.filter(f => {
        if (f.name.includes('--------')) return false;
        // Geo Filter: Only filter by bounds if no search query is active to allow global search
        if (currentBounds && !searchQuery) {
            if (!currentBounds.contains([f.lat, f.lng])) return false;
        }
        // Query
        if (searchQuery && !f.name.includes(searchQuery) && !f.address.includes(searchQuery)) return false;
        // Category
        if (selectedFilter !== '전체') {
            if (selectedFilter === '공원묘지') return f.type === 'park' || f.type === 'complex';
            if (selectedFilter === '장례식장') return f.type === 'funeral';
            if (selectedFilter === '봉안시설') return f.type === 'charnel';
            if (selectedFilter === '자연장') return f.type === 'natural';
            if (selectedFilter === '해양장') return f.type === 'sea';
            if (selectedFilter === '동물장례') return f.type === 'pet';
        }
        if (f.type === 'sangjo') return false; // Sangjo separate tab
        return true;
    });

    // 3. Handlers
    const handleFacilitySelect = async (facility: Facility) => {
        setSelectedFacility(facility);
        if (!facility.isDetailLoaded && !facility.id.startsWith('db-')) {
            await loadFacilityDetails(facility.id);
        }
    };

    const handleBoundsChange = (bounds: L.LatLngBounds) => {
        setCurrentBounds(bounds);
    };

    const handleLogin = () => {
        console.log("Login requested");
    };

    const handleLogout = () => {
        console.log("Logout requested");
    };

    // Chat Handler
    const handleSelectIntent = (intent: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general') => {
        setChatIntent(intent);
        setIsChatOpen(true);
    };

    // 4. Render
    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col">
            {/* Top Bar (Search & Menu) */}
            <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="pointer-events-auto bg-white p-3 rounded-xl shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <Menu size={24} className="text-gray-700" />
                    </button>

                    <div className="flex-1 max-w-md pointer-events-auto relative">
                        <div className="bg-white rounded-xl shadow-lg flex items-center p-3 gap-3">
                            <Search size={20} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="시설명 또는 지역 검색..."
                                className="flex-1 bg-transparent outline-none text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')}>
                                    <X size={16} className="text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 pointer-events-auto no-scrollbar">
                    {['전체', '장례식장', '봉안시설', '자연장', '공원묘지', '해양장', '동물장례'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium shadow-md whitespace-nowrap transition-colors ${selectedFilter === filter
                                ? 'bg-primary text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapComponent
                    ref={mapRef}
                    facilities={filteredFacilities}
                    onFacilitySelect={handleFacilitySelect}
                    onBoundsChange={handleBoundsChange}
                />

                {/* My Location Button */}
                <button
                    onClick={() => mapRef.current?.flyToLocation()}
                    className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg z-[900] hover:bg-gray-50 active:scale-95 transition-transform"
                >
                    <Crosshair size={24} className="text-blue-500" />
                </button>
            </div>

            {/* Side Menu */}
            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={setViewState}
                reservationCount={0}
                isLoggedIn={!!isSignedIn}
                user={user ? { name: user.firstName || 'User', email: user.primaryEmailAddress?.emailAddress || '' } : null}
                onLogin={handleLogin}
                onLogout={handleLogout}
            />

            {/* Facility Sheet */}
            {selectedFacility && (
                <FacilitySheet
                    facility={selectedFacility}
                    onClose={() => setSelectedFacility(null)}
                    onBook={() => console.log("Booking clicked")}
                    onToggleCompare={() => console.log("Compare clicked")}
                    onViewMap={() => {
                        setSelectedFacility(null);
                        mapRef.current?.flyToLocation(); // Ideally fly to facility loc, but keeping simple
                    }}
                    isLoggedIn={!!isSignedIn}
                    currentUser={user ? { id: user.id, name: user.firstName || 'User' } : null}
                    onAddReview={(id, content, rating) => console.log("Add review", id, content, rating)}
                    onLoginRequired={() => console.log("Login required")}
                    isInCompareList={false}
                    onOpenAiChat={() => {
                        setSelectedFacility(null);
                        setChatIntent(null); // Facility specific chat
                        setIsChatOpen(true);
                        // Ideally pass active facility to ChatInterface
                    }}
                />
            )}

            {/* AI Chat Layout (Floating) */}
            <div className="absolute bottom-4 right-4 z-[999] pointer-events-auto">
                {isChatOpen ? (
                    <div className="w-[350px] h-[500px] shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-200">
                        <ChatInterface
                            facility={selectedFacility || { id: 'maum-i', name: 'AI 마음이', type: 'assistant', lat: 37.5, lng: 127, address: '서울', rating: 5, reviewCount: 999 } as Facility}
                            allFacilities={facilities}
                            onAction={(action, data) => console.log("AI Action", action, data)}
                            onClose={() => setIsChatOpen(false)}
                            currentUser={user ? { id: user.id, name: user.firstName || 'User' } : null}
                            initialIntent={chatIntent}
                            onSearchFacilities={(region) => {
                                console.log("AI Search region:", region);
                                setSearchQuery(region);
                                return [];
                            }}
                        />
                    </div>
                ) : (
                    <RecommendationStarter
                        onSelectIntent={handleSelectIntent}
                    />
                )}
            </div>
        </div>
    );
};

export default MapView;
