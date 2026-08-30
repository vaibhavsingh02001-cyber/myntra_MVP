# ⚠️ Edge Cases & Boundary Conditions — Myntra Wishlist Conversion AI Agent

> **Project:** Myntra AI Agent — Dual-Agent System  
> **Scope:** Smart Nudge Agent (Timing) & Fit-Confidence Match Agent (Body Type / Style Fit)  
> **Purpose:** Document all critical edge cases, boundary conditions, failure scenarios, and their technical resolutions.

---

## 📋 Table of Contents

1. [Agent 1 — Smart Nudge Agent Edge Cases](#1-agent-1--smart-nudge-agent-edge-cases)
2. [Agent 2 — Fit-Confidence Match Agent Edge Cases](#2-agent-2--fit-confidence-match-agent-edge-cases)
3. [Product Catalog & LLM Extraction Edge Cases](#3-product-catalog--llm-extraction-edge-cases)
4. [User Profile & Onboarding Edge Cases](#4-user-profile--onboarding-edge-cases)
5. [Shared Infrastructure & Data Layer Edge Cases](#5-shared-infrastructure--data-layer-edge-cases)
6. [API Gateway & System Integration Edge Cases](#6-api-gateway--system-integration-edge-cases)
7. [User Behavior & Edge Scenarios](#7-user-behavior--edge-scenarios)
8. [Security, Privacy & Compliance Edge Cases](#8-security-privacy--compliance-edge-cases)

---

## 1. Agent 1 — Smart Nudge Agent Edge Cases

### 1.1 Rapid Price Fluctuations (Flash Sales & Price Bouncing)
* **Scenario:** A product's price drops by 15%, then increases back to normal within 1 hour, or fluctuates multiple times in a single day.
* **Impact:** Users receive multiple conflicting notifications or a price drop notification for an item whose price has already increased by the time they open the app.
* **Resolution Strategy:**
  * Enforce a minimum cooldown window of 48 hours per product/user for price-drop notifications.
  * Real-time verification step prior to FCM payload dispatch: check current live price against the trigger price. If current price >= original wishlist price, suppress nudge.

### 1.2 User Has Zero Purchase History (Cold Start for Salary-Day Modeler)
* **Scenario:** New user or user with `< 3` orders in the last 6 months wishlists items.
* **Impact:** `SalaryModeler` cannot infer an `EARLY` or `LATE` salary profile.
* **Resolution Strategy:**
  * Assign fallback status `IRREGULAR`.
  * Suppress salary-day nudges completely for `IRREGULAR` profile users to prevent irrelevant notifications.
  * Rely solely on price drop and intent expiry triggers until at least 3 orders are completed.

### 1.3 Rapid Wishlist Add & Remove (Wishlist Flashing)
* **Scenario:** User repeatedly adds and removes the same item from their wishlist within a short timeframe.
* **Impact:** Database pollution, reset of `added_at` timestamps, triggering false expiry or price drop notifications.
* **Resolution Strategy:**
  * Soft-delete wishlist items or preserve original `added_at` timestamp if re-added within 7 days.
  * Debounce wishlist add/remove events at the API Gateway level (e.g., 5-minute window).

### 1.4 Invalid or Expired Device Tokens (FCM Failures)
* **Scenario:** User uninstalls the app, revokes push permissions, or the device token expires.
* **Impact:** High FCM delivery failure rates, potential blocking by notification providers.
* **Resolution Strategy:**
  * Handle FCM error responses (e.g., `messaging/registration-token-not-registered`).
  * Immediately set `device_token = NULL` in `users` table upon 404/NotRegistered response.
  * Fall back to In-App Alert badges on the wishlist page instead of push notifications.

---

## 2. Agent 2 — Fit-Confidence Match Agent Edge Cases

### 2.1 Non-Apparel Products Wishlisted
* **Scenario:** User adds shoes, jewelry, cosmetics, accessories, or home decor to their wishlist.
* **Impact:** Fit-Confidence scoring algorithm fails or generates nonsensical scores for items without body fit relevance.
* **Resolution Strategy:**
  * Category filtering before score evaluation. Restrict Agent 2 processing strictly to apparel categories (`women/dresses`, `men/shirts`, `women/tops`, etc.).
  * For non-apparel categories, return `fit_match_score = NULL` and suppress the Fit-Match badge on the UI card.

### 2.2 Gender Profile Mismatch
* **Scenario:** User profile indicates female body shape (e.g., `pear`), but wishlists a men's product (or vice versa, e.g., shopping for a gift).
* **Impact:** Inaccurate compatibility scores generated using wrong body shape matrices.
* **Resolution Strategy:**
  * Detect category gender tag vs. user profile gender tag.
  * If category doesn't match user's profile context, return neutral badge: *"Gift Pick / Non-Profile Fit"* and disable heuristic scoring for that item.

### 2.3 Boundary Condition Height & Body Shape Combinations
* **Scenario:** Extremely tall/short users or uncommon body shape selections (e.g., Height `< 5'0"` shopping for `Maxi` dresses).
* **Impact:** Standard silhouette heuristics may yield false high/low scores.
* **Resolution Strategy:**
  * Implement explicit penalty/bonus adjustments for length attributes when extreme height buckets are detected (e.g., Maxi dress + Short height = `-15%` fit confidence penalty due to hem drag risk).

### 2.4 User Updates Body Profile
* **Scenario:** User changes their body shape, height, or fit preference in settings after having 20+ items in their wishlist.
* **Impact:** Cached Fit-Match scores become obsolete.
* **Resolution Strategy:**
  * Emit `user.profile.updated` event on RabbitMQ.
  * Invalidate all cached Redis keys matching `fit_score:{userId}:*`.
  * Trigger background worker job to re-compute scores for all active wishlist items of that user.

---

## 3. Product Catalog & LLM Extraction Edge Cases

### 3.1 Unstructured / Minimal Product Descriptions
* **Scenario:** Product catalog entry contains only title ("Blue Denim Shirt") and 0-character description or generic placeholder text.
* **Impact:** LLM attribute extractor cannot identify `cut`, `silhouette`, or `fabric`.
* **Resolution Strategy:**
  * Perform title fallback parsing using regex rules (e.g., regex match `"Wrap"`, `"A-Line"`, `"Slim Fit"` in title).
  * If attributes remain unresolved, set `fit_match_score = NULL` and display a neutral tag: *"Size Guide Available"* instead of an artificial match percentage.

### 3.2 LLM API Failure / Timeout / Rate-Limit Exceeded
* **Scenario:** Google Gemini API returns 429 Rate Limit, 5xx server error, or times out (> 3 seconds).
* **Impact:** Agent 2 scoring pipeline blocks wishlist page loading.
* **Resolution Strategy:**
  * Asynchronous processing: LLM extraction must never happen synchronously on the user's read path.
  * Circuit breaker pattern for LLM API calls. On failure, queue item for retry with exponential backoff and serve standard structured attributes or neutral score in the interim.

### 3.3 Hallucinated LLM Attributes
* **Scenario:** LLM outputs invalid JSON or non-standard attribute values (e.g., `silhouette: "skinny-flowy"`).
* **Impact:** Scoring Engine fails due to key mismatch in `SILHOUETTE_MATRIX`.
* **Resolution Strategy:**
  * Strict schema validation using Zod/TypeScript guards post-extraction.
  * Discard invalid fields and fall back to neutral compatibility score (`0.6`) for unvalidated attributes.

---

## 4. User Profile & Onboarding Edge Cases

### 4.1 Incomplete Onboarding / Skipped Profile Setup
* **Scenario:** User ignores the body-type profile setup modal and navigates directly to wishlist.
* **Impact:** `FitProfileService` returns `null` for body profile.
* **Resolution Strategy:**
  * Graceful UI degradation: Render a friendly CTA banner on the Wishlist item card: *"Unlock your Fit-Match Score — 30 sec setup [Complete Profile]"*.
  * Do not throw 404 or 500 errors from API.

### 4.2 Multi-User Shared Account / Device
* **Scenario:** Family members or couples share a single Myntra account with wildly different body types.
* **Impact:** Contradictory wishlist items and inaccurate fit matching.
* **Resolution Strategy:**
  * Allow multi-profile support (e.g., "Profile 1 - Personal", "Profile 2 - Gift/Partner").
  * Default scoring to the primary profile while providing a quick profile toggle on the wishlist screen.

---

## 5. Shared Infrastructure & Data Layer Edge Cases

### 5.1 Redis Cache Outage / Cache Stampede
* **Scenario:** Redis cluster crashes or experiences sudden eviction of thousands of fit scores simultaneously.
* **Impact:** Surge of DB read queries for user profiles and product attributes, causing DB CPU spikes.
* **Resolution Strategy:**
  * Use mutex locks / single-flight requests in Node.js to ensure only one worker re-computes a cold fit score while concurrent requests wait.
  * Primary PostgreSQL database served via Read Replicas for high-volume wishlist queries.

### 5.2 Out-of-Order Price Feed Webhooks
* **Scenario:** Price feed webhooks arrive out of sequence due to network delays (e.g., Event $1500 arrives after Event $1200).
* **Impact:** System records incorrect current price and sends false price drop or price hike alerts.
* **Resolution Strategy:**
  * Webhook payload must include an event timestamp (`event_timestamp`).
  * Reject price updates if `event_timestamp` is earlier than `updated_at` in the `products` table.

---

## 6. API Gateway & System Integration Edge Cases

### 6.1 Massive Wishlist Size (Wishlist Hoarders with 100+ Items)
* **Scenario:** User with 200+ wishlisted items opens the wishlist page.
* **Impact:** High payload size, slow API response time, potential gateway timeouts when fetching/enriching fit scores for all items.
* **Resolution Strategy:**
  * Paginate wishlist API responses (e.g., 20 items per page).
  * Compute and stream/fetch fit scores lazily as the user scrolls.

### 6.2 Partial Service Degradation (Agent 1 Down, Agent 2 Up)
* **Scenario:** Agent 1 microservice suffers downtime, while Agent 2 is healthy.
* **Impact:** API Gateway failures if endpoints strictly require both agents.
* **Resolution Strategy:**
  * Decouple wishlist enrichment at Gateway.
  * If Agent 1 is unresponsive, return wishlist items with fit scores (Agent 2) and fallback `nudge_status = null`.

---

## 7. User Behavior & Edge Scenarios

### 7.1 Out-of-Stock Items Wishlisted
* **Scenario:** Item in wishlist goes completely out of stock (`stock_count = 0`).
* **Impact:** Agent 1 might send a price drop or salary nudge for an unpurchaseable item, frustrating the user.
* **Resolution Strategy:**
  * Stock validation filter in `NudgeEvaluator`.
  * If `stock_count == 0`, suppress price drop and salary-day nudges.
  * Trigger a distinct "Back in Stock" notification when stock returns.

### 7.2 User Buys Item Outside Myntra (Competitor Purchase)
* **Scenario:** User buys the wishlisted dress on another app and leaves it in their Myntra wishlist forever.
* **Impact:** Continued nudging annoys the user.
* **Resolution Strategy:**
  * Automatically stop nudges after 3 consecutive unengaged nudges (user ignored push notifications).
  * Auto-archive wishlist items with no user interaction after 60 days.

---

## 8. Security, Privacy & Compliance Edge Cases

### 8.1 User Requests Account / Data Deletion (GDPR / DPDP Compliance)
* **Scenario:** User requests complete deletion of their account and personal data.
* **Impact:** Body-type profile data, purchase history, and wishlist logs must be scrubbed.
* **Resolution Strategy:**
  * Hard delete record in `users` table with `ON DELETE CASCADE` configured across `wishlist_items`, `nudge_event_log`, and body profile records.
  * Invalidate and delete all associated keys in Redis.

### 8.2 Malicious / Adversarial Inputs in Body Profile
* **Scenario:** User submits malicious script tags or SQL injection strings into free-text fields in the profile endpoint.
* **Impact:** XSS or SQL injection risks.
* **Resolution Strategy:**
  * Enum-only validation for body shape, height range, and fit preferences. Reject any non-whitelisted strings via Zod schemas prior to database access.

---

## 📐 Summary Matrix of Edge Cases

| Category | Primary Risk | High-Level Solution |
|----------|--------------|---------------------|
| **Timing (Agent 1)** | Notification Spam & Out-of-Stock Nudges | 48h Cooldown, 3/day Cap, Stock Check |
| **Fit Score (Agent 2)** | Non-Apparel & Gender Mismatch | Category Filtering, Gender Match Check |
| **Catalog & LLM** | API Timeouts & Bad JSON Output | Async Execution, Zod Schema Guard, Fallback Rules |
| **Infrastructure** | Cache Stampede & Database Spikes | Mutex Locks, DB Read Replicas |
| **Privacy / Security** | PII Scrape & Malicious Input | Enum Whitelisting, CASCADE Deletes |

---

*Edge Cases Specification version: 1.0 · Last updated: August 2026*
