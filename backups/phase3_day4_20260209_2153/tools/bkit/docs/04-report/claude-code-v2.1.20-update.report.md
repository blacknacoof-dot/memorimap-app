# Claude Code v2.1.20 심층 업데이트 조사 보고서

> **Summary**: Claude Code v2.1.20 릴리즈 변경사항 심층 분석
>
> **Version**: v2.1.20
> **Release Date**: 2026-01-27
> **Author**: Claude Opus 4.5
> **Report Date**: 2026-01-27

---

## 1. 버전 정보

| 항목 | 내용 |
|------|------|
| 버전 | v2.1.20 |
| 릴리즈 일자 | 2026년 1월 27일 |
| 릴리즈 페이지 | https://github.com/anthropics/claude-code/releases/tag/v2.1.20 |
| 유형 | 안정성 및 UX 개선 중심 업데이트 |

---

## 2. 새로운 기능 (New Features)

### 2.1 편집기 및 UI 개선

| 기능 | 설명 |
|------|------|
| **Arrow Key History Navigation in Vim** | Vim normal 모드에서 커서가 더 이상 이동할 수 없을 때 방향키로 명령어 히스토리 내비게이션 가능 |
| **External Editor Shortcut** | 헬프 메뉴에 Ctrl+G 단축키 추가로 외부 에디터 접근성 향상 |
| **PR Review Status Indicator** | 프롬프트 푸터에 현재 브랜치의 PR 상태 표시 (approved, changes requested, pending, draft) |
| **Task Deletion** | `TaskUpdate` 도구를 통한 작업 삭제 기능 추가 |
| **Dynamic Task List** | 터미널 높이에 따라 작업 목록의 표시 항목 동적 조정 |

### 2.2 플러그인/구성 파일 지원

| 기능 | 설명 |
|------|------|
| **CLAUDE.md Multiple Directories** | `--add-dir` 플래그로 지정된 추가 디렉토리에서 CLAUDE.md 파일 로드 가능 |
| **Config Backups Timestamped** | 타임스탬프가 있는 구성 백업 (최근 5개 유지) |
| **User Permissions** | `/copy` 명령어가 모든 사용자에게 이제 사용 가능 |

### 2.3 UI/UX 개선사항

| 개선 사항 | 설명 |
|----------|------|
| **Rich Markdown for Teammates** | 팀원 메시지가 리치 마크다운 형식(bold, code blocks, lists) 렌더링 |
| **ToolSearch Notifications** | `ToolSearch` 결과가 간단한 알림으로 표시 |
| **PR URL Auto-posting to Slack** | `/commit-push-pr` 스킬이 MCP 도구 설정 시 Slack 채널에 PR URL 자동 게시 |
| **Sandbox Command Enhancements** | `/sandbox` 명령어에 의존성 상태 및 설치 지침 포함 |
| **Thinking Status Animation** | 생각하는 상태에 미묘한 shimmer 애니메이션 추가 |

---

## 3. 버그 수정 (Bug Fixes)

### 3.1 세션 및 상태 관리

| 버그 | 해결 내용 |
|------|----------|
| **Session Compaction** | 세션 압축 문제 수정 (resume이 전체 히스토리 로드하던 문제) |
| **Agent Message Handling** | 에이전트가 작업 중 사용자 메시지 무시하던 문제 해결 |
| **Resume Broken** | fork 대화 힌트에 원본 세션 재개 방법 포함 |

### 3.2 텍스트 렌더링 및 입력 처리

| 버그 | 해결 내용 |
|------|----------|
| **Wide Character Rendering** | 이모지, CJK(한중일 문자) 렌더링 아티팩트 수정 |
| **Arrow Key Input** | 멀티라인에서 up/down 화살표가 커서 이동 우선 처리 |
| **Draft Prompt Loss** | UP 화살표로 히스토리 네비게이션 시 draft prompt 손실 문제 해결 |
| **Ghost Text Flickering** | 슬래시 명령어 입력 중 ghost text 깜빡임 수정 |

