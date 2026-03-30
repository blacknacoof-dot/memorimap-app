import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { PartnerDocumentSection } from './PartnerDetailModal';

describe('PartnerDocumentSection', () => {
  it('shows document buttons for super admin when a document exists', () => {
    const html = renderToStaticMarkup(
      <PartnerDocumentSection
        canViewDocuments={true}
        hasDocument={true}
        isLoading={false}
        isOpening={false}
        onView={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    expect(html).toContain('사업자등록증 보기');
    expect(html).toContain('문서 다운로드');
  });

  it('shows a friendly empty state when the super admin has no document', () => {
    const html = renderToStaticMarkup(
      <PartnerDocumentSection
        canViewDocuments={true}
        hasDocument={false}
        isLoading={false}
        isOpening={false}
        onView={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    expect(html).toContain('등록된 문서가 없습니다.');
    expect(html).not.toContain('사업자등록증 보기');
  });

  it('renders nothing when the user cannot view partner documents', () => {
    const html = renderToStaticMarkup(
      <PartnerDocumentSection
        canViewDocuments={false}
        hasDocument={true}
        isLoading={false}
        isOpening={false}
        onView={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    expect(html).toBe('');
  });
});
