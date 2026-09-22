# 🎓 HireSSU — AI Job Portal for B.Tech Graduates

[![Deploy to GitHub Pages](https://github.com/RITESH-we/Hire-With-SSU/actions/workflows/daily_refresh.yml/badge.svg)](https://github.com/RITESH-we/Hire-With-SSU/actions)
[![Live Site](https://img.shields.io/badge/Live%20Site-GitHub%20Pages-brightgreen?logo=github)](https://ritesh-we.github.io/Hire-With-SSU/)
[![Open Source](https://img.shields.io/badge/Open%20Source-MIT-blue.svg)](LICENSE)
[![Batch](https://img.shields.io/badge/Target%20Batch-2025%20%2F%202026-orange.svg)]()

> **Live Demo:** [https://ritesh-we.github.io/Hire-With-SSU/](https://ritesh-we.github.io/Hire-With-SSU/)

**HireSSU** is a sleek, self-driven job portal tailored specifically for **Indian B.Tech engineering graduates (2025/2026 batch & 0–2 years experience)**. It curates fresh openings across **Cybersecurity**, **AI / ML & Data Science**, and **CSE Core** with direct application links to authentic company career pages.

---

## ✨ Key Features

- **🏢 Top 100 Companies in India (By Domain):** Integrated directory of 110+ top tech companies in India broken down by **Cybersecurity (56)**, **AI/ML & DS (82)**, and **CSE Core (92)**, with one-click direct career portal links and role tags.

- **⚡ Zero Setup / Free Mode:** Loads 40+ verified job openings immediately upon opening—**no API keys, login, or configuration required**.
- **🔄 Automated Daily Refresh:** Runs on a scheduled GitHub Actions workflow every 24 hours at midnight to fetch fresh tech postings automatically.
- **📎 Direct Application Redirection:** Every single card is directly linked (`target="_blank"`) to official career portals (TCS iBegin, Amazon Jobs, Google Careers, Wipro, Infosys, Flipkart, Jio, Swiggy, Zomato, PhonePe, etc.).
- **🚫 Zero Dropdowns:** Entirely self-driven interactive UI with click-to-filter tabs, pills, and dynamic tag chips.
- **🎯 3 Specialized Engineering Domains:**
  - 🔐 **Cybersecurity:** SOC Analyst (L1), VAPT, Threat Hunting & DFIR, Cloud Security, DevSecOps, AppSec.
  - 🤖 **AI / ML & Data Science:** Machine Learning Engineers, Data Scientists, BI Analysts, Big Data/Kafka Engineers, GenAI & LLM Trainees, Computer Vision.
  - 💻 **CSE Core / Software Engineering:** SDE-1, Full Stack Web, Mobile Developers (Flutter/React Native), Backend Microservices, Cloud & DevOps, Embedded/Systems.
- **🔍 Instant Multi-Filter Search:** Filter dynamically by Experience (*Fresher, 1–3 yrs*), Location (*Bangalore, Hyderabad, Delhi NCR, Pune, Remote*), Top Skills, Companies, or free text.
- **🔑 Optional Live AI Web Search:** Visitors can optionally enter a free Google Gemini API key to activate on-demand live scraping across LinkedIn, Naukri, and company portals using **Gemini 2.0 Flash with Google Search Grounding**.

---

## 🏗️ Tech Stack

- **Frontend:** Pure Semantic HTML5, Modern CSS3 (Glassmorphism, CSS Grid, Custom Design System, Flexbox), Vanilla JavaScript (ES6+).
- **Automation & CI/CD:** GitHub Actions (`.github/workflows/daily_refresh.yml`), Python 3.11.
- **Hosting:** GitHub Pages (Free, HTTPS enabled, Global CDN).
- **AI Engine (Optional):** Google Gemini 2.0 Flash (`generateContent` with Google Search tool grounding).

---

## 📁 Repository Structure

```text
Hire-With-SSU/
├── index.html                  # Main responsive single-page job portal
├── portal.css                  # Dark-themed modern styling & animations
├── portal.js                   # Client-side filtering, card rendering & AI integration
├── sample_jobs.json            # Curated verified dataset of 40+ openings
├── scripts/
│   └── daily_refresh.py        # Automated python script to fetch fresh jobs
├── .github/
│   └── workflows/
│       └── daily_refresh.yml   # Scheduled GitHub Actions cron workflow (runs daily)
└── README.md                   # Project documentation
```

---

## 🚀 How to Run Locally

Because this project is built with vanilla web technologies, you don't need `node_modules` or local servers to run it:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RITESH-we/Hire-With-SSU.git
   cd Hire-With-SSU
   ```

2. **Open `index.html`:**
   - Double-click `index.html` to open it in any browser (Chrome, Edge, Firefox, Safari).
   - Or serve with any local server:
     ```bash
     python -m http.server 8000
     ```
     Visit `http://localhost:8000`.

---

## 🤖 Automated Daily Refresh Workflow

The portal keeps its listings up to date automatically:
1. **GitHub Action:** Scheduled via `.github/workflows/daily_refresh.yml` to trigger every day at `00:00 UTC` (05:30 AM IST).
2. **Scraper Script:** Executes `scripts/daily_refresh.py` in an Ubuntu runner, updates `sample_jobs.json` and `portal.js`.
3. **Auto-Deploy:** Commits the updated listings back to the `main` branch, triggering an instant GitHub Pages rebuild.

---

## 🤝 Contributing

Contributions, role suggestions, and bug reports are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AddCompanyRole`)
3. Commit your Changes (`git commit -m 'feat: Add role'`)
4. Push to the Branch (`git push origin feature/AddCompanyRole`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Made with ❤️ for Indian B.Tech Freshers &amp; Engineering Students
</div>
