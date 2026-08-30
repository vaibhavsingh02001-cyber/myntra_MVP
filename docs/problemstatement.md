# 🛍️ Problem Statement — Myntra Wishlist-to-Purchase Conversion

> *"Wishlist demand isn't cold — it's stuck between 'not the right time' and 'not sure it'll suit me,' and Myntra never answers either."*

---

## 🔍 Core Problem

Myntra's high-intent **"Wishlist Hoarders"** — repeat buyers (2+ orders/month) who add 5+ items to their wishlist — convert **less than 10%** of those items within 30 days.

These users don't lack **purchase intent**. They lack the two things that would turn intent into action:

| Gap | What Users Are Missing |
|-----|------------------------|
| ⏰ **Moment** | The *right time* to buy |
| 🪞 **Confidence** | Certainty that the item will *actually work for them* |

### By the Numbers

- **49%** cite *price/salary-timing uncertainty* as their #1 reason for not converting  
  > *"I'll buy when it drops / when I get paid"*

- **24%** cite *fit and style uncertainty* as a recurring blocker  
  > *"Will it look like it does on the model?"*

### The Silent Leak

Because nothing in the app resolves either gap, **high-intent demand Myntra already owns quietly leaks away every month** — to forgetting, to waiting, or to the same item bought cheaper on Amazon / Ajio / offline.

> This never shows up as a complaint — so it never shows up as a fix.

---

## 💡 Why Two Agents?

The **49%** and the **24%** are two different root causes, not one problem wearing two faces. They require two separate mechanisms, not a single nudge that tries to do both:

```
1. TIMING gap      →  Users need to be told WHEN to act
2. CONFIDENCE gap  →  Users need to be told WHETHER it'll work for them
```

---

## 🤖 Agent 1 — Smart Nudge Agent *(Timing)*

### Problem It Solves

Wishlisted items sit idle because users have no external trigger to revisit them. They rely on themselves to remember to check back — and mostly, **they don't**.

### Problem Statement

> *"Wishlisted intent has no expiry-aware trigger. Users need to be told the **right moment** to act — a price drop, a salary-day window, or a closing 30-day intent window — instead of relying on themselves to remember to check back."*

### How It Works

The Smart Nudge Agent monitors each wishlisted item and proactively surfaces contextual triggers:

- 📉 **Price Drop Alert** — notifies the user the moment an item's price falls
- 💰 **Salary-Day Window** — nudges around the user's typical purchase cycle
- ⏳ **Intent Expiry Warning** — flags items approaching the 30-day wishlist drop-off window

---

## 🤖 Agent 2 — Fit-Confidence Match Agent *(Body Type / Style Fit)*

### Problem It Solves

Users see a wishlisted item on a model whose body type may not resemble theirs, and have no reliable way to know if the **fit, cut, or style** will translate to their own body. So they:

- Stall and seek opinions **outside the app** (friends, reviews, other sites)
- Or **abandon the purchase entirely** rather than risk a return

### Problem Statement

> *"Users wishlist apparel with genuine intent, but the product image only shows fit on the model's body — not theirs. With no way to translate 'how it looks on them' into 'how it'll look on me,' users default to hesitation, not purchase.*
>
> *This fit-uncertainty is the **second-largest blocker (24%)** to converting saved items, and unlike the timing problem, it cannot be solved by nudging — it has to be solved by giving the user a personalized, trustworthy answer to **'will this work for MY body?'** before they decide."*

### Core Mechanic

```
Step 1  →  Capture a lightweight body-type profile
           (Height range · Body shape/type · Fit preference)
           No invasive input. No photo requirement upfront.

Step 2  →  For each wishlisted item, generate a Fit-Match Score (%)
           estimating how well the item's cut/style suits the user's profile
           using: fabric · cut · silhouette  ×  body-type heuristics

Step 3  →  Surface the score directly on the wishlist, next to the item
           Turning a vague "will it suit me?" doubt into a concrete,
           personalized signal at the exact moment of decision
```

---

## 🏆 Combined Value Proposition

### For the User
> Removes **two separate reasons to hesitate** — *"not the right time"* and *"not sure it'll suit me"* — **without ever discounting the product**.

### For the Business

| Business Outcome | Mechanism |
|-----------------|-----------|
| ✅ Converts already-owned, high-intent demand | No CAC spend required |
| ✅ Zero margin hit | No discounting needed |
| ✅ Reduces silent drop-off to competitors | Answers the "just double-check" query in-app |

> Users currently leave Myntra to "just double-check" before buying elsewhere. Both agents close this loop **before** the user exits the funnel.

---

## 📐 Scope Summary

| | Agent 1: Smart Nudge | Agent 2: Fit-Confidence Match |
|---|---|---|
| **Root Cause** | Timing gap | Confidence gap |
| **User Signal Addressed** | 49% (price/timing blockers) | 24% (fit/style uncertainty) |
| **Core Output** | Contextual purchase trigger | Personalized Fit-Match Score (%) |
| **Requires User Data** | Purchase history + price tracking | Lightweight body-type profile |
| **Primary Surface** | Push notification / In-app alert | Wishlist item card |
| **Conversion Lever** | Right moment | Right confidence |
