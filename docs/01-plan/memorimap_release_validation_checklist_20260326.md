# Memorimap 異쒖떆 寃利?泥댄겕由ъ뒪??

?묒꽦?? 2026-03-26
紐⑹쟻: 異붾え留?異쒖떆 ???ㅼ젣 ?댁쁺 寃쎈줈瑜?湲곗??쇰줈 理쒖쥌 寃利??쒖꽌瑜?怨좎젙?쒕떎.
?먯튃: 寃곗젣??"寃곗젣 ?깃났"???꾨땲??"寃곗젣 ?깃났 + DB 諛섏쁺 + ?꾩냽 ?뚮줈???뺤긽"源뚯? ?뺤씤?댁빞 ?듦낵濡?蹂몃떎.

## 0. 寃利?吏꾪뻾 ?꾪솴

- [x] `verify-payment` 理쒖떊 諛고룷 ?뺤씤
  - ACTIVE
  - deployed at `2026-03-26 10:10:51 UTC`
- [x] 援щ룆 paid/free ?먮쫫 `verify-payment` 寃쎌쑀 ?뺤씤
- [x] `ContentRouter.tsx` 以묐났 client write ?쒓굅 ?뺤씤
- [x] `lib/portone.ts` debug 濡쒓렇 ?쒓굅 ?뺤씤
- [x] `windowType` ?쒓굅 ?뺤씤
- [x] `npm run typecheck` ?듦낵
- [x] `npm run build` ?듦낵
- [x] ?뚯뒪??寃곗젣 ??DB 諛섏쁺 ?뺤씤
- [ ] ?ㅺ껐??payload 理쒖쥌 ?뺤씤

## 1. ?꾩옱 湲곗? ?곹깭

- `verify-payment` Edge Function? 理쒖떊 諛고룷蹂?湲곗??쇰줈 ?좊즺 援щ룆 ?곸냽?? 臾대즺 ?꾪솚, 寃곗젣?대젰 ????ㅽ뙣 ??濡ㅻ갚 濡쒖쭅???ы븿?쒕떎.
- 援щ룆 paid/free ?먮쫫? `verify-payment` 寃쎌쑀 援ъ“濡??뺣━?섏뿀??
- `ContentRouter.tsx`??以묐났 client write???쒓굅?섏뿀??
- `lib/portone.ts`???꾩떆 debug 濡쒓렇???쒓굅?섏뿀??
- `windowType`? KCP prepare 400 ?먯씤 ?꾨낫濡??쒓굅?섏뿀??
- ?꾩옱 理쒖슦??寃利???ぉ? "?ㅼ젣 寃곗젣 ?깃났 ??DB 諛섏쁺???앷퉴吏 ?섎뒗吏"??

## 2. 異쒖떆 ??理쒖슦??寃利?

### 2.1 ?뚯뒪??寃곗젣 ??DB 諛섏쁺 ?뺤씤

媛??癒쇱? ?꾨옒 3媛??뚯씠釉붿쓣 ?뺤씤?쒕떎.

- [x] `user_subscriptions`
- [x] `facility_subscriptions`
- [x] `subscription_payments`

- `user_subscriptions`
- `facility_subscriptions`
- `subscription_payments`

?듦낵 湲곗?:

- 媛쒖씤 ?좊즺 援щ룆 寃곗젣 ??`user_subscriptions` ?쒖꽦 row ?앹꽦 ?먮뒗 媛깆떊
- ?쒖꽕 ?좊즺 援щ룆 寃곗젣 ??`facility_subscriptions` ?쒖꽦 row ?앹꽦 ?먮뒗 媛깆떊
- 媛?寃곗젣????묓븯??`subscription_payments` row ?앹꽦
- `verify-payment` ?묐떟 湲곗? `verified: true`, `persisted: true`

?ㅽ뙣 湲곗?:

- 寃곗젣 ?깃났 UI媛 ?대뒗????3媛??뚯씠釉붿뿉 ?ㅻ뒛 row媛 ?놁쓬
- `verified: true`?몃뜲 `persisted: false`
- 寃곗젣???섏뿀吏留?subscription ?곹깭媛 湲곕?媛믨낵 ?ㅻ쫫

### 2.2 ?ㅺ껐???붿껌媛?理쒖쥌 ?뺤씤

寃곗젣 Network 濡쒓렇 湲곗??쇰줈 ?꾨옒瑜??뺤씤?쒕떎.

- [ ] `storeId`
- [ ] `channelKey`
- [ ] `paymentId`
- [ ] `orderName`
- [ ] `totalAmount`
- [ ] `currency`
- [ ] `payMethod`
- [ ] `customer.fullName`
- [ ] ?꾩슂 ??`customer.phoneNumber`