### 3.3 도구 및 스크립팅

| 버그 | 해결 내용 |
|------|----------|
| **JSON Parsing with Unicode** | MCP 도구 응답에 특수 유니코드 문자 포함 시 JSON 파싱 에러 수정 |
| **Tool Cancellation Crashes** | 도구 사용 취소 시 충돌 수정 |
| **MCP Tool Names in Analytics** | MCP 도구명이 분석 이벤트에 노출되던 문제 해결 |
| **Binary Files in Memory** | CLAUDE.md의 `@include` 지시자 사용 시 바이너리 파일 메모리 포함 문제 |
| **Socket File Crashes** | 감시 디렉토리에 소켓 파일 존재 시 충돌 문제 해결 |

### 3.4 명령어 및 기능

| 버그 | 해결 내용 |
|------|----------|
| **Duplicate Command Output** | `/context` 같은 명령어에서 중복 출력 수정 |
| **Task List Positioning** | 작업 목록이 주 대화 보기 외에 표시되던 문제 해결 |
| **Syntax Highlighting in Diffs** | 멀티라인 구문(Python docstrings)에서 diff 구문 강조 문제 해결 |
| **Marketplace Source Removal** | 마켓플레이스 소스 제거 시 설정 삭제 문제 |

---

## 4. Breaking Changes

### 4.1 Windows 관리 설정 경로 변경

| 항목 | 이전 | 이후 |
|------|------|------|
| **Windows Managed Settings** | `C:\ProgramData\ClaudeCode\managed-settings.json` | `C:\Program Files\ClaudeCode\managed-settings.json` |

### 4.2 MCP 서버 관리 변경

- **@-mention 제거**: MCP 서버를 @언급으로 활성화/비활성화 불가
- **대체 명령어**: `/mcp enable <server-name>` 또는 `/mcp disable <server-name>` 사용

---

## 5. 플러그인 시스템 관련 변경사항

### 5.1 ${CLAUDE_PLUGIN_ROOT} 변수

**용도**: 플러그인 디렉토리의 절대 경로를 나타내는 환경 변수

**지원 영역**:
- ✅ hooks.json (정상 작동)
- ✅ .mcp.json (정상 작동)
- ❌ **Markdown 파일 (SKILL.md, Agent.md) - 미지원!**

### 5.2 알려진 제한 사항 및 이슈

| 이슈 | GitHub Issue | 상태 | 상세 |
|------|-------------|------|------|
| **Markdown 파일 미지원** | #9354 | ⚠️ Open | `${CLAUDE_PLUGIN_ROOT}`는 JSON 설정에서만 작동, **markdown 파일에서는 미작동** |
| **Windows 경로 호환성** | - | ⚠️ Known | Windows native에서 bash 경로 호환성 부족 |
| **플러그인 캐시 문제** | #15642 | ⚠️ Open | 플러그인 업데이트 후 stale 캐시 디렉토리 참조 |

### 5.3 bkit 저장소 영향 분석

**현재 bkit 문제의 원인 확인**:

```
Error: Cannot find module '.claude/skills/pdca/scripts/pdca-skill-stop.js'
```

**GitHub Issue #9354 확인 결과**:
- `${CLAUDE_PLUGIN_ROOT}` 변수는 **JSON 파일(hooks.json, .mcp.json)**에서만 정상 작동
- **Markdown 파일(SKILL.md, Agent.md)** 내부의 hooks 섹션에서는 변수가 해석되지 않거나 잘못 해석됨
- 이것이 bkit에서 발생하는 경로 오류의 **정확한 원인**

---

## 6. Skills/Agents/Hooks 관련 변경사항

### 6.1 v2.1 시리즈의 주요 개선사항

