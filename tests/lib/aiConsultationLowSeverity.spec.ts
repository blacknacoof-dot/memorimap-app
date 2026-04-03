import { readFileSync } from 'fs';

import { describe, expect, it } from 'vitest';

describe('AI consultation low-severity follow-ups', () => {
  it('persists consultation topic and injects topic into the AI system prompt', () => {
    const consultationView = readFileSync('components/Consultation/ConsultationView.tsx', 'utf8');
    const queries = readFileSync('lib/queries.ts', 'utf8');
    const gemini = readFileSync('lib/gemini.ts', 'utf8');

    expect(consultationView).toContain("topic || '?쇰컲 ?곷떞'");
    expect(queries).toContain('topic: topic ?? null');
    expect(gemini).toContain('${topic}');
  });

  it('uses a shared sangjo contract number generator in both entry points', () => {
    const brandChat = readFileSync('components/sangjo/BrandChat/index.tsx', 'utf8');
    const brandScenario = readFileSync('components/sangjo/BrandScenario/index.tsx', 'utf8');

    expect(brandChat).toContain('generateSangjoContractNumber');
    expect(brandScenario).toContain('generateSangjoContractNumber');
    expect(brandChat).not.toContain("REQ'}-2026-");
    expect(brandScenario).not.toContain("REQ'}-2026-");
  });
});
