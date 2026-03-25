# Repository Cleanup Inventory Snapshot
Date: 2026-03-25 09:47
Branch: dev (HEAD: 15f9151)

## Worktree Inventory

### Active (keep)
| Path | Branch | HEAD |
|------|--------|------|
| memorimap/ | dev | 15f9151 |

### Claude Worktrees (17개, ~1.1GB) — 삭제 대상
| Name | Branch | HEAD | Merged? | Uncommitted |
|------|--------|------|---------|-------------|
| cool-meitner | claude/cool-meitner | 20f053f | ✅ | settings only |
| crazy-bhabha | claude/crazy-bhabha | 20f053f | ✅ | settings only |
| dazzling-shockley | claude/dazzling-shockley | 20f053f | ✅ | settings+tsbuild |
| dreamy-bartik | claude/dreamy-bartik | bf50e6d | ✅ | settings only |
| exciting-ellis | claude/exciting-ellis | bf95fc7 | ❌ | settings+env+tsbuild |
| festive-brahmagupta | claude/festive-brahmagupta | 5c460ea | ✅ | settings+tsbuild+img |
| interesting-darwin | claude/interesting-darwin | 20f053f | ✅ | settings only |
| laughing-galileo | claude/laughing-galileo | 233f0a1 | ✅ | settings+img |
| magical-margulis | claude/magical-margulis | e3f2335 | ✅ | settings+img+uxuiplan |
| mystifying-easley | claude/mystifying-easley | 5c460ea | ✅ | settings+img |
| naughty-kalam | claude/naughty-kalam | 233f0a1 | ✅ | settings+img |
| objective-hugle | claude/objective-hugle | 20f053f | ✅ | clean |
| recursing-yonath | claude/recursing-yonath | 83fde16 | ❌ | settings+tsbuild+img |
| strange-davinci | claude/strange-davinci | 6dcf72f | ❌ | settings+tsbuild |
| trusting-payne | claude/trusting-payne | 20f053f | ✅ | settings only |
| unruffled-wilson | claude/unruffled-wilson | bf50e6d | ✅ | settings only |
| zealous-yonath | claude/zealous-yonath | 30bc651 | ❌ | settings+tsbuild+img |

Note: 모든 uncommitted 변경은 .claude/settings.local.json, .tsbuildinfo, 이미지 삭제 등 보존 불필요한 항목만 해당.

### Prunable (7개, 디렉토리 이미 삭제됨)
| Registration | HEAD | Status |
|-------------|------|--------|
| .stage_gtm_csp | de27efa | detached, prunable |
| .stage_mobile_cards | de27efa | detached, prunable |
| .stage_reviewed_deploy | ca0f722 | detached, prunable |
| .worktree_de27efa_check | 4304709 | detached, prunable |
| .worktree_payment_main | 004dbd1 | release/payment-main, prunable |
| .worktree_payment_release | 0fc0354 | detached, prunable |
| .worktree_release_local_parity | c661869 | release/local-parity-merge, prunable |

### External (1개, ~347MB)
| Path | Branch | HEAD |
|------|--------|------|
| memorimap-release-check | release-de27efa-check | a36e9c1 |

## Branch Inventory

### Merged into BOTH main & dev (20개) — 삭제 가능
| Branch | Last Commit | Date | Remote? |
|--------|-------------|------|---------|
| backup-ai-restore-point | e9192ce | 2026-02-02 | origin |
| backup/before-phase3 | 3d3518c | 2026-01-21 | origin |
| claude/cool-meitner | 20f053f | 2026-03-13 | - |
| claude/crazy-bhabha | 20f053f | 2026-03-13 | - |
| claude/dazzling-shockley | 20f053f | 2026-03-13 | - |
| claude/dreamy-bartik | bf50e6d | 2026-03-18 | - |
| claude/festive-brahmagupta | 5c460ea | 2026-03-03 | - |
| claude/interesting-darwin | 20f053f | 2026-03-13 | - |
| claude/laughing-galileo | 233f0a1 | 2026-03-01 | - |
| claude/magical-margulis | e3f2335 | 2026-03-03 | - |
| claude/mystifying-easley | 5c460ea | 2026-03-03 | - |
| claude/naughty-kalam | 233f0a1 | 2026-03-01 | - |
| claude/objective-hugle | 20f053f | 2026-03-13 | - |
| claude/recursing-ishizaka | 233f0a1 | 2026-03-01 | - |
| claude/trusting-payne | 20f053f | 2026-03-13 | - |
| claude/unruffled-wilson | bf50e6d | 2026-03-18 | - |
| feat/zustand-migration | 680b379 | 2026-02-02 | origin |
| release-de27efa-check | a36e9c1 | 2026-03-24 | origin |
| release/local-parity-merge | c661869 | 2026-03-24 | origin(main) |
| release/payment-main | 004dbd1 | 2026-03-24 | - |

### NOT merged (6개) — 보류, 내용 검토 후 판단
| Branch | Last Commit | Date | Diff vs dev | 판단 |
|--------|-------------|------|-------------|------|
| claude/exciting-ellis | bf95fc7 | 2026-03-18 | 28파일 +1493/-120 | E2E 테스트, 이미 별도 반영 |
| claude/recursing-yonath | 83fde16 | 2026-03-03 | 42파일 +387/-244 | 타입/보안 리팩토링, 이미 반영 |
| claude/strange-davinci | 6dcf72f | 2026-03-19 | 1파일 +3/-3 | 지도필터 버그, 이미 수정 |
| claude/zealous-yonath | 30bc651 | 2026-03-04 | 12파일 +29/-28 | TS에러 수정, 이미 반영 |
| feature/error-handling-safe | 17fc5cc | 2026-01-21 | 4파일 +105/-16 | 에러로거+스켈레톤, P2 |
| refactor/mobile-layout | 8a47cbc | 2026-03-20 | 24파일 +109/-24 | CSS토큰/dvh, P2 |

### Remote-only branches (origin에만 존재, 로컬 없음)
| Branch | 비고 |
|--------|------|
| origin/claude/kind-brown | 로컬 없음 |
| origin/claude/priceless-feistel | 로컬 없음 |
| origin/claude/sad-saha | 로컬 없음 |
| origin/claude/zealous-agnesi | 로컬 없음 |
| origin/claude/zen-tu | 로컬 없음 |
