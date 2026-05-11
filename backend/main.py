from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import httpx, os, json
from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}


SYSTEM_PROMPT = """You are a GTM playbook specialist. Given account
profile and buyer signal, generate a personalized outreach playbook.
Return ONLY valid JSON, no markdown, no preamble.
Schema: {"role_target": str, "assigned_to": "SDR"|"AE",
"channels": [str], "steps": [{"day": int, "channel": str,
"action": str, "message_hint": str}], "rationale": str}"""


class SignalPayload(BaseModel):
    signal_id: str
    account_id: str
    account_name: str
    industry: str
    employee_count: int = 0
    data_quality_score: int
    why_now: str
    fit_score: int
    intent_score: int
    timing_score: int
    composite_score: int


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate-playbook")
async def generate_playbook(payload: SignalPayload):
    try:
        user_msg = (
            f"Account: {payload.account_name}, {payload.industry}, "
            f"{payload.employee_count} employees.\n"
            f"Signal: {payload.why_now}\n"
            f"Scores: fit={payload.fit_score}, intent={payload.intent_score}, "
            f"timing={payload.timing_score}\n"
            f"Composite: {payload.composite_score}/100\nGenerate the playbook."
        )
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_msg,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
        )
        text = resp.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        playbook = json.loads(text.strip())
        return playbook
    except Exception as e:
        return {"error": str(e), "raw": locals().get("text", "no response")}

@app.post("/webhook/signal-approved")
async def signal_approved(payload: SignalPayload):
    try:
        playbook = await generate_playbook(payload)
        async with httpx.AsyncClient() as http:
            resp = await http.post(
                f"{SUPABASE_URL}/rest/v1/signals",
                headers=HEADERS,
                json={
                    "account_name": payload.account_name,
                    "industry": payload.industry,
                    "employee_count": payload.employee_count,
                    "why_now": payload.why_now,
                    "fit_score": payload.fit_score,
                    "intent_score": payload.intent_score,
                    "timing_score": payload.timing_score,
                    "composite_score": payload.composite_score,
                    "status": "approved",
                    "assigned_to": playbook.get("assigned_to", "AE"),
                    "playbook": playbook,
                    "source": "webhook"
                }
            )
            print(f"SUPABASE STATUS: {resp.status_code}")
            print(f"SUPABASE BODY: {resp.text}")
        return {"playbook": playbook}
    except Exception as e:
        print(f"ERROR: {e}")
        return {"error": str(e)}