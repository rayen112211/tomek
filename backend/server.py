from fastapi import FastAPI, APIRouter, UploadFile, File, Form, Query, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from mongomock_motor import AsyncMongoMockClient
import os
import io
import csv
import json
import logging
from pathlib import Path
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import pandas as pd

from models import Lead, LeadCreate, LeadUpdate, ICPSettings, ColumnMapping, ImportRequest, PIPELINE_STATUSES
from normalize import normalize_lead_data, extract_domain
from dedupe import find_duplicates, merge_lead_data
from icp import check_icp_fit
from scoring import calculate_score
from signal_detection import detect_signals, signals_to_legacy_list
from ai_explanation import generate_ai_explanation, generate_template_explanation
from mock_data import get_mock_leads

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Use in-memory mock MongoDB so it works instantly without setup
client = AsyncMongoMockClient()
db = client[os.environ.get('DB_NAME', 'lead_qualification_engine')]

# Create the main app
app = FastAPI(title="KiMatch Lead Intelligence API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ Helper Functions ============

def serialize_doc(doc):
    """Serialize MongoDB document for JSON response."""
    if doc is None:
        return None
    if "_id" in doc:
        del doc["_id"]
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc


async def get_icp_settings() -> dict:
    """Get ICP settings from database or create KiMatch defaults."""
    settings = await db.icp_settings.find_one({"id": "icp_settings_default"}, {"_id": 0})
    if not settings:
        defaults = ICPSettings()
        settings = defaults.model_dump()
        await db.icp_settings.insert_one(settings)
    return settings


async def process_and_score_lead(lead_dict: dict, skip_ai: bool = False) -> dict:
    """Process a single lead: normalize, detect signals, check ICP, score, generate explanation."""
    # Normalize
    lead_dict = normalize_lead_data(lead_dict)

    # Get ICP settings
    icp_settings = await get_icp_settings()

    # Detect real growth signals
    typed_signals = detect_signals(lead_dict)
    lead_dict["typed_signals"] = typed_signals
    lead_dict["growth_signals"] = signals_to_legacy_list(typed_signals)

    # Check ICP fit
    icp_fit, icp_explanation = check_icp_fit(lead_dict, icp_settings)
    lead_dict["icp_fit"] = icp_fit

    # Calculate score
    score, breakdown, why = calculate_score(lead_dict, icp_settings)
    lead_dict["score"] = score
    lead_dict["score_breakdown"] = breakdown
    lead_dict["why_this_lead"] = why

    # Generate AI explanation (Claude or template fallback)
    if skip_ai:
        ai_explanation = generate_template_explanation(lead_dict)
    else:
        ai_explanation = await generate_ai_explanation(lead_dict)
    lead_dict["ai_explanation"] = ai_explanation

    # Set default pipeline status if not set
    if not lead_dict.get("pipeline_status"):
        lead_dict["pipeline_status"] = "New"

    lead_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    return lead_dict


# ============ Root ============

@api_router.get("/")
async def root():
    return {"message": "KiMatch Lead Intelligence API"}


# ============ CSV Import Endpoints ============

@api_router.post("/leads/import/preview")
async def preview_csv(file: UploadFile = File(...)):
    """Upload CSV and return column names + sample rows for mapping."""
    try:
        contents = await file.read()
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                text = contents.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file")

        df = pd.read_csv(io.StringIO(text))

        columns = list(df.columns)
        sample_rows = df.head(5).fillna("").to_dict(orient="records")
        total_rows = len(df)

        internal_fields = [
            "company_name", "website", "country", "industry", "employee_range",
            "linkedin_company_url", "decision_maker_name", "decision_maker_role",
            "decision_maker_linkedin_url", "email", "email_status",
            "growth_signals", "notes", "source"
        ]

        suggested_mappings = []
        for internal in internal_fields:
            best_match = None
            for col in columns:
                col_lower = col.lower().replace(" ", "_").replace("-", "_")
                if col_lower == internal:
                    best_match = col
                    break

            if not best_match:
                keywords = internal.split("_")
                for col in columns:
                    col_lower = col.lower()
                    if all(kw in col_lower for kw in keywords):
                        best_match = col
                        break

            if not best_match:
                heuristics = {
                    "company_name": ["company", "organization", "org", "name"],
                    "website": ["url", "website", "domain", "site"],
                    "email": ["email", "mail", "e-mail"],
                    "decision_maker_name": ["contact", "person", "first", "full name"],
                    "decision_maker_role": ["title", "role", "position", "job"],
                    "employee_range": ["employees", "size", "headcount", "# employees"],
                    "linkedin_company_url": ["linkedin", "company linkedin"],
                    "decision_maker_linkedin_url": ["person linkedin", "contact linkedin"],
                }
                if internal in heuristics:
                    for col in columns:
                        col_lower = col.lower()
                        if any(h in col_lower for h in heuristics[internal]):
                            best_match = col
                            break

            suggested_mappings.append({
                "internal_field": internal,
                "csv_column": best_match or "",
                "required": internal in ["company_name"]
            })

        return {
            "columns": columns,
            "sample_rows": sample_rows,
            "total_rows": total_rows,
            "suggested_mappings": suggested_mappings
        }

    except Exception as e:
        logger.error(f"CSV preview error: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


@api_router.post("/leads/import/commit")
async def commit_import(
    file: UploadFile = File(...),
    mappings: str = Form(...),
    source: str = Form("CSV Import")
):
    """Import CSV with column mappings. Process, dedupe, score, and save."""
    try:
        contents = await file.read()
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                text = contents.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file")

        df = pd.read_csv(io.StringIO(text))

        mapping_list = json.loads(mappings)
        field_map = {}
        for m in mapping_list:
            if m.get("csv_column"):
                field_map[m["csv_column"]] = m["internal_field"]

        batch_id = str(uuid.uuid4())

        leads = []
        for _, row in df.iterrows():
            lead_dict = {
                "id": str(uuid.uuid4()),
                "import_batch_id": batch_id,
                "source": source,
                "pipeline_status": "New",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            for csv_col, internal_field in field_map.items():
                if csv_col in row.index:
                    value = row[csv_col]
                    if pd.notna(value):
                        if internal_field == "growth_signals":
                            lead_dict[internal_field] = [s.strip() for s in str(value).split(",") if s.strip()]
                        else:
                            lead_dict[internal_field] = str(value).strip()
                    else:
                        if internal_field == "growth_signals":
                            lead_dict[internal_field] = []
                        else:
                            lead_dict[internal_field] = ""

            leads.append(lead_dict)

        processed_leads = []
        for lead in leads:
            processed = await process_and_score_lead(lead)
            processed_leads.append(processed)

        existing_cursor = db.leads.find({}, {"_id": 0, "dedupe_key": 1, "id": 1})
        existing_docs = await existing_cursor.to_list(length=10000)
        existing_keys = {d["dedupe_key"]: d["id"] for d in existing_docs if d.get("dedupe_key")}

        new_leads, updated_leads, duplicate_count = find_duplicates(processed_leads, existing_keys)

        created_count = 0
        if new_leads:
            await db.leads.insert_many(new_leads)
            created_count = len(new_leads)

        updated_count = 0
        for lead in updated_leads:
            existing = await db.leads.find_one({"id": lead["id"]}, {"_id": 0})
            if existing:
                merged = merge_lead_data(existing, lead)
                merged = await process_and_score_lead(merged)
                await db.leads.update_one({"id": lead["id"]}, {"$set": merged})
                updated_count += 1

        incomplete_count = sum(1 for l in new_leads if l.get("incomplete_flags"))

        return {
            "batch_id": batch_id,
            "total_processed": len(leads),
            "created": created_count,
            "updated": updated_count,
            "duplicates_skipped": duplicate_count,
            "incomplete": incomplete_count,
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid mappings format")
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=400, detail=f"Error importing CSV: {str(e)}")


# ============ Leads CRUD ============

@api_router.get("/leads")
async def get_leads(
    import_batch_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    icp_fit: Optional[str] = Query(None),
    pipeline_status: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    max_score: Optional[int] = Query(None),
    country: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    email_status: Optional[str] = Query(None),
    incomplete_only: Optional[bool] = Query(None),
    sort_field: Optional[str] = Query("score"),
    sort_order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """Get leads with filtering, sorting, and pagination."""
    query = {}

    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"company_name": search_regex},
            {"website": search_regex},
            {"decision_maker_name": search_regex},
            {"email": search_regex},
            {"country": search_regex},
            {"industry": search_regex},
        ]

    if icp_fit:
        if "," in icp_fit:
            query["icp_fit"] = {"$in": [v.strip() for v in icp_fit.split(",")]}
        else:
            query["icp_fit"] = icp_fit
    if import_batch_id:
        query["import_batch_id"] = import_batch_id
    if pipeline_status:
        query["pipeline_status"] = pipeline_status
    if min_score is not None:
        query["score"] = {"$gte": min_score}
    if max_score is not None:
        if "score" in query:
            query["score"]["$lte"] = max_score
        else:
            query["score"] = {"$lte": max_score}
    if country:
        query["country"] = country
    if industry:
        query["industry"] = industry
    if email_status:
        query["email_status"] = email_status
    if incomplete_only:
        query["incomplete_flags"] = {"$ne": []}

    sort_direction = -1 if sort_order == "desc" else 1
    valid_sort_fields = ["score", "company_name", "country", "industry", "icp_fit", "pipeline_status", "created_at", "updated_at", "email_status"]
    if sort_field not in valid_sort_fields:
        sort_field = "score"

    total = await db.leads.count_documents(query)

    skip = (page - 1) * page_size
    cursor = db.leads.find(query, {"_id": 0}).sort(sort_field, sort_direction).skip(skip).limit(page_size)
    leads = await cursor.to_list(length=page_size)

    leads = [serialize_doc(l) for l in leads]

    countries = await db.leads.distinct("country")
    industries = await db.leads.distinct("industry")

    return {
        "leads": leads,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
        "filter_options": {
            "countries": sorted([c for c in countries if c]),
            "industries": sorted([i for i in industries if i]),
        }
    }


@api_router.get("/leads/stats")
async def get_lead_stats():
    """Get lead statistics for KiMatch dashboard."""
    total = await db.leads.count_documents({})
    fit_count = await db.leads.count_documents({"icp_fit": "Fit"})
    partial_count = await db.leads.count_documents({"icp_fit": "Partial Fit"})
    not_fit_count = await db.leads.count_documents({"icp_fit": "Not Fit"})
    incomplete_count = await db.leads.count_documents({"incomplete_flags": {"$ne": []}})

    # Pipeline status counts
    pipeline_counts = {}
    for status in PIPELINE_STATUSES:
        pipeline_counts[status] = await db.leads.count_documents({"pipeline_status": status})

    # Score distribution
    pipeline_agg = [
        {"$group": {"_id": "$score", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    score_dist = await db.leads.aggregate(pipeline_agg).to_list(length=20)

    # Average score
    avg_pipeline = [{"$group": {"_id": None, "avg_score": {"$avg": "$score"}}}]
    avg_result = await db.leads.aggregate(avg_pipeline).to_list(length=1)
    
    score_val = 0
    if avg_result and avg_result[0].get("avg_score") is not None:
        score_val = avg_result[0]["avg_score"]
        
    avg_score = round(score_val, 1)

    # Email stats
    verified_emails = await db.leads.count_documents({"email_status": "verified"})
    missing_emails = await db.leads.count_documents({"email_status": "missing"})

    return {
        "total": total,
        "fit": fit_count,
        "partial_fit": partial_count,
        "not_fit": not_fit_count,
        "incomplete": incomplete_count,
        "avg_score": avg_score,
        "verified_emails": verified_emails,
        "missing_emails": missing_emails,
        "pipeline": pipeline_counts,
        "score_distribution": [{"score": s["_id"], "count": s["count"]} for s in score_dist],
    }


@api_router.get("/leads/{lead_id}")
async def get_lead(lead_id: str):
    """Get a single lead by ID."""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return serialize_doc(lead)


@api_router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, update: LeadUpdate):
    """Update a lead. If only pipeline_status changes, skip re-scoring."""
    existing = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}

    # Check if this is a status-only update (skip expensive re-scoring)
    non_status_fields = {k for k in update_data if k != "pipeline_status"}
    
    if non_status_fields:
        # Full reprocess
        merged = {**existing, **update_data}
        processed = await process_and_score_lead(merged)
        await db.leads.update_one({"id": lead_id}, {"$set": processed})
    else:
        # Status-only update
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})

    updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return serialize_doc(updated)


@api_router.post("/leads/{lead_id}/explain")
async def regenerate_explanation(lead_id: str):
    """Regenerate AI explanation for a specific lead."""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    explanation = await generate_ai_explanation(lead)
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"ai_explanation": explanation, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"lead_id": lead_id, "ai_explanation": explanation}