- `storeId`
- `channelKey`
- `paymentId`
- `orderName`
- `totalAmount`
- `currency`
- `payMethod`
- `customer.fullName`
- ?꾩슂 ??`customer.phoneNumber`

泥댄겕 ?ъ씤??

- ?붾? fallback 媛믪씠 ?ㅼ젣 ?붿껌???⑥븘 ?덉? ?딆?吏 ?뺤씤
- KCP/PortOne???붽뎄?섎뒗 ?ㅼ젣 ?ъ슜???뺣낫媛 ?꾨씫?섏? ?딅뒗吏 ?뺤씤
- `site_name` 理쒖쥌 ?쒓린媛 ?댁쁺 湲곗?怨?留욌뒗吏 ?뺤씤

### 2.3 DB ?뺤씤??SQL

Supabase SQL Editor?먯꽌 ?꾨옒 荑쇰━瑜?洹몃?濡??ㅽ뻾?쒕떎.

```sql
-- 1) 理쒓렐 寃곗젣 ?대젰 ?뺤씤
select
  id,
  subscription_id,
  user_id,
  payment_context,
  portone_payment_id,
  amount,
  final_amount,
  status,
  paid_at,
  billing_period_start,
  billing_period_end
from public.subscription_payments
order by paid_at desc
limit 20;
```

```sql
-- 2) 理쒓렐 媛쒖씤 援щ룆 ?곹깭 ?뺤씤
select
  id,
  user_id,
  plan_id,
  plan_name,
  status,
  started_at,
  expires_at,
  billing_cycle
from public.user_subscriptions
order by started_at desc nulls last, updated_at desc nulls last
limit 20;
```

```sql
-- 3) 理쒓렐 ?쒖꽕/?곸“ 援щ룆 ?곹깭 ?뺤씤
select
  id,
  facility_id,
  facility_id_uuid,
  facility_id_bigint,
  plan_id,
  status,
  billing_cycle,
  next_billing_date,
  updated_at
from public.facility_subscriptions
order by updated_at desc nulls last
limit 20;
```

```sql
-- 4) ?뱀젙 PortOne paymentId濡?寃곗젣 1嫄?異붿쟻
-- ?꾨옒 媛믩쭔 ?ㅼ젣 paymentId濡?諛붽퓭???ъ슜
select
  id,
  subscription_id,
  user_id,
  payment_context,
  portone_payment_id,
  amount,
  status,
  paid_at
from public.subscription_payments
where portone_payment_id = 'REPLACE_WITH_PAYMENT_ID';
```

```sql
-- 5) ?뱀젙 ?쒖꽕 UUID 湲곗? 援щ룆 ?곹깭 異붿쟻
-- ?꾨옒 媛믩쭔 ?ㅼ젣 facilityId濡?諛붽퓭???ъ슜
select
  id,
  facility_id_uuid,
  plan_id,
  status,
  billing_cycle,
  next_billing_date,
  updated_at
from public.facility_subscriptions
where facility_id_uuid = 'REPLACE_WITH_FACILITY_UUID'
order by updated_at desc nulls last;
```

```sql
-- 6) ?뱀젙 user_id 湲곗? 媛쒖씤 援щ룆 ?곹깭 異붿쟻
-- ?꾨옒 媛믩쭔 ?ㅼ젣 user_id濡?諛붽퓭???ъ슜
select
  id,
  user_id,
  plan_id,
  plan_name,
  status,
  started_at,
  expires_at,
  billing_cycle
from public.user_subscriptions
where user_id = 'REPLACE_WITH_USER_ID'
order by started_at desc nulls last, updated_at desc nulls last;
```

### 2.4 寃곗젣 吏곹썑 ?뺤씤 ?쒖꽌

1. 釉뚮씪?곗? Network?먯꽌 `paymentId`瑜?蹂듭궗?쒕떎.
2. `subscription_payments`?먯꽌 `portone_payment_id`濡?寃곗젣 row瑜?李얜뒗??
3. `payment_context`媛 `personal`?몄? `facility`?몄? ?뺤씤?쒕떎.
4. 媛쒖씤 寃곗젣硫?`user_subscriptions`, ?쒖꽕/?곸“ 寃곗젣硫?`facility_subscriptions`瑜??뺤씤?쒕떎.
5. `plan_id`, `status`, `billing_cycle`, 寃곗젣 湲곌컙 而щ읆??湲곕?媛믨낵 留욌뒗吏 蹂몃떎.
6. 寃곗젣 ?깃났 UI媛 ?대뒗??row媛 ?놁쑝硫??ㅽ뙣濡?湲곕줉?쒕떎.

## 3. 寃곗젣 寃利??쒕굹由ъ삤

### 3.1 媛쒖씤 ?좊즺 援щ룆

?됰룞:

- 媛쒖씤 ?꾨━誘몄뾼 寃곗젣 ?ㅽ뻾

