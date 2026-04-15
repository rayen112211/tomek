# QMatch ABM Platform — Full Alignment with Specification

## Background

The existing `tomek-main` codebase is already a solid lead intelligence dashboard built for QMatch Consulting. After deep analysis vs. the specification document, this plan identifies every gap and proposes precise changes to fully align the platform with what the client expects.

---

## Current State vs. Spec — Gap Analysis

| Spec Requirement | Current State | Gap |
|---|---|---|
| **3 Target Groups** (Rapid Growth, Transformation, Declining) | Not modelled — single ICP | ❌ Missing |
| **Revenue-based filtering** (PLN 20–150M) | No revenue field; uses employee count only | ❌ Missing |
| **YoY Revenue Growth** (+50%, stable, declining) | No revenue trend field | ❌ Missing |
| **Years in market** (age of company) | No founding year / company age field | ❌ Missing |
| **Annual revenue + headcount** in lead data | No revenue field in Lead model | ❌ Missing |
| **Company short description** | `notes` field exists but not structured | ⚠️ Partial |
| **Verified email (3-method approach)** | Placeholder only (mock hash) | ⚠️ Placeholder |
| **Email guessing (Polish patterns)** | Not implemented | ❌ Missing |
| **Email verification status** | Field exists, mock only | ⚠️ Placeholder |
| **Polish "Sp. z o.o." legal form filtering** | Not modelled | ❌ Missing |
| **Owner-on-board / Shareholder as DM** | Partially via role matching | ⚠️ Partial |
| **ICP fit with Groups (Group 1/2/3)** | Single ICP fit label | ❌ Missing |
| **Lead scoring (0–10)** | Exists and works well | ✅ Good |
| **AI explanation + Suggested angle** | Exists, QMatch-tuned | ✅ Good |
| **Export CSV/Excel** | CSV export exists | ✅ Good |
| **Filtering/sorting dashboard** | Fully functional | ✅ Good |
| **Company revenue in export** | Not in model | ❌ Missing |
| **LinkedIn DM profile** | Field exists | ✅ Good |
| **Polish signal detection** | Partial (Pułapka signals) | ✅ Good |

---

## Proposed Changes

### Component 1: Backend Data Model

#### [MODIFY] [models.py](file:///c:/Users/azizi/Downloads/tomek-main/backend/models.py)

Add new fields to `Lead`, `LeadCreate`, and `LeadUpdate`:
- `annual_revenue_pln: str = ""` — approximate revenue (e.g., "PLN 40M")
- `revenue_growth_pct: Optional[float]` — YoY revenue growth %
- `years_in_market: Optional[int]` — company age in years
- `legal_form: str = ""` — e.g., "Sp. z o.o."
- `company_description: str = ""` — short description of what the company does
- `ownership_structure: str = ""` — e.g., "Owner-managed", "Family business"
- `target_group: str = ""` — Group 1 / Group 2 / Group 3 / None
- `revenue_trend: str = ""` — "growing", "stable", "declining"

Also update `ICPSettings` to include:
- `target_groups_enabled: bool = True`

---

### Component 2: Backend — Target Group Classification

#### [NEW] [target_groups.py](file:///c:/Users/azizi/Downloads/tomek-main/backend/target_groups.py)

New module: `classify_target_group(lead: dict) -> Tuple[str, str]`

**Group 1 — Rapid Growth:**
- Revenue: PLN 20–100M (if available)
- YoY growth: ≥ 50%
- Years in market: ≤ 15
- Owner on board (role match)
- Industry: trade, distribution, manufacturing, B2B services

**Group 2 — Transformation Potential:**
- Revenue: PLN 20–150M
- YoY growth: 0–20% (stable)
- Years in market: 15–25
- Owner on board

**Group 3 — Declining Revenue:**
- Revenue: PLN 20–150M
- YoY growth: negative (declining)
- Years in market: ≥ 20
- Owner on board

Falls back gracefully if data is missing — returns "Potential" if partial match.

---

### Component 3: Backend — Scoring Enhancement

#### [MODIFY] [scoring.py](file:///c:/Users/azizi/Downloads/tomek-main/backend/scoring.py)

Add target group bonus scoring:
- `+1` if lead classified into any target group
- `+1` if revenue_growth_pct ≥ 50 (super-high growth)
- `+1` if revenue_trend == "declining" AND years_in_market ≥ 20 (Group 3 signal)
- Adjust the "QMatch Perfect Client" logic to also take into account `target_group`

Also expose `target_group` in `why_this_lead` output.

---

### Component 4: Backend — Email Guessing (Polish Pattern)

#### [MODIFY] [server.py](file:///c:/Users/azizi/Downloads/tomek-main/backend/server.py)