@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete a single lead."""
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted", "id": lead_id}


@api_router.post("/leads/bulk-delete")
async def bulk_delete_leads(lead_ids: List[str]):
    """Delete multiple leads."""
    result = await db.leads.delete_many({"id": {"$in": lead_ids}})
    return {"deleted_count": result.deleted_count}


# ============ Export ============

@api_router.post("/leads/export")
async def export_leads(
    lead_ids: Optional[List[str]] = None,
    search: Optional[str] = Query(None),
    icp_fit: Optional[str] = Query(None),
    pipeline_status: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    country: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
):
    """Export leads as CSV."""
    if lead_ids:
        cursor = db.leads.find({"id": {"$in": lead_ids}}, {"_id": 0})
    else:
        query = {}
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"company_name": search_regex},
                {"website": search_regex},
                {"decision_maker_name": search_regex},
                {"email": search_regex},
            ]
        if icp_fit:
            if "," in icp_fit:
                query["icp_fit"] = {"$in": [v.strip() for v in icp_fit.split(",")]}
            else:
                query["icp_fit"] = icp_fit
        if pipeline_status:
            query["pipeline_status"] = pipeline_status
        if min_score is not None:
            query["score"] = {"$gte": min_score}
        if country:
            query["country"] = country
        if industry:
            query["industry"] = industry

        cursor = db.leads.find(query, {"_id": 0}).sort("score", -1)

    leads = await cursor.to_list(length=10000)

    if not leads:
        raise HTTPException(status_code=404, detail="No leads to export")

    csv_columns = [
        "company_name", "website", "country", "industry", "employee_range",
        "linkedin_company_url", "decision_maker_name", "decision_maker_role",
        "decision_maker_linkedin_url", "email", "email_status",
        "icp_fit", "score", "pipeline_status", "ai_explanation", "suggested_angle",
        "why_this_lead", "growth_signals", "notes", "source"
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=csv_columns, extrasaction='ignore')
    writer.writeheader()

    for lead in leads:
        row = {k: lead.get(k, "") for k in csv_columns}
        if isinstance(row.get("growth_signals"), list):
            row["growth_signals"] = ", ".join(row["growth_signals"])
        # Extract suggested_angle from the end of ai_explanation if it contains "Suggested angle:"
        explanation = row.get("ai_explanation") or row.get("why_this_lead") or ""
        if "Suggested angle:" in explanation:
            row["suggested_angle"] = "Suggested angle:" + explanation.split("Suggested angle:")[-1].strip()
            row["ai_explanation"] = explanation.split("Suggested angle:")[0].strip()
        writer.writerow(row)

    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=kimatch_leads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


# ============ ICP Settings ============

@api_router.get("/settings/icp")
async def get_icp_settings_endpoint():
    """Get current ICP settings."""
    settings = await get_icp_settings()
    return serialize_doc(settings)


@api_router.put("/settings/icp")
async def update_icp_settings(settings: ICPSettings):
    """Update ICP settings."""
    settings_dict = settings.model_dump()
    settings_dict["id"] = "icp_settings_default"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.icp_settings.update_one(
        {"id": "icp_settings_default"},
        {"$set": settings_dict},
        upsert=True
    )

    return serialize_doc(settings_dict)


@api_router.post("/leads/recalculate")
async def recalculate_all_leads():
    """Recalculate ICP fit, signals, scores, and AI explanations for all leads."""
    cursor = db.leads.find({}, {"_id": 0})
    leads = await cursor.to_list(length=10000)

    updated_count = 0
    for lead in leads:
        processed = await process_and_score_lead(lead)
        await db.leads.update_one({"id": lead["id"]}, {"$set": processed})
        updated_count += 1

    return {"message": f"Recalculated {updated_count} leads", "count": updated_count}


# ============ Weekly Digest ============

@api_router.get("/digest/weekly")
async def weekly_digest():
    """Return a structured weekly summary of the pipeline for email digest use."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    week_ago_str = (now - timedelta(days=7)).isoformat()

    total = await db.leads.count_documents({})
    new_this_week = await db.leads.count_documents({"created_at": {"$gte": week_ago_str}})

    # Top 5 leads by score
    top_cursor = db.leads.find({}, {"_id": 0}).sort("score", -1)
    top_leads_raw = await top_cursor.to_list(length=5)
    top_leads = [
        {
            "company_name": l.get("company_name"),
            "score": l.get("score"),
            "icp_fit": l.get("icp_fit"),
            "pipeline_status": l.get("pipeline_status"),
            "country": l.get("country"),
            "industry": l.get("industry"),
            "decision_maker_name": l.get("decision_maker_name"),
            "decision_maker_role": l.get("decision_maker_role"),
            "top_signal": l.get("typed_signals", [{}])[0].get("label", "") if l.get("typed_signals") else "",
            "ai_explanation": l.get("ai_explanation", ""),
        }
        for l in top_leads_raw
    ]

    # Pipeline status counts
    pipeline_counts = {}
    for status in PIPELINE_STATUSES:
        pipeline_counts[status] = await db.leads.count_documents({"pipeline_status": status})

    # Most common signal type this week
    recent_cursor = db.leads.find({"created_at": {"$gte": week_ago_str}}, {"_id": 0, "typed_signals": 1})
    recent_leads = await recent_cursor.to_list(length=1000)
    signal_counter: dict = {}
    for lead in recent_leads:
        for sig in lead.get("typed_signals", []):
            sig_type = sig.get("type", "unknown")
            signal_counter[sig_type] = signal_counter.get(sig_type, 0) + 1
    most_common_signal = max(signal_counter, key=signal_counter.get) if signal_counter else None

    return {
        "generated_at": now.isoformat(),
        "total_leads": total,
        "new_leads_last_7_days": new_this_week,
        "top_5_leads": top_leads,
        "pipeline_summary": pipeline_counts,
        "most_common_signal_this_week": most_common_signal,
        "signal_breakdown_this_week": signal_counter,
    }