?뺤씤:

- 寃곗젣李??뺤긽 ?ㅽ뵂
- 寃곗젣 ?뱀씤 ?꾨즺
- `verify-payment` ?깃났 ?묐떟
- `user_subscriptions.plan_id = 'PERSONAL_PREMIUM'`
- `user_subscriptions.status = 'active'`
- `subscription_payments.payment_context = 'personal'`
- `subscription_payments.status = 'completed'`

寃利?寃곌낵:

- [x] ?뺤씤 ?꾨즺
- `PERSONAL_PREMIUM`
- `status = active`
- `payment_context = personal`
- `billing_period_start/end` ????뺤씤

### 3.2 ?쒖꽕 ?좊즺 援щ룆

?됰룞:

- ?쒖꽕 ?뚮옖 寃곗젣 ?ㅽ뻾

?뺤씤:

- 寃곗젣李??뺤긽 ?ㅽ뵂
- 寃곗젣 ?뱀씤 ?꾨즺
- `verify-payment` ?깃났 ?묐떟
- `facility_subscriptions.status = 'active'`
- 湲곕? `plan_id` ??κ컪 諛섏쁺
- `subscription_payments.payment_context = 'facility'`
- `subscription_payments.status = 'completed'`

寃利?寃곌낵:

- [x] ?뺤씤 ?꾨즺
- ?쒖꽕 ?쇰컲 援щ룆 1嫄?????뺤씤
- ?곸“ 援щ룆 `SJ_STARTER` 1嫄?????뺤씤
- `payment_context = facility`
- `billing_period_start/end` ????뺤씤

### 3.3 ?쒖꽕 臾대즺 ?꾪솚

?됰룞:

- ?쒖꽕 臾대즺 ?뚮옖 ?좏깮

?뺤씤:

- `verify-payment` free downgrade 寃쎌쑀
- `facility_subscriptions.plan_id = 'free'`
- `facility_subscriptions.status = 'active'`
- ?덈줈??`subscription_payments` row ?놁쓬

### 3.4 媛쒖씤 臾대즺 ?꾪솚

?됰룞:

- 媛쒖씤 臾대즺 ?뚮옖 ?좏깮

?뺤씤:

- `verify-payment` free downgrade 寃쎌쑀
- `user_subscriptions.plan_id = 'PERSONAL_FREE'`
- `user_subscriptions.status = 'active'`
- ?덈줈??`subscription_payments` row ?놁쓬

### 3.5 寃곗젣 痍⑥냼

?됰룞:

- 寃곗젣李쎌쓣 ?닿퀬 ?뱀씤 ?꾩뿉 痍⑥냼

?뺤씤:

- 理쒖쥌 ?깃났 ?좎뒪???놁쓬
- 愿??subscription/payment ?뚯씠釉?蹂寃??놁쓬

## 4. Phase B~D ?⑥? ?묒뾽

### Phase B

