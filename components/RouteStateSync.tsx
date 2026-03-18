import React, { useEffect } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { ViewState } from '../types';
import { AppRouteLayout, getPathForViewState, parseAppRoute } from '../lib/appRouteConfig';

interface RouteStateSyncProps {
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  setShowLoginModal: (open: boolean) => void;
  onLayoutChange: (layout: AppRouteLayout) => void;
}

export const RouteStateSync: React.FC<RouteStateSyncProps> = ({
  viewState,
  setViewState,
  setShowLoginModal,
  onLayoutChange,
}) => {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const routeSyncKeyRef = React.useRef<string>('');
  const routeSyncSettledRef = React.useRef(false);
  const routeDrivenViews = React.useMemo(
    () => new Set<ViewState>([
      ViewState.ADMIN,
      ViewState.FACILITY_ADMIN,
      ViewState.SUPER_ADMIN,
      ViewState.FUNERAL_COMPANIES,
      ViewState.PARTNER_INQUIRY,
    ]),
    [],
  );
  const parsedRoute = React.useMemo(
    () => parseAppRoute(location.pathname, location.search),
    [location.pathname, location.search],
  );

  useEffect(() => {
    onLayoutChange(parsedRoute.layout);
  }, [onLayoutChange, parsedRoute.layout]);

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`;
    if (routeSyncKeyRef.current !== routeKey) {
      routeSyncKeyRef.current = routeKey;
      routeSyncSettledRef.current = false;
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (parsedRoute.viewState === viewState) {
      routeSyncSettledRef.current = true;
    }
  }, [parsedRoute.viewState, viewState]);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;

    if (parsedRoute.action === 'open-login-modal') {
      setShowLoginModal(true);
    }

    if (parsedRoute.canonicalPath && parsedRoute.canonicalPath !== currentPath) {
      navigate(parsedRoute.canonicalPath, { replace: true });
      return;
    }

    if (parsedRoute.viewState && parsedRoute.viewState !== viewState) {
      const parsedIsRouteDriven = routeDrivenViews.has(parsedRoute.viewState);
      const currentIsRouteDriven = routeDrivenViews.has(viewState);
      if ((parsedIsRouteDriven || currentIsRouteDriven) && !routeSyncSettledRef.current) {
        setViewState(parsedRoute.viewState);
      }
    }
  }, [location.pathname, location.search, navigate, parsedRoute, routeDrivenViews, setShowLoginModal, setViewState, viewState]);

  useEffect(() => {
    if (parsedRoute.layout !== 'main') return;
    if (
      parsedRoute.viewState &&
      routeDrivenViews.has(parsedRoute.viewState) &&
      parsedRoute.viewState !== viewState &&
      !routeSyncSettledRef.current
    ) {
      // Wait for URL -> state sync to settle before pushing state -> URL updates.
      return;
    }

    const targetPath = getPathForViewState(viewState);
    if (location.pathname === targetPath) return;
    navigate(targetPath, { replace: false });
  }, [location.pathname, navigate, parsedRoute.layout, parsedRoute.viewState, routeDrivenViews, viewState]);

  return null;
};
