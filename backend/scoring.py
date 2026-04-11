from typing import Dict, Tuple, List
from normalize import get_employee_count_from_range

# CEE countries get a regional bonus
CEE_COUNTRIES = {
    "poland", "czech republic", "slovakia", "hungary", "romania", "ukraine",
    "bulgaria", "croatia", "estonia", "latvia", "lithuania", "serbia",
    "polska", "czechy",
}

# Polish-language role keywords
POLISH_FOUNDER_ROLES = {"prezes", "właściciel", "współwłaściciel", "prezes zarządu"}


def calculate_score(lead: dict, icp_settings: dict) -> Tuple[int, Dict[str, int], str]:
    """
    Calculate KiMatch lead score out of 10.
    Returns (score, breakdown, why_this_lead)

    Scoring:
    +3 ICP match (industry + country/CEE + size)
    +2 Decision maker role is an owner/C-level
    +2 Growth / risk signals detected
    +1 Direct email available
    +1 Complete company profile
    +1 KiMatch bonus (Polish company or founder-led at risk signal stage)
    """
    breakdown = {}
    reasons = []
    score = 0

    target_countries = [c.lower() for c in icp_settings.get("target_countries", [])]
    target_industries = [i.lower() for i in icp_settings.get("target_industries", [])]
    target_min = icp_settings.get("target_employee_min", 20)
    target_max = icp_settings.get("target_employee_max", 500)

    lead_country = (lead.get("country") or "").lower()
    lead_industry = (lead.get("industry") or "").lower()
    emp_count = get_employee_count_from_range(lead.get("employee_range", ""))

    country_match = (lead_country in target_countries) or (lead_country in CEE_COUNTRIES) if lead_country else False
    industry_match = any(t in lead_industry or lead_industry in t for t in target_industries) if lead_industry else False
    size_match = (target_min <= emp_count <= target_max) if emp_count > 0 else False

    # ---- ICP Match (max +3) ----
    icp_score = 0
    matches = sum([country_match, industry_match, size_match])
    if matches == 3:
        icp_score = 3
        reasons.append("Matches KiMatch ICP on industry, region, and company size")
    elif matches == 2:
        icp_score = 2
        parts = []
        if country_match: parts.append("CEE region")
        if industry_match: parts.append("target industry")
        if size_match: parts.append("right size")
        reasons.append(f"Matches KiMatch ICP on {' and '.join(parts)}")
    elif matches == 1:
        icp_score = 1
        if country_match: reasons.append("Company is in the CEE target region")
        if industry_match: reasons.append(f"{lead.get('industry', '')} is a KiMatch target industry")
        if size_match: reasons.append("Company size is in the target range")

    breakdown["icp_match"] = icp_score
    score += icp_score

    # ---- Decision Maker Role (max +2) ----
    target_roles = [r.lower() for r in icp_settings.get("target_decision_maker_roles", [])]
    lead_role = (lead.get("decision_maker_role") or "").lower()

    is_high_value_dm = False
    if lead_role:
        # Polish roles get automatic match
        if any(p in lead_role for p in POLISH_FOUNDER_ROLES):
            is_high_value_dm = True
        elif any(r in lead_role or lead_role in r for r in target_roles):
            is_high_value_dm = True

    if is_high_value_dm:
        breakdown["decision_maker"] = 2
        score += 2
        reasons.append(f"{lead.get('decision_maker_role', '')} is a primary decision maker")
    else:
        breakdown["decision_maker"] = 0
        if lead_role:
            reasons.append(f"Role '{lead.get('decision_maker_role', '')}' is not a primary KiMatch target")

    # ---- Growth / Risk Signals (max +2) ----
    typed_signals = lead.get("typed_signals", [])
    signal_types = {s.get("type") for s in typed_signals}
    legacy_signals = lead.get("growth_signals", [])

    if typed_signals:
        signal_score = min(2, len(typed_signals))
        breakdown["growth_signals"] = signal_score
        score += signal_score
        # Prioritize risk and scaling signals in the reason
        if "risk" in signal_types:
            reasons.append("Risk signal: founder carrying operational load without COO")
        elif "scaling" in signal_types and "structure" in signal_types:
            reasons.append("Scaling + structure signals — classic KiMatch engagement trigger")
        elif "scaling" in signal_types:
            reasons.append("Company at scaling inflection point")
        elif "structure" in signal_types:
            reasons.append("Structural complexity without formal management layer")
        else:
            reasons.append(f"Growth signals: {', '.join(s.get('label','') for s in typed_signals[:2])}")
    elif legacy_signals:
        breakdown["growth_signals"] = 1
        score += 1
        reasons.append(f"Signals: {', '.join(legacy_signals[:2])}")
    else:
        breakdown["growth_signals"] = 0

    # ---- Direct Email (+1) ----
    email = lead.get("email", "")
    if email and "@" in email:
        breakdown["email_available"] = 1
        score += 1
        reasons.append("Direct contact email available")
    else:
        breakdown["email_available"] = 0

    # ---- Completeness (+1) ----
    completeness_fields = ["website", "company_name", "country", "industry", "employee_range"]
    filled = sum(1 for f in completeness_fields if lead.get(f, ""))
    if filled >= 4:
        breakdown["completeness"] = 1
        score += 1
    else:
        breakdown["completeness"] = 0

    # ---- KiMatch Bonus (+1) — Poland or founder-led risk ----
    kimatch_bonus = 0
    if lead_country == "poland" or lead_country == "polska":
        kimatch_bonus = 1
        reasons.append("Polish company — core KiMatch market")
    elif "risk" in signal_types and is_high_value_dm:
        kimatch_bonus = 1
        reasons.append("High-value decision maker with structural risk signal")

    breakdown["kimatch_bonus"] = kimatch_bonus
    score += kimatch_bonus

    # Cap non-target countries to max score of 5
    if not country_match:
        score = min(score, 5)

    score = min(score, 10)

    why = generate_why(lead, score, reasons)
    return score, breakdown, why


def generate_why(lead: dict, score: int, reasons: List[str]) -> str:
    """Generate a short template-based 'Why this lead' explanation."""
    company = lead.get("company_name", "This company")
    role = lead.get("decision_maker_role", "")
    name = lead.get("decision_maker_name", "")

    if score >= 8:
        quality = "a top-priority"
    elif score >= 5:
        quality = "a strong"
    else:
        quality = "a low-priority"

    parts = [f"{company} is {quality} KiMatch prospect."]

    if reasons:
        top = reasons[:3]
        parts.append(" ".join(r + ("." if not r.endswith(".") else "") for r in top))

    if name and role:
        parts.append(f"Contact: {name} ({role}).")

    return " ".join(parts)
