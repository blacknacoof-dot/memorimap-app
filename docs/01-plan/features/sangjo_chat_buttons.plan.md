
# Sangjo Dashboard & Chat Integration Master Plan

> **Objective**: Transform the AI Chat from a simple UI into a real-time CRM & Analytics engine for Sangjo companies.
> **Key Goal**: "No chat action is lost; everything is an event for the dashboard."
> **Date**: 2026-02-02

## 1. High-Level Architecture

### Core Principle: Chat UI as a Data Collector
- **Old Flow**: User Clicks Button -> AI Replies (Ephemeral)
- **New Flow**: User Clicks Button -> **Event Logged to DB** -> Dashboard Updates -> AI Replies

### Key Components
1.  **Chat Event Stream**: Real-time logging of every user interaction.
2.  **Emergency Pipeline**: Separate, high-priority channel for urgent requests.
3.  **Consultation CRM**: Rich context (conversation summary, source) for counselors.
4.  **Analytics**: Product clicks and content engagement tracking.

## 2. Database Schema Design (Supabase)

### 2.1 `chat_events` (The Activity Stream)
Captures every significant action in the chat.
```sql
CREATE TABLE chat_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id), -- Nullable for anonymous
  session_id text, -- For anonymous tracking
  partner_id text NOT NULL, -- Which Sangjo company
  event_type text NOT NULL, -- 'VIEW_PRODUCT', 'EMERGENCY_REQUEST', 'VIEW_PROCESS', 'RESERVATION_CLICK'
  payload jsonb DEFAULT '{}'::jsonb, -- Store product_id, specific selection, etc.
  created_at timestamptz DEFAULT now()
);
```

### 2.2 `emergency_requests` (Hot Line)
Dedicated table for Red-alert items on the dashboard.
```sql
CREATE TABLE emergency_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  customer_name text,
  customer_phone text,
  location text, -- Current location or requested place
  status text DEFAULT 'NEW', -- 'NEW', 'CHECKING', 'DISPATCHED', 'COMPLETED'
  created_at timestamptz DEFAULT now()
);
```

### 2.3 `product_click_logs` (Sales Analytics)
Data source for "Popular Products" charts.
```sql
CREATE TABLE product_click_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  product_id text NOT NULL,
  product_name text,
  user_id uuid,
  clicked_at timestamptz DEFAULT now()
);
```

### 2.4 `consultations` Table Update (Handover Context)
Enrich the existing consultation table.
- `reservation_type`: 'CALL' | 'CHAT'
- `is_emergency`: boolean
- `handover_reason`: text ('REQUEST', 'EMERGENCY', 'RESERVATION')
- `last_chat_summary`: text (AI generated summary)

## 3. Implementation Steps

### Phase 1: Database Setup
1.  Create `chat_events`, `emergency_requests`, `product_click_logs` tables in Supabase.
2.  Set RLS policies (Insert: Public/Anon, Select: Partner/Admin).

### Phase 2: Frontend Logic (`BrandChatInterface`)
Modify `handleSend` and button callbacks to log events *before* or *simultaneously* with AI processing.

| Button Action | DB Event | Payload Example |
| :--- | :--- | :--- |
| **"상품 안내"** | `VIEW_PRODUCT_LIST` | `{ "source": "quick_menu" }` |
| **"긴급 접수"** | `EMERGENCY_click` | `{}` |
| **"장례 절차"** | `VIEW_PROCESS` | `{ "step": "intro" }` |
| **"상담 예약"** | `RESERVATION_click` | `{ "method": "chat" }` |
| **Products Carousel Click** | `VIEW_PRODUCT_DETAIL` | `{ "product_id": "1", "product_name": "Basic" }` |

### Phase 3: AI Service Update (`geminiService`)
1.  **Categorize Intents**: Ensure intents map clearly to the DB event types.
2.  **Handover Protocals**:
    - If `URGENT_DISPATCH` -> Trigger `emergency_requests` insert (via Frontend).
    - If `RESERVE` -> Trigger `consultations` insert.

### Phase 4: Dashboard (Admin) View Preparation
(Future work, but enabled by this plan)
- **Live Support**: Query `consultations WHERE status = 'live'`.
- **Emergency Board**: Query `emergency_requests WHERE status = 'NEW'`.

## 4. Execution Plan (Immediate)

1.  **Execute SQL**: Run migrations to create the 3 new tables.
2.  **Update `BrandChatInterface.tsx`**: Add `logChatEvent` helper function and attach to buttons.
3.  **Update `geminiService.ts`**: As previously planned, but ensure `action` strings match the event logging needs.

This structure ensures that **every click counts** and the Sangjo company gets the data they value most.
