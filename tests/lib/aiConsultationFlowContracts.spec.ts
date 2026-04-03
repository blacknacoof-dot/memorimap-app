import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('AI consultation flow contracts', () => {
    it('ConsultationView enforces atomic user+facility quota checks for UUID facilities', () => {
        const source = readRepoFile('components/Consultation/ConsultationView.tsx');

        expect(source).toContain("check_and_increment_ai_consult_quotas");
        expect(source).toContain("p_facility_id: facility.id");
        expect(source).toContain("check_and_increment_user_quota");
        expect(source).toContain("quotaExceeded?.reason === 'facility_limit'");
    });

    it('ConsultationView subscribes to consultation status updates for the user view', () => {
        const source = readRepoFile('components/Consultation/ConsultationView.tsx');

        expect(source).toContain("channel(`consultation-user-${consultationId}`)");
        expect(source).toContain("table: 'consultations'");
        expect(source).toContain("event: 'UPDATE'");
        expect(source).toContain("setConsultationStatus(newStatus)");
    });

    it('sangjo contract flows record timeline events after saving contracts', () => {
        const modalContainer = readRepoFile('components/ModalContainer.tsx');
        const brandChat = readRepoFile('components/sangjo/BrandChat/index.tsx');
        const brandScenario = readRepoFile('components/sangjo/BrandScenario/index.tsx');

        expect(modalContainer).toContain('addTimelineEvent');
        expect(brandChat).toContain('addTimelineEvent');
        expect(brandScenario).toContain('addTimelineEvent');
    });

    it('geminiService exposes an explicit mock/real boundary for non-stream chat flows', () => {
        const source = readRepoFile('services/geminiService.ts');

        expect(source).toContain("VITE_GEMINI_SERVICE_MODE");
        expect(source).toContain("SERVICE_MODE === 'real'");
        expect(source).toContain("streamConsultationMessage");
        expect(source).toContain("Real 실패 시 mock fallback");
    });
});
