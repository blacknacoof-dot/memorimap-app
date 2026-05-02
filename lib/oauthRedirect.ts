import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from './supabaseClient';

const NATIVE_AUTH_SCHEME = 'com.atomcare.memorimap';
const OAUTH_CALLBACK_PATH = '/auth/callback';
const OAUTH_RETURN_PATH_KEY = 'memorimap_oauth_return_path_v1';

type OAuthCallbackParams = {
  code?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  error?: string | null;
  url: string;
};

function shouldDebugAuthRedirect() {
  if (import.meta.env.DEV) return true;
  try {
    return window.localStorage.getItem('memorimap_auth_redirect_debug') === '1';
  } catch {
    return false;
  }
}

function debugAuthRedirect(message: string, meta?: Record<string, unknown>) {
  if (!shouldDebugAuthRedirect()) return;
  console.debug(`[auth-redirect] ${message}`, meta || {});
}

export function isNativeAppRuntime() {
  return Capacitor.isNativePlatform();
}

export function getOAuthRedirectTo() {
  if (isNativeAppRuntime()) {
    return `${NATIVE_AUTH_SCHEME}://auth/callback`;
  }

  return `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
}

export function rememberOAuthReturnPath() {
  if (typeof window === 'undefined') return;

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentPath.includes(OAUTH_CALLBACK_PATH)) return;

  try {
    window.localStorage.setItem(OAUTH_RETURN_PATH_KEY, currentPath || '/');
  } catch {
    // OAuth should continue even when storage is unavailable.
  }
}

function restoreOAuthReturnPath() {
  let storedPath: string | null = null;
  try {
    storedPath = window.localStorage.getItem(OAUTH_RETURN_PATH_KEY);
    window.localStorage.removeItem(OAUTH_RETURN_PATH_KEY);
  } catch {
    storedPath = null;
  }

  const nextPath = storedPath && !storedPath.includes(OAUTH_CALLBACK_PATH) ? storedPath : '/';
  window.history.replaceState(null, '', nextPath);
}

function isOAuthCallbackUrl(parsedUrl: URL) {
  if (parsedUrl.protocol === `${NATIVE_AUTH_SCHEME}:`) {
    return parsedUrl.host === 'auth' && parsedUrl.pathname.startsWith('/callback');
  }

  return parsedUrl.pathname.startsWith(OAUTH_CALLBACK_PATH);
}

function parseOAuthCallbackUrl(rawUrl: string): OAuthCallbackParams | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!isOAuthCallbackUrl(parsedUrl)) return null;

  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  return {
    url: rawUrl,
    code: parsedUrl.searchParams.get('code') || hashParams.get('code'),
    accessToken: hashParams.get('access_token') || parsedUrl.searchParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') || parsedUrl.searchParams.get('refresh_token'),
    error: parsedUrl.searchParams.get('error') || hashParams.get('error'),
  };
}

async function completeOAuthCallback(params: OAuthCallbackParams, source: string) {
  debugAuthRedirect('callback received', {
    source,
    hasCode: !!params.code,
    hasAccessToken: !!params.accessToken,
    hasRefreshToken: !!params.refreshToken,
    error: params.error || null,
  });

  if (params.error) {
    return;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      debugAuthRedirect('exchangeCodeForSession failed', { message: error.message });
      return;
    }
    restoreOAuthReturnPath();
    return;
  }

  if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) {
      debugAuthRedirect('setSession failed', { message: error.message });
      return;
    }
    restoreOAuthReturnPath();
  }
}

export async function handleOAuthCallbackUrl(rawUrl: string, source = 'direct') {
  const params = parseOAuthCallbackUrl(rawUrl);
  if (!params) return false;

  await completeOAuthCallback(params, source);
  return true;
}

export function installNativeOAuthRedirectHandler() {
  if (!isNativeAppRuntime()) return;

  void App.addListener('appUrlOpen', event => {
    void handleOAuthCallbackUrl(event.url, 'appUrlOpen');
  });

  void App.getLaunchUrl().then(launch => {
    if (launch?.url) {
      void handleOAuthCallbackUrl(launch.url, 'getLaunchUrl');
    }
  });
}