- ?쇰컲寃곗젣/?뺢린寃곗젣 UI 臾멸뎄 遺꾨━
- 媛쒖씤 ?쒓렇?덉쿂 `9,900?? ?뚮옖 異붽?

### Phase C

- 鍮뚮쭅??諛쒓툒 UI ?곌껐

### Phase D

- ?쒕쾭 ?먮룞寃곗젣 Edge Function
- ?댁? ?뚮줈??
- `pg_cron` ?곕룞

## 5. ?댁쁺 ?뺤씤 ??ぉ

- KCP 鍮뚮쭅???ъ쟾 怨꾩빟 ?щ?
  - Phase C ???꾩닔
- `site_name` 理쒖쥌 ?쒓린 ?뺤젙
  - `異붾え留? ?먮뒗 `(二??꾪넱耳??
- `PORTONE_API_SECRET`
  - Supabase Edge Function 諛고룷蹂몄뿉???ㅼ젣 ?뺤긽 ?숈옉 ?뺤씤
- PortOne 肄섏넄
  - `storeId` / `channelKey` ?뚯냽 ?쇱튂
  - PG媛 `NHN KCP (v2)`?몄? ?뺤씤
  - 梨꾨꼸 ?쒖꽦 ?곹깭 ?뺤씤
  - `CARD` ?덉슜 ?щ? ?뺤씤

## 6. 異쒖떆 ???섎룞 寃利?

### ?쇰컲 ?ъ슜??

- ?뚯썝媛??/ 濡쒓렇??
- ?쒖꽕 寃??
- ?쒖꽕 ?곸꽭 蹂닿린
- ?곷떞 ?붿껌
- ?덉빟 ?앹꽦
- 由щ럭 ?묒꽦 / 議고쉶

### ?낆껜 愿由ъ옄

- 愿由ъ옄 ??쒕낫???묎렐
- 援щ룆 ?곹깭 ?뺤씤
- 寃곗젣 ???뚮옖 諛섏쁺 ?뺤씤

### ?덊띁愿由ъ옄

- ?뚰듃???뱀씤 / 嫄곗젅
- 二쇱슂 ?댁쁺 ?붾㈃ ?묎렐
- `approve-partner` 理쒖떊 諛고룷蹂??숈옉 ?뺤씤

### 紐⑤컮???ㅺ린湲?

- iPhone Safari
- Android Chrome
- Safe Area
- 寃곗젣李??숈옉
- ?덉씠?꾩썐 源⑥쭚 ?щ?

## 7. 諛고룷 ??泥댄겕

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Vercel 理쒖떊 諛고룷 ?뺤씤
- [x] Supabase Edge Function 理쒖떊 諛고룷 ?뺤씤
  - [x] `verify-payment`
  - [ ] ?꾩슂 ??`approve-partner`

## 8. 異쒖떆 吏곹썑 ?ㅻえ???뚯뒪??

- ?ㅼ젣 ?꾨찓???묒냽
- 濡쒓렇??
- 寃??
- 寃곗젣 ?먮뒗 臾대즺 ?꾪솚
- 愿由ъ옄 ?묎렐
- 釉뚮씪?곗? 肄섏넄 / ?ㅽ듃?뚰겕 ?ㅻ쪟 ?뺤씤

## 9. 理쒖쥌 ?듦낵 湲곗?

異쒖떆???꾨옒媛 紐⑤몢 異⑹”???뚮쭔 吏꾪뻾?쒕떎.

- `typecheck` ?듦낵
- `build` ?듦낵
- 媛쒖씤/?쒖꽕 寃곗젣 ??DB 諛섏쁺 ?뺤긽
- 媛쒖씤/?쒖꽕 臾대즺 ?꾪솚 ?뺤긽
- 二쇱슂 ?섎룞 ?뚮줈??移섎챸 ?ㅻ쪟 ?놁쓬
- 紐⑤컮???ㅺ린湲?移섎챸 ?댁뒋 ?놁쓬
- ?댁쁺 ?ㅼ젙 ?꾨씫 ?놁쓬

## 10. 吏湲?諛붾줈 ?ㅼ쓬 ?≪뀡

1. ?뚯뒪??寃곗젣 1???ㅽ뻾
2. `user_subscriptions`, `facility_subscriptions`, `subscription_payments` ?뺤씤
3. 寃곗젣 ?붿껌 payload 理쒖쥌 ?뺤씤
4. DB 諛섏쁺???뺤씤?섎㈃ Phase B ?쒖옉

## 11. 2026-03-27 ?ㅼ륫 寃곌낵

- `subscription_payments`
  - personal 1嫄?????뺤씤
  - facility 2嫄?????뺤씤
  - 理쒖떊 row 湲곗? `status = completed`
  - `billing_period_start`, `billing_period_end` ????뺤씤

- `user_subscriptions`
  - `PERSONAL_PREMIUM` active 諛섏쁺 ?뺤씤

- `facility_subscriptions`
  - ?쒖꽕 ?쇰컲 援щ룆 active 諛섏쁺 ?뺤씤
  - ?곸“ 援щ룆 `SJ_STARTER` active 諛섏쁺 ?뺤씤

- ?꾩쭅 誘명솗??
  - free downgrade ?ㅼ륫
  - 寃곗젣 痍⑥냼 ?ㅼ륫
  - ?ㅺ껐??payload 理쒖쥌 ?뺤씤

### 11.1 ?ㅼ륫 ?붿빟

- [x] 媛쒖씤 ?좊즺 寃곗젣 ?깃났
- [x] ?쒖꽕 ?좊즺 寃곗젣 ?깃났
- [x] ?곸“ ?좊즺 寃곗젣 ?깃났
- [x] 寃곗젣 ??DB 3媛??뚯씠釉?諛섏쁺 ?뺤씤
- [x] billing period 而щ읆 ????뺤씤

### 11.2 ?뺤씤??理쒖떊 row 湲곗?

- 媛쒖씤 寃곗젣
  - `payment_context = personal`
  - `portone_payment_id = psub_mn7jih05_r54s0g`
  - `amount = 4900`
  - `status = completed`
  - `user_subscriptions.plan_id = PERSONAL_PREMIUM`

- ?곸“ 寃곗젣
  - `payment_context = facility`
  - `portone_payment_id = sub_mn7kvsz8_p4l343`
  - `amount = 1500000`
  - `status = completed`
  - `facility_subscriptions.plan_id = SJ_STARTER`

- ?쒖꽕 ?쇰컲 寃곗젣
  - `payment_context = facility`
  - `portone_payment_id = sub_mn7k6k23_wi65s3`
  - `amount = 199000`
  - `status = completed`
  - `facility_subscriptions.plan_id = premium`

## 12. 2026-03-27 ?댁? ?덉빟 寃利?

### 12.1 媛쒖씤 援щ룆 ?댁? ?덉빟

- 寃利?怨꾩젙
  - `user_id = 2f3c8a86-07d7-42e5-99b5-c4389b1b31ed`

- ?ъ쟾 蹂듦뎄 ?곹깭
  - `plan_id = PERSONAL_PREMIUM`
  - `plan_name = PERSONAL_PREMIUM`
  - `status = active`
  - `auto_renew = true`
  - `expires_at = 2026-04-26 14:01:55.921`

- UI ?뺤씤
  - 媛쒖씤 援щ룆 ?붾㈃?먯꽌 `臾대즺濡?蹂寃쏀븯湲? ?대┃
  - confirm 臾멸뎄:
    `援щ룆???댁??섏떆寃좎뒿?덇퉴? ?꾩옱 ?댁슜湲곌컙 留뚮즺 ???먮룞?쇰줈 臾대즺 ?뚮옖?쇰줈 ?꾪솚?⑸땲??`

