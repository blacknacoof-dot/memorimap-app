# Claude Code 2.1.23 → 2.1.25 업그레이드 영향 분석 보고서

> **Summary**: Claude Code CLI 2.1.23~2.1.25 릴리즈 변경사항과 bkit 플러그인 v1.4.7 코드베이스 간의 Gap 분석 및 영향 범위 평가
>
> **Project**: bkit Vibecoding Kit
> **Version**: 1.4.7
> **Author**: Claude Opus 4.5 + bkit PDCA
> **Date**: 2026-01-30
> **Status**: Complete

---

## Executive Summary

Claude Code CLI가 2.1.23에서 2.1.25로 업데이트되었습니다. 본 보고서는 bkit 플러그인 v1.4.7의 전체 코드베이스를 한 줄씩 분석하여 새 버전과의 호환성 및 영향 범위를 평가합니다.

**중요**: v2.1.24는 건너뜀 (2.1.23 → 2.1.25 직행)

### 핵심 결론

| 영향 수준 | 변경사항 수 | 즉시 조치 필요 |
|----------|:----------:|:--------------:|
| 🔴 High Impact | 2 | ⚠️ 모니터링 필수 |
| 🟡 Medium Impact | 3 | ⚠️ 모니터링 |
| 🟢 Low/No Impact | 8 | ❌ |

