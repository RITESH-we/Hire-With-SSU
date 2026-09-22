"""
daily_refresh.py — HireSSU Automated Daily Job Updater
Runs automatically via GitHub Actions every 24 hours.
If GEMINI_API_KEY secret is present, queries Gemini 2.0 Flash with Google Search
grounding to discover fresh openings across Cybersecurity, AI/ML, and CSE,
updating sample_jobs.json and portal.js.
"""

import os
import json
import re
import urllib.request
import urllib.error

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

PROMPTS = {
    "cybersecurity": (
        "Find 12 latest Cybersecurity job openings in India (2025/2026 batch) for freshers and 0-2 years: "
        "SOC Analyst, VAPT, Threat Hunting, DFIR, Cloud Security, AppSec. "
        "Return JSON with format: {'jobs': [{'title': '...', 'company': '...', 'location': '...', 'experience': '...', 'salary': '...', 'skills': ['...'], 'apply_url': 'https://...', 'domain': '...'}]}"
    ),
    "aiml": (
        "Find 12 latest AI/ML and Data Science job openings in India (2025/2026 batch) for freshers and 0-2 years: "
        "ML Engineer, Data Scientist, Data Analyst, Data Engineer, GenAI/LLM, Computer Vision. "
        "Return JSON with format: {'jobs': [{'title': '...', 'company': '...', 'location': '...', 'experience': '...', 'salary': '...', 'skills': ['...'], 'apply_url': 'https://...', 'domain': '...'}]}"
    ),
    "cse": (
        "Find 12 latest CSE Core Software Engineering job openings in India (2025/2026 batch) for freshers and 0-2 years: "
        "SDE-1, Backend, Frontend, Full Stack, Mobile/Flutter, DevOps, Cloud Engineer. "
        "Return JSON with format: {'jobs': [{'title': '...', 'company': '...', 'location': '...', 'experience': '...', 'salary': '...', 'skills': ['...'], 'apply_url': 'https://...', 'domain': '...'}]}"
    )
}

def fetch_domain_jobs(api_key, domain_key, prompt_text):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.7}
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            raw = body["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
            cleaned = re.sub(r"```\s*$", "", cleaned).strip()
            parsed = json.loads(cleaned)
            jobs = parsed.get("jobs", [])
            for j in jobs:
                j["_domain"] = domain_key
                if not j.get("apply_url") or not j["apply_url"].startswith("http"):
                    q = urllib.parse.quote(f"{j.get('title','')} {j.get('company','')} careers job apply")
                    j["apply_url"] = f"https://www.google.com/search?q={q}"
            return jobs
    except Exception as e:
        print(f"[DailyRefresh] Warning: Could not fetch {domain_key}: {e}")
        return []

def main():
    print("[DailyRefresh] Starting scheduled daily job check...")

    if not API_KEY:
        print("[DailyRefresh] Note: GEMINI_API_KEY secret is not configured in GitHub repository secrets.")
        print("[DailyRefresh] Keeping verified 36 curated job openings active.")
        return

    all_fresh_jobs = []
    for domain, prompt in PROMPTS.items():
        print(f"[DailyRefresh] Fetching fresh {domain} openings...")
        jobs = fetch_domain_jobs(API_KEY, domain, prompt)
        print(f"[DailyRefresh] Found {len(jobs)} jobs for {domain}")
        all_fresh_jobs.extend(jobs)

    if len(all_fresh_jobs) < 15:
        print("[DailyRefresh] Warning: Too few jobs returned from API. Keeping existing verified list.")
        return

    print(f"[DailyRefresh] Successfully collected {len(all_fresh_jobs)} fresh jobs. Updating files...")

    # Update sample_jobs.json
    with open("sample_jobs.json", "w", encoding="utf-8") as f:
        json.dump(all_fresh_jobs, f, indent=2, ensure_ascii=False)

    # Update portal.js
    with open("portal.js", encoding="utf-8") as f:
        portal = f.read()

    js_str = "const VERIFIED_JOBS = " + json.dumps(all_fresh_jobs, indent=2, ensure_ascii=False) + ";"
    portal = re.sub(r"const VERIFIED_JOBS = \[[\s\S]*?\];", lambda m: js_str, portal)

    with open("portal.js", "w", encoding="utf-8") as f:
        f.write(portal)

    print("[DailyRefresh] Successfully updated sample_jobs.json and portal.js!")

if __name__ == "__main__":
    main()
