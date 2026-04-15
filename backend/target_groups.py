"""
Target Group Classification for QMatch ABM.
Classifies leads into one of 3 target groups based on the ABM spec criteria.

Group 1 — Rapid Growth Phase
    Revenue: PLN 20–100M
    YoY Growth: >= 50%
    Years in market: <= 15
    Owner on board
    Industry: trade, distribution, manufacturing, B2B services

Group 2 — Transformation Potential
    Revenue: PLN 20–150M
    YoY Growth: 0–20% (stable/moderate)
    Years in market: 15–25
    Owner on board

Group 3 — Declining Revenue
    Revenue: PLN 20–150M
    YoY Growth: negative (declining)
    Years in market: >= 20
    Owner on board
"""
from typing import Tuple, Optional

# Target industries per spec
GROUP_TARGET_INDUSTRIES = {
    "trade", "distribution", "manufacturing", "b2b services",
    "wholesale", "logistics", "transportation", "fmcg",
    "food & beverage", "business services", "professional services", "retail",
    "construction",
}

# Owner/founder-type roles (Polish + English)
OWNER_ROLES = {
    "właściciel", "współwłaściciel", "prezes", "prezes zarządu",
    "owner", "founder", "co-founder", "ceo", "chief executive",
    "managing director", "general manager", "president",
    "jednatel", "ügyvezető", "dyrektor generalny", "dyrektor zarządzający",
    "członek zarządu",
}


def _parse_revenue_pln(revenue_str: str) -> Optional[float]:
    """Try to parse annual_revenue_pln into a numeric value (in PLN M)."""
    if not revenue_str:
        return None
    s = revenue_str.upper().replace(",", ".").replace(" ", "")
    # e.g. "PLN45M", "45M", "45000000", "PLN 45 000 000"
    s = s.replace("PLN", "").replace("ZŁ", "").strip()
    if "M" in s:
        try:
            return float(s.replace("M", "")) * 1_000_000
        except ValueError:
            return None
    try:
        return float(s)
    except ValueError:
        return None


def _is_owner_on_board(role: str) -> bool:
    """Check if the decision maker role indicates an owner/founder."""
    role_lower = role.lower().strip()
    return any(r in role_lower or role_lower in r for r in OWNER_ROLES)


def _is_target_industry(industry: str) -> bool:
    """Check if the industry matches QMatch target industries."""
    ind_lower = industry.lower().strip()
    return any(t in ind_lower or ind_lower in t for t in GROUP_TARGET_INDUSTRIES)


