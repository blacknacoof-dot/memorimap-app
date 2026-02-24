import React, { useState, useRef, useEffect } from 'react';
import { ViewState, Facility } from '../../types';
import { useFacilities } from '../../hooks/useFacilities';
import { useUser, useClerk } from '../../lib/auth'; // For side menu props
import { Menu, Crosshair } from 'lucide-react';
import { CategoryFilter } from '../map/CategoryFilter';
import { FacilityCategoryType } from '../../types';
import { REGION_COORDINATES } from '../../constants/regions';
import { SmartSearchInput } from '../AI/SmartSearchInput';

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
    const [selectedFilter, setSelectedFilter] = useState<FacilityCategoryType | '전체'>('전체');
    const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatIntent, setChatIntent] = useState<'funeral_home' | 'memorial_facility' | 'pet_funeral' | null>(null);

    // Auth State for SideMenu
    const { isSignedIn, user } = useUser();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { openSignIn } = useClerk();

    // Map Ref
    const mapRef = useRef<MapRef>(null);

    // 2. Filter Logic
    const filteredFacilities = facilities.filter(f => {
        if (f.name.includes('--------')) return false;

        // Geo Filter
        if (currentBounds && !searchQuery) {
            if (f.lat === undefined || f.lng === undefined) return false;
            if (!currentBounds.contains([f.lat, f.lng])) return false;
        }

        // Query
        if (searchQuery && !f.name.includes(searchQuery) && !f.address.includes(searchQuery)) return false;

        // Category - EXACT MATCH (Strict)
        if (selectedFilter !== '전체') {
            return f.category === selectedFilter;
        }

        // Exclude Sangjo from general map view for now
        if ((f.category as string) === '상조' || f.type === 'sangjo') return false;

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
        // console.log("Login requested");
    };

    const handleLogout = () => {
        // console.log("Logout requested");
    };

    // Chat Handler
    const handleSelectIntent = (intent: 'funeral_home' | 'memorial_facility' | 'pet_funeral') => {
        setChatIntent(intent);
        setIsChatOpen(true);
    };

    // 4. Render
    return (
        <div className="relative h-full w-full overflow-hidden flex flex-col">
            {/* Top Bar (Search & Menu) */}
            <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-3 pb-1 pointer-events-none">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="pointer-events-auto bg-white p-2.5 rounded-xl shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <Menu size={20} className="text-gray-700" />
                    </button>

                    <div className="flex-1 max-w-md pointer-events-auto">
                        <SmartSearchInput
                            compact
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onAction={(type, region) => {
                                if (type === 'urgent') {
                                    handleSelectIntent('funeral_home');
                                } else if (type === 'search') {
                                    setSearchQuery(region);
                                    setSelectedFilter('funeral_home');
                                } else if (type === 'map') {
                                    const coords = Object.entries(REGION_COORDINATES).find(
                                        ([key]) => region.includes(key) || key.includes(region)
                                    );
                                    if (coords) {
                                        mapRef.current?.flyTo(coords[1].center, coords[1].zoom);
                                    }
                                    setSelectedFilter('전체');
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <CategoryFilter
                    selectedCategory={selectedFilter}
                    onSelectCategory={setSelectedFilter}
                />
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapComponent
                    ref={mapRef}
                    facilities={filteredFacilities}
                    onFacilitySelect={handleFacilitySelect}
                    onBoundsChange={handleBoundsChange as (bounds: { getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } }) => void}
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
                    onBook={() => { }}
                    onToggleCompare={() => { }}
                    onViewMap={() => {
                        setSelectedFacility(null);
                        mapRef.current?.flyToLocation(); // Ideally fly to facility loc, but keeping simple
                    }}
                    isLoggedIn={!!isSignedIn}
                    currentUser={user ? { id: user.id, name: user.firstName || 'User' } : null}
                    onAddReview={(id, content, rating) => { }}
                    onLoginRequired={() => { }}
                    isInCompareList={false}
                    onOpenAiChat={() => {
                        setSelectedFacility(null);
                        setChatIntent(null); // Facility specific chat
                        setIsChatOpen(true);
                        // Ideally pass active facility to ChatInterface
                    }}
                />
            )}

            {/* AI Chat Layout (Floating) — hide when side menu is open */}
            {!isMenuOpen && (
                <div className="absolute bottom-4 right-4 z-[999] pointer-events-auto">
                    {isChatOpen ? (
                        <div className="w-[350px] h-[500px] shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-200">
                            <ChatInterface
                                facility={selectedFacility || { id: 'maum-i', name: 'AI 마음이', type: 'assistant', lat: 37.5, lng: 127, address: '서울', rating: 5, reviewCount: 999 } as Facility}
                                allFacilities={facilities}
                                onAction={(action, data) => { }}
                                onClose={() => setIsChatOpen(false)}
                                currentUser={user ? { id: user.id, name: user.firstName || 'User' } : null}
                                initialIntent={chatIntent}
                                onSearchFacilities={(region) => {
                                    // AI Search region
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
            )}
        </div>
    );
};

export default MapView;
