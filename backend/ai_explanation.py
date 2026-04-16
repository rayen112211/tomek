"""
Claude AI-powered lead explanation generator for QMatch.
Falls back to an improved template if no API key is available.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _build_prompt(lead: dict) -> str:
    company = lead.get("company_name", "This company")
    country = lead.get("country", "")
    industry = lead.get("industry", "")
    emp_range = lead.get("employee_range", "")
    role = lead.get("decision_maker_role", "")
    name = lead.get("decision_maker_name", "")
    website = lead.get("website", "")
    notes = lead.get("notes", "")
    company_description = lead.get("company_description", "")
    signals = lead.get("growth_signals", [])
    typed_signals = lead.get("typed_signals", [])
    target_group = lead.get("target_group", "")
    annual_revenue = lead.get("annual_revenue_pln", "")
    revenue_growth = lead.get("revenue_growth_pct")
    revenue_trend = lead.get("revenue_trend", "")
    years_in_market = lead.get("years_in_market")
    legal_form = lead.get("legal_form", "")

    signal_text = ""
    if typed_signals:
        signal_text = "Detected signals: " + "; ".join(
            f"{s.get('label', '')} ({s.get('type', '')})" for s in typed_signals
        )
    elif signals:
        signal_text = "Signals: " + ", ".join(signals[:4])

    dm_text = ""
    if name and role:
        dm_text = f"Decision maker: {name}, {role}."
    elif role:
        dm_text = f"Decision maker role: {role}."

    # Build ABM target group context
    group_context = ""
    if target_group == "Group 1":
        growth_str = f"+{revenue_growth:.0f}% YoY revenue growth" if revenue_growth and revenue_growth > 0 else "rapid growth phase"
        group_context = f"This company is in GROUP 1 — Rapid Growth Phase: {growth_str}. The message: 'We'll help you bring order to the chaos of growth before things fall apart.'"
    elif target_group == "Group 2":
        group_context = "This company is in GROUP 2 — Transformation Potential: stable or moderate growth (0-20%), owner still operational, likely needs to step back or reorganize for the next stage."
    elif target_group == "Group 3":
        decline_str = f"{revenue_growth:.0f}% revenue decline" if revenue_growth and revenue_growth < 0 else "declining revenue trend"
        group_context = f"This company is in GROUP 3 — Declining Revenue: {decline_str}. The message: 'We'll help you diagnose the root causes and bring order before the decline deepens.'"

    # Extra data points
    extra_lines = []
    if annual_revenue:
        extra_lines.append(f"- Annual revenue: {annual_revenue}")
    if revenue_growth is not None:
        trend = "growth" if revenue_growth >= 0 else "decline"
        extra_lines.append(f"- YoY revenue {trend}: {revenue_growth:+.0f}%")
    if years_in_market:
        extra_lines.append(f"- Years in market: {years_in_market}")
    if legal_form:
        extra_lines.append(f"- Legal form: {legal_form}")
    if company_description:
        extra_lines.append(f"- Business description: {company_description}")
    if group_context:
        extra_lines.append(f"- ABM Context: {group_context}")

    prompt = f"""You are a senior business analyst for QMatch Consulting, a Polish consulting firm that helps owner-managed companies escape the Pułapka Firmy Właścicielskiej — the Owner's Company Trap. This is when a founder runs everything himself, cannot delegate, his team is not independent, and company growth is blocked by his personal bottleneck. QMatch works with founders and owners of 10-300 employee companies in Poland and CEE.

Write a 2-3 sentence explanation of why this specific company is likely caught in the Owner's Company Trap right now and why QMatch should reach out. Be specific to their industry, size, and growth situation. Do not use generic phrases. Reference the ABM context if provided.

End with one sentence starting with 'Suggested angle:' that gives the sales person a specific, non-generic opening line referencing something real about this company — their growth trajectory, their industry, a specific pain point, or a timely business challenge.

Company data:
- Name: {company}
- Country: {country}
- Industry: {industry}
- Team size: {emp_range} employees
- {dm_text}
- Website: {website or 'not available'}
- {signal_text}
{chr(10).join(extra_lines)}
{f'- Notes: {notes}' if notes else ''}

Write only the explanation (2-3 sentences) followed immediately by the "Suggested angle:" sentence, in English."""

    return prompt


async def generate_ai_explanation(lead: dict) -> str:
    """
    Generate an AI-powered explanation using Claude.
    Falls back to template if no API key or quota issue.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if api_key:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=api_key)
            message = await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=200,
                messages=[
                    {"role": "user", "content": _build_prompt(lead)}
                ],
            )
            text = message.content[0].text.strip()
            if text:
                return text
        except Exception as e:
            logger.warning(f"Claude API failed for lead {lead.get('company_name', '?')}: {e}")

    # Fallback to improved template
    return generate_template_explanation(lead)