def classify_target_group(lead: dict) -> Tuple[str, str]:
    """
    Classify a lead into one of 3 QMatch target groups.

    Returns:
        (group, reason): e.g. ("Group 1", "+80% YoY growth, owner on board, no COO")
        group can be: "Group 1", "Group 2", "Group 3", ""
    """
    role = lead.get("decision_maker_role", "") or ""
    industry = lead.get("industry", "") or ""
    revenue_str = lead.get("annual_revenue_pln", "") or ""
    growth_pct = lead.get("revenue_growth_pct")
    revenue_trend = (lead.get("revenue_trend", "") or "").lower()
    years_in_market = lead.get("years_in_market")
    notes = (lead.get("notes", "") or "").lower()
    typed_signals = lead.get("typed_signals", []) or []
    signal_types = {s.get("type", "") for s in typed_signals}

    # Resolve revenue
    revenue_num = _parse_revenue_pln(revenue_str)

    # Resolve growth: explicit field wins, else infer from trend
    if growth_pct is None and revenue_trend:
        if revenue_trend == "growing":
            growth_pct = 60.0   # assume significant growth if trend is "growing"
        elif revenue_trend == "stable":
            growth_pct = 10.0
        elif revenue_trend == "declining":
            growth_pct = -10.0

    # Infer from signal types if still unknown
    if growth_pct is None:
        if "scaling" in signal_types or "growth" in signal_types:
            growth_pct = 60.0   # strong growth signals → Group 1 candidate
        elif "risk" in signal_types:
            growth_pct = 25.0   # risk without explicit growth → moderate

    # Check owner on board
    owner_on_board = _is_owner_on_board(role)

    # Check industry match
    industry_match = _is_target_industry(industry)

    # Revenue range checks (in PLN M equivalent)
    revenue_in_range_low = (revenue_num is None) or (20_000_000 <= revenue_num <= 150_000_000)
    revenue_in_range_g1 = (revenue_num is None) or (20_000_000 <= revenue_num <= 100_000_000)

    reasons = []

    # ─── GROUP 1: Rapid Growth ───────────────────────────────────────────────
    # Revenue 20–100M, growth >= 50%, years <= 15, owner on board
    g1_growth = growth_pct is not None and growth_pct >= 50
    g1_years = years_in_market is None or years_in_market <= 15
    g1_revenue = revenue_in_range_g1

    if g1_growth and g1_revenue:
        reasons.append(f"+{growth_pct:.0f}% YoY revenue growth" if growth_pct else "rapid growth signals")
    if owner_on_board:
        reasons.append("owner on board")
    if not industry_match and g1_growth:
        pass  # still valid, just not extra-target industry
    if "scaling" in signal_types:
        reasons.append("scaling signals detected")

    if g1_growth and g1_revenue and g1_years:
        reason = "; ".join(reasons) if reasons else "rapid growth phase"
        return "Group 1", reason

    # ─── GROUP 3: Declining Revenue ──────────────────────────────────────────
    # Revenue 20–150M, growth < 0 (declining), years >= 20
    g3_declining = (growth_pct is not None and growth_pct < 0) or (revenue_trend == "declining")
    g3_years = years_in_market is None or years_in_market >= 20
    g3_revenue = revenue_in_range_low

    if g3_declining and g3_revenue and g3_years:
        g3_reasons = []
        if growth_pct is not None and growth_pct < 0:
            g3_reasons.append(f"{growth_pct:.0f}% revenue decline")
        elif revenue_trend == "declining":
            g3_reasons.append("declining revenue trend")
        if years_in_market:
            g3_reasons.append(f"{years_in_market} years in market")
        if owner_on_board:
            g3_reasons.append("owner on board")
        return "Group 3", "; ".join(g3_reasons) if g3_reasons else "declining revenue, long track record"

    # ─── GROUP 2: Transformation Potential ───────────────────────────────────
    # Revenue 20–150M, growth 0–20% (stable/moderate), years 15–25
    g2_growth = growth_pct is not None and 0 <= growth_pct <= 20
    g2_years = years_in_market is None or (15 <= years_in_market <= 30)
    g2_revenue = revenue_in_range_low

    # Also match companies with stable trend and owner on board even without years data
    stable_signals = revenue_trend == "stable" or g2_growth

    if stable_signals and g2_revenue and (g2_years or years_in_market is None):
        g2_reasons = []
        if growth_pct is not None:
            g2_reasons.append(f"{growth_pct:.0f}% YoY growth (stable/moderate)")
        elif revenue_trend == "stable":
            g2_reasons.append("stable revenue trend")
        if years_in_market:
            g2_reasons.append(f"{years_in_market} years in market")
        if owner_on_board:
            g2_reasons.append("owner still operational")
        return "Group 2", "; ".join(g2_reasons) if g2_reasons else "stable growth, transformation potential"

    # ─── Fallback: check if any group signals exist ──────────────────────────
    # Owner-managed with scaling signals but no revenue/growth data → Group 1 candidate
    if owner_on_board and ("scaling" in signal_types or "risk" in signal_types):
        reason_parts = []
        if "risk" in signal_types:
            reason_parts.append("owner dependency risk signal")
        if "scaling" in signal_types:
            reason_parts.append("scaling signals")
        if industry_match:
            reason_parts.append(f"target industry ({industry})")
        return "Group 1", "; ".join(reason_parts) if reason_parts else "owner-managed with growth signals"

    # Industry target match with owner → at least Group 2 potential
    if owner_on_board and industry_match:
        return "Group 2", f"owner-managed {industry} company, transformation potential"

    return "", ""
