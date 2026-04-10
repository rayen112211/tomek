from typing import List, Dict, Tuple


def find_duplicates(leads: List[dict], existing_keys: Dict[str, str]) -> Tuple[List[dict], List[dict], int]:
    """
    Check leads against existing dedupe keys in the database.
    Returns (new_leads, updated_leads, duplicate_count)
    
    existing_keys: dict mapping dedupe_key -> existing lead id
    """
    new_leads = []
    updated_leads = []
    seen_keys = set()
    duplicate_count = 0
    
    for lead in leads:
        key = lead.get("dedupe_key", "")
        
        if not key:
            new_leads.append(lead)
            continue
        
        # Check for duplicates within the batch
        if key in seen_keys:
            duplicate_count += 1
            lead["is_duplicate"] = True
            continue
        
        seen_keys.add(key)
        
        # Check against existing database records
        if key in existing_keys:
            lead["id"] = existing_keys[key]
            lead["is_duplicate"] = False
            updated_leads.append(lead)
        else:
            lead["is_duplicate"] = False
            new_leads.append(lead)
    
    return new_leads, updated_leads, duplicate_count


def merge_lead_data(existing: dict, new_data: dict) -> dict:
    """
    Merge new data into existing lead, preferring non-empty values from new data.
    Preserves existing notes and manual edits.
    """
    merged = {**existing}
    
    # Fields that should be updated with newer non-empty data
    merge_fields = [
        "website", "country", "industry", "employee_range",
        "linkedin_company_url", "decision_maker_name", "decision_maker_role",
        "decision_maker_linkedin_url", "email", "email_status",
    ]
    
    for field in merge_fields:
        new_value = new_data.get(field, "")
        if new_value and new_value.strip():
            merged[field] = new_value
    
    # Merge growth signals (union)
    existing_signals = set(existing.get("growth_signals", []))
    new_signals = set(new_data.get("growth_signals", []))
    merged["growth_signals"] = list(existing_signals | new_signals)
    
    # Preserve existing notes, append source info
    if new_data.get("source") and new_data["source"] != existing.get("source", ""):
        source_note = f"Also imported from: {new_data['source']}"
        if existing.get("notes"):
            if source_note not in existing["notes"]:
                merged["notes"] = existing["notes"] + "\n" + source_note
        else:
            merged["notes"] = source_note
    
    return merged