| 기능 | 설명 |
|------|------|
| **Hot Reload for Skills** | 스킬 업데이트 시 세션 재시작 없이 즉시 이용 가능 |
| **Forked Context** | `context: fork`로 격리된 컨텍스트에서 실행 가능 |
| **Frontmatter Hooks** | YAML frontmatter에 직접 hooks 정의 가능 |
| **Scoped Hooks** | PreToolUse, PostToolUse, Stop hooks를 특정 컴포넌트에 제한 |

### 6.2 Frontmatter Hooks의 제한사항

v2.1.20에서 Frontmatter hooks가 지원되지만:

1. **변수 해석 미지원**: `${CLAUDE_PLUGIN_ROOT}` 등의 변수가 markdown frontmatter에서 해석되지 않음
2. **권장 방식**: global `hooks/hooks.json`으로 통합하는 것이 권장됨

---

## 7. bkit 저장소 대응 전략

### 7.1 문제 요약

| 문제 | 원인 | 영향 |
|------|------|------|
| 스크립트 경로 오류 | `${CLAUDE_PLUGIN_ROOT}`가 SKILL.md에서 미해석 | 10개 skills, 5개 agents 영향 |

### 7.2 해결 방안

#### Option A: hooks.json으로 통합 (권장)

```json
// hooks/hooks.json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "gap-detector",
        "hooks": [{ "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-stop.js" }]
      }
    ]
  }
}
```

**장점**:
- `${CLAUDE_PLUGIN_ROOT}` 정상 작동
- 중앙 집중 관리

**단점**:
- Skills/Agents 파일의 모듈성 감소

#### Option B: 상대 경로 사용

```yaml
# skills/pdca/SKILL.md
hooks:
  Stop:
    - hooks:
        - type: command
          command: "node ../../scripts/pdca-skill-stop.js"
```

**장점**: 변수 의존성 없음
**단점**: 경로 깊이에 따라 복잡해짐

#### Option C: Claude Code 버그 수정 대기

- GitHub Issue #9354가 해결될 때까지 대기
- 임시로 Option A 또는 B 적용

### 7.3 권장 조치

1. **단기**: Skills/Agents의 hooks를 `hooks/hooks.json`으로 이동
2. **장기**: Claude Code Issue #9354 해결 후 원래 구조로 복원

---

## 8. MCP 통합 개선사항

| 개선 사항 | 설명 |
|----------|------|
| **Server Toggling** | `/mcp enable/disable [server-name]`으로 빠르게 토글 |
| **Process Cleanup** | orphaned 프로세스 수정 |
| **Timeout Handling** | MCP stdio 서버 타임아웃 시 자식 프로세스 종료 |
| **Analytics Privacy** | MCP 도구명이 분석 이벤트에 노출되지 않음 |

---

## 9. 참고 자료

- [Claude Code v2.1.20 Release Page](https://github.com/anthropics/claude-code/releases/tag/v2.1.20)
- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Plugins Reference Documentation](https://code.claude.com/docs/en/plugins-reference)
- [GitHub Issue #9354 - ${CLAUDE_PLUGIN_ROOT} in command markdown](https://github.com/anthropics/claude-code/issues/9354)
- [GitHub Issue #15642 - Plugin cache stale version](https://github.com/anthropics/claude-code/issues/15642)

---

## 10. 요약

**Claude Code v2.1.20**은 안정성과 사용자 경험 중심의 업데이트입니다.

### 주요 특징
1. **UI/UX 개선**: Vim 지원, PR 상태 표시, 향상된 알림 시스템
2. **안정성 강화**: 세션 압축, 문자 렌더링, JSON 파싱 버그 수정
3. **플러그인 시스템**: Frontmatter hooks 지원 (단, 변수 해석 미지원)

### bkit 영향
- **GitHub Issue #9354 확인**: `${CLAUDE_PLUGIN_ROOT}`가 markdown 파일에서 미지원
- **해결책**: hooks.json으로 통합 또는 상대 경로 사용

---

**Generated by**: bkit Deep Research Agent
**Timestamp**: 2026-01-27T09:00:00.000Z