def generate_template_explanation(lead: dict) -> str:
    """Improved template-based explanation when Claude is unavailable."""
    company = lead.get("company_name", "This company")
    country = lead.get("country", "")
    industry = lead.get("industry", "")
    emp_range = lead.get("employee_range", "")
    role = lead.get("decision_maker_role", "")
    typed_signals = lead.get("typed_signals", [])
    target_group = lead.get("target_group", "")
    revenue_growth = lead.get("revenue_growth_pct")
    years_in_market = lead.get("years_in_market")
    company_description = lead.get("company_description", "")

    # Pick the most important signal
    signal_types = {s.get("type") for s in typed_signals}
    signal_labels = [s.get("label", "") for s in typed_signals]

    parts = []

    # Opener based on industry + size
    if industry and country:
        parts.append(f"{company} is a {industry.lower()} business in {country}")
    elif industry:
        parts.append(f"{company} operates in {industry.lower()}")
    else:
        parts.append(f"{company}")

    if emp_range:
        parts[0] += f" with {emp_range} employees"
    parts[0] += "."

    if company_description:
        parts.append(f"{company_description}")

    # Group-specific messaging
    if target_group == "Group 1":
        growth_str = f"+{revenue_growth:.0f}% revenue growth" if revenue_growth and revenue_growth > 0 else "rapid revenue growth"
        parts.append(
            f"With {growth_str}, {company} is growing faster than its organizational structure can keep up — "
            f"exactly the Pułapka Firmy Właścicielskiej pattern: the {role.lower() or 'owner'} is still running "
            "everything personally while the team around them hasn't matured. QMatch helps build the management layer before things fall apart."
        )
        parts.append(
            f"Suggested angle: {company} has been scaling fast — the risk now is that growth "
            "creates chaos if the structure doesn't catch up. Worth a 20-minute call?"
        )
    elif target_group == "Group 2":
        years_str = f"{years_in_market}-year-old" if years_in_market else "established"
        parts.append(
            f"As a {years_str} {industry.lower() if industry else 'company'}, {company} has likely reached a plateau — "
            f"the {role.lower() or 'owner'} is still operationally involved, the systems haven't been rebuilt for scale, "
            "and unlocking the next phase of growth requires stepping back and building leadership depth."
        )
        parts.append(
            f"Suggested angle: After {years_in_market or 'many'} years of running the business hands-on, "
            "many owners at this stage are ready to step back — but don't know how to build the team to make it happen. Is that a conversation worth having?"
        )
    elif target_group == "Group 3":
        decline_str = f"{revenue_growth:.0f}% revenue decline" if revenue_growth and revenue_growth < 0 else "declining revenue"
        parts.append(
            f"With {decline_str}, {company} is at a critical inflection point — the {role.lower() or 'owner'} "
            "is likely still running operations personally, which can mask the real structural and strategic issues "
            "causing the downturn. QMatch specialises in diagnosing exactly these situations."
        )
        parts.append(
            "Suggested angle: Revenue has been under pressure the last couple of years — "
            "sometimes that's a market issue, sometimes it's an internal one. Either way, an outside perspective often surfaces things you can't see from the inside."
        )
    else:
        # Generic fallback based on signals
        if "risk" in signal_types:
            parts.append(
                f"Classic Pułapka Firmy Właścicielskiej pattern — {company} has {emp_range} employees "
                f"but the {role.lower() or 'owner'} appears to be carrying full operational responsibility "
                "without a management layer. This is exactly the situation QMatch helps resolve."
            )
        elif "scaling" in signal_types and "structure" in signal_types:
            parts.append(
                "The company is at the inflection point where headcount growth without matching structure "
                "creates deep structural debt — exactly the stage where owner dependency becomes the ceiling, "
                "and where QMatch adds the most value."
            )
        elif "scaling" in signal_types:
            parts.append(
                f"At this stage of growth, companies like {company} typically struggle to delegate "
                "and formalize management layers — the founder ends up doing everything, "
                "and growth stalls. A consulting engagement could de-risk the next phase."
            )
        elif "structure" in signal_types:
            parts.append(
                "The operational complexity at this size typically reveals owner dependency and "
                "gaps in process, management structure, or cross-team coordination — "
                "classic conditions where QMatch's systems-building approach fits."
            )
        elif signal_labels:
            parts.append(signal_labels[0] + ".")
        else:
            parts.append(
                "The company profile matches QMatch's core ICP: an owner-managed business at the "
                "size where structural debt and founder dependency start to visibly limit growth."
            )

        # Decision maker closer
        if role:
            parts.append(
                f"{role} is the right entry point for a conversation about scaling challenges."
            )

    return " ".join(parts)
