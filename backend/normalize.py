import re
from urllib.parse import urlparse
from typing import List, Tuple


def extract_domain(url_or_email: str) -> str:
    """Extract domain from URL or email."""
    if not url_or_email:
        return ""
    
    text = url_or_email.strip().lower()
    
    # If it's an email, extract domain part
    if "@" in text:
        return text.split("@")[-1].strip()
    
    # If it's a URL
    if not text.startswith(("http://", "https://")):
        text = "https://" + text
    
    try:
        parsed = urlparse(text)
        domain = parsed.netloc or parsed.path
        domain = domain.split(":")[0]  # Remove port
        domain = domain.replace("www.", "")
        return domain.strip("/")
    except Exception:
        return url_or_email.strip().lower()


def normalize_url(url: str) -> str:
    """Normalize URL to consistent format."""
    if not url:
        return ""
    
    url = url.strip()
    if url and not url.startswith(("http://", "https://")):
        url = "https://" + url
    
    return url


def normalize_country(country: str) -> str:
    """Normalize country name."""
    if not country:
        return ""
    
    country = country.strip().title()
    
    # Common aliases
    aliases = {
        "Uk": "United Kingdom",
        "Gb": "United Kingdom",
        "Great Britain": "United Kingdom",
        "England": "United Kingdom",
        "Us": "United States",
        "Usa": "United States",
        "United States Of America": "United States",
        "De": "Germany",
        "Deutschland": "Germany",
        "Fr": "France",
        "Nl": "Netherlands",
        "Au": "Australia",
        "Ca": "Canada",
        "Sg": "Singapore",
        "Ie": "Ireland",
        "Ch": "Switzerland",
        "In": "India",
        "Jp": "Japan",
        "Br": "Brazil",
        "Ae": "United Arab Emirates",
        "Uae": "United Arab Emirates",
    }
    
    return aliases.get(country, country)


def normalize_industry(industry: str) -> str:
    """Normalize industry name."""
    if not industry:
        return ""
    
    industry = industry.strip().title()
    
    aliases = {
        "It": "Technology",
        "Information Technology": "Technology",
        "Information Technology & Services": "Technology",
        "Tech": "Technology",
        "Software": "Technology",
        "Saas": "SaaS",
        "Finance": "Financial Services",
        "Banking": "Financial Services",
        "Financial Services": "Financial Services",
        "Accounting": "Professional Services",
        "Management Consulting": "Professional Services",
        "Human Resources": "Professional Services",
        "Health": "Healthcare",
        "Medical": "Healthcare",
        "Pharma": "Healthcare",
        "Ecommerce": "E-commerce",
        "E-Commerce": "E-commerce",
        "Online Retail": "E-commerce",
        "Consumer Goods": "Retail",
        "Apparel & Fashion": "Retail",
        "Consulting": "Professional Services",
        "Advisory": "Professional Services",
        "Professional Training & Coaching": "Professional Services",
        "Legal Services": "Professional Services",
        "Translation & Localization": "Professional Services",
        "Staffing & Recruiting": "Professional Services",
        "Education": "Education",
        "Edtech": "Education",
        "Logistics & Supply Chain": "Logistics",
        "Transportation/Trucking/Railroad": "Transportation",
        "Trucking": "Transportation",
        "Packaging & Containers": "Manufacturing",
        "Industrial Automation": "Manufacturing",
        "Mechanical Or Industrial Engineering": "Manufacturing",
        "Food & Beverages": "Food & Beverage",
        "Food Production": "Food & Beverage",
        "Import And Export": "Distribution",
        "Wholesale": "Wholesale",
        "Real Estate": "Real Estate",
    }

    return aliases.get(industry, industry)


def normalize_employee_range(value: str) -> str:
    """Normalize employee range to standard buckets."""
    if not value:
        return ""
    
    value = str(value).strip().replace(",", "").replace(" ", "")
    
    # Try to extract number
    numbers = re.findall(r'\d+', value)
    if not numbers:
        return value
    
    # Use the first number as the primary count
    count = int(numbers[0])
    
    if count <= 10:
        return "1-10"
    elif count <= 50:
        return "11-50"
    elif count <= 200:
        return "51-200"
    elif count <= 500:
        return "201-500"
    elif count <= 1000:
        return "501-1000"
    elif count <= 5000:
        return "1001-5000"
    elif count <= 10000:
        return "5001-10000"
    else:
        return "10000+"


