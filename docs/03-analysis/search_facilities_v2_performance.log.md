# search_facilities_v2 Performance Analysis Log

> **Date**: 2026-02-02
> **Purpose**: Document performance characteristics of `search_facilities_v2` RPC
> **Status**: 🟡 Pending Execution

---

## Background

This log serves as the **basis for the `nearby_facilities` RPC hold decision**.

Before creating a new `nearby_facilities` RPC, we must verify:
1. Whether `search_facilities_v2` properly uses GIST index
2. Whether sequential scans occur on large datasets
3. Baseline performance metrics

---

## Test Query Template

```sql
-- Run this in Supabase SQL Editor
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM search_facilities_v2(
  p_lat := 37.5665,           -- Seoul center
  p_lng := 126.9780,
  p_radius := 5000,           -- 5km radius
  p_category := NULL,         -- All categories
  p_limit := 50
);
```

---

## Expected Results (Criteria)

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Index Type** | Index Scan / Index Only Scan | Bitmap Heap Scan | Seq Scan |
| **Execution Time** | < 50ms | 50-200ms | > 200ms |
| **Rows Examined** | ≈ Rows Returned | 2-5x Rows Returned | > 10x Rows Returned |

---

## Execution Log

### Run 1: [DATE PENDING]

```
-- Paste EXPLAIN ANALYZE output here
```

**Analysis:**
- Index Used: [YES/NO]
- Execution Time: [X ms]
- Sequential Scan: [YES/NO]

**Decision:**
- [ ] `nearby_facilities` can proceed
- [x] Continue with `search_facilities_v2` optimization

---

## Conclusion

| Decision | Status |
|----------|--------|
| Create `nearby_facilities` | ⏸️ **HOLD** |
| Reason | Pending performance verification |
| Next Step | Run EXPLAIN ANALYZE and log results |

---

## References

- [final_release_verification.analysis.md](./final_release_verification.analysis.md)
- [Supabase PostGIS Performance](https://postgis.net/docs/performance_tips.html)