- API ?묐떟
  - `{"verified":true,"persisted":true}`

- DB 寃곌낵
  - `plan_id = PERSONAL_PREMIUM`
  - `plan_name = PERSONAL_PREMIUM`
  - `status = cancelling`
  - `auto_renew = false`
  - `expires_at = 2026-04-26 14:01:55.921`

- ?먯젙
  - [x] ?댁? 吏곹썑 `cancelling` ?꾪솚 ?뺤긽
  - [x] ?좊즺 ?뚮옖 ?좎? ?뺤긽
  - [x] `auto_renew=false` 諛섏쁺 ?뺤긽

### 12.2 cron / 諛곗튂 ?곹깭

- [x] `pg_cron` extension ?쒖꽦???뺤씤
- [x] `process_expired_subscriptions()` ?⑥닔 ?앹꽦 ?뺤씤
- [x] cron job ?깅줉 ?뺤씤
  - `jobname = process-expired-subscriptions`
  - `schedule = 0 18 * * *`
  - `command = select public.process_expired_subscriptions()`

### 12.3 ?ㅼ쓬 寃利?

- [ ] 留뚮즺 ??媛쒖씤 ?좊즺 湲곕뒫 ?묎렐 ?좎? ?뺤씤
- [ ] `expires_at` 怨쇨굅 議곗젙 ??`select public.process_expired_subscriptions();`
- [ ] `PERSONAL_FREE` ?꾪솚 ?뺤씤
- [ ] ?쒖꽕/?곸“ `cancelling -> FREE` ?꾪솚 ?뺤씤
## 13. 2026-03-27 諛고룷 ???곹깭

### 13.1 ?꾨즺 ??ぉ

- [x] `tsc --noEmit` ?듦낵
- [x] `npm run build` ?듦낵
- [x] `verify-payment` Edge Function ?щ같???ㅽ뻾
- [x] `facility_subscriptions` RLS 留덉씠洹몃젅?댁뀡 諛섏쁺
- [x] `cancelling` ?곹깭癒몄떊 諛섏쁺
- [x] 媛쒖씤 援щ룆 `cancelling -> ?좊즺 ?좎?` ?ㅼ륫
- [x] 媛쒖씤 援щ룆 `留뚮즺 -> PERSONAL_FREE` ?꾪솚 濡쒖쭅 寃利?
- [x] ?곸“ 援щ룆 `cancelling -> ?좊즺 ?좎?` ?ㅼ륫
- [x] ?곸“ 援щ룆 `留뚮즺 -> FREE` ?꾪솚 濡쒖쭅 寃利?
- [x] ?쒖꽕 援щ룆 `留뚮즺 -> FREE` ?섎룞 ?꾪솚 寃利?
- [x] `pg_cron` ?쒖꽦??諛?`process-expired-subscriptions` ?깅줉

### 13.2 P0 諛고룷 ?묒뾽

- [x] Vercel ?꾨줈?뺤뀡 諛고룷 ??`vercel --prod` CLI 吏곸젒 諛고룷 (2026-03-27)
- [x] 諛고룷 吏곹썑 ?댁쁺 URL ?ㅻえ???뚯뒪????memorimap.kr ?뺤씤 ?꾨즺
- [x] 媛쒖씤 援щ룆 ?붾㈃ ???꾨━誘몄뾼 "?꾩옱 ?뚮옖" + "?꾩옱 ?댁슜 以? PASS
- [x] ?곸“ 援щ룆 ?붾㈃ ???뚯씪??"援щ룆以? + "?꾩옱 ?곸슜 以묒씤 ?뚮옖" PASS
- [x] ?쒖꽕 援щ룆 ?붾㈃ ???꾨━誘몄뾼 "援щ룆以? + "?꾩옱 ?곸슜 以묒씤 ?뚮옖" PASS
- [x] `verify-payment` 理쒖떊 諛고룷蹂???Edge Function ?щ같???꾨즺

