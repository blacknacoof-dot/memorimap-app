import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (file: string): string => readFileSync(path.join(process.cwd(), file), 'utf8');
const authorizedSeller = 'google.com, pub-4865485908744524, DIRECT, f08c47fec0942fa0';

describe('root-domain AdSense ads.txt static resource contract', () => {
  it('contains exactly the approved seller entry, not fallback HTML', () => {
    const contents = read('public/ads.txt');
    expect(contents.trim()).toBe(authorizedSeller);
    expect(contents).not.toMatch(/<html|<head|<!doctype|<script/i);
    expect(contents.endsWith('\n')).toBe(true);
  });

  it('serves static files before routing unmatched paths to the SPA', () => {
    const cfg = JSON.parse(read('vercel.json')) as {
      routes?: Array<{ src?: string; dest?: string; handle?: string }>;
    };
    const routes = cfg.routes ?? [];
    const filesIndex = routes.findIndex(route => route.handle === 'filesystem');
    const fallbackIndex = routes.findIndex(route => route.src === '/(.*)' && route.dest === '/index.html');
    expect(filesIndex).toBeGreaterThanOrEqual(0);
    expect(fallbackIndex).toBeGreaterThan(filesIndex);
    expect(routes.every(route => route.src !== '/ads.txt' || route.dest !== '/index.html')).toBe(true);
  });
});
