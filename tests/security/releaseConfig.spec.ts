import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('release security configuration', () => {
  it('vercel.json keeps ai-test blocked and production CSP excludes unsafe-eval', () => {
    const vercelConfig = JSON.parse(readRepoFile('vercel.json')) as {
      routes?: Array<Record<string, unknown>>;
      headers?: Array<{ source?: string; headers?: Array<{ key?: string; value?: string }> }>;
    };

    const aiTestRoute = vercelConfig.routes?.find((route) => route.src === '/ai-test\\.html');
    expect(aiTestRoute).toBeTruthy();
    expect(aiTestRoute?.status).toBe(404);

    const cspHeader = vercelConfig.headers
      ?.flatMap((entry) => entry.headers ?? [])
      .find((header) => header.key === 'Content-Security-Policy');

    expect(cspHeader?.value).toBeTruthy();
    expect(cspHeader?.value).not.toContain("'unsafe-eval'");
    expect(cspHeader?.value).toContain("default-src 'self'");
  });

  it('vite production build keeps sourcemaps disabled and strips debugger statements', () => {
    const source = readRepoFile('vite.config.ts');

    expect(source).toContain('sourcemap: false');
    expect(source).toContain("drop: ['debugger']");
  });

  it('tracked client code does not reference server-only secret env vars', () => {
    const clientFiles = [
      'lib/supabaseClient.ts',
      'src/utils/browserDetection.ts',
      'components/ui/OptimizedImage.tsx',
      'lib/queries.ts',
    ];

    for (const file of clientFiles) {
      const source = readRepoFile(file);
      expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(source).not.toContain('NAVER_CLIENT_SECRET');
      expect(source).not.toContain('VITE_SUPABASE_SERVICE_ROLE_KEY');
      expect(source).not.toContain('VITE_NAVER_CLIENT_SECRET');
    }
  });

  it('review image storage stays private and facility marketing images stay public by contract', () => {
    const source = readRepoFile('lib/security/storageImage.ts');

    expect(source).toContain("type StorageImageBucket = 'facility-images' | 'review-images'");
    expect(source).toContain("new Set<StorageImageBucket>(['review-images'])");
    expect(source).toContain("return !PRIVATE_STORAGE_BUCKETS.has(bucket)");
  });
});