Update `mock_enrich_email` to implement actual Polish email pattern guessing:
- Pattern 1: `first_initial + last_name @ domain` (e.g., `jkowalski@firma.pl`)
- Pattern 2: `firstname.lastname @ domain`
- Pattern 3: `lastname.firstname @ domain`
- Pattern 4: `firstname @ domain`

The endpoint returns a list of candidate emails with `guessed` status, and stores the best guess. This matches the spec's "3-method approach": lookup → verify → guess.

---

### Component 5: Backend — Mock Data Update

#### [MODIFY] [mock_data.py](file:///c:/Users/azizi/Downloads/tomek-main/backend/mock_data.py)

Update existing ~30 leads to include:
- `annual_revenue_pln` values (PLN 20M–150M range)
- `revenue_growth_pct` (positive for Group 1, stable for Group 2, negative for Group 3)
- `years_in_market` — reflecting appropriate group age
- `legal_form: "Sp. z o.o."` for Polish companies
- `company_description` — one-sentence business description
- `revenue_trend` — "growing" / "stable" / "declining"
- `ownership_structure` — "Owner-managed" for most

Add a mix across all 3 groups (10 per group roughly).

---

### Component 6: Backend — server.py (process_and_score_lead)

#### [MODIFY] [server.py](file:///c:/Users/azizi/Downloads/tomek-main/backend/server.py)

- Call `classify_target_group(lead_dict)` after signal detection
- Store `target_group` and `target_group_reason` in lead dict
- Update export CSV columns to include new fields: `annual_revenue_pln`, `revenue_growth_pct`, `years_in_market`, `legal_form`, `company_description`, `target_group`

---

### Component 7: Frontend — Dashboard Enhancements

#### [MODIFY] [DashboardPage.js](file:///c:/Users/azizi/Downloads/tomek-main/frontend/src/pages/DashboardPage.js)

- Add **Target Group** column to the leads table (Group 1: 🚀 Rapid Growth, Group 2: 🔄 Transformation, Group 3: 📉 Declining)
- Add **Revenue** column (PLN value)
- Add Target Group filter to FilterBar
- Add stat cards for Group 1 / Group 2 / Group 3 counts
- Show `company_description` in lead row tooltip

---

### Component 8: Frontend — Filter Bar

#### [MODIFY] [FilterBar.js](file:///c:/Users/azizi/Downloads/tomek-main/frontend/src/components/FilterBar.js)

Add `target_group` filter dropdown (All / Group 1 / Group 2 / Group 3).

---

### Component 9: Frontend — Lead Details Sheet

#### [MODIFY] [LeadDetailsSheet.js](file:///c:/Users/azizi/Downloads/tomek-main/frontend/src/components/LeadDetailsSheet.js)

Add new fields in the Company Information section:
- Annual Revenue (PLN)
- Revenue Growth %
- Years in Market
- Legal Form
- Revenue Trend
- Company Description
- Target Group badge (prominent, color-coded)
- Ownership Structure

---

### Component 10: Frontend — Status Badges

#### [MODIFY] [StatusBadges.js](file:///c:/Users/azizi/Downloads/tomek-main/frontend/src/components/StatusBadges.js)

Add `TargetGroupBadge` component:
- Group 1: green background, "🚀 Rapid Growth"
- Group 2: blue background, "🔄 Transformation"  
- Group 3: orange/red background, "📉 Declining"
- None/Unknown: grey

---

### Component 11: Backend — GetLeads Filter

#### [MODIFY] [server.py — get_leads endpoint](file:///c:/Users/azizi/Downloads/tomek-main/backend/server.py)

Add `target_group: Optional[str]` query param to `/api/leads` endpoint for filtering.

---

## Open Questions

> [!IMPORTANT]
> **Revenue data**: The spec requires PLN 20–150M revenue filtering. This requires sourcing real financial data (Rejestr.io API, KRS). For now, we will add the `annual_revenue_pln` field and use it for display/filtering, but **actual data sourcing from Rejestr.io** is a future integration. The mock data will have realistic values.

> [!IMPORTANT]
> **Email verification**: The spec demands real verification (ZeroBounce/NeverBounce). The current implementation is mock-only. The backend endpoints already exist as placeholders — for now they stay as intelligent placeholders that implement the Polish email pattern guessing logic properly.

> [!NOTE]
> **Poland-first focus**: The spec is explicitly focused on Polish "Sp. z o.o." companies, but the existing data covers all CEE. We will keep CEE companies in the system but update scoring to give Poland highest priority (already done partially — will refine).

---

## Verification Plan

### Automated Tests
- Run existing `backend_test.py` after changes and verify pass rate
- Verify new fields appear in `/api/leads` response
- Verify `target_group` classification works for all 3 groups

### Manual Verification
- Start backend + frontend, seed data, confirm all 3 target groups appear in dashboard
- Confirm new fields are visible in Lead Details Sheet
- Confirm Target Group filter works
- Confirm CSV export includes new columns
- Confirm scoring reflects target group bonus
