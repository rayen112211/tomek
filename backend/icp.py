from typing import Dict, Tuple
from normalize import get_employee_count_from_range

# CEE region countries (all lowercase)
CEE_COUNTRIES = {
    "poland", "czech republic", "slovakia", "hungary", "romania", "ukraine",
    "bulgaria", "croatia", "estonia", "latvia", "lithuania", "serbia",
    "slovenia", "bosnia", "bosnia and herzegovina", "north macedonia",
    "polska", "czechy", "słowacja", "węgry", "rumunia",
}

# Polish-language role keywords
POLISH_ROLES = {
    "prezes", "właściciel", "dyrektor generalny", "dyrektor zarządzający",
    "współwłaściciel", "prezes zarządu", "członek zarządu",
}


def check_icp_fit(lead: dict, icp_settings: dict) -> Tuple[str, str]:
    """
    Check if a lead matches the KiMatch ICP.
    Returns (fit_status, explanation)
    fit_status: 'Fit', 'Partial Fit', 'Not Fit'
    """
    matches = []
    mismatches = []

    # ---- Country / Region ----
    target_countries = [c.lower() for c in icp_settings.get("target_countries", [])]
    lead_country = (lead.get("country") or "").lower()

    if lead_country and target_countries:
        # Direct match
        if lead_country in target_countries:
            matches.append("country")
        # CEE regional match (still a positive signal even if not explicitly listed)
        elif lead_country in CEE_COUNTRIES:
            matches.append("country")
        else:
            mismatches.append("country")

    # ---- Industry ----
    target_industries = [i.lower() for i in icp_settings.get("target_industries", [])]
    excluded_industries = [i.lower() for i in icp_settings.get("excluded_industries", [])]
    lead_industry = (lead.get("industry") or "").lower()

    if lead_industry:
        if any(ex in lead_industry or lead_industry in ex for ex in excluded_industries):
            return "Not Fit", f"Industry '{lead.get('industry')}' is excluded from KiMatch ICP."
        if any(t in lead_industry or lead_industry in t for t in target_industries):
            matches.append("industry")
        else:
            mismatches.append("industry")

    # ---- Employee Size ----
    emp_count = get_employee_count_from_range(lead.get("employee_range", ""))
    target_min = icp_settings.get("target_employee_min", 20)
    target_max = icp_settings.get("target_employee_max", 500)

    if emp_count > 0:
        if target_min <= emp_count <= target_max:
            matches.append("company_size")
        else:
            return "Not Fit", f"Company size is outside the target {target_min}-{target_max} range."

    # ---- Decision Maker Role ----
    target_roles = [r.lower() for r in icp_settings.get("target_decision_maker_roles", [])]
    lead_role = (lead.get("decision_maker_role") or "").lower()

    if lead_role and target_roles:
        # Polish role direct match
        if any(p in lead_role for p in POLISH_ROLES):
            matches.append("decision_maker_role")
        elif any(r in lead_role or lead_role in r for r in target_roles):
            matches.append("decision_maker_role")
        else:
            mismatches.append("decision_maker_role")

    # ---- Determine Fit ----
    total_criteria = len(matches) + len(mismatches)

    if total_criteria == 0:
        return "Partial Fit", "Insufficient data to determine KiMatch ICP fit."

    match_ratio = len(matches) / total_criteria

    if match_ratio >= 0.75:
        fit = "Fit"
    elif match_ratio >= 0.40:
        fit = "Partial Fit"
    else:
        fit = "Not Fit"

    # ---- Explanation ----
    parts = []
    if "country" in matches:
        parts.append(f"{lead.get('country', '')} is in the target CEE region")
    if "industry" in matches:
        parts.append(f"{lead.get('industry', '')} is a KiMatch target industry")
    if "company_size" in matches:
        parts.append(f"company size ({lead.get('employee_range', '')}) fits the 20–500 range")
    if "decision_maker_role" in matches:
        parts.append(f"{lead.get('decision_maker_role', '')} is a key decision maker role")

    if mismatches:
        mismatch_str = ", ".join(mismatches).replace("_", " ")
        parts.append(f"does not match: {mismatch_str}")

    explanation = "; ".join(parts) + "."
    return fit, explanation