# ============ Mock Enrichment Placeholders ============

@api_router.post("/enrich/email/{lead_id}")
async def mock_enrich_email(lead_id: str):
    """Placeholder for email enrichment."""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.get("email"):
        domain = extract_domain(lead.get("website", ""))
        name = lead.get("decision_maker_name", "").lower().split()
        if domain and name:
            mock_email = f"{name[0]}@{domain}"
            await db.leads.update_one(
                {"id": lead_id},
                {"$set": {"email": mock_email, "email_status": "unverified", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
            processed = await process_and_score_lead(updated)
            await db.leads.update_one({"id": lead_id}, {"$set": processed})

            return {"message": f"Mock email enriched: {mock_email}", "email": mock_email, "status": "unverified"}
        return {"message": "Could not generate mock email", "email": "", "status": "missing"}

    return {"message": "Email already exists", "email": lead["email"], "status": lead.get("email_status", "unverified")}


@api_router.post("/verify/email/{lead_id}")
async def mock_verify_email(lead_id: str):
    """Placeholder for email verification."""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.get("email"):
        return {"message": "No email to verify", "status": "missing"}

    import hashlib
    h = hashlib.md5(lead["email"].encode()).hexdigest()
    is_verified = int(h[0], 16) < 12

    new_status = "verified" if is_verified else "unverified"
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"email_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {"message": f"Email verification result: {new_status}", "email": lead["email"], "status": new_status}


# ============ Seed Data ============

@api_router.post("/admin/seed")
async def seed_data():
    """Seed the database with KiMatch mock data and default ICP settings."""
    count = await db.leads.count_documents({})
    if count > 0:
        return {"message": f"Database already has {count} leads. Use /admin/seed/force to reseed.", "count": count}

    icp_settings = await get_icp_settings()

    mock_leads = get_mock_leads()

    processed_leads = []
    for lead in mock_leads:
        lead["id"] = str(uuid.uuid4())
        lead["created_at"] = datetime.now(timezone.utc).isoformat()
        lead["updated_at"] = datetime.now(timezone.utc).isoformat()
        lead["import_batch_id"] = "seed_data"
        lead["pipeline_status"] = "New"

        processed = await process_and_score_lead(lead, skip_ai=True)
        processed_leads.append(processed)

    if processed_leads:
        await db.leads.insert_many(processed_leads)

    return {"message": f"Seeded {len(processed_leads)} KiMatch leads", "count": len(processed_leads)}


@api_router.post("/admin/seed/force")
async def force_seed_data():
    """Force reseed: clear existing data and insert fresh mock data."""
    await db.leads.delete_many({})
    await db.icp_settings.delete_many({})
    return await seed_data()


# Include the router in the main app
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """Automatically seed data on startup for the in-memory mock DB."""
    count = await db.leads.count_documents({})
    if count == 0:
        logger.info("Auto-seeding mock data on startup...")
        await seed_data()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
