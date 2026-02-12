# HTML 유효성 검증 보고서 (HTML Validation Report)

## 1. 🚨 Quirks Mode (호환성 모드) 경고
**메시지**: `Page layout may be unexpected due to Quirks Mode`
**원인**:
*   보고서에 명시된 URL(`https://pixel.itemscout.io/`)은 외부 트래킹 스크립트(아이템스카우트 픽셀)와 관련이 있습니다.
*   해당 외부 스크립트가 생성하는 `iframe`이나 문서가 표준 `<!DOCTYPE html>`을 포함하지 않아 발생한 문제입니다.
**해결 방안**:
*   **무시 가능**: 메인 페이지(`index.html`)는 이미 표준 모드(`<!DOCTYPE html>`)로 선언되어 있으므로, 메인 레이아웃에는 영향이 없습니다.
*   외부 서비스(ItemScout) 측의 문제이므로, 우리 코드에서 수정할 수 있는 부분은 없습니다.

## 2. 📝 폼 필드 경고 (Form Field Warnings)
**메시지**:
1.  `A form field element should have an id or name attribute`
2.  `No label associated with a form field`

**원인**:
*   `<input>`, `<select>`, `<textarea>` 등의 폼 요소에 `id`, `name` 속성이 빠져 있거나, 연결된 `<label>` 태그가 없습니다.
*   이는 **접근성(Accessibility)** 및  **자동완성(Autofill)** 기능에 영향을 줍니다.

**해결 방안 (권장)**:
코드 내의 모든 입력 필드에 대해 아래 규칙을 적용해야 합니다.

```html
<!-- 변경 전 (경고 발생) -->
<input type="text" placeholder="이름 입력">

<!-- 변경 후 (권장) -->
<label for="userName">이름</label>
<input 
  id="userName" 
  name="userName" 
  type="text" 
  placeholder="이름 입력" 
  autocomplete="name"
>
```

### 주요 검토 대상 컴포넌트
*   `FuneralSearchForm.tsx` (기존 폼)
*   `SmartSearchInput.tsx` (신규 검색창 구현 시 주의 필요)
*   로그인/회원가입 관련 모달

---
**요약**: Quirks Mode는 외부 스크립트 이슈로 무시해도 안전하며, 폼 필드 경고는 웹 접근성 향상을 위해 점진적으로 개선(ID/Label 추가)하면 됩니다.