**결론**: bkit v1.4.7은 Claude Code 2.1.25와 **대체로 호환**되나, 알려진 이슈(#21758 allowed-tools validator, #21730 subagent crash)로 인해 **모니터링이 필요**합니다.

---

## 1. Claude Code 2.1.23~2.1.25 릴리즈 상세

### 1.1 버전별 릴리즈 정보

| 버전 | 릴리즈 일시 (UTC) | 작성자 | 특성 |
|------|-------------------|--------|------|
| v2.1.23 | 2026-01-29 01:09:51 | ashwin-ant | 대규모 기능/버그 수정 |
| v2.1.24 | - | - | **건너뜀 (Skip Release)** |
| v2.1.25 | 2026-01-29 21:13:33 | ashwin-ant | Bedrock/Vertex 핫픽스 |

### 1.2 v2.1.23 변경사항 분류

#### Added (추가)
| ID | 변경사항 | 상세 |
|----|---------|------|
| A-01 | **spinnerVerbs 설정** | 커스터마이즈 가능한 스피너 동사 설정 (mode: replace/append) |

#### Fixed (수정)
| ID | 변경사항 | 상세 |
|----|---------|------|
| F-01 | **mTLS/proxy 연결** | 기업 프록시/클라이언트 인증서 사용자 연결 문제 수정 |
| F-02 | **temp directory isolation** | 공유 시스템에서 사용자별 임시 디렉토리 격리 |
| F-03 | **prompt caching race condition** | 프롬프트 캐싱 scope 활성화 시 400 오류 경쟁 상태 수정 |
| F-04 | **headless streaming hooks** | 헤드리스 스트리밍 세션 종료 시 취소되지 않은 비동기 훅 수정 |
| F-05 | **tab completion** | 제안 수락 시 입력 필드 업데이트 안 됨 수정 |
| F-06 | **ripgrep timeout** | 검색 타임아웃이 빈 결과 대신 오류 반환하도록 수정 |

#### Changed (변경)
| ID | 변경사항 | 상세 |
|----|---------|------|
| C-01 | **Bash 타임아웃 표시** | 경과 시간과 함께 타임아웃 기간 표시 |
| C-02 | **PR 상태 표시** | Merged PR에 보라색 상태 표시기 |

#### Performance (성능)
| ID | 변경사항 | 상세 |
|----|---------|------|
| P-01 | **터미널 렌더링** | 최적화된 화면 데이터 레이아웃으로 성능 개선 |

#### IDE 관련
| ID | 변경사항 | 상세 |
|----|---------|------|
| I-01 | **Bedrock 지역 문자열** | Headless 모드에서 모델 옵션 지역 문자열 수정 |

### 1.3 v2.1.25 변경사항 분류

#### Fixed (수정)
| ID | 변경사항 | 상세 |
|----|---------|------|
| F-07 | **Beta header validation** | Bedrock/Vertex 게이트웨이 사용자용 beta header 검증 오류 수정 |

**상세**:
- `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1` 환경 변수 설정 시 오류 회피
- `settings.json`의 `env` 설정에서도 올바르게 인식

---

## 2. 관련 GitHub 이슈 분석

### 2.1 bkit 영향 가능 이슈

| 이슈 | 제목 | 상태 | bkit 영향도 |
|------|------|------|------------|
| **#21758** | Skill validator missing 'allowed-tools' attribute | OPEN | 🔴 **Critical** |
| **#21730** | Session crashes with subagent (regression v2.1.23) | OPEN | 🔴 **High** |
| #21675 | Input box collapses on Termux (regression v2.1.23) | OPEN | 🟢 None |
| #21778 | Vertex AI 400 bad request (regression v2.1.23) | OPEN | 🟢 None |
| #21825 | Browser extension connection broken in v2.1.25 | OPEN | 🟢 None |
| #21815 | Update to v2.1.25 don't work on Windows | OPEN | 🟢 None |

### 2.2 Critical Issue 상세: #21758

**문제**: Claude Code 2.1.23의 skill file validator가 `allowed-tools` 속성을 지원 필드 목록에서 누락

**오류 메시지**:
```
Attribute 'allowed-tools' is not supported in skill files.
Supported: compatibility, description, license, metadata, name.
```

**bkit 영향 범위**: 18개 스킬 파일이 `allowed-tools` 속성 사용

| 스킬 파일 | allowed-tools 사용 |
|-----------|:------------------:|
| skills/pdca/SKILL.md | ✅ |
| skills/starter/SKILL.md | ✅ |
| skills/dynamic/SKILL.md | ✅ |
| skills/enterprise/SKILL.md | ✅ |
| skills/phase-1-schema/SKILL.md ~ phase-9-deployment/SKILL.md | ✅ (10개) |
| skills/code-review/SKILL.md | ✅ |
| skills/claude-code-learning/SKILL.md | ✅ |
| skills/desktop-app/SKILL.md | ✅ |
| skills/mobile-app/SKILL.md | ✅ |
| skills/development-pipeline/SKILL.md | ✅ |

### 2.3 High Issue 상세: #21730

**문제**: 서브에이전트로 미팅 노트 처리 시 반복적 세션 크래시/중단

**Regression 정보**:
- Last Working Version: v2.1.21
- Affected Version: v2.1.23
- 증상: 세션이 예기치 않게 종료, 이전 세션 메모리 없음

**bkit 영향 범위**: 11개 에이전트가 Task 도구를 통해 서브에이전트로 실행

---

## 3. bkit 플러그인 v1.4.7 코드베이스 분석

### 3.1 전체 구조

```
bkit-claude-code/
├── .claude-plugin/
│   ├── plugin.json              # 플러그인 메타데이터
│   └── marketplace.json         # 마켓플레이스 정보
├── agents/                      # 11개 에이전트 정의
├── skills/                      # 21개 스킬 정의
├── hooks/
│   ├── hooks.json               # 훅 설정 (6개 이벤트)
│   └── session-start.js         # 세션 초기화
├── scripts/                     # 39개 스크립트
├── lib/                         # 22개 파일, 132개 함수
├── templates/                   # PDCA 템플릿
└── bkit.config.json             # bkit 설정
```

### 3.2 핵심 구성요소

| 카테고리 | 항목 수 | Claude Code 기능 의존 |
|---------|:------:|----------------------|
| **Skills** | 21개 | allowed-tools, agents, imports |
| **Agents** | 11개 | permissionMode, tools, model |
| **Library Functions** | 132개 | Hook context, stdin/stdout |
| **Scripts** | 39개 | Hook events, process I/O |
| **Hook Events** | 6개 | SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit, PreCompact |

### 3.3 비동기 코드 분석

| 파일 | 비동기 패턴 | 위험도 | 비고 |
|------|-----------|:-----:|------|
| `skill-post.js` | Lazy loading, sync main | 🟢 Safe | v1.4.4에서 동기화됨 |
| `phase9-deploy-stop.js` | async main() | 🟢 Low | Promise 체인만 |
| 기타 37개 스크립트 | 동기 전용 | 🟢 Safe | fs.readFileSync 등 |

**참고**: bkit v1.4.4에서 skill-post.js가 동기 패턴으로 리팩토링되어 F-04 (headless streaming hooks) 영향 최소화

---

## 4. Gap 분석: 변경사항 vs bkit 영향

### 4.1 영향 매트릭스

| 변경 ID | 변경사항 | bkit 관련 코드 | 영향 수준 | 조치 필요 |
|---------|---------|---------------|:--------:|:--------:|
| A-01 | spinnerVerbs | 없음 | 🟢 None | ❌ |
| F-01 | mTLS/proxy | 없음 (네트워크 레이어) | 🟢 None | ❌ |
| F-02 | temp directory | debugLog (docs/ 내부만 사용) | 🟢 None | ❌ |
| F-03 | prompt caching | 없음 (Claude Code 내부) | 🟢 None | ❌ |
| F-04 | headless hooks | skill-post.js | 🟡 Medium | ⚠️ 모니터링 |
| F-05 | tab completion | 없음 (UI 레이어) | 🟢 None | ❌ |
| F-06 | ripgrep timeout | gap-detector, code-analyzer (Grep 사용) | 🟡 Medium | ⚠️ 모니터링 |
| F-07 | beta header | 없음 (API 레이어) | 🟢 None | ❌ |
| C-01 | Bash 타임아웃 | unified-bash-*.js | 🟢 Low | ❌ |
| C-02 | PR 상태 표시 | 없음 (UI 레이어) | 🟢 None | ❌ |
| P-01 | 터미널 렌더링 | outputAllow/outputBlock | 🟢 Low | ❌ |
| I-01 | Bedrock 지역 | 없음 (IDE 전용) | 🟢 None | ❌ |
| **#21758** | allowed-tools validator | **18개 스킬** | 🔴 **High** | ⚠️ **모니터링 필수** |
| **#21730** | subagent crash | **11개 에이전트** | 🔴 **High** | ⚠️ **모니터링 필수** |

### 4.2 상세 분석

#### 🔴 #21758: Skill Validator - allowed-tools 누락 (Critical)

**문제**: Claude Code 2.1.23 skill validator가 `allowed-tools` 속성을 인식하지 못함

**bkit 영향 분석**:
```yaml
# skills/pdca/SKILL.md (예시)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - AskUserQuestion
```

**영향받는 스킬 (18개)**:
- pdca, starter, dynamic, enterprise
- phase-1-schema ~ phase-9-deployment (10개)
- code-review, claude-code-learning
- desktop-app, mobile-app, development-pipeline

**현재 상태**:
- 이슈 OPEN (2026-01-30 기준)
- 실제 실행 시 오류 발생 여부는 런타임 테스트 필요
- validator 경고일 수 있으며 실행은 정상일 가능성 있음

**권장 조치**:
1. 실제 스킬 실행 테스트 수행
2. validator 경고가 blocking인지 확인
3. 이슈 진행 상황 모니터링

#### 🔴 #21730: Subagent Session Crash (High)

**문제**: 서브에이전트 처리 시 세션 크래시 (v2.1.21 → v2.1.23 regression)

**bkit 영향 분석**:
```yaml
# 에이전트 호출 패턴
agents:
  analyze: bkit:gap-detector      # Task tool로 호출
  iterate: bkit:pdca-iterator     # Task tool로 호출
  report: bkit:report-generator   # Task tool로 호출
```

**영향받는 에이전트 (11개)**:
- gap-detector, pdca-iterator, code-analyzer, report-generator
- starter-guide, bkend-expert, design-validator
- enterprise-expert, infra-architect, pipeline-guide, qa-monitor

**현재 상태**:
- 이슈 OPEN (2026-01-30 기준)
- 특정 조건(대용량 입력, MCP 서버 조합)에서 발생
- 모든 서브에이전트 호출에서 발생하는 것은 아님

**권장 조치**:
1. 에이전트 호출 시 세션 안정성 모니터링
2. 크래시 발생 시 단계적 호출로 대체
3. 이슈 진행 상황 모니터링

#### 🟡 F-04: Headless Streaming Hooks 취소 (Medium)

**변경사항**: 헤드리스 스트리밍 세션 종료 시 취소되지 않은 비동기 훅 수정

**관련 bkit 코드**: `scripts/skill-post.js`

```javascript
// skill-post.js - v1.4.4에서 동기 패턴으로 리팩토링
function getCommon() {
  if (!common) {
    common = require('../lib/common.js');  // Lazy loading
  }
  return common;
}
```

**분석**:
- bkit v1.4.4에서 skill-post.js가 동기 패턴으로 리팩토링됨
- stdin 읽기가 `readStdinSync()` 사용
- 헤드리스 모드 영향 최소화

**권장 조치**:
- 현재 코드 유지 (정상 작동 중)
- headless 모드 사용 시 모니터링

#### 🟡 F-06: Ripgrep Timeout 에러 처리 (Medium)

**변경사항**: 검색 타임아웃이 빈 결과 대신 오류 반환하도록 수정

**관련 bkit 코드**: 에이전트의 Grep 도구 사용

```yaml
# agents/gap-detector.md
tools:
  - Read
  - Glob
  - Grep  # ← 간접적으로 ripgrep 사용
  - Task
```

**분석**:
- bkit은 ripgrep을 직접 호출하지 않음
- Claude Code의 Grep 도구를 통해 간접 사용
- gap-detector, code-analyzer 등이 Grep 사용

**영향 시나리오**:
- 대규모 코드베이스에서 Grep 검색 타임아웃 시
- 이전: 빈 결과 반환 (무시됨)
- 이후: 에러 반환 (적절한 처리 필요)

**권장 조치**:
- 에이전트 실행 시 Grep 에러 로그 모니터링
- 대규모 프로젝트 테스트 시 확인

---

## 5. 호환성 테스트 권장사항

### 5.1 자동 테스트 시나리오

```bash
# 1. 스킬 validator 테스트 (#21758)
/pdca plan test-feature
# → validator 경고 발생 여부 확인

# 2. 에이전트 호출 테스트 (#21730)
/pdca analyze test-feature
# → gap-detector 에이전트 세션 안정성 확인

# 3. 대규모 검색 테스트 (F-06)
# Grep 타임아웃 에러 처리 확인
# 대규모 프로젝트에서 code-analyzer 실행

# 4. 전체 PDCA 사이클 테스트
/pdca plan test-feature
/pdca design test-feature
/pdca do test-feature
/pdca analyze test-feature
/pdca report test-feature
```

### 5.2 모니터링 포인트

| 항목 | 모니터링 방법 | 예상 문제 |
|------|-------------|---------|
| allowed-tools validator | 스킬 실행 시 콘솔 출력 | validator 경고/오류 |
| subagent stability | 에이전트 호출 후 세션 상태 | 크래시/중단 |
| ripgrep timeout | Grep 도구 에러 로그 | 대규모 검색 실패 |
| hook execution | `BKIT_DEBUG=true` | 타임아웃, 에러 |

---

## 6. 권장 조치 사항

### 6.1 즉시 조치

| 우선순위 | 항목 | 조건 | 조치 |
|:-------:|------|------|------|
| 🔴 Critical | #21758 모니터링 | 스킬 사용 시 | validator 경고 확인 및 보고 |
| 🔴 High | #21730 모니터링 | 에이전트 호출 시 | 세션 크래시 발생 여부 확인 |

### 6.2 모니터링 권장

| 우선순위 | 항목 | 조건 | 조치 |
|:-------:|------|------|------|
| 🟡 Medium | headless hooks | headless 모드 사용 시 | 타임아웃 로그 모니터링 |
| 🟡 Medium | Grep 에러 처리 | 대규모 프로젝트 | 에러 핸들링 동작 확인 |

### 6.3 이슈 추적

| 이슈 | 상태 | 영향도 | 추적 필요 |
|------|------|--------|:--------:|
| #21758 | OPEN | Critical | ✅ |
| #21730 | OPEN | High | ✅ |
| #21778 | OPEN | None (Vertex 전용) | ❌ |
| #21825 | OPEN | None (Browser 전용) | ❌ |

---

## 7. 향후 개선 고려사항

### 7.1 단기 (v1.4.8 계획)

1. **#21758 대응 준비**
   - `allowed-tools` 대체 방안 검토
   - 이슈 수정 시 즉시 테스트

2. **#21730 대응 준비**
   - 에이전트 폴백 메커니즘 검토
   - 크래시 복구 로직 고려

### 7.2 중기 (v1.5.0 계획)

1. **spinnerVerbs 활용**
   - bkit 커스텀 스피너 메시지 적용 가능
   - 사용자 경험 개선

2. **에러 핸들링 강화**
   - Grep 타임아웃 에러 graceful 처리
   - 에이전트 실패 시 자동 재시도 로직

---

## 8. 결론

### 8.1 호환성 평가

| 평가 항목 | 결과 |
|----------|:----:|
| **전체 호환성** | ⚠️ 대체로 호환 (주의 필요) |
| **즉시 조치 필요** | ❌ 없음 (모니터링만) |
| **모니터링 필요** | ⚠️ 4개 항목 |
| **코드 변경 필요** | ❌ 없음 (현재 기준) |

### 8.2 최종 권장사항

1. **업그레이드 진행**: Claude Code 2.1.25로 업그레이드 가능하나 **모니터링 필수**
2. **테스트 실행**: 기본 PDCA 사이클 및 에이전트 호출 테스트 **강력 권장**
3. **이슈 추적**: #21758, #21730 이슈 진행 상황 지속 모니터링
4. **롤백 준비**: 심각한 문제 발생 시 2.1.22로 롤백 가능하도록 준비

---

## 9. 참고 자료

### 공식 릴리즈

- [Claude Code v2.1.25 Release](https://github.com/anthropics/claude-code/releases/tag/v2.1.25)
- [Claude Code v2.1.23 Release](https://github.com/anthropics/claude-code/releases/tag/v2.1.23)
- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

### 관련 GitHub 이슈

- [#21758 - Skill validator missing 'allowed-tools' attribute](https://github.com/anthropics/claude-code/issues/21758)
- [#21730 - Session crashes/aborts with subagent](https://github.com/anthropics/claude-code/issues/21730)
- [#21599 - spinnerVerbs documentation](https://github.com/anthropics/claude-code/issues/21599)
- [#11960 - CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS bug](https://github.com/anthropics/claude-code/issues/11960)

### 공식 문서

- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Enterprise Network Configuration](https://code.claude.com/docs/en/network-config)

### bkit 내부 문서

- bkit-system/components/agents/_agents-overview.md
- bkit-system/components/skills/_skills-overview.md
- docs/04-report/features/claude-code-2.1.23-upgrade.report.md

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-30 | Initial comprehensive upgrade impact analysis (2.1.23→2.1.25) | Claude Opus 4.5 + bkit |