### 13.3 醫낇빀 QA 踰붿쐞 (2026-03-27 肄붾뱶 寃利?

#### ?쇰컲 ?좎?
- [x] ?뚯썝媛??/ 濡쒓렇????PASS (Supabase Auth, ?먮윭 ?몃뱾留??꾨퉬)
- [x] ?λ??앹옣 / 異붾え?쒖꽕 / ?곸“ 寃??諛??곸꽭 吏꾩엯 ??PASS (null 泥댄겕 ?꾨퉬)
- [x] 留덉쓬???곷떞 吏꾩엯 ??PASS (getAuthClient strict ?ъ슜)
- [x] ?λ??앹옣 / 異붾え?쒖꽕 AI ?곷떞 ??PASS (DOMPurify, auth ?꾩닔)
- [x] ?곸“ AI 鍮꾧탳 / ?곷떞 ??PASS (quota 泥댄겕 + auth ?꾩닔)
- [x] 李?異붽? / ?댁젣 ??PASS (getAuthClient strict, ?먮윭 ?좎뒪??
- [x] ?곷떞 ?좎껌 / ?덉빟 ?좎껌 ??PASS (auth client, confirm dialog)
- [x] 媛쒖씤 援щ룆 寃곗젣 ??PASS (?꾨줈?뺤뀡 ?ㅽ겕由곗꺑 ?뺤씤)
- [x] 媛쒖씤 援щ룆 ?댁? ?덉빟 ??PASS (cancelling ?곹깭癒몄떊 寃利??꾨즺)
- [x] 留덉씠?섏씠吏 援щ룆 ?곹깭 ?뺤씤 ??PASS (?꾨줈?뺤뀡 ?ㅽ겕由곗꺑 ?뺤씤)

#### ?쒖꽕 ?뚰듃??
- [x] ??쒕낫??吏꾩엯 ??PASS (肄붾뱶: auth ?꾩닔, realtime mounted ?뚮옒洹?
- [x] ?쒖꽕 援щ룆 寃곗젣 ??PASS (?꾨줈?뺤뀡 ?ㅽ겕由곗꺑 ?뺤씤)
- [x] ?쒖꽕 援щ룆 ?댁? ?덉빟 ??PASS (confirm + cancelling ?꾪솚)
- [x] ?덉빟 / ?곷떞 ?섏떊 ?뺤씤 ??PASS (肄붾뱶: realtime 援щ룆 + getAuthClient)
- [x] KPI / 由щ럭 / 臾몄쓽 / 留ㅼ텧 移대뱶 ?뺤씤 ??PASS (肄붾뱶 寃利?
- [ ] ?뚰듃???좎껌 ??BLOCKED (?섎룞 E2E ?꾩슂)
- [ ] ?뱀씤 ??/ ??沅뚰븳 李⑥씠 ?뺤씤 ??BLOCKED (?섎룞 E2E ?꾩슂)

#### ?곸“ ?뚰듃??
- [x] ?뱀씤 ???곸“ ??쒕낫??吏꾩엯 ??PASS (肄붾뱶: usePartnerDashboard auth)
- [x] ?곸“ 援щ룆 寃곗젣 ??PASS (?꾨줈?뺤뀡 ?ㅽ겕由곗꺑 ?뺤씤)
- [x] ?곸“ 援щ룆 ?댁? ?덉빟 ??PASS (DB 寃利? cancelling ??FREE ?꾪솚)
- [x] ?곸“ AI 鍮꾧탳 / ?곷떞 ?곌껐 ?뺤씤 ??PASS (肄붾뱶: BrandChat auth)
- [x] 由щ뱶 / 臾몄쓽 / ?곷떞 ?곗씠??諛섏쁺 ?뺤씤 ??PASS (肄붾뱶: realtime)
- [ ] ?곸“ ?뚰듃???좎껌 ??BLOCKED (?섎룞 E2E ?꾩슂)

#### ?덊띁愿由ъ옄
- [x] ?뚰듃???좎껌 紐⑸줉 ?뺤씤 ??PASS (肄붾뱶: PartnerAdmissions useSuperAdminClient)
- [x] ?쒖꽕/?곸“ ?뚰듃???뱀씤 / 諛섎젮 ??PASS (肄붾뱶: confirm dialog + Edge Function)
- [x] ?뱀씤 ???ㅼ젣 沅뚰븳 諛섏쁺 ?뺤씤 ??PASS (肄붾뱶: approvePartner hook)
- [x] ?댁쁺 ?붾㈃ 吏꾩엯 ?먮윭 ?뺤씤 ??PASS (肄붾뱶: SuperAdminGuard + timeout)
- [ ] ?ㅼ젣 E2E ?뱀씤 ?먮쫫 ??BLOCKED (?섎룞 ?뚯뒪???꾩슂)

### 13.4 ?붿뿬 ?먭? ??ぉ

- [ ] ?덊띁愿由ъ옄 ?뚰듃???뱀씤 E2E ??BLOCKED (?섎룞 ?뚯뒪??
- [ ] 紐⑤컮??UI ?ㅺ린湲??먭? ??BLOCKED (?ㅺ린湲??꾩슂)
- [x] `admin_memo` ?뺤씤 ??PASS (而щ읆 議댁옱)
- [x] `system_settings` RLS ?뺤씤 ??PASS (SELECT/UPDATE/DELETE: is_super_admin(), anon 李⑤떒)
- [x] `sangjo_contracts` RLS ?뺤씤 ??PASS (UPDATE: is_super_admin() OR sangjo_hq_admins JOIN)

### 13.5 QA ?붿빟 (2026-03-27)

| 援щ텇 | PASS | FAIL | BLOCKED |
|------|------|------|---------|
| P0 諛고룷 | 6/6 | 0 | 0 |
| ?쇰컲 ?좎? | 10/10 | 0 | 0 |
| ?쒖꽕 ?뚰듃??| 5/7 | 0 | 2 |
| ?곸“ ?뚰듃??| 5/6 | 0 | 1 |
| ?덊띁愿由ъ옄 | 4/5 | 0 | 1 |
| ?붿뿬 ?먭? | 0/5 | 0 | 2+3 pending |

**異쒖떆 blocking ?щ?: FAIL 0嫄? blocking ?댁뒋 ?놁쓬.**
BLOCKED 4嫄댁? 紐⑤몢 ?섎룞 E2E ?뚯뒪?몃줈, 肄붾뱶??援ы쁽? ?꾨즺 ?곹깭.
## 14. ?⑥? ?섎룞 ?뚯뒪???ㅽ뻾 ?쒖꽌

### 14.1 ?쒖꽕 ?뚰듃???좎껌 -> ?덊띁愿由ъ옄 ?뱀씤 E2E

- ?뚯뒪??怨꾩젙?쇰줈 ?쒖꽕 ?뚰듃???좎껌
- ?덊띁愿由ъ옄 怨꾩젙?쇰줈 ?좎껌 紐⑸줉 ?뺤씤
- ?뱀씤 泥섎━ ???쒖꽕 怨꾩젙 ?щ줈洹몄씤 ?먮뒗 ?덈줈怨좎묠
- PASS 湲곗?
  - ?좎껌 row ?앹꽦 ?뺤씤
  - ?뱀씤 ???쒖꽕 沅뚰븳 諛섏쁺
  - ?쒖꽕 ??쒕낫??吏꾩엯 媛??
### 14.2 ?곸“ ?뚰듃???좎껌 -> ?덊띁愿由ъ옄 ?뱀씤 E2E

- ?뚯뒪??怨꾩젙?쇰줈 ?곸“ ?뚰듃???좎껌
- ?덊띁愿由ъ옄 怨꾩젙?쇰줈 ?좎껌 紐⑸줉 ?뺤씤
- ?뱀씤 泥섎━ ???곸“ 怨꾩젙 ?щ줈洹몄씤 ?먮뒗 ?덈줈怨좎묠
- PASS 湲곗?
  - ?좎껌 row ?앹꽦 ?뺤씤
  - ?뱀씤 ???곸“ 沅뚰븳 諛섏쁺
  - ?곸“ ??쒕낫??吏꾩엯 媛??
### 14.3 紐⑤컮???ㅺ린湲??먭?

- 紐⑤컮??釉뚮씪?곗??먯꽌 `https://memorimap.kr` ?묒냽
- ?ㅼ쓬 ?붾㈃ ?곗꽑 ?뺤씤
  - ??  - 寃??/ ?곸꽭
  - 媛쒖씤 援щ룆 ?붾㈃
  - ?쒖꽕 / ?곸“ ??쒕낫???듭떖 ?붾㈃
- PASS 湲곗?
  - ?덉씠?꾩썐 源⑥쭚 ?놁쓬
  - 踰꾪듉 ?대┃ 媛??  - 二쇱슂 CTA 媛?ㅼ쭚 ?놁쓬
  - 移섎챸??肄섏넄/?고????먮윭 ?놁쓬

### 14.4 理쒖쥌 ?먯젙 湲곕줉

- 媛???ぉ??`PASS / FAIL / BLOCKED` 濡?臾몄꽌??媛깆떊
- FAIL 諛쒖깮 ???ы쁽 寃쎈줈, 湲곕? 寃곌낵, ?ㅼ젣 寃곌낵瑜?媛숈씠 湲곕줉
## 15. 역할별 기능 흐름 테스트 매트릭스

### 15.1 일반 유저 관점
- 회원가입 / 로그인
- 수목장 검색 -> 상세 -> 예약 / 상담 요청
- 추모시설 검색 -> 상세 -> 예약 / 상담 요청
- 상조 검색 / 비교 -> AI 상담 -> 상담 요청
- 찜 / 마이페이지 / 내 요청 상태 확인
- 개인 구독 결제 / 해지 예약
- PASS 기준
  - 요청 데이터가 저장된다
  - 내 화면에서 상태 확인이 가능하다
  - 치명적 오류 없이 다음 화면으로 진행된다

### 15.2 시설 관리자 관점
- 파트너 신청
- 승인 후 시설 대시보드 진입
- 유저 예약 / 상담 접수 확인
- 승인 / 거절 / 취소 / 상태 변경
- 리뷰 / 문의 / KPI 확인
- 시설 구독 결제 / 해지 예약
- PASS 기준
  - 유저 신청이 시설 화면에 접수된다
  - 시설 관리자가 상태 변경을 할 수 있다
  - 변경 결과가 유저 상태에도 반영된다

### 15.3 상조 업체 관점
- 상조 파트너 신청
- 승인 후 상조 대시보드 진입
- 유저 상조 상담 / 리드 접수 확인
- 상담 처리 / 상태 변경
- 상조 구독 결제 / 해지 예약
- 리드 / 문의 / 매출 확인
- PASS 기준
  - AI 상담 이후 리드가 상조 관리자에게 들어온다
  - 상조 관리자가 처리할 수 있다
  - 처리 상태가 정상 반영된다

### 15.4 슈퍼관리자 관점
- 시설 업체 신청 승인 / 반려 / 취소
- 상조 업체 신청 승인 / 반려 / 취소
- 승인 후 권한 반영 확인
- 파트너 관리
- 매출 / 구독 / 운영 화면 점검
- PASS 기준
  - 승인 / 반려가 실제 권한에 반영된다
  - 관리자 화면 진입 에러가 없다
  - 파트너 매출 관리 화면 확인이 가능하다

### 15.5 핵심 흐름 세트

1. 일반 유저가 요청한다
2. 시설 / 상조 관리자가 접수한다
3. 관리자가 승인 / 거절 / 취소 처리한다
4. 유저 상태가 변경된다
5. 슈퍼관리자가 업체 권한을 관리한다

## 16. Feature Gating 정밀 검증 기준

### 16.1 검증 순서

1. Level 1 정적 검증
2. Level 2 SQL Editor RPC 검증
3. Level 3 브라우저 FREE / PREMIUM 실측

### 16.2 정적으로 확인된 실제 게이트 경로

- AI 상담
  - `components/AI/ChatInterface.tsx`
  - `components/Consultation/ConsultationView.tsx`
- 상조 비교
  - `components/Consultation/SangjoConsultationModal.tsx`
- 즐겨찾기
  - `hooks/useFavorites.ts`
  - `stores/useSangjoFavoriteStore.ts`
  - `components/FacilitySheet/useFacilitySheet.ts`
  - `components/MyPageView/useMyPage.ts`
- 엔딩노트 레벨 분기
  - `components/IntegratedJourneyView.tsx`

### 16.3 최신 SQL 기준

- `get_user_plan_info()` 최신 기준
  - `supabase/migrations/20260327_subscription_cancelling_state.sql`
- user quota / favorite rollback 기준
  - `supabase/migrations/20260227_feature_gating.sql`
- 최신 상조 비교 제한값
  - `supabase/migrations/20260310000000_update_sangjo_quota_limits.sql`

### 16.4 코드 기준 확인 사항

- `get_user_plan_info()`는 최신 구현에서 인증 없을 때 `Not authenticated` 예외를 던지지 않는다.
- `check_and_increment_user_quota()`와 `decrement_user_favorites_count()`는 인증 없을 때 예외를 던진다.
- FREE `sangjo_compare`는 월 10회다.
- BASIC `sangjo_compare`는 월 15회다.
- PREMIUM `sangjo_compare`는 무제한이다.
- 상조 즐겨찾기 실제 경로는 `stores/useSangjoFavoriteStore.ts`다.

### 16.5 정밀 검증 리스크

- quota RPC 실패 시 gating이 우회되지 않는지 확인
- AI 상담에서 사용자 quota와 시설 quota 차감 순서가 의도와 맞는지 확인
- 상담 생성 실패 시 quota 롤백이 필요한지 확인
- `PERSONAL_FREE` 대소문자 혼재 데이터가 무료 판정을 깨지 않는지 확인
- 상조 즐겨찾기 quota 초과 시 업그레이드 유도 UI가 실제 노출되는지 확인
