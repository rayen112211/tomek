"""
Real growth signal detection for KiMatch Lead Qualification Engine.
Analyzes available lead data fields to surface meaningful signals
that indicate why a company might need consulting help right now.
"""
from typing import List, Dict
from normalize import get_employee_count_from_range


# Keywords that suggest operational/structural needs
STRUCTURE_KEYWORDS = [
    "operations", "hr", "human resources", "management", "process",
    "scaling", "restructure", "reorganize", "efficiency", "systems",
    "procedures", "workflow", "compliance", "kpi", "reporting",
    "back office", "administration", "middle management",
    "operacje", "zarządzanie", "procesy", "struktura", "efektywność",
]

# Keywords that suggest growth momentum
GROWTH_KEYWORDS = [
    "hiring", "expanding", "growth", "new market", "new office",
    "acquisition", "merger", "investment", "funding", "international",
    "expansion", "scale", "series", "venture", "capital", "runda",
    "ekspansja", "wzrost", "rozwój", "zatrudniamy", "rekrutacja",
]

# Role keywords that indicate NO structural support (risk signal)
COO_ROLES = [
    "coo", "chief operating", "operations director", "dyrektor operacyjny",
    "head of operations", "vp operations", "vp of operations",
    "director of operations",
]

FOUNDER_ROLES = [
    "founder", "co-founder", "owner", "właściciel", "współwłaściciel",
    "prezes", "president", "ceo", "chief executive",
]

LEADERSHIP_CHANGE_KEYWORDS = [
    "new ceo", "new coo", "new cfo", "new director", "nowy prezes",
    "nowy dyrektor", "joined as", "appointed", "promoted to",
    "leadership change", "management change",
]


def detect_signals(lead: dict) -> List[Dict[str, str]]:
    """
    Detect meaningful growth and risk signals from lead data.
    Returns a list of typed signal dicts:
    [{"type": "scaling", "label": "...", "icon": "trending-up"}]
    """
    signals = []
    seen_types = set()

    role = (lead.get("decision_maker_role") or "").lower()
    notes = (lead.get("notes") or "").lower()
    source = (lead.get("source") or "").lower()
    industry = (lead.get("industry") or "").lower()
    employee_range = lead.get("employee_range") or ""
    combined_text = f"{notes} {source}"

    emp_count = get_employee_count_from_range(employee_range)

    # 1. SCALING SIGNAL — founder-led company over 25 people
    is_founder = any(f in role for f in FOUNDER_ROLES)
    if is_founder and emp_count >= 25:
        signals.append({
            "type": "scaling",
            "label": "Founder-led at growth stage",
            "icon": "trending-up",
        })
        seen_types.add("scaling")

    # 2. SCALING SIGNAL — large employee count relative to typical KiMatch target
    if emp_count >= 150 and "scaling" not in seen_types:
        signals.append({
            "type": "scaling",
            "label": "Significant headcount (scaling phase)",
            "icon": "trending-up",
        })
        seen_types.add("scaling")

    # 3. STRUCTURE SIGNAL — notes/source mention operational keywords
    if any(kw in combined_text for kw in STRUCTURE_KEYWORDS):
        signals.append({
            "type": "structure",
            "label": "Operational structure need detected",
            "icon": "settings",
        })
        seen_types.add("structure")

    # 4. STRUCTURE SIGNAL — manufacturing/logistics/construction without management roles
    structural_industries = {"manufacturing", "logistics", "construction", "distribution", "transportation", "fmcg"}
    if any(ind in industry for ind in structural_industries):
        if emp_count >= 25 and "structure" not in seen_types:
            signals.append({
                "type": "structure",
                "label": f"{lead.get('industry', 'Industry')} at scale needs strong ops",
                "icon": "settings",
            })
            seen_types.add("structure")

    # 5. RISK SIGNAL — founder-led above 50 with no COO equivalent
    has_coo = any(c in role for c in COO_ROLES)
    if is_founder and emp_count >= 25 and not has_coo and "risk" not in seen_types:
        signals.append({
            "type": "risk",
            "label": "No COO — founder carrying operational load",
            "icon": "alert-triangle",
        })
        seen_types.add("risk")

    # 6. GROWTH SIGNAL — keywords in notes/source
    if any(kw in combined_text for kw in GROWTH_KEYWORDS) and "growth" not in seen_types:
        signals.append({
            "type": "growth",
            "label": "Active growth signals in profile",
            "icon": "rocket",
        })
        seen_types.add("growth")

    # 7. EXPANSION SIGNAL — LinkedIn presence suggests external activity
    linkedin = lead.get("linkedin_company_url") or ""
    website = lead.get("website") or ""
    if linkedin and website and emp_count >= 100 and "expansion" not in seen_types:
        signals.append({
            "type": "expansion",
            "label": "Active online presence at scale",
            "icon": "globe",
        })
        seen_types.add("expansion")

    # 8. LEADERSHIP SIGNAL — leadership change keywords
    if any(kw in combined_text for kw in LEADERSHIP_CHANGE_KEYWORDS) and "leadership" not in seen_types:
        signals.append({
            "type": "leadership",
            "label": "Recent leadership change",
            "icon": "user-check",
        })
        seen_types.add("leadership")

    # 9. E-COMMERCE SIGNAL — e-commerce with warehouse/logistics pressure
    if "e-commerce" in industry or "ecommerce" in industry or "e commerce" in industry:
        if emp_count >= 30 and "ecom" not in seen_types:
            signals.append({
                "type": "scaling",
                "label": "E-commerce scaling — ops complexity rising",
                "icon": "trending-up",
            })
            seen_types.add("ecom")

    return signals


def signals_to_legacy_list(typed_signals: List[Dict[str, str]]) -> List[str]:
    """Convert typed signals to simple string list for backward compatibility."""
    return [s["label"] for s in typed_signals]
