from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


PIPELINE_STATUSES = [
    "New",
    "Reviewing",
    "Approved for Outreach",
    "Contacted",
    "Converted",
    "Rejected",
]


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str = ""
    website: str = ""
    country: str = ""
    industry: str = ""
    employee_range: str = ""
    linkedin_company_url: str = ""
    decision_maker_name: str = ""
    decision_maker_role: str = ""
    decision_maker_linkedin_url: str = ""
    email: str = ""
    phone: str = ""
    email_status: str = "unverified"  # verified, unverified, missing, guessed
    growth_signals: List[str] = Field(default_factory=list)
    typed_signals: List[Dict[str, str]] = Field(default_factory=list)  # [{type, label, icon}]
    icp_fit: str = "Not Fit"  # Fit, Partial Fit, Not Fit
    score: int = 0
    score_breakdown: Dict[str, int] = Field(default_factory=dict)
    why_this_lead: str = ""
    ai_explanation: str = ""  # Claude-generated explanation
    pipeline_status: str = "New"
    notes: str = ""
    source: str = ""
    import_batch_id: str = ""
    dedupe_key: str = ""
    incomplete_flags: List[str] = Field(default_factory=list)
    is_duplicate: bool = False

    # ---- NEW ABM / QMatch Spec Fields ----
    annual_revenue_pln: str = ""          # e.g. "PLN 45M" or "40000000"
    revenue_growth_pct: Optional[float] = None   # YoY growth % — positive or negative
    revenue_trend: str = ""              # "growing" | "stable" | "declining"
    years_in_market: Optional[int] = None        # Company age in years
    legal_form: str = ""                 # e.g. "Sp. z o.o."
    company_description: str = ""        # Short business description (what they do/sell)
    ownership_structure: str = ""        # "Owner-managed", "Family business", etc.
    target_group: str = ""               # "Group 1", "Group 2", "Group 3", ""
    target_group_reason: str = ""        # Short explanation why classified into this group
    # ---- End new fields ----

    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LeadCreate(BaseModel):
    company_name: str = ""
    website: str = ""
    country: str = ""
    industry: str = ""
    employee_range: str = ""
    linkedin_company_url: str = ""
    decision_maker_name: str = ""
    decision_maker_role: str = ""
    decision_maker_linkedin_url: str = ""
    email: str = ""
    phone: str = ""
    email_status: str = "unverified"
    growth_signals: List[str] = Field(default_factory=list)
    notes: str = ""
    source: str = ""
    pipeline_status: str = "New"
    # New fields
    annual_revenue_pln: str = ""
    revenue_growth_pct: Optional[float] = None
    revenue_trend: str = ""
    years_in_market: Optional[int] = None
    legal_form: str = ""
    company_description: str = ""
    ownership_structure: str = ""


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    employee_range: Optional[str] = None
    linkedin_company_url: Optional[str] = None
    decision_maker_name: Optional[str] = None
    decision_maker_role: Optional[str] = None
    decision_maker_linkedin_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    email_status: Optional[str] = None
    growth_signals: Optional[List[str]] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    pipeline_status: Optional[str] = None
    # New fields
    annual_revenue_pln: Optional[str] = None
    revenue_growth_pct: Optional[float] = None
    revenue_trend: Optional[str] = None
    years_in_market: Optional[int] = None
    legal_form: Optional[str] = None
    company_description: Optional[str] = None
    ownership_structure: Optional[str] = None


class ICPSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = "icp_settings_default"
    target_countries: List[str] = Field(default_factory=lambda: [
        "Poland",
        "Czech Republic",
        "Slovakia",
        "Hungary",
        "Romania",
        "Ukraine",
        "Bulgaria",
        "Croatia",
        "Estonia",
        "Latvia",
        "Lithuania",
    ])
    target_industries: List[str] = Field(default_factory=lambda: [
        "Construction",
        "Manufacturing",
        "Logistics",
        "Transportation",
        "Distribution",
        "Wholesale",
        "Professional Services",
        "Real Estate",
        "FMCG",
        "Food & Beverage",
        "Business Services",
        "Financial Services",
        "Retail",
        "Technology",
        "E-commerce",
    ])
    target_employee_min: int = 10
    target_employee_max: int = 500
    target_decision_maker_roles: List[str] = Field(default_factory=lambda: [
        # English
        "Owner",
        "Founder",
        "CEO",
        "Managing Director",
        "COO",
        "General Manager",
        "President",
        # Polish
        "Prezes",
        "Właściciel",
        "Dyrektor Generalny",
        "Dyrektor Zarządzający",
        "Współwłaściciel",
        "Prezes Zarządu",
        "Członek Zarządu",
        # CEE equivalents
        "Jednatel",
        "Ügyvezető",
        "Director General",
        "Administrator",
    ])
    excluded_industries: List[str] = Field(default_factory=lambda: [
        "Gambling",
        "Tobacco",
        "Adult Entertainment",
        "Weapons",
        "Cryptocurrency",
    ])
    minimum_acceptable_score: int = 5
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ColumnMapping(BaseModel):
    csv_column: str
    internal_field: str


class ImportRequest(BaseModel):
    mappings: List[ColumnMapping]
    source: str = "CSV Import"
