/**
 * agent.js — Hire with SSU | B.Tech Job Finder AI Agent
 *
 * Uses Gemini 2.0 Flash + Google Search grounding (generateContent API)
 * to find real-time job openings for B.Tech graduates.
 *
 * FIX: Switched from /v1beta/interactions (restricted access)
 *      to /v1beta/models/gemini-2.0-flash:generateContent (works for all API keys)
 */

// ── DOM refs ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const apiKeyInput    = $('api-key');
const toggleKeyBtn   = $('toggle-key');
const domainSel      = $('domain');
const experienceSel  = $('experience');
const locationSel    = $('location');
const companyTypeSel = $('company-type');
const customQueryInp = $('custom-query');
const searchBtn      = $('search-btn');
const btnSpinner     = $('spinner');
const btnIcon        = $('btn-icon');
const btnText        = $('btn-text');
const outputArea     = $('output-area');
const aiBanner       = $('ai-banner');
const aiSummaryText  = $('ai-summary-text');
const resultsBar     = $('results-bar');
const jobCount       = $('job-count');
const refreshBtn     = $('refresh-btn');
const sortBtn        = $('sort-btn');
const citationsPanel = $('citations-panel');
const citationChips  = $('citation-chips');
const toastRoot      = $('toast-root');

// ── Gemini API config ──────────────────────────────────────────────────────
const GEMINI_MODEL    = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Persist API key in sessionStorage ─────────────────────────────────────
apiKeyInput.value = sessionStorage.getItem('ssu_gemini_key') || '';
apiKeyInput.addEventListener('input', () => {
  sessionStorage.setItem('ssu_gemini_key', apiKeyInput.value.trim());
});

// ── Toggle API key visibility ──────────────────────────────────────────────
toggleKeyBtn.addEventListener('click', () => {
  const hide = apiKeyInput.type === 'password';
  apiKeyInput.type = hide ? 'text' : 'password';
  toggleKeyBtn.textContent = hide ? '🙈' : '👁️';
});

// ── Refresh & sort buttons ─────────────────────────────────────────────────
refreshBtn.addEventListener('click', doSearch);

let sortAsc = true;
sortBtn.addEventListener('click', () => {
  sortAsc = !sortAsc;
  sortBtn.textContent = sortAsc ? '⇅ Sort A→Z' : '⇅ Sort Z→A';
  const grid = $('jobs-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.job-card')];
  cards.sort((a, b) => {
    const ca = a.dataset.company || '';
    const cb = b.dataset.company || '';
    return sortAsc ? ca.localeCompare(cb) : cb.localeCompare(ca);
  });
  cards.forEach(c => grid.appendChild(c));
});

// Enter key in keyword box triggers search
customQueryInp.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

// ── Toast helper ───────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = message;
  toastRoot.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

// ── HTML escape ────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Domain → emoji map ─────────────────────────────────────────────────────
const DOMAIN_EMOJI = {
  'SOC':        '📡', 'SIEM':       '🖥️', 'EDR':        '🔍',
  'DFIR':       '🔬', 'Forensic':   '🔬', 'Threat':     '🧠',
  'Penetration':'💣', 'VAPT':       '🔓', 'Bug Bounty': '💰',
  'Red Team':   '🔴', 'Blue Team':  '🔵', 'Purple':     '🟣',
  'Detection':  '🔭', 'SOAR':       '⚡', 'DevSecOps':  '🔄',
  'Zero Trust': '🛡️', 'IAM':        '🪪', 'OT':         '🏭',
  'Malware':    '🦠', 'Reverse':    '🦠', 'GRC':        '📋',
  'AppSec':     '🛠️', 'Cloud Sec':  '☁️',
  'Machine Learning':'🤖', 'Deep Learning':'🧠', 'Computer Vision':'👁️',
  'NLP':        '💬', 'LLM':        '💬', 'Generative': '✨',
  'RAG':        '📚', 'MLOps':      '⚙️', 'AI Agent':   '🕵️',
  'Prompt':     '💡', 'Edge AI':    '⚡', 'TinyML':     '⚡',
  'Data Scientist':'📊', 'Data Analyst':'📈', 'BI':      '💡',
  'Data Engineer':'🔧', 'Spark':    '⚡', 'Kafka':      '🔴',
  'Lakehouse':  '🏞️',
  'Software':   '💻', 'SDE':        '💻', 'Backend':    '⚙️',
  'Frontend':   '🎨', 'Full Stack': '🌐', 'Mobile':     '📱',
  'Cloud':      '☁️', 'DevOps':     '🔄', 'SRE':        '🛡️',
  'Platform':   '🏗️', 'GitOps':     '🔀', 'FinOps':     '💰',
  'Embedded':   '⚡', 'VLSI':       '🔬', 'Firmware':   '🔩',
  'Kernel':     '🖥️', 'Network':    '🔌', 'AR':         '🥽',
  'VR':         '🥽', 'Quantum':    '⚛️', 'Robotics':   '🤖',
  'Game':       '🎮', 'Blockchain': '⛓️', 'Web3':       '⛓️',
};

