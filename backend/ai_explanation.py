"""
Claude AI-powered lead explanation generator for KiMatch.
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
    signals = lead.get("growth_signals", [])
    typed_signals = lead.get("typed_signals", [])
    score = lead.get("score", 0)

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

    prompt = f"""You are a senior business analyst for QMatch Consulting, a Polish consulting firm that helps companies either build organizational structure or fix growth problems.

Write a 2-3 sentence explanation for why this company is a strong consulting prospect right now. Sound like a smart analyst who understands CEE business dynamics — direct, specific, not generic. Focus on what's happening in the business that creates a consulting need. Do not use phrases like "this company is a good lead" or reference the scoring system.

End your response with exactly one sentence starting with "Suggested angle:" followed by a specific, personalized opening line a sales person could use to start an outreach message to this exact decision maker — make it reference their specific role, industry, or a signal you noticed. Do NOT write a generic line like "I'd love to talk about your growth challenges."

Company data:
- Name: {company}
- Country: {country}
- Industry: {industry}
- Team size: {emp_range} employees
- {dm_text}
- Website: {website or 'not available'}
- {signal_text}
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

    # Signal-based insight
    if "risk" in signal_types:
        parts.append(
            f"The {role.lower() or 'founder'} appears to be carrying all operational responsibility "
            f"without a dedicated operations leader — a classic signal of growing structural debt."
        )
    elif "scaling" in signal_types and "structure" in signal_types:
        parts.append(
            "The company is at the inflection point where headcount growth without matching structure "
            "creates operational risk — exactly where QMatch adds the most value."
        )
    elif "scaling" in signal_types:
        parts.append(
            f"At this stage of growth, companies like {company} typically struggle with formalizing "
            "management layers and sustaining culture — a consulting engagement could de-risk the next phase."
        )
    elif "structure" in signal_types:
        parts.append(
            "The operational complexity of their industry at this size typically reveals gaps in process, "
            "management structure, or cross-team coordination."
        )
    elif signal_labels:
        parts.append(signal_labels[0] + ".")
    else:
        parts.append(
            "The company profile matches QMatch's core ICP for organizational development consulting."
        )

    # Decision maker closer
    if role:
        parts.append(
            f"{role} is the right entry point for a conversation about scaling challenges."
        )

    return " ".join(parts)
