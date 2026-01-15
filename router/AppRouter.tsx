import React, { Suspense, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ViewState } from '../types';
import LoadingFallback from '../components/ui/LoadingFallback';
import { useUser } from '../lib/auth';
import { useFacilities } from '../hooks/useFacilities';

/* Placeholder for views not yet implemented */
const Placeholder: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <p className="text-gray-600">{name} (placeholder)</p>
    </div>
);

// Real View Components - Lazy loaded
const MapView = React.lazy(() => import('../components/views/MapView'));
const SuperAdminDashboard = React.lazy(() => import('../components/SuperAdmin/SuperAdminDashboard'));
const FacilityAdminViewComponent = React.lazy(() => import('../components/FacilityAdminView').then(m => ({ default: m.FacilityAdminView })));
const PartnerInquiryViewComponent = React.lazy(() => import('../components/PartnerInquiryView').then(m => ({ default: m.PartnerInquiryView })));
const SubscriptionPlans = React.lazy(() => import('../components/SubscriptionPlans'));

// Placeholders for views that need more work
const AdminView = () => <Placeholder name="AdminView" />;
const MyPageView = () => <Placeholder name="MyPageView" />;
const FuneralCompanyView = () => <Placeholder name="FuneralCompanyView" />;
const GuideView = () => <Placeholder name="GuideView" />;
const NoticesView = () => <Placeholder name="NoticesView" />;
const SupportView = () => <Placeholder name="SupportView" />;
const SettingsView = () => <Placeholder name="SettingsView" />;

/** Wrapper for FacilityAdminView - provides required props from hooks */
const FacilityAdminWrapper: React.FC = () => {
    const { user } = useUser();
    const { facilities } = useFacilities();
    const navigate = useNavigate();

    const handleNavigate = (view: ViewState, context?: { facilityId?: string }) => {
        switch (view) {
            case ViewState.MAP:
                navigate('/');
                break;
            case ViewState.SUBSCRIPTION_PLANS:
                navigate('/subscription-plans');
                break;
            case ViewState.MY_PAGE:
                navigate('/my-page');
                break;
            default:
                navigate('/');
        }
    };

    return <FacilityAdminViewComponent user={user} facilities={facilities} onNavigate={handleNavigate} />;
};

/** Wrapper for PartnerInquiryView - provides onBack */
const PartnerInquiryWrapper: React.FC = () => {
    const navigate = useNavigate();
    return <PartnerInquiryViewComponent onBack={() => navigate('/')} />;
};

/**
 * AppRouter handles hash‑based routing and maps ViewState values to routes.
 */
const AppRouter: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>(ViewState.MAP);

    // Sync URL hash with viewState
    useEffect(() => {
        // Handle direct access to /admin or /admin/ which might be served by SPA fallback
        if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
            window.location.replace('/#/facility-admin');
            return;
        }

        const syncRoute = () => {
            const hash = window.location.hash;
            switch (hash) {
                case '#/admin':
                    setViewState(ViewState.ADMIN);
                    break;
                case '#/super-admin':
                    setViewState(ViewState.SUPER_ADMIN);
                    break;
                case '#/facility-admin':
                    setViewState(ViewState.FACILITY_ADMIN);
                    break;
                case '#/funeral-company':
                    setViewState(ViewState.FUNERAL_COMPANIES);
                    break;
                case '#/partner-inquiry':
                    setViewState(ViewState.PARTNER_INQUIRY);
                    break;
                default:
                    setViewState(ViewState.MAP);
            }
        };
        syncRoute();
        window.addEventListener('hashchange', syncRoute);
        return () => window.removeEventListener('hashchange', syncRoute);
    }, []);

    return (
        <HashRouter>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Main Map View */}
                    <Route path="/" element={<MapView viewState={viewState} setViewState={setViewState} />} />

                    {/* Admin Views */}
                    <Route path="/admin" element={<AdminView />} />
                    <Route path="/super-admin" element={<SuperAdminDashboard />} />
                    <Route path="/facility-admin" element={<FacilityAdminWrapper />} />
                    <Route path="/funeral-company" element={<FuneralCompanyView />} />

                    {/* User Views */}
                    <Route path="/my-page" element={<MyPageView />} />
                    <Route path="/partner-inquiry" element={<PartnerInquiryWrapper />} />
                    <Route path="/subscription-plans" element={<SubscriptionPlans />} />

                    {/* Static Pages */}
                    <Route path="/guide" element={<GuideView />} />
                    <Route path="/notices" element={<NoticesView />} />
                    <Route path="/support" element={<SupportView />} />
                    <Route path="/settings" element={<SettingsView />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </HashRouter>
    );
};

export default AppRouter;