def get_employee_count_from_range(employee_range: str) -> int:
    """Get approximate employee count from range string."""
    if not employee_range:
        return 0
    
    range_map = {
        "1-10": 5,
        "11-50": 30,
        "51-200": 125,
        "201-500": 350,
        "501-1000": 750,
        "1001-5000": 3000,
        "5001-10000": 7500,
        "10000+": 15000,
    }
    
    return range_map.get(employee_range, 0)


def normalize_role(role: str) -> str:
    """Normalize decision maker role."""
    if not role:
        return ""
    
    role = role.strip().title()
    
    aliases = {
        "Ceo": "CEO",
        "Cto": "CTO",
        "Cfo": "CFO",
        "Coo": "COO",
        "Cmo": "CMO",
        "Vp": "VP",
        "Md": "Managing Director",
        "Hr Director": "HR Director",
        "Head Of Hr": "Head of HR",
        "Head Of People": "Chief People Officer",
        "Founder & Ceo": "Founder",
        "Co-Founder": "Founder",
        "Co Founder": "Founder",
    }
    
    return aliases.get(role, role)


def normalize_phone(phone: str) -> str:
    """Normalize phone number — strip Apollo apostrophe prefix and whitespace."""
    if not phone:
        return ""
    phone = str(phone).strip()
    # Apollo sometimes prefixes numbers with a leading apostrophe to prevent
    # Excel from interpreting them as numbers, e.g. '+48 123 456 789
    if phone.startswith("'"):
        phone = phone[1:].strip()
    return phone


def check_completeness(lead_dict: dict) -> List[str]:
    """Check for incomplete/missing fields and return list of flags."""
    flags = []
    
    required_fields = {
        "company_name": "Missing company name",
        "country": "Missing country",
        "industry": "Missing industry",
    }
    
    important_fields = {
        "website": "Missing website",
        "email": "Missing email",
        "decision_maker_name": "Missing decision maker",
        "decision_maker_role": "Missing decision maker role",
        "employee_range": "Missing employee range",
    }
    
    for field, flag in {**required_fields, **important_fields}.items():
        if not lead_dict.get(field, ""):
            flags.append(flag)
    
    return flags


def normalize_lead_data(lead_dict: dict) -> dict:
    """Apply all normalizations to a lead dictionary."""
    lead_dict["website"] = normalize_url(lead_dict.get("website", ""))
    lead_dict["country"] = normalize_country(lead_dict.get("country", ""))
    lead_dict["industry"] = normalize_industry(lead_dict.get("industry", ""))
    lead_dict["employee_range"] = normalize_employee_range(lead_dict.get("employee_range", ""))
    lead_dict["decision_maker_role"] = normalize_role(lead_dict.get("decision_maker_role", ""))
    lead_dict["linkedin_company_url"] = normalize_url(lead_dict.get("linkedin_company_url", ""))
    lead_dict["decision_maker_linkedin_url"] = normalize_url(lead_dict.get("decision_maker_linkedin_url", ""))
    lead_dict["phone"] = normalize_phone(lead_dict.get("phone", ""))
    
    # Normalize company name
    if lead_dict.get("company_name"):
        lead_dict["company_name"] = lead_dict["company_name"].strip()
    
    # Normalize email
    if lead_dict.get("email"):
        lead_dict["email"] = lead_dict["email"].strip().lower()
    
    # Set email status
    if not lead_dict.get("email"):
        lead_dict["email_status"] = "missing"
    elif lead_dict.get("email_status") not in ["verified", "unverified", "missing"]:
        lead_dict["email_status"] = "unverified"
    
    # Generate dedupe key
    domain = extract_domain(lead_dict.get("website", "") or lead_dict.get("email", ""))
    if domain:
        lead_dict["dedupe_key"] = domain
    else:
        lead_dict["dedupe_key"] = re.sub(r'[^a-z0-9]', '', lead_dict.get("company_name", "").lower())
    
    # Check completeness
    lead_dict["incomplete_flags"] = check_completeness(lead_dict)
    
    return lead_dict
