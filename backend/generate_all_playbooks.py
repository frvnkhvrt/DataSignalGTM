# generate_all_playbooks.py
import asyncio
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

FASTAPI_URL = os.getenv("FASTAPI_GENERATE_URL", "http://localhost:8000/generate-playbook")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

accounts = [
    {"name": "Cursor", "industry": "DevTools", "employee_count": 50, "why_now": "Fastest growing dev tool in 2024 — first enterprise sales hire posted", "fit_score": 95, "intent_score": 94, "timing_score": 96, "composite_score": 95},
    {"name": "Lovable", "industry": "AI", "employee_count": 40, "why_now": "Viral growth — 100K users in 30 days, first GTM hire posted this week", "fit_score": 94, "intent_score": 96, "timing_score": 95, "composite_score": 95},
    {"name": "Make", "industry": "Automation", "employee_count": 300, "why_now": "Raised $100M Series B — scaling enterprise GTM motion globally", "fit_score": 93, "intent_score": 91, "timing_score": 92, "composite_score": 92},
    {"name": "ElevenLabs", "industry": "AI", "employee_count": 120, "why_now": "Series B $80M announced — building enterprise voice AI platform", "fit_score": 92, "intent_score": 93, "timing_score": 91, "composite_score": 92},
    {"name": "Amplitude", "industry": "Analytics", "employee_count": 700, "why_now": "Series D $150M — doubling GTM headcount this quarter", "fit_score": 90, "intent_score": 91, "timing_score": 93, "composite_score": 91},
    {"name": "Stripe", "industry": "FinTech", "employee_count": 4000, "why_now": "Series E $600M announced — new GTM expansion", "fit_score": 92, "intent_score": 88, "timing_score": 95, "composite_score": 91},
    {"name": "HubSpot", "industry": "SaaS", "employee_count": 7000, "why_now": "Launching new AI product suite — partner ecosystem expanding", "fit_score": 91, "intent_score": 89, "timing_score": 88, "composite_score": 89},
    {"name": "Figma", "industry": "SaaS", "employee_count": 800, "why_now": "Migrated from Salesforce to HubSpot — 30-day window", "fit_score": 95, "intent_score": 85, "timing_score": 90, "composite_score": 89},
    {"name": "Mixpanel", "industry": "Analytics", "employee_count": 350, "why_now": "Replatforming data infra — evaluating new vendor stack", "fit_score": 88, "intent_score": 92, "timing_score": 89, "composite_score": 89},
    {"name": "Airtable", "industry": "SaaS", "employee_count": 900, "why_now": "New VP of Sales hired from Salesforce this month", "fit_score": 90, "intent_score": 88, "timing_score": 87, "composite_score": 88},
    {"name": "Loom", "industry": "SaaS", "employee_count": 300, "why_now": "Acquired by Atlassian — new enterprise motion launching Q1", "fit_score": 88, "intent_score": 86, "timing_score": 90, "composite_score": 88},
    {"name": "Notion", "industry": "SaaS", "employee_count": 500, "why_now": "3 VP-level hires + G2 review spike in 14 days", "fit_score": 88, "intent_score": 91, "timing_score": 85, "composite_score": 87},
    {"name": "Linear", "industry": "SaaS", "employee_count": 90, "why_now": "Posted 8 RevOps roles in last 30 days", "fit_score": 85, "intent_score": 90, "timing_score": 88, "composite_score": 87},
    {"name": "Vercel", "industry": "DevTools", "employee_count": 350, "why_now": "Raised Series D $150M — first enterprise sales team building", "fit_score": 88, "intent_score": 83, "timing_score": 85, "composite_score": 85},
    {"name": "Intercom", "industry": "SaaS", "employee_count": 600, "why_now": "Rebranded to Fin — repositioning in AI customer service market", "fit_score": 83, "intent_score": 87, "timing_score": 85, "composite_score": 85},
    {"name": "Retool", "industry": "DevTools", "employee_count": 250, "why_now": "5 new enterprise AE roles posted — scaling sales team", "fit_score": 85, "intent_score": 82, "timing_score": 84, "composite_score": 83},
    {"name": "Brex", "industry": "FinTech", "employee_count": 1100, "why_now": "Expanding to LATAM — 12 new AE roles posted this month", "fit_score": 78, "intent_score": 83, "timing_score": 80, "composite_score": 80},
    {"name": "Carta", "industry": "FinTech", "employee_count": 1800, "why_now": "Expanding cap table product to mid-market — 10 new AEs hired", "fit_score": 87, "intent_score": 85, "timing_score": 86, "composite_score": 86},
]

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

async def generate_and_save(account):
    payload = {
        "signal_id": f"gen-{account['name'].lower().replace(' ', '-')}",
        "account_id": "00000000-0000-0000-0000-000000000000",
        "account_name": account["name"],
        "industry": account["industry"],
        "employee_count": account["employee_count"],
        "data_quality_score": 85,
        "why_now": account["why_now"],
        "fit_score": account["fit_score"],
        "intent_score": account["intent_score"],
        "timing_score": account["timing_score"],
        "composite_score": account["composite_score"],
    }

    # Gemini + JSON parse can exceed 30s; local API may also queue under load.
    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=15.0)) as client:
        # Generate playbook
        r = await client.post(FASTAPI_URL, json=payload)
        if r.status_code != 200:
            print(f"[ERR] {account['name']} — FastAPI error: {r.text}")
            return
        playbook = r.json()

        # Save to Supabase
        name_encoded = account["name"].replace(" ", "%20")
        r2 = await client.patch(
            f"{SUPABASE_URL}/rest/v1/signals?account_name=eq.{name_encoded}",
            headers=headers,
            json={"playbook": playbook}
        )
        if r2.status_code in (200, 204):
            print(f"[OK] {account['name']}")
        else:
            print(f"[ERR] {account['name']} — Supabase error: {r2.text}")

async def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise SystemExit(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env "
            "(copy from backend/.env; do not hardcode service keys in this file)."
        )
    for account in accounts:
        await generate_and_save(account)
        await asyncio.sleep(0.5)  # Rate limit Gemini
    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())