function getDomainEmoji(domain = '', title = '') {
  const str = domain + ' ' + title;
  for (const [k, v] of Object.entries(DOMAIN_EMOJI)) {
    if (str.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '🏢';
}

// ── Skeleton loader ────────────────────────────────────────────────────────
function showSkeletons(n = 6) {
  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';
  for (let i = 0; i < n; i++) {
    grid.innerHTML += `
      <div class="skeleton-card">
        <div class="sk" style="width:48px;height:48px;border-radius:14px;margin-bottom:18px"></div>
        <div class="sk" style="height:18px;width:65%"></div>
        <div class="sk" style="height:13px;width:40%"></div>
        <div style="display:flex;gap:8px;margin:16px 0">
          <div class="sk" style="height:28px;width:80px;border-radius:20px;margin:0"></div>
          <div class="sk" style="height:28px;width:80px;border-radius:20px;margin:0"></div>
        </div>
        <div class="sk" style="height:13px;width:90%"></div>
        <div class="sk" style="height:13px;width:70%"></div>
        <div class="sk" style="height:38px;border-radius:12px;margin-top:14px"></div>
      </div>`;
  }
  outputArea.innerHTML = '';
  outputArea.appendChild(grid);
}

// ── Render one job card ────────────────────────────────────────────────────
function renderJobCard(job, index) {
  const emoji  = getDomainEmoji(job.domain, job.title);
  const skills = (job.skills || []).slice(0, 5);

  const applyUrl = job.apply_url
    || `https://www.google.com/search?q=${encodeURIComponent(`"${job.title}" "${job.company}" job apply site:linkedin.com OR site:naukri.com`)}`;

  const card = document.createElement('div');
  card.className = 'job-card';
  card.dataset.company = job.company || '';
  card.style.animationDelay = `${index * 55}ms`;

  card.innerHTML = `
    <div class="card-accent"></div>
    <div class="card-top">
      <div class="company-avatar">${emoji}</div>
      <div class="card-badges">
        <span class="badge badge-new">✦ New</span>
        ${job.experience ? `<span class="badge badge-exp">${esc(job.experience.split(' ')[0])}</span>` : ''}
      </div>
    </div>
    <div class="job-title">${esc(job.title || 'Engineering Opening')}</div>
    <div class="company-name">${esc(job.company || 'Top Company')}</div>
    <div class="meta-row">
      <span class="meta-chip"><span class="chip-icon">📍</span>${esc(job.location || 'India')}</span>
      <span class="meta-chip"><span class="chip-icon">💼</span>${esc(job.experience || 'Fresher')}</span>
      ${job.salary ? `<span class="meta-chip"><span class="chip-icon">💰</span>${esc(job.salary)}</span>` : ''}
    </div>
    ${skills.length ? `
    <div class="skills-row">
      ${skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}
    </div>` : ''}
    <a href="${esc(applyUrl)}" target="_blank" rel="noopener noreferrer" class="apply-link">
      Apply Now &nbsp;→
    </a>`;

  return card;
}

// ── Extract citations from groundingMetadata ──────────────────────────────
function extractCitations(data) {
  const citations = [];
  try {
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of chunks) {
      const url   = chunk?.web?.uri;
      const title = chunk?.web?.title || '';
      if (url) {
        let hostname = url;
        try { hostname = new URL(url).hostname.replace('www.', ''); } catch {}
        citations.push({ url, title: title || hostname });
      }
    }
  } catch {}
  return [...new Map(citations.map(c => [c.url, c])).values()];
}

// ── Main search function ───────────────────────────────────────────────────
async function doSearch() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showToast('❌ Please enter your Gemini API key first.', 'error');
    apiKeyInput.focus();
    return;
  }

  const domain      = domainSel.value;
  const experience  = experienceSel.value;
  const location    = locationSel.value;
  const companyType = companyTypeSel.value;
  const extraKw     = customQueryInp.value.trim();

  // ── Build prompt ──
  const domainPart  = domain   ? `specifically for "${domain}"` : 'across all engineering domains';
  const extraPart   = extraKw  ? ` Also focus on: ${extraKw}.` : '';

  const prompt = `You are an expert job search AI agent for Indian B.Tech graduates.
Search the web RIGHT NOW for the LATEST job openings (posted in 2025 or 2026) ${domainPart}, for ${experience} candidates at ${companyType}, located in ${location}.${extraPart}

Find 10–14 real, currently OPEN job postings. Search on LinkedIn, Naukri, Indeed, company career pages, etc.

Return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON:

{
  "summary": "2-3 sentence overview of current hiring trends for these roles in ${location}",
  "jobs": [
    {
      "title": "Exact job title",
      "company": "Company name",
      "location": "City or Remote",
      "experience": "e.g. Fresher / 0-2 years",
      "salary": "e.g. ₹6-10 LPA or null",
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4"],
      "apply_url": "Direct URL to job posting or careers page",
      "domain": "Job domain/category"
    }
  ]
}`;

  // ── Set loading UI ──
  searchBtn.disabled       = true;
  btnSpinner.style.display = 'block';
  btnIcon.style.display    = 'none';
  btnText.textContent      = 'Agent searching the web…';
  aiBanner.hidden          = true;
  resultsBar.hidden        = true;
  citationsPanel.hidden    = true;
  showSkeletons();

  try {
    // ── Call Gemini generateContent API ──
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        }
      })
    });

    // ── Handle HTTP errors ──
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `HTTP ${res.status} — ${res.statusText}`;
      throw new Error(msg);
    }

    const data = await res.json();

    // ── Extract raw text from response ──
    const rawText = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .join('') || '';

    if (!rawText) throw new Error('No response received from Gemini. Please try again.');

    // ── Parse JSON (handle markdown fences if any) ──
    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/,      '')
        .replace(/```\s*$/,      '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { throw new Error('Could not parse job data from AI. Try refreshing.'); }
      } else {
        throw new Error('Could not parse job data from AI. Try refreshing.');
      }
    }

    const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs : [];

    // ── Render jobs grid ──
    outputArea.innerHTML = '';

    if (jobs.length === 0) {
      outputArea.innerHTML = `
        <div class="error-state">
          <div class="error-icon">😕</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your filters or adding different keywords and try again.</p>
        </div>`;
    } else {
      const grid = document.createElement('div');
      grid.id = 'jobs-grid';
      jobs.forEach((job, i) => grid.appendChild(renderJobCard(job, i)));
      outputArea.appendChild(grid);
    }

    // ── Stats bar ──
    jobCount.textContent = jobs.length;
    resultsBar.hidden    = false;

    // ── AI Summary ──
    if (parsed?.summary) {
      aiSummaryText.textContent = parsed.summary;
      aiBanner.hidden = false;
    }

    // ── Citations from Google Search grounding ──
    const citations = extractCitations(data);
    if (citations.length > 0) {
      citationChips.innerHTML = citations.map(c => `
        <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="citation-chip">
          🔗 ${esc(c.title)}
        </a>`).join('');
      citationsPanel.hidden = false;
    }

    showToast(`✅ Found <strong>${jobs.length} jobs</strong> via live Google Search!`, 'success');

  } catch (err) {
    outputArea.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>${esc(err.message)}</p>
      </div>`;
    showToast(`❌ ${esc(err.message)}`, 'error');
    console.error('[SSU Agent Error]', err);
  } finally {
    searchBtn.disabled       = false;
    btnSpinner.style.display = 'none';
    btnIcon.style.display    = 'inline';
    btnText.textContent      = 'Search Jobs with AI Agent';
  }
}

// ── Attach main button ─────────────────────────────────────────────────────
searchBtn.addEventListener('click', doSearch);
