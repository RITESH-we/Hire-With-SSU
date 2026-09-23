/**
 * portal.js — HireSSU | B.Tech Job Portal
 *
 * • Auto-searches 3 domains in parallel on API key save
 * • Entire job card is clickable → opens direct job/company URL
 * • Client-side filtering: domain tabs, exp, location, skill, company, global search
 * • No dropdowns — fully self-driven
 */

'use strict';

// ── DOM helpers ────────────────────────────────────────────────────────────
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Elements ───────────────────────────────────────────────────────────────
const globalSearch  = $('global-search');
const clearSearch   = $('clear-search');
const keyBtn        = $('key-btn');
const keyDot        = $('key-status-dot');
const keyBtnLabel   = $('key-btn-label');
const keyModal      = $('key-modal');
const modalClose    = $('modal-close');
const modalApiInput = $('modal-api-input');
const modalEye      = $('modal-eye');
const modalSave     = $('modal-save');
const domainTabs    = $$('.dtab');
const tabStats      = $('tab-stats');
const totalCount    = $('total-count');
const refreshBtn    = $('refresh-btn');
const expChips      = $$('[data-filter="exp"]');
const locChips      = $$('[data-filter="loc"]');
const skillsSection = $('skills-section');
const skillsChips   = $('skills-chips');
const companySection= $('company-section');
const companyChips  = $('company-chips');
const activeFilters = $('active-filters');
const afChips       = $('af-chips');
const afClear       = $('af-clear');
const sortBar       = $('sort-bar');
const showingCount  = $('showing-count');
const sortSelect    = $('sort-select');
const jobsArea      = $('jobs-area');
const wsCta         = $('ws-cta-btn');
const toastRoot     = $('toast-root');

// ── State ──────────────────────────────────────────────────────────────────
let allJobs      = [];   // all fetched jobs from AI (unfiltered)
let filteredJobs = [];   // after applying all filters
let activeDomain = 'all';
let activeExp    = 'all';
let activeLoc    = 'all';
let activeSkill  = '';
let activeCompany= '';
let searchQuery  = '';
let isLoading    = false;

// ── Curated Verified Jobs (Runs Out-of-the-Box without API Key) ───────────
const VERIFIED_JOBS = [
  {
    "title": "Junior SOC Analyst (L1)",
    "company": "Tata Consultancy Services (TCS)",
    "location": "Bangalore / Hybrid",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹4.5 - 7 LPA",
    "skills": [
      "SIEM",
      "Splunk",
      "Incident Response",
      "Network Security",
      "Wireshark"
    ],
    "apply_url": "https://ibegin.tcs.com/iBegin/jobs/search",
    "domain": "SOC Analyst",
    "_domain": "cybersecurity"
  },
  {
    "title": "Associate Security Engineer - VAPT",
    "company": "Wipro",
    "location": "Hyderabad / Remote",
    "experience": "Fresher (0-2 yrs)",
    "salary": "₹5.0 - 8.5 LPA",
    "skills": [
      "Burp Suite",
      "OWASP Top 10",
      "Web VAPT",
      "Penetration Testing",
      "Nmap"
    ],
    "apply_url": "https://careers.wipro.com/careers-home",
    "domain": "VAPT Web",
    "_domain": "cybersecurity"
  },
  {
    "title": "Cyber Security Analyst - Threat Hunting & DFIR",
    "company": "Infosys",
    "location": "Pune",
    "experience": "0-1 years",
    "salary": "₹5.5 - 9 LPA",
    "skills": [
      "DFIR",
      "Threat Hunting",
      "EDR",
      "SentinelOne",
      "Log Analysis"
    ],
    "apply_url": "https://career.infosys.com/",
    "domain": "DFIR",
    "_domain": "cybersecurity"
  },
  {
    "title": "Cloud Security & DevSecOps Associate",
    "company": "HCLTech",
    "location": "Noida / Delhi NCR",
    "experience": "0-2 years",
    "salary": "₹5.0 - 8 LPA",
    "skills": [
      "AWS Security",
      "DevSecOps",
      "Docker",
      "CI/CD Security",
      "SonarQube"
    ],
    "apply_url": "https://www.hcltech.com/careers",
    "domain": "Cloud Security",
    "_domain": "cybersecurity"
  },
  {
    "title": "Associate Information Security Analyst",
    "company": "Accenture",
    "location": "Gurgaon / Hyderabad",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹4.8 - 7.5 LPA",
    "skills": [
      "ISO 27001",
      "Vulnerability Management",
      "IAM",
      "Python",
      "Firewalls"
    ],
    "apply_url": "https://www.accenture.com/in-en/careers",
    "domain": "Information Security",
    "_domain": "cybersecurity"
  },
  {
    "title": "Network Security & Firewall Trainee",
    "company": "Cisco Systems India",
    "location": "Bangalore",
    "experience": "Fresher (2025/2026 Batch)",
    "salary": "₹9 - 14 LPA",
    "skills": [
      "CCNA",
      "TCP/IP",
      "Linux",
      "Firewalls",
      "Python"
    ],
    "apply_url": "https://jobs.cisco.com/jobs/SearchJobs/?21178=%5B16948%5D&21178_format=6020&listFilterMode=1",
    "domain": "Network Security",
    "_domain": "cybersecurity"
  },
  {
    "title": "Application Security Intern / Associate",
    "company": "Cognizant",
    "location": "Chennai",
    "experience": "Fresher",
    "salary": "₹4.5 - 6.5 LPA",
    "skills": [
      "SAST",
      "DAST",
      "OWASP",
      "Java",
      "Git"
    ],
    "apply_url": "https://careers.cognizant.com/global/en",
    "domain": "AppSec",
    "_domain": "cybersecurity"
  },
  {
    "title": "Threat Intelligence & SIEM Engineer",
    "company": "Tech Mahindra",
    "location": "Mumbai / Remote",
    "experience": "1-3 years",
    "salary": "₹6 - 10 LPA",
    "skills": [
      "Splunk",
      "QRadar",
      "MITRE ATT&CK",
      "Threat Intel",
      "Python"
    ],
    "apply_url": "https://careers.techmahindra.com/",
    "domain": "Threat Intelligence",
    "_domain": "cybersecurity"
  },
  {
    "title": "Security Operations Center (SOC) Specialist",
    "company": "Deloitte India",
    "location": "Hyderabad / Bangalore",
    "experience": "0-2 years",
    "salary": "₹6.5 - 11 LPA",
    "skills": [
      "SIEM",
      "Microsoft Sentinel",
      "Log Analysis",
      "Incident Triage",
      "KQL"
    ],
    "apply_url": "https://jobsindia.deloitte.com/",
    "domain": "SOC Operations",
    "_domain": "cybersecurity"
  },
  {
    "title": "Product Security & Bug Bounty Engineer",
    "company": "Razorpay",
    "location": "Bangalore / Remote",
    "experience": "0-2 years",
    "salary": "₹12 - 20 LPA",
    "skills": [
      "AppSec",
      "OWASP Top 10",
      "Threat Modeling",
      "Web Security",
      "Python"
    ],
    "apply_url": "https://razorpay.com/jobs/",
    "domain": "Product Security",
    "_domain": "cybersecurity"
  },
  {
    "title": "Cyber Defense & Incident Response Associate",
    "company": "PwC India",
    "location": "Kolkata / Gurgaon",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹5.2 - 8 LPA",
    "skills": [
      "DFIR",
      "Malware Analysis",
      "Windows Internals",
      "Wireshark",
      "Memory Forensics"
    ],
    "apply_url": "https://www.pwc.in/careers.html",
    "domain": "DFIR",
    "_domain": "cybersecurity"
  },
  {
    "title": "Cloud Infrastructure Security Analyst",
    "company": "Palo Alto Networks India",
    "location": "Bangalore",
    "experience": "0-2 years",
    "salary": "₹14 - 24 LPA",
    "skills": [
      "Prisma Cloud",
      "CSPM",
      "Kubernetes Security",
      "Linux",
      "Python"
    ],
    "apply_url": "https://jobs.paloaltonetworks.com/",
    "domain": "Cloud Security",
    "_domain": "cybersecurity"
  },
  {
    "title": "Vulnerability Assessment & Penetration Testing (VAPT) Analyst",
    "company": "Mahindra Defence Systems",
    "location": "Pune / Mumbai",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹5.5 - 8.5 LPA",
    "skills": [
      "Burp Suite",
      "OWASP",
      "Kali Linux",
      "Python",
      "Network VAPT"
    ],
    "apply_url": "https://www.mahindra.com/careers",
    "domain": "VAPT",
    "_domain": "cybersecurity"
  },
  {
    "title": "Associate SOC Security Engineer",
    "company": "Wipro",
    "location": "Bangalore / Hyderabad",
    "experience": "0-2 years",
    "salary": "₹5.2 - 8 LPA",
    "skills": [
      "Splunk",
      "CrowdStrike",
      "Incident Handling",
      "SIEM",
      "Wireshark"
    ],
    "apply_url": "https://careers.wipro.com/",
    "domain": "SOC Operations",
    "_domain": "cybersecurity"
  },
  {
    "title": "Machine Learning Engineer (NLP & LLM)",
    "company": "Jio Platforms",
    "location": "Mumbai / Navi Mumbai",
    "experience": "Fresher / 0-2 yrs",
    "salary": "₹7 - 12 LPA",
    "skills": [
      "Python",
      "PyTorch",
      "HuggingFace",
      "LangChain",
      "RAG"
    ],
    "apply_url": "https://careers.jio.com/",
    "domain": "ML Engineer",
    "_domain": "aiml"
  },
  {
    "title": "Junior Data Scientist",
    "company": "Mu Sigma",
    "location": "Bangalore",
    "experience": "Fresher",
    "salary": "₹6 - 9 LPA",
    "skills": [
      "Python",
      "Statistics",
      "Machine Learning",
      "SQL",
      "Data Modeling"
    ],
    "apply_url": "https://www.mu-sigma.com/careers",
    "domain": "Data Science",
    "_domain": "aiml"
  },
  {
    "title": "Data Analyst (Analytics & BI)",
    "company": "Flipkart",
    "location": "Bangalore / Remote",
    "experience": "0-1 years",
    "salary": "₹8 - 14 LPA",
    "skills": [
      "SQL",
      "Power BI",
      "Tableau",
      "Python",
      "Data Visualization"
    ],
    "apply_url": "https://www.flipkartcareers.com/",
    "domain": "Data Analyst",
    "_domain": "aiml"
  },
  {
    "title": "Associate Data Engineer (Big Data & Kafka)",
    "company": "Swiggy",
    "location": "Bangalore / Remote",
    "experience": "0-2 years",
    "salary": "₹10 - 16 LPA",
    "skills": [
      "Python",
      "Apache Spark",
      "Kafka",
      "SQL",
      "Airflow"
    ],
    "apply_url": "https://careers.swiggy.com/",
    "domain": "Data Engineering",
    "_domain": "aiml"
  },
  {
    "title": "Generative AI & LLM Trainee",
    "company": "Zomato",
    "location": "Gurgaon / Remote",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹8 - 13 LPA",
    "skills": [
      "Python",
      "OpenAI API",
      "LangChain",
      "Vector DBs",
      "Prompt Engineering"
    ],
    "apply_url": "https://www.zomato.com/careers",
    "domain": "GenAI / LLM",
    "_domain": "aiml"
  },
  {
    "title": "Computer Vision & AI Associate",
    "company": "Tata Elxsi",
    "location": "Bangalore / Pune",
    "experience": "0-2 years",
    "salary": "₹5.5 - 8.5 LPA",
    "skills": [
      "OpenCV",
      "Python",
      "PyTorch",
      "CNN",
      "Deep Learning"
    ],
    "apply_url": "https://www.tataelxsi.com/careers",
    "domain": "Computer Vision",
    "_domain": "aiml"
  },
  {
    "title": "Business Intelligence Analyst",
    "company": "Meesho",
    "location": "Bangalore",
    "experience": "0-2 years",
    "salary": "₹7 - 12 LPA",
    "skills": [
      "SQL",
      "Looker",
      "Metabase",
      "Excel",
      "Data Modeling"
    ],
    "apply_url": "https://www.meesho.io/jobs",
    "domain": "BI Analyst",
    "_domain": "aiml"
  },
  {
    "title": "MLOps & AI Pipeline Engineer",
    "company": "InMobi",
    "location": "Bangalore / Hybrid",
    "experience": "1-3 years",
    "salary": "₹11 - 18 LPA",
    "skills": [
      "Python",
      "MLflow",
      "Docker",
      "Kubernetes",
      "AWS SageMaker"
    ],
    "apply_url": "https://www.inmobi.com/company/careers/",
    "domain": "MLOps",
    "_domain": "aiml"
  },
  {
    "title": "Data Scientist - Decision Analytics",
    "company": "CRED",
    "location": "Bangalore",
    "experience": "0-2 years",
    "salary": "₹14 - 24 LPA",
    "skills": [
      "Python",
      "SQL",
      "Predictive Modeling",
      "Scikit-Learn",
      "Feature Engineering"
    ],
    "apply_url": "https://cred.club/careers",
    "domain": "Data Science",
    "_domain": "aiml"
  },
  {
    "title": "Associate Machine Learning Researcher",
    "company": "Microsoft Research India",
    "location": "Bangalore",
    "experience": "Fresher (2025/2026 Batch)",
    "salary": "₹18 - 32 LPA",
    "skills": [
      "Deep Learning",
      "PyTorch",
      "Transformers",
      "Algorithms",
      "Linear Algebra"
    ],
    "apply_url": "https://careers.microsoft.com/",
    "domain": "AI Research",
    "_domain": "aiml"
  },
  {
    "title": "Data Analytics Trainee",
    "company": "Ernst & Young (EY) India",
    "location": "Gurgaon / Chennai",
    "experience": "Fresher",
    "salary": "₹4.5 - 7 LPA",
    "skills": [
      "SQL",
      "Power BI",
      "Advanced Excel",
      "Python",
      "Statistics"
    ],
    "apply_url": "https://www.ey.com/en_in/careers",
    "domain": "Data Analyst",
    "_domain": "aiml"
  },
  {
    "title": "AI & Prompt Engineering Associate",
    "company": "Zepto",
    "location": "Mumbai / Bangalore",
    "experience": "0-1 years",
    "salary": "₹7.5 - 12 LPA",
    "skills": [
      "LangChain",
      "Claude/Gemini API",
      "Python",
      "Evaluation",
      "Prompt Tuning"
    ],
    "apply_url": "https://www.zeptonow.com/careers",
    "domain": "GenAI / LLM",
    "_domain": "aiml"
  },
  {
    "title": "Associate AI Engineer - Computer Vision",
    "company": "L&T Technology Services (LTTS)",
    "location": "Bangalore / Mysore",
    "experience": "0-2 years",
    "salary": "₹5.5 - 9 LPA",
    "skills": [
      "OpenCV",
      "Python",
      "PyTorch",
      "YOLO",
      "Object Detection"
    ],
    "apply_url": "https://www.ltts.com/careers",
    "domain": "Computer Vision",
    "_domain": "aiml"
  },
  {
    "title": "Software Development Engineer (SDE-1)",
    "company": "Amazon India",
    "location": "Hyderabad / Bangalore",
    "experience": "Fresher (2025/2026 Batch)",
    "salary": "₹16 - 28 LPA",
    "skills": [
      "Java",
      "DSA",
      "System Design",
      "OOPs",
      "Algorithms"
    ],
    "apply_url": "https://www.amazon.jobs/en/teams/in",
    "domain": "SDE Core",
    "_domain": "cse"
  },
  {
    "title": "Graduate Trainee Software Engineer",
    "company": "HCLTech",
    "location": "Noida / Delhi NCR",
    "experience": "Fresher",
    "salary": "₹4.25 - 6.5 LPA",
    "skills": [
      "C++",
      "Java",
      "SQL",
      "Data Structures",
      "Linux"
    ],
    "apply_url": "https://www.hcltech.com/careers",
    "domain": "Software Engineering",
    "_domain": "cse"
  },
  {
    "title": "DevOps & Cloud Associate Engineer",
    "company": "Accenture India",
    "location": "Gurgaon / Hyderabad",
    "experience": "0-1 years",
    "salary": "₹5.5 - 8.5 LPA",
    "skills": [
      "AWS",
      "Docker",
      "Kubernetes",
      "Linux",
      "CI/CD"
    ],
    "apply_url": "https://www.accenture.com/in-en/careers",
    "domain": "Cloud & DevOps",
    "_domain": "cse"
  },
  {
    "title": "Frontend / Full Stack Web Developer",
    "company": "Zomato",
    "location": "Gurgaon / Remote",
    "experience": "0-2 years",
    "salary": "₹9 - 15 LPA",
    "skills": [
      "React.js",
      "TypeScript",
      "Node.js",
      "HTML5/CSS3",
      "REST APIs"
    ],
    "apply_url": "https://www.zomato.com/careers",
    "domain": "Full Stack",
    "_domain": "cse"
  },
  {
    "title": "Mobile App Developer (Flutter / React Native)",
    "company": "PhonePe",
    "location": "Bangalore",
    "experience": "0-2 years",
    "salary": "₹12 - 18 LPA",
    "skills": [
      "Flutter",
      "Dart",
      "Android SDK",
      "REST APIs",
      "State Management"
    ],
    "apply_url": "https://www.phonepe.com/careers/",
    "domain": "Mobile Development",
    "_domain": "cse"
  },
  {
    "title": "Backend Software Engineer (Java / Golang)",
    "company": "Paytm",
    "location": "Noida / Bangalore",
    "experience": "0-2 years",
    "salary": "₹7 - 12 LPA",
    "skills": [
      "Java",
      "Spring Boot",
      "MySQL",
      "Redis",
      "Microservices"
    ],
    "apply_url": "https://paytm.com/careers",
    "domain": "Backend SDE",
    "_domain": "cse"
  },
  {
    "title": "Associate Systems & Cloud Engineer",
    "company": "Capgemini",
    "location": "Pune / Mumbai",
    "experience": "Fresher",
    "salary": "₹4.2 - 6.8 LPA",
    "skills": [
      "Linux",
      "Shell Scripting",
      "Azure",
      "Git",
      "Networking"
    ],
    "apply_url": "https://www.capgemini.com/in-en/careers/",
    "domain": "Systems & Cloud",
    "_domain": "cse"
  },
  {
    "title": "Full Stack Engineer Trainee",
    "company": "Persistent Systems",
    "location": "Pune / Hyderabad",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹4.5 - 7.5 LPA",
    "skills": [
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "Git"
    ],
    "apply_url": "https://www.persistent.com/careers/",
    "domain": "Full Stack",
    "_domain": "cse"
  },
  {
    "title": "Associate Software Engineer (Java / C++)",
    "company": "Google India",
    "location": "Hyderabad / Bangalore",
    "experience": "Fresher (2025/2026 Batch)",
    "salary": "₹18 - 35 LPA",
    "skills": [
      "Data Structures",
      "Algorithms",
      "C++",
      "Java",
      "Systems Programming"
    ],
    "apply_url": "https://www.google.com/about/careers/applications/jobs/results/?location=India",
    "domain": "SDE Core",
    "_domain": "cse"
  },
  {
    "title": "Platform Infrastructure & SRE",
    "company": "Cisco Systems India",
    "location": "Bangalore",
    "experience": "0-2 years",
    "salary": "₹11 - 18 LPA",
    "skills": [
      "Linux",
      "Golang",
      "Python",
      "Docker",
      "Kubernetes",
      "Terraform"
    ],
    "apply_url": "https://jobs.cisco.com/",
    "domain": "Cloud & DevOps",
    "_domain": "cse"
  },
  {
    "title": "Backend Developer - High Scale APIs",
    "company": "Zepto",
    "location": "Mumbai / Bangalore",
    "experience": "0-2 years",
    "salary": "₹10 - 16 LPA",
    "skills": [
      "Golang",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "Distributed Systems"
    ],
    "apply_url": "https://www.zeptonow.com/careers",
    "domain": "Backend SDE",
    "_domain": "cse"
  },
  {
    "title": "Systems Software Engineer - Linux & Firmware",
    "company": "Qualcomm India",
    "location": "Hyderabad / Bangalore",
    "experience": "Fresher (0-1 yr)",
    "salary": "₹13 - 22 LPA",
    "skills": [
      "C",
      "Linux Kernel",
      "RTOS",
      "Device Drivers",
      "Embedded C"
    ],
    "apply_url": "https://www.qualcomm.com/company/careers",
    "domain": "Embedded & Systems",
    "_domain": "cse"
  },
  {
    "title": "Associate Software Engineer (Java / Cloud)",
    "company": "Oracle India",
    "location": "Bangalore / Hyderabad",
    "experience": "Fresher (2025/2026 Batch)",
    "salary": "₹12 - 18 LPA",
    "skills": [
      "Java",
      "OCI Cloud",
      "REST APIs",
      "Microservices",
      "SQL"
    ],
    "apply_url": "https://www.oracle.com/corporate/careers/",
    "domain": "SDE Core",
    "_domain": "cse"
  }
];

// ── API config ─────────────────────────────────────────────────────────────
const TOP100_COMPANIES = [
  {
    "name": "Palo Alto Networks India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "Prisma Cloud, CSPM, SOC, Network Security",
    "location": "Bangalore",
    "career_url": "https://jobs.paloaltonetworks.com/"
  },
  {
    "name": "CrowdStrike India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "Falcon EDR, Threat Hunting, Detection Eng, Golang",
    "location": "Pune / Remote",
    "career_url": "https://www.crowdstrike.com/careers/"
  },
  {
    "name": "Cloudflare India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "DDoS Defense, Edge Security, Systems Eng, Rust",
    "location": "Bangalore / Remote",
    "career_url": "https://www.cloudflare.com/careers/"
  },
  {
    "name": "Fortinet India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "FortiGate, Network Security, Firewall, Threat Intel",
    "location": "Bangalore",
    "career_url": "https://www.fortinet.com/corporate/careers"
  },
  {
    "name": "Trend Micro India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "XDR, Endpoint Security, Malware Analysis, Python",
    "location": "Bangalore, Mumbai",
    "career_url": "https://www.trendmicro.com/en_in/about/careers.html"
  },
  {
    "name": "SentinelOne India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Autonomous AI Cyber, EDR, SIEM, Threat Hunting",
    "location": "Bangalore / Remote",
    "career_url": "https://www.sentinelone.com/careers/"
  },
  {
    "name": "Zscaler India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "Zero Trust (ZTNA), Cloud Security, SASE, Systems",
    "location": "Bangalore, Chandigarh",
    "career_url": "https://www.zscaler.com/careers"
  },
  {
    "name": "Sophos India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "MDR, Threat Analysis, Firewall OS, C/C++",
    "location": "Ahmedabad, Bangalore",
    "career_url": "https://www.sophos.com/en-us/company/careers"
  },
  {
    "name": "Qualys India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "Vulnerability Management, VMDR, Cloud Security",
    "location": "Pune",
    "career_url": "https://www.qualys.com/company/careers/"
  },
  {
    "name": "Akamai Technologies India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "WAF, API Security, DDoS Mitigation, Linux",
    "location": "Bangalore",
    "career_url": "https://www.akamai.com/careers"
  },
  {
    "name": "Check Point India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "Threat Prevention, CloudGuard, Cyber Intelligence",
    "location": "Bangalore, Delhi",
    "career_url": "https://www.checkpoint.com/careers/"
  },
  {
    "name": "F5 Networks India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity",
      "cse"
    ],
    "hiring_roles": "AppSec, NGINX, API Security, Distributed Cloud",
    "location": "Hyderabad",
    "career_url": "https://www.f5.com/company/careers"
  },
  {
    "name": "Tenable India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "Nessus, Vulnerability Exposure, Cloud Security",
    "location": "Bangalore / Remote",
    "career_url": "https://www.tenable.com/careers"
  },
  {
    "name": "Rapid7 India",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "Metasploit, InsightIDR, SIEM, Penetration Testing",
    "location": "Bangalore / Remote",
    "career_url": "https://www.rapid7.com/about/careers/"
  },
  {
    "name": "Deloitte Cyber",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "SOC Specialist, Microsoft Sentinel, Incident Response",
    "location": "Hyderabad, Bangalore, Gurgaon",
    "career_url": "https://jobsindia.deloitte.com/"
  },
  {
    "name": "PwC India Cyber",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "DFIR, Threat Hunting, ISO 27001, Vulnerability Mgmt",
    "location": "Kolkata, Gurgaon, Bangalore",
    "career_url": "https://www.pwc.in/careers.html"
  },
  {
    "name": "EY India InfoSec",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "Threat Intelligence, IAM, Cloud Security, Cyber Risk",
    "location": "Gurgaon, Bangalore, Chennai",
    "career_url": "https://www.ey.com/en_in/careers"
  },
  {
    "name": "KPMG Cyber Security",
    "category": "Cyber & Cloud",
    "cat_key": "cyber",
    "domains": [
      "cybersecurity"
    ],
    "hiring_roles": "GRC, Penetration Testing, Red Teaming, VAPT",
    "location": "Mumbai, Bangalore, Gurgaon",
    "career_url": "https://kpmg.com/in/en/home/careers.html"
  },
  {
    "name": "Jio Platforms (Jio AI)",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml",
      "cse"
    ],
    "hiring_roles": "LLM Fine-tuning, NLP, GenAI, Speech AI, RAG",
    "location": "Mumbai, Navi Mumbai, Bangalore",
    "career_url": "https://careers.jio.com/"
  },
  {
    "name": "Mu Sigma",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Data Science, Machine Learning, Decision Analytics",
    "location": "Bangalore",
    "career_url": "https://www.mu-sigma.com/careers"
  },
  {
    "name": "Fractal Analytics",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "GenAI, Computer Vision, Deep Learning, MLOps",
    "location": "Mumbai, Bangalore, Gurgaon",
    "career_url": "https://fractal.ai/careers/"
  },
  {
    "name": "Tiger Analytics",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Data Science, Big Data, Predictive Modeling, Spark",
    "location": "Chennai, Bangalore, Hyderabad",
    "career_url": "https://www.tigeranalytics.com/careers/"
  },
  {
    "name": "LatentView Analytics",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Data Engineering, BI Analytics, Supply Chain ML",
    "location": "Chennai, Bangalore",
    "career_url": "https://www.latentview.com/careers/"
  },
  {
    "name": "Tata Elxsi",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml",
      "cse"
    ],
    "hiring_roles": "Autonomous AI, Computer Vision, Edge AI, CNN",
    "location": "Bangalore, Pune, Trivandrum",
    "career_url": "https://www.tataelxsi.com/careers"
  },
  {
    "name": "Quantiphi",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Google Vertex AI, AWS SageMaker, NLP, Transformers",
    "location": "Mumbai, Bangalore",
    "career_url": "https://quantiphi.com/careers/"
  },
  {
    "name": "Celebal Technologies",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml",
      "cse"
    ],
    "hiring_roles": "Azure OpenAI, Databricks, Big Data Engineering",
    "location": "Jaipur, Pune, Noida",
    "career_url": "https://celebaltech.com/careers"
  },
  {
    "name": "EXL Service Analytics",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Healthcare Analytics, Banking Risk ML, Python",
    "location": "Noida, Gurgaon, Bangalore",
    "career_url": "https://www.exlservice.com/careers"
  },
  {
    "name": "Genpact AI & Analytics",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "GenAI Workflows, ML Pipeline, Data Science",
    "location": "Gurgaon, Noida, Hyderabad",
    "career_url": "https://www.genpact.com/careers"
  },
  {
    "name": "Tredence",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Retail ML, Data Engineering, Python, Databricks",
    "location": "Bangalore",
    "career_url": "https://www.tredence.com/careers"
  },
  {
    "name": "Course5 Intelligence",
    "category": "AI & Analytics",
    "cat_key": "ai",
    "domains": [
      "aiml"
    ],
    "hiring_roles": "Customer AI, NLP Sentiment, Predictive Modeling",
    "location": "Mumbai, Bangalore",
    "career_url": "https://www.course5i.com/careers/"
  },
  {
    "name": "Nvidia AI India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "aiml",
      "cse"
    ],
    "hiring_roles": "CUDA, Deep Learning, TensorRT, LLM Optimization",
    "location": "Bangalore, Pune, Hyderabad",
    "career_url": "https://www.nvidia.com/en-us/about-nvidia/careers/"
  },
  {
    "name": "Microsoft Research India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "aiml",
      "cse"
    ],
    "hiring_roles": "AI Research, Transformers, Vision-Language, Algorithms",
    "location": "Bangalore",
    "career_url": "https://careers.microsoft.com/"
  },
  {
    "name": "Google Research India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "aiml",
      "cse"
    ],
    "hiring_roles": "Gemini, Multimodal AI, TensorFlow, AI for Social Good",
    "location": "Bangalore",
    "career_url": "https://www.google.com/about/careers/applications/jobs/results/?location=India"
  },
  {
    "name": "Google India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "SDE-1, Cloud, Android, Distributed Systems, ML",
    "location": "Bangalore, Hyderabad, Gurgaon",
    "career_url": "https://www.google.com/about/careers/applications/jobs/results/?location=India"
  },
  {
    "name": "Microsoft India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Software Engineer, Azure, Copilot AI, Security",
    "location": "Bangalore, Hyderabad, Noida",
    "career_url": "https://careers.microsoft.com/"
  },
  {
    "name": "Amazon India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "SDE-1, AWS Cloud, Applied Scientist, InfoSec",
    "location": "Bangalore, Hyderabad, Chennai",
    "career_url": "https://www.amazon.jobs/en/teams/in"
  },
  {
    "name": "Cisco Systems India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Networking, Firewalls, Cloud SRE, Python, C++",
    "location": "Bangalore",
    "career_url": "https://jobs.cisco.com/"
  },
  {
    "name": "Adobe India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Computer Graphics, GenAI (Firefly), Full Stack Web",
    "location": "Noida, Bangalore",
    "career_url": "https://www.adobe.com/careers.html"
  },
  {
    "name": "Oracle India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "OCI Cloud, Database Internals, Java, Identity Cloud",
    "location": "Bangalore, Hyderabad, Pune",
    "career_url": "https://www.oracle.com/corporate/careers/"
  },
  {
    "name": "Apple India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "iOS/Swift, Siri AI, Cloud Infrastructure, Maps",
    "location": "Bangalore, Hyderabad",
    "career_url": "https://www.apple.com/careers/in/"
  },
  {
    "name": "Intel India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "VLSI, Firmware, OpenVINO AI, Linux Kernel, C++",
    "location": "Bangalore, Hyderabad",
    "career_url": "https://jobs.intel.com/en"
  },
  {
    "name": "Qualcomm India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Snapdragon Systems, Embedded Linux, RTOS, 5G",
    "location": "Hyderabad, Bangalore, Chennai",
    "career_url": "https://www.qualcomm.com/company/careers"
  },
  {
    "name": "Salesforce India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Einstein AI, SaaS Microservices, Java, React",
    "location": "Hyderabad, Bangalore, Mumbai",
    "career_url": "https://salesforce.com/company/careers/"
  },
  {
    "name": "Uber India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "High-Throughput Golang, Maps ML, Distributed Backend",
    "location": "Hyderabad, Bangalore",
    "career_url": "https://www.uber.com/in/en/careers/"
  },
  {
    "name": "Atlassian India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Jira/Confluence Cloud, React, Java, Security",
    "location": "Bangalore / Remote",
    "career_url": "https://www.atlassian.com/company/careers"
  },
  {
    "name": "LinkedIn India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Graph DBs, Feed Ranking ML, Kafka, SDE",
    "location": "Bangalore, Mumbai",
    "career_url": "https://careers.linkedin.com/"
  },
  {
    "name": "SAP Labs India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Enterprise Cloud, HANA, Business AI, ABAP/Java",
    "location": "Bangalore, Pune, Gurgaon",
    "career_url": "https://jobs.sap.com/"
  },
  {
    "name": "VMware / Broadcom",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Virtualization, Kubernetes, NSX Security, Kernel",
    "location": "Bangalore, Pune",
    "career_url": "https://careers.broadcom.com/"
  },
  {
    "name": "Intuit India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "TurboTax AI, FinTech Cloud, Java, React, Microservices",
    "location": "Bangalore",
    "career_url": "https://www.intuit.com/careers/"
  },
  {
    "name": "PayPal India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Payments Engine, Fraud ML, AppSec, High Scale Java",
    "location": "Chennai, Bangalore, Hyderabad",
    "career_url": "https://careers.pypl.com/"
  },
  {
    "name": "IBM India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "watsonx GenAI, Red Hat OpenShift, QRadar SIEM",
    "location": "Bangalore, Hyderabad, Pune",
    "career_url": "https://www.ibm.com/in-en/employment/"
  },
  {
    "name": "AMD India",
    "category": "MNC Tech Giant",
    "cat_key": "mnc",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "ROCm AI Stack, GPU Drivers, Hardware Systems",
    "location": "Bangalore, Hyderabad",
    "career_url": "https://www.amd.com/en/corporate/careers.html"
  },
  {
    "name": "Tata Consultancy Services (TCS)",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Digital Ninja/Prime, SOC Analyst L1, Cloud AWS, Java",
    "location": "Pan-India",
    "career_url": "https://ibegin.tcs.com/iBegin/jobs/search"
  },
  {
    "name": "Infosys",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Specialist Programmer, DFIR, GenAI Topaz, Full Stack",
    "location": "Bangalore, Pune, Hyderabad, Chennai",
    "career_url": "https://career.infosys.com/"
  },
  {
    "name": "Wipro",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Turbo / Elite, VAPT Web, ai360, Cloud DevOps",
    "location": "Bangalore, Hyderabad, Pune, Chennai",
    "career_url": "https://careers.wipro.com/careers-home"
  },
  {
    "name": "HCLTech",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Graduate Trainee, Cloud Security, C++, Linux, AI Force",
    "location": "Noida, Bangalore, Chennai, Pune",
    "career_url": "https://www.hcltech.com/careers"
  },
  {
    "name": "Tech Mahindra",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Threat Intel, 5G Telecom Software, Java, Python",
    "location": "Pune, Mumbai, Hyderabad, Bangalore",
    "career_url": "https://careers.techmahindra.com/"
  },
  {
    "name": "LTIMindtree",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Data Engineering, Snowflake, Full Stack, InfoSec",
    "location": "Mumbai, Bangalore, Pune, Chennai",
    "career_url": "https://www.ltimindtree.com/careers/"
  },
  {
    "name": "Cognizant",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "GenC Elevate/Next, AppSec, React, Python, Cloud",
    "location": "Chennai, Bangalore, Hyderabad, Pune",
    "career_url": "https://careers.cognizant.com/global/en"
  },
  {
    "name": "Capgemini",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Cloud DevOps, Systems Admin, Cyber Defense, Java",
    "location": "Mumbai, Pune, Bangalore, Hyderabad",
    "career_url": "https://www.capgemini.com/in-en/careers/"
  },
  {
    "name": "Accenture",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Advanced ASE, InfoSec Analyst, Cloud AWS, GenAI",
    "location": "Bangalore, Hyderabad, Gurgaon, Pune",
    "career_url": "https://www.accenture.com/in-en/careers"
  },
  {
    "name": "Persistent Systems",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Full Stack MERN, Cloud Platforms, AI Engineering",
    "location": "Pune, Hyderabad, Bangalore",
    "career_url": "https://www.persistent.com/careers/"
  },
  {
    "name": "Coforge",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Travel & Banking Tech, Microservices, Data Science",
    "location": "Noida, Bangalore, Hyderabad",
    "career_url": "https://www.coforge.com/careers"
  },
  {
    "name": "Hexaware Technologies",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Automate Anything, Cloud App Modernization, Java",
    "location": "Mumbai, Chennai, Bangalore, Pune",
    "career_url": "https://hexaware.com/careers/"
  },
  {
    "name": "Mphasis",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "NextLabs AI, Financial Services Tech, Cloud DevOps",
    "location": "Bangalore, Pune, Chennai",
    "career_url": "https://careers.mphasis.com/"
  },
  {
    "name": "Birlasoft",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Enterprise Digital, SAP Cloud, Python Analytics",
    "location": "Pune, Noida, Bangalore",
    "career_url": "https://www.birlasoft.com/careers"
  },
  {
    "name": "KPIT Technologies",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Automotive Software, AUTOSAR, ADAS AI, Embedded C",
    "location": "Pune, Bangalore",
    "career_url": "https://www.kpit.com/careers/"
  },
  {
    "name": "Cyient",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Intelligent Engineering, OT/IoT Security, Embedded",
    "location": "Hyderabad, Bangalore",
    "career_url": "https://careers.cyient.com/"
  },
  {
    "name": "Tata Technologies",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "EV Platforms, Digital Twin AI, Automotive C++",
    "location": "Pune, Bangalore",
    "career_url": "https://www.tatatechnologies.com/careers/"
  },
  {
    "name": "Sonata Software",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Modernization, Microsoft Cloud, Data Analytics",
    "location": "Bangalore, Hyderabad",
    "career_url": "https://www.sonata-software.com/careers"
  },
  {
    "name": "Zensar Technologies",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Experience Tech, Cloud Native Backend, AI/ML",
    "location": "Pune, Hyderabad, Bangalore",
    "career_url": "https://www.zensar.com/careers"
  },
  {
    "name": "L&T Technology Services (LTTS)",
    "category": "IT Titan",
    "cat_key": "it",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Industrial Cybersecurity, Telecom 5G, Smart Systems",
    "location": "Vadodara, Bangalore, Chennai",
    "career_url": "https://www.ltts.com/careers"
  },
  {
    "name": "Flipkart",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "SDE-1, Data Analyst, Recommendation AI, AppSec",
    "location": "Bangalore",
    "career_url": "https://www.flipkartcareers.com/"
  },
  {
    "name": "Swiggy",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Data Engineer (Spark/Kafka), Logistics ML, Backend",
    "location": "Bangalore / Remote",
    "career_url": "https://careers.swiggy.com/"
  },
  {
    "name": "Zomato",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Frontend React, GenAI Trainee, High Scale Node.js",
    "location": "Gurgaon / Remote",
    "career_url": "https://www.zomato.com/careers"
  },
  {
    "name": "PhonePe",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Flutter Mobile, Distributed Java/HBase, Fraud ML",
    "location": "Bangalore, Pune",
    "career_url": "https://www.phonepe.com/careers/"
  },
  {
    "name": "Razorpay",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Product Security, Payments Backend Golang, FinTech ML",
    "location": "Bangalore",
    "career_url": "https://razorpay.com/jobs/"
  },
  {
    "name": "CRED",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Decision Science, AppSec, Backend SDE, iOS/Android",
    "location": "Bangalore",
    "career_url": "https://cred.club/careers"
  },
  {
    "name": "Meesho",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "BI Analyst, Search & Discovery ML, Java Backend",
    "location": "Bangalore",
    "career_url": "https://www.meesho.io/jobs"
  },
  {
    "name": "Zepto",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Golang Backend, Prompt Eng / GenAI, Fast Logistics ML",
    "location": "Mumbai, Bangalore",
    "career_url": "https://www.zeptonow.com/careers"
  },
  {
    "name": "Paytm",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Backend Java/Spring, InfoSec, Risk AI, Payments",
    "location": "Noida, Bangalore",
    "career_url": "https://paytm.com/careers"
  },
  {
    "name": "InMobi",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "MLOps, AdTech High Scale, Glance Content AI",
    "location": "Bangalore",
    "career_url": "https://www.inmobi.com/company/careers/"
  },
  {
    "name": "Groww",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "FinTech SDE, Trading Engine Microservices, Analytics",
    "location": "Bangalore",
    "career_url": "https://groww.in/careers"
  },
  {
    "name": "Zerodha",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse"
    ],
    "hiring_roles": "FOSS, Kite Trading Platform, Python/Go, PostgreSQL",
    "location": "Bangalore",
    "career_url": "https://zerodha.com/careers"
  },
  {
    "name": "Urban Company",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Marketplace Algorithms, Full Stack Web, Mobile SDE",
    "location": "Gurgaon",
    "career_url": "https://www.urbancompany.com/careers"
  },
  {
    "name": "Nykaa",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "E-Commerce SDE, Computer Vision Try-on, Data Eng",
    "location": "Mumbai, Gurgaon",
    "career_url": "https://www.nykaa.com/careers"
  },
  {
    "name": "Blinkit",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "10-min Supply Chain Tech, Node.js, Route Optimization",
    "location": "Gurgaon",
    "career_url": "https://blinkit.com/careers"
  },
  {
    "name": "Ola",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Krutrim GenAI, Ola Electric Firmware, Fleet Routing",
    "location": "Bangalore",
    "career_url": "https://www.olacabs.com/careers"
  },
  {
    "name": "BharatPe",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Merchant Payments SDE, AppSec, Golang, AWS",
    "location": "Delhi NCR, Bangalore",
    "career_url": "https://bharatpe.com/careers"
  },
  {
    "name": "Dream11",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Sports Tech High Concurrency, Realtime Leaderboards",
    "location": "Mumbai",
    "career_url": "https://careers.dream11.com/"
  },
  {
    "name": "Postman",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse"
    ],
    "hiring_roles": "API Platform, Electron/Desktop, Node.js, Cloud",
    "location": "Bangalore / Remote",
    "career_url": "https://www.postman.com/company/careers/"
  },
  {
    "name": "BrowserStack",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Cloud Testing Infra, Device Cloud, Systems, Security",
    "location": "Mumbai / Remote",
    "career_url": "https://www.browserstack.com/careers"
  },
  {
    "name": "Freshworks",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Freddy AI, SaaS Backend Ruby/Java, Frontend React",
    "location": "Chennai, Bangalore",
    "career_url": "https://www.freshworks.com/company/careers/"
  },
  {
    "name": "Delhivery",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Logistics Big Data, Geo-Spatial ML, Python, Erlang",
    "location": "Gurgaon, Bangalore",
    "career_url": "https://www.delhivery.com/careers"
  },
  {
    "name": "Cars24",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Used Car Pricing AI, Computer Vision Inspection",
    "location": "Gurgaon, Bangalore",
    "career_url": "https://www.cars24.com/careers/"
  },
  {
    "name": "PolicyBazaar",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "InsurTech SDE, Conversational AI, React Native",
    "location": "Gurgaon",
    "career_url": "https://www.policybazaar.com/careers/"
  },
  {
    "name": "MakeMyTrip",
    "category": "Unicorn & Consumer",
    "cat_key": "unicorn",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Travel Tech, Dynamic Pricing ML, Android/iOS, Java",
    "location": "Gurgaon, Bangalore",
    "career_url": "https://careers.makemytrip.com/"
  },
  {
    "name": "Goldman Sachs India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Quant Engineering, Core Strats, Cloud & Cyber Defense",
    "location": "Bangalore, Hyderabad",
    "career_url": "https://www.goldmansachs.com/careers/"
  },
  {
    "name": "Morgan Stanley India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Low Latency Java/C++, Trading Systems, Predictive ML",
    "location": "Mumbai, Bangalore",
    "career_url": "https://www.morganstanley.com/about-us/careers"
  },
  {
    "name": "JPMorgan Chase India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Software Engineer, Threat Hunting, Big Data Analytics",
    "location": "Bangalore, Hyderabad, Mumbai",
    "career_url": "https://careers.jpmorgan.com/"
  },
  {
    "name": "Barclays India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Card Platforms, Open Banking APIs, Cyber SOC",
    "location": "Pune, Chennai, Noida",
    "career_url": "https://search.jobs.barclays/"
  },
  {
    "name": "American Express India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml",
      "cybersecurity"
    ],
    "hiring_roles": "Risk Decisioning ML, Payments Core Java, Cyber",
    "location": "Gurgaon, Bangalore",
    "career_url": "https://www.americanexpress.com/en-in/careers/"
  },
  {
    "name": "Wells Fargo India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Banking Microservices, Kafka Data Pipelines, Cloud",
    "location": "Hyderabad, Bangalore",
    "career_url": "https://www.wellsfargojobs.com/"
  },
  {
    "name": "BNY Mellon India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Asset Custody Tech, Python Financial Analytics",
    "location": "Pune, Chennai",
    "career_url": "https://jobs.bnymellon.com/"
  },
  {
    "name": "D.E. Shaw India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Quantitative Analyst, Systems Architecture, High Perf C++",
    "location": "Hyderabad",
    "career_url": "https://www.deshawindia.com/careers"
  },
  {
    "name": "Fidelity Investments India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Retirement Cloud Platforms, DevSecOps, Java/Angular",
    "location": "Bangalore, Chennai",
    "career_url": "https://india.fidelity.com/careers/"
  },
  {
    "name": "Standard Chartered GBS",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Global Core Banking, Cyber Defense, AWS/Azure Cloud",
    "location": "Chennai, Bangalore",
    "career_url": "https://www.sc.com/en/careers/"
  },
  {
    "name": "NatWest Group India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Customer Journeys, Data Science, Full Stack Java",
    "location": "Gurgaon, Chennai, Bangalore",
    "career_url": "https://jobs.natwestgroup.com/"
  },
  {
    "name": "Citi India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "Treasury Tech, Cyber Security Operations, SDE",
    "location": "Pune, Chennai, Mumbai",
    "career_url": "https://jobs.citi.com/"
  },
  {
    "name": "HSBC Technology India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "aiml"
    ],
    "hiring_roles": "Commercial Banking Cloud, Python Analytics, DevOps",
    "location": "Pune, Hyderabad",
    "career_url": "https://www.hsbc.com/careers"
  },
  {
    "name": "Mastercard India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity",
      "aiml"
    ],
    "hiring_roles": "Transaction Processing, Fraud AI, Cyber & Intelligence",
    "location": "Pune, Gurgaon, Vadodara",
    "career_url": "https://careers.mastercard.com/"
  },
  {
    "name": "Visa India",
    "category": "FinTech & Banking",
    "cat_key": "fintech",
    "domains": [
      "cse",
      "cybersecurity"
    ],
    "hiring_roles": "VisaNet High Availability, Payments Tokenization, Sec",
    "location": "Bangalore",
    "career_url": "https://corporate.visa.com/en/careers.html"
  }
];

const GEMINI_MODEL    = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Persist API key ────────────────────────────────────────────────────────
function getKey()     { return localStorage.getItem('hiressu_key') || ''; }
function setKey(k)    { localStorage.setItem('hiressu_key', k); }

function updateKeyUI(hasKey) {
  if (hasKey) {
    keyDot.className = 'key-dot active';
    keyBtnLabel.textContent = '🤖 Live AI Active ✓';
    keyBtn.classList.add('active');
  } else {
    keyDot.className = 'key-dot free-mode';
    keyBtnLabel.textContent = '⚡ Free Mode (Add AI Key)';
    keyBtn.classList.remove('active');
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  toastRoot.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

// ── HTML escape ────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Domain classifier ─────────────────────────────────────────────────────
const CYBER_KW  = /soc|siem|edr|dfir|forensic|incident|vulnerability|penetrat|vapt|red team|blue team|purple|threat hunt|detection engineer|soar|devsecops|zero trust|iam|ot\/ics|scada|malware|reverse engineer|grc|appsec|cloud secur|bug bounty|phish|exploit|cybersec|security analyst|information security/i;
const AIML_KW   = /machine learning|deep learning|computer vision|nlp|llm|generative ai|rag|ai agent|prompt engineer|edge ai|tinyml|mlops|reinforcement learning|data scientist|data analyst|business intelligence|bi analyst|data engineer|big data|kafka|spark|lakehouse|delta lake|analytics engineer|ai research|multimodal/i;
const CSE_KW    = /software engineer|sde|backend|frontend|full stack|mobile app|android|ios|flutter|react native|devops|kubernetes|docker|cloud engineer|aws|gcp|azure|sre|platform engineer|gitops|finops|terraform|embedded|iot|vlsi|firmware|kernel|networks|quantum|robotics|wasm|blockchain|web3|game developer|ar\/vr|microservice|api developer|competitive programming/i;

function classifyJob(job) {
  const hay = `${job.title} ${job.domain} ${(job.skills||[]).join(' ')}`;
  if (CYBER_KW.test(hay)) return 'cybersecurity';
  if (AIML_KW.test(hay))  return 'aiml';
  if (CSE_KW.test(hay))   return 'cse';
  return 'cse';
}

// ── Domain avatar emoji ────────────────────────────────────────────────────
const EMOJI_MAP = [
  [/soc|siem/i,'📡'], [/edr|endpoint/i,'🔍'], [/dfir|forensic/i,'🔬'],
  [/threat hunt|cti|intel/i,'🧠'], [/penetrat|pt\b/i,'💣'],
  [/vapt|burp|owasp/i,'🔓'], [/bug bounty/i,'💰'], [/phish|social eng/i,'🎭'],
  [/exploit|vuln res/i,'🔐'], [/active directory/i,'🏰'], [/purple/i,'🟣'],
  [/detection eng|sigma/i,'🔭'], [/soar/i,'⚡'], [/devsecops/i,'🔄'],
  [/zero trust|ztna/i,'🛡️'], [/iam\b|identity/i,'🪪'], [/ot\/ics|scada/i,'🏭'],
  [/malware|reverse/i,'🦠'], [/grc|compliance/i,'📋'], [/appsec|sast|dast/i,'🛠️'],
  [/cloud secur|cspm/i,'☁️'], [/cyber/i,'🔐'],
  [/machine learning|ml\b/i,'🤖'], [/deep learning/i,'🧠'], [/computer vision/i,'👁️'],
  [/nlp|language/i,'💬'], [/generat|llm|gpt/i,'✨'], [/rag\b|langchain/i,'📚'],
  [/ai agent|agentic/i,'🕵️'], [/prompt eng/i,'💡'], [/edge ai|tinyml/i,'⚡'],
  [/mlops|ai infra/i,'⚙️'], [/ai research|ai safety/i,'🔬'], [/robotics ai/i,'🦾'],
  [/data scientist/i,'📊'], [/data analyst/i,'📈'], [/bi\b|business intel/i,'💡'],
  [/data engineer|etl/i,'🔧'], [/big data|spark|kafka/i,'⚡'],
  [/lakehouse|delta/i,'🏞️'], [/data architect/i,'🏛️'], [/dba|database admin/i,'🗄️'],
  [/sde|software eng/i,'💻'], [/backend/i,'⚙️'], [/frontend/i,'🎨'],
  [/full stack/i,'🌐'], [/mobile|android|ios|flutter/i,'📱'],
  [/api |microservice/i,'🔗'], [/game dev/i,'🎮'],
  [/cloud eng|aws|gcp|azure/i,'☁️'], [/devops/i,'🔄'], [/sre\b/i,'🛡️'],
  [/platform eng/i,'🏗️'], [/gitops|argocd/i,'🔀'], [/finops/i,'💰'],
  [/terraform|iac/i,'📝'], [/embedded|iot/i,'⚡'], [/kernel|os\b/i,'🖥️'],
  [/network/i,'🔌'], [/vlsi|chip|fpga/i,'🔬'], [/firmware/i,'🔩'],
  [/ar\/vr|xr\b|vison pro/i,'🥽'], [/quantum/i,'⚛️'], [/robotics\b|ros\b/i,'🤖'],
  [/wasm|webassembly/i,'🕸️'], [/blockchain|web3|solidity/i,'⛓️'],
  [/competitive prog/i,'🏆'], [/research eng/i,'🔭'],
  [/product manager|tpm/i,'📊'], [/devrel|developer advo/i,'🎙️'],
];

function getEmoji(job) {
  const hay = `${job.title} ${job.domain} ${(job.skills||[]).join(' ')}`;
  for (const [rx, em] of EMOJI_MAP) if (rx.test(hay)) return em;
  return '🏢';
}

// ── Build apply URL ────────────────────────────────────────────────────────
function buildApplyUrl(job) {
  if (job.apply_url && job.apply_url.startsWith('http')) return job.apply_url;
  const q = encodeURIComponent(`"${job.title}" "${job.company}" job apply`);
  return `https://www.google.com/search?q=${q}&ibp=htl;jobs`;
}

// ── Render skeleton grid ───────────────────────────────────────────────────
function showSkeletons() {
  const g = document.createElement('div');
  g.className = 'skeleton-grid';
  for (let i = 0; i < 9; i++) g.innerHTML += `
    <div class="skeleton-card">
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div class="sk" style="width:46px;height:46px;border-radius:13px;flex-shrink:0;margin:0"></div>
        <div style="flex:1">
          <div class="sk" style="height:15px;width:80%;margin-bottom:8px"></div>
          <div class="sk" style="height:11px;width:50%;margin:0"></div>
        </div>
      </div>
      <div class="sk" style="height:11px;width:90%;margin-bottom:7px"></div>
      <div class="sk" style="height:11px;width:65%;margin-bottom:14px"></div>
      <div style="display:flex;gap:7px;margin-bottom:14px">
        <div class="sk" style="height:22px;width:70px;border-radius:999px;margin:0"></div>
        <div class="sk" style="height:22px;width:70px;border-radius:999px;margin:0"></div>
        <div class="sk" style="height:22px;width:60px;border-radius:999px;margin:0"></div>
      </div>
      <div class="sk" style="height:36px;border-radius:10px;margin:0"></div>
    </div>`;
  jobsArea.innerHTML = '';
  jobsArea.appendChild(g);
}

// ── Render a single card (entire card is a link) ───────────────────────────
function renderCard(job, idx) {
  const domain    = job._domain || classifyJob(job);
  const emoji     = getEmoji(job);
  const applyUrl  = buildApplyUrl(job);
  const skills    = (job.skills || []).slice(0, 5);

  // domain colour class
  const domCls = { cybersecurity:'cyber', aiml:'aiml', cse:'cse' }[domain] || 'all';
  const avCls  = `${domCls}-av`;
  const badgeCls = `badge-${domCls}`;
  const domLabel = { cybersecurity:'🔐 Cyber', aiml:'🤖 AI/ML & DS', cse:'💻 CSE' }[domain] || '';

  // experience badge text
  const expRaw = (job.experience || '').toLowerCase();
  let expLabel = 'Fresher';
  if (/1[\-–]3|junior/i.test(expRaw))  expLabel = '1–3 yrs';
  else if (/3[\-–]5|mid/i.test(expRaw)) expLabel = '3–5 yrs';
  else if (/5\+|senior/i.test(expRaw))  expLabel = '5+ yrs';

  const a = document.createElement('a');
  a.className = 'job-card';
  a.href      = applyUrl;
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.title     = `${job.title} at ${job.company} — click to apply`;
  a.dataset.company = (job.company || '').toLowerCase();
  a.dataset.domain  = domain;
  a.dataset.exp     = expRaw;
  a.dataset.location= (job.location || '').toLowerCase();
  a.dataset.skills  = (job.skills || []).join(' ').toLowerCase();
  a.dataset.salary  = job.salary || '';
  a.style.animationDelay = `${idx * 45}ms`;
  a.style.textDecoration = 'none';

  a.innerHTML = `
    <div class="card-strip ${domCls}"></div>
    <div class="card-top">
      <div class="company-avatar ${avCls}">${emoji}</div>
      <div class="card-badges">
        <span class="badge badge-new">✦ New</span>
        <span class="badge badge-dom ${badgeCls}">${domLabel}</span>
      </div>
    </div>
    <div class="job-title">${esc(job.title || 'Engineering Role')}</div>
    <div class="company-name">${esc(job.company || 'Top Company')}</div>
    <div class="meta-row">
      <span class="meta-chip">📍 ${esc(job.location || 'India')}</span>
      <span class="meta-chip">💼 ${esc(expLabel)}</span>
      ${job.salary ? `<span class="meta-chip salary">💰 ${esc(job.salary)}</span>` : ''}
    </div>
    ${skills.length ? `
    <div class="skills-row">
      ${skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}
    </div>` : ''}
    <div class="apply-link">Apply Now &nbsp;→</div>
  `;

  a.addEventListener('click', (e) => {
    if (applyUrl && applyUrl.startsWith('http')) {
      try {
        const w = window.open(applyUrl, '_blank', 'noopener,noreferrer');
        if (!w || w.closed || typeof w.closed === 'undefined') {
          window.location.href = applyUrl;
        }
      } catch (err) {
        window.location.href = applyUrl;
      }
      e.preventDefault();
    }
  });

  return a;
}

// ── Render jobs ────────────────────────────────────────────────────────────
function renderJobs(jobs) {
  jobsArea.innerHTML = '';

  if (!jobs.length) {
    jobsArea.innerHTML = `
      <div class="empty-state">
        <div class="ei">🔍</div>
        <h3>No matching jobs</h3>
        <p>Try removing some filters or use a different search keyword.</p>
      </div>`;
    showingCount.textContent = 0;
    sortBar.hidden = true;
    return;
  }

  const grid = document.createElement('div');
  grid.id = 'jobs-grid';
  jobs.forEach((j, i) => grid.appendChild(renderCard(j, i)));
  jobsArea.appendChild(grid);

  showingCount.textContent = jobs.length;
  sortBar.hidden = false;
}

// ── Build sidebar skill & company chips from current allJobs ───────────────
function buildSidebarChips() {
  // Top skills
  const skillMap = {};
  allJobs.forEach(j => (j.skills || []).forEach(s => {
    const k = s.trim();
    if (k) skillMap[k] = (skillMap[k] || 0) + 1;
  }));
  const topSkills = Object.entries(skillMap)
    .sort((a,b) => b[1]-a[1]).slice(0, 14).map(([s]) => s);

  if (topSkills.length) {
    skillsChips.innerHTML = topSkills.map(s =>
      `<span class="fchip skill" data-filter="skill" data-val="${esc(s.toLowerCase())}">${esc(s)}</span>`
    ).join('');
    skillsSection.hidden = false;
    skillsChips.querySelectorAll('[data-filter="skill"]').forEach(c =>
      c.addEventListener('click', () => handleSkillChip(c))
    );
  }

  // Top companies
  const compSet = {};
  allJobs.forEach(j => {
    const k = (j.company || '').trim();
    if (k) compSet[k] = (compSet[k] || 0) + 1;
  });
  const topComps = Object.entries(compSet)
    .sort((a,b) => b[1]-a[1]).slice(0, 12).map(([c]) => c);

  if (topComps.length) {
    companyChips.innerHTML = topComps.map(c =>
      `<span class="fchip company" data-filter="company" data-val="${esc(c.toLowerCase())}">${esc(c)}</span>`
    ).join('');
    companySection.hidden = false;
    companyChips.querySelectorAll('[data-filter="company"]').forEach(c =>
      c.addEventListener('click', () => handleCompanyChip(c))
    );
  }
}

// ── Apply all active filters ───────────────────────────────────────────────
function applyFilters() {
  if (activeDomain === 'top100') {
    renderTop100Directory();
    return;
  }
  let jobs = [...allJobs];

  // Domain tab
  if (activeDomain !== 'all') jobs = jobs.filter(j => j._domain === activeDomain);

  // Experience
  if (activeExp !== 'all') {
    jobs = jobs.filter(j => {
      const e = (j.experience || '').toLowerCase();
      if (activeExp === 'fresher') return /fresher|0[\-–]1|0-1|entry/i.test(e);
      if (activeExp === 'junior')  return /1[\-–]3|junior/i.test(e);
      if (activeExp === 'mid')     return /3[\-–]5|mid/i.test(e);
      return true;
    });
  }

  // Location
  if (activeLoc !== 'all') {
    jobs = jobs.filter(j => {
      const l = (j.location || '').toLowerCase();
      if (activeLoc === 'remote')     return /remote|wfh|work from home/i.test(l);
      if (activeLoc === 'bangalore')  return l.includes('bangalore') || l.includes('bengaluru');
      if (activeLoc === 'hyderabad')  return l.includes('hyderabad');
      if (activeLoc === 'mumbai')     return l.includes('mumbai');
      if (activeLoc === 'delhi')      return l.includes('delhi') || l.includes('ncr') || l.includes('gurgaon') || l.includes('noida');
      if (activeLoc === 'pune')       return l.includes('pune');
      if (activeLoc === 'chennai')    return l.includes('chennai');
      return true;
    });
  }

  // Skill chip
  if (activeSkill) {
    jobs = jobs.filter(j =>
      (j.skills || []).some(s => s.toLowerCase().includes(activeSkill))
    );
  }

  // Company chip
  if (activeCompany) {
    jobs = jobs.filter(j => (j.company || '').toLowerCase().includes(activeCompany));
  }

  // Global search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    jobs = jobs.filter(j => {
      const hay = `${j.title} ${j.company} ${j.location} ${j.domain} ${(j.skills||[]).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Sort
  const sv = sortSelect.value;
  if (sv === 'company') jobs.sort((a,b) => (a.company||'').localeCompare(b.company||''));
  if (sv === 'salary')  jobs.sort((a,b) => parseSalary(b.salary) - parseSalary(a.salary));

  filteredJobs = jobs;
  renderJobs(jobs);
  updateActiveFiltersBar();
}

function parseSalary(s) {
  if (!s) return 0;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

// ── Active filters bar ─────────────────────────────────────────────────────
function updateActiveFiltersBar() {
  const chips = [];
  if (activeDomain !== 'all') chips.push({ label: `Domain: ${activeDomain}`, remove: () => { activeDomain='all'; $$('.dtab').forEach(t => t.classList.toggle('active', t.dataset.domain==='all')); applyFilters(); } });
  if (activeExp    !== 'all') chips.push({ label: `Exp: ${activeExp}`,    remove: () => { activeExp='all'; setChip(expChips,'all'); applyFilters(); } });
  if (activeLoc    !== 'all') chips.push({ label: `Loc: ${activeLoc}`,    remove: () => { activeLoc='all'; setChip(locChips,'all'); applyFilters(); } });
  if (activeSkill)            chips.push({ label: `Skill: ${activeSkill}`, remove: () => { activeSkill=''; $$('[data-filter="skill"]').forEach(c=>c.classList.remove('active')); applyFilters(); } });
  if (activeCompany)          chips.push({ label: `Co: ${activeCompany}`,  remove: () => { activeCompany=''; $$('[data-filter="company"]').forEach(c=>c.classList.remove('active')); applyFilters(); } });
  if (searchQuery)            chips.push({ label: `"${searchQuery}"`,       remove: () => { searchQuery=''; globalSearch.value=''; clearSearch.classList.remove('visible'); applyFilters(); } });

  if (!chips.length) { activeFilters.hidden = true; return; }
  activeFilters.hidden = false;
  afChips.innerHTML = chips.map((c,i) =>
    `<span class="af-chip">${esc(c.label)}<button data-ci="${i}">✕</button></span>`
  ).join('');
  afChips.querySelectorAll('button').forEach(b =>
    b.addEventListener('click', () => chips[+b.dataset.ci].remove())
  );
}

function setChip(nodeList, val) {
  nodeList.forEach(c => c.classList.toggle('active', c.dataset.val === val));
}

// ── AI Prompt builder ──────────────────────────────────────────────────────
const DOMAIN_PROMPTS = {
  cybersecurity: `
Find 12–15 latest Cybersecurity job openings in India (2025/2026) for B.Tech freshers and 1-3 year experience:
Blue Teaming (SOC Analyst, SIEM Engineer, EDR Analyst, DFIR, Threat Intelligence, IR),
Red Teaming (VAPT Web, VAPT Mobile, VAPT API, PT, Bug Bounty, Exploit Developer),
Purple Teaming (Detection Engineering, SOAR, Threat Hunting, Adversary Simulation),
and other roles (DevSecOps, Zero Trust, IAM, AppSec, Malware Analyst, Cloud Security, GRC).`,

  aiml: `
Find 12–15 latest AI/ML & Data Science job openings in India (2025/2026) for B.Tech freshers and 1-3 year experience:
AI/ML roles (ML Engineer, Deep Learning, NLP, Computer Vision, GenAI, LLM Fine-tuning, RAG Engineer, AI Agent Developer, Prompt Engineer, Edge AI, MLOps, AI Research),
Data Science (Data Scientist, Data Analyst, BI Analyst, Product Analyst, Analytics Engineer),
and Data Engineering (Data Engineer, Big Data/Spark, Real-time Streaming/Kafka, Lakehouse/Delta Lake, DBA).`,

  cse: `
Find 12–15 latest CSE Core / Software Engineering job openings in India (2025/2026) for B.Tech freshers and 1-3 year experience:
Software Development (SDE/DSA, Backend, Frontend, Full Stack, Mobile/Flutter, API/Microservices, Game Dev),
Cloud & DevOps (Cloud Engineer AWS/GCP/Azure, DevOps, SRE, Platform Engineer, GitOps, FinOps, IaC/Terraform),
Systems (Embedded, IoT, VLSI, Firmware, Networks, Kernel),
and Emerging Tech (AR/VR, Quantum, Robotics/ROS2, WASM, Blockchain/Web3).`,
};

function buildPrompt(domainKey) {
  return `You are an expert Indian job search AI agent for B.Tech graduates.
${DOMAIN_PROMPTS[domainKey]}

Search the LIVE web (LinkedIn, Naukri, Indeed, company career pages, Glassdoor, Internshala, Angel.co) RIGHT NOW.

Return ONLY a valid JSON object — no markdown, no explanation, raw JSON only:

{
  "summary": "2–3 sentence market insight for these roles in India as of today",
  "jobs": [
    {
      "title": "Exact job title as posted on the platform",
      "company": "Company name",
      "location": "City, India  OR  Remote",
      "experience": "e.g. Fresher, 0–1 years, 1–3 years",
      "salary": "e.g. ₹6–10 LPA  or null if not mentioned",
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
      "apply_url": "DIRECT URL to the exact job post on LinkedIn/Naukri/company site (must start with https://)",
      "domain": "specific role category e.g. SOC Analyst, ML Engineer, SDE"
    }
  ]
}

IMPORTANT: apply_url must be a REAL direct link to the job post or company careers page. Do NOT use Google search links.`;
}

// ── Gemini API call ────────────────────────────────────────────────────────
async function fetchJobs(apiKey, domainKey) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(domainKey) }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.7 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.map(p => p.text||'').join('') || '';

  if (!raw) throw new Error(`No response for ${domainKey} domain`);

  // strip markdown fences if any
  const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`Could not parse ${domainKey} response`);
    parsed = JSON.parse(m[0]);
  }

  const jobs = (parsed?.jobs || []).map(j => ({
    ...j,
    _domain:  domainKey,
    _summary: parsed.summary || '',
  }));

  return { jobs, summary: parsed.summary || '' };
}

// ── Free Mode: Load Curated Verified Jobs ──────────────────────────────────
function loadVerifiedJobs() {
  allJobs = JSON.parse(JSON.stringify(VERIFIED_JOBS));
  domainSummaries = {};
  buildSidebarChips();
  applyFilters();
  showAISummary("Displaying 40 verified fresher & junior roles with direct company application links across Cybersecurity, AI/ML, Data Science & CSE. Add your Gemini API Key anytime above to enable live real-time web scraping.");
  totalCount.textContent = allJobs.length;
  tabStats.hidden = false;
  isLoading = false;
}

// ── Main load (parallel 3 domains) ────────────────────────────────────────
let domainSummaries = {};

async function loadAllJobs(apiKey) {
  if (isLoading) return;
  isLoading = true;

  showSkeletons();
  tabStats.hidden = true;
  sortBar.hidden  = true;
  activeFilters.hidden = true;

  toast('🤖 AI Agent searching live web for Cybersecurity, AI/ML & CSE jobs…', 'info');

  const keys = ['cybersecurity', 'aiml', 'cse'];
  let results;
  try {
    results = await Promise.allSettled(keys.map(k => fetchJobs(apiKey, k)));
  } catch (e) {
    console.warn('[HireSSU] API search failed:', e);
  }

  const collected = [];
  const summaries = {};

  if (results) {
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        r.value.jobs.forEach(j => collected.push(j));
        summaries[keys[i]] = r.value.summary;
      } else {
        console.warn(`[HireSSU] ${keys[i]} failed:`, r.reason?.message);
        toast(`⚠️ ${keys[i]} live search note: ${r.reason?.message || 'timeout'}`, 'error');
      }
    });
  }

  if (collected.length > 0) {
    allJobs = collected;
    domainSummaries = summaries;
    buildSidebarChips();
    applyFilters();
    showAISummary();
    totalCount.textContent = allJobs.length;
    tabStats.hidden = false;
    toast(`✅ Live AI found <strong>${allJobs.length} fresh jobs</strong>!`, 'success');
    isLoading = false;
  } else {
    toast('⚠️ Live AI search could not connect. Falling back to 36 verified openings.', 'error');
    loadVerifiedJobs();
  }
}

// ── AI Summary banner ──────────────────────────────────────────────────────
function showAISummary(customText) {
  const existing = document.querySelector('.ai-summary-bar');
  if (existing) existing.remove();

  const summaryText = customText || Object.values(domainSummaries).filter(Boolean).join(' ');
  if (!summaryText) return;

  const tagLabel = customText ? '⚡ Verified Mode' : '✨ AI Market Insight';
  const bar = document.createElement('div');
  bar.className = 'ai-summary-bar';
  bar.innerHTML = `<span class="ai-tag">${tagLabel}</span><span>${esc(summaryText)}</span>`;

  // Insert before jobs area
  const content = document.querySelector('.portal-content');
  if (content && jobsArea) {
    content.insertBefore(bar, jobsArea);
  }
}

// ── Chip filter handlers ───────────────────────────────────────────────────
function handleSkillChip(chip) {
  const wasActive = chip.classList.contains('active');
  $$('[data-filter="skill"]').forEach(c => c.classList.remove('active'));
  if (wasActive) { activeSkill = ''; }
  else           { chip.classList.add('active'); activeSkill = chip.dataset.val; }
  applyFilters();
}

function handleCompanyChip(chip) {
  const wasActive = chip.classList.contains('active');
  $$('[data-filter="company"]').forEach(c => c.classList.remove('active'));
  if (wasActive) { activeCompany = ''; }
  else           { chip.classList.add('active'); activeCompany = chip.dataset.val; }
  applyFilters();
}

// ── Event listeners ────────────────────────────────────────────────────────

// Domain tabs
domainTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    domainTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeDomain = tab.dataset.domain;
    applyFilters();
  });
});

// Experience chips
expChips.forEach(chip => {
  chip.addEventListener('click', () => {
    expChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeExp = chip.dataset.val;
    applyFilters();
  });
});

// Location chips
locChips.forEach(chip => {
  chip.addEventListener('click', () => {
    locChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeLoc = chip.dataset.val;
    applyFilters();
  });
});

// Clear all filters
afClear.addEventListener('click', () => {
  activeDomain = 'all'; domainTabs.forEach(t => t.classList.toggle('active', t.dataset.domain==='all'));
  activeExp    = 'all'; expChips.forEach(c => c.classList.toggle('active', c.dataset.val==='all'));
  activeLoc    = 'all'; locChips.forEach(c => c.classList.toggle('active', c.dataset.val==='all'));
  activeSkill  = '';    $$('[data-filter="skill"]').forEach(c => c.classList.remove('active'));
  activeCompany= '';    $$('[data-filter="company"]').forEach(c => c.classList.remove('active'));
  searchQuery  = '';    globalSearch.value=''; clearSearch.classList.remove('visible');
  applyFilters();
});

// Sort
sortSelect.addEventListener('change', applyFilters);

// Global search bar
let searchDebounce;
globalSearch.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchQuery = globalSearch.value.trim();
  clearSearch.classList.toggle('visible', !!searchQuery);
  searchDebounce = setTimeout(applyFilters, 280);
});
clearSearch.addEventListener('click', () => {
  globalSearch.value = '';
  searchQuery = '';
  clearSearch.classList.remove('visible');
  applyFilters();
});
globalSearch.addEventListener('keydown', e => {
  if (e.key === 'Enter') { clearTimeout(searchDebounce); applyFilters(); }
});

// Hero quick-tags
document.querySelectorAll('.htag').forEach(tag => {
  tag.addEventListener('click', () => {
    globalSearch.value = tag.dataset.q;
    searchQuery = tag.dataset.q;
    clearSearch.classList.add('visible');
    applyFilters();
  });
});

// Refresh
refreshBtn.addEventListener('click', () => {
  const k = getKey();
  if (k) {
    loadAllJobs(k);
  } else {
    loadVerifiedJobs();
    toast('🔄 Refreshed 40 verified job listings! Direct apply active.', 'info');
  }
});

// ── API Key modal ──────────────────────────────────────────────────────────
function openModal() {
  modalApiInput.value = getKey();
  keyModal.classList.add('open');
  keyModal.removeAttribute('hidden');
  keyModal.style.display = 'flex';
  setTimeout(() => modalApiInput.focus(), 60);
}
function closeModal() {
  keyModal.classList.remove('open');
  keyModal.setAttribute('hidden', '');
  keyModal.style.display = 'none';
}

keyBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
keyModal.addEventListener('click', e => { if (e.target === keyModal) closeModal(); });
modalEye.addEventListener('click', () => {
  const hide = modalApiInput.type === 'password';
  modalApiInput.type = hide ? 'text' : 'password';
  modalEye.textContent = hide ? '🙈' : '👁️';
});
modalApiInput.addEventListener('keydown', e => { if (e.key === 'Enter') savAndGo(); });
modalSave.addEventListener('click', savAndGo);

const modalClear = $('modal-clear');
if (modalClear) {
  modalClear.addEventListener('click', () => {
    localStorage.removeItem('hiressu_key');
    updateKeyUI(false);
    closeModal();
    loadVerifiedJobs();
    toast('⚡ Switched to Free Mode — 36 verified openings active', 'info');
  });
}

if (wsCta) wsCta.addEventListener('click', openModal);

function savAndGo() {
  const k = modalApiInput.value.trim();
  if (!k) {
    localStorage.removeItem('hiressu_key');
    updateKeyUI(false);
    closeModal();
    loadVerifiedJobs();
    toast('⚡ Running in Free Mode (No API key needed)', 'info');
    return;
  }
  setKey(k);
  updateKeyUI(true);
  closeModal();
  loadAllJobs(k);
}

// ── Init on page load ──────────────────────────────────────────────────────

// ── Top 100 Companies by Domain Directory ──────────────────────────────────
let top100DomainFilter = 'all';
let top100Search = '';

function renderTop100Directory() {
  sortBar.hidden = true;
  activeFilters.hidden = true;

  const cyberTotal = TOP100_COMPANIES.filter(c => (c.domains || []).includes('cybersecurity')).length;
  const aimlTotal  = TOP100_COMPANIES.filter(c => (c.domains || []).includes('aiml')).length;
  const cseTotal   = TOP100_COMPANIES.filter(c => (c.domains || []).includes('cse')).length;

  const tabs = [
    { id: 'all',           label: `🌐 All (${TOP100_COMPANIES.length})` },
    { id: 'cybersecurity', label: `🔐 Cybersecurity (${cyberTotal})` },
    { id: 'aiml',          label: `🤖 AI / ML & DS (${aimlTotal})` },
    { id: 'cse',           label: `💻 CSE Core (${cseTotal})` },
    { id: 'cat_unicorn',   label: `🦄 Unicorns & Startups` },
    { id: 'cat_it',        label: `🏢 IT Titans` },
    { id: 'cat_fintech',   label: `💳 FinTech & Banking` }
  ];

  let list = [...TOP100_COMPANIES];

  if (top100DomainFilter === 'cybersecurity') {
    list = list.filter(c => (c.domains || []).includes('cybersecurity'));
  } else if (top100DomainFilter === 'aiml') {
    list = list.filter(c => (c.domains || []).includes('aiml'));
  } else if (top100DomainFilter === 'cse') {
    list = list.filter(c => (c.domains || []).includes('cse'));
  } else if (top100DomainFilter === 'cat_unicorn') {
    list = list.filter(c => c.cat_key === 'unicorn');
  } else if (top100DomainFilter === 'cat_it') {
    list = list.filter(c => c.cat_key === 'it');
  } else if (top100DomainFilter === 'cat_fintech') {
    list = list.filter(c => c.cat_key === 'fintech');
  }

  if (top100Search) {
    const q = top100Search.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.hiring_roles || '').toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }

  showingCount.textContent = list.length;

  jobsArea.innerHTML = `
    <div class="top100-container">
      <div class="top100-header">
        <h2>🏢 Top Companies in India — Direct Career Portals</h2>
        <p>Explore top tech companies in India hiring B.Tech graduates broken down by domain: <strong>Cybersecurity (${cyberTotal})</strong>, <strong>AI/ML &amp; Data Science (${aimlTotal})</strong>, and <strong>CSE Core (${cseTotal})</strong>. Click any portal to apply directly.</p>
        <div class="top100-controls">
          <input type="text" id="top100-search-input" class="top100-search" placeholder="Search companies or roles (e.g. Palo Alto, Google, SOC, GenAI, SDE, Goldman Sachs)..." value="${esc(top100Search)}" autocomplete="off" />
          <div class="top100-cats">
            ${tabs.map(t => `
              <span class="top100-cat-chip ${top100DomainFilter === t.id ? 'active' : ''}" data-d="${t.id}">${t.label}</span>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="top100-grid">
        ${list.map(c => {
          const cNameLower = c.name.toLowerCase();
          const matchCount = allJobs.filter(j =>
            (j.company || '').toLowerCase().includes(cNameLower) ||
            cNameLower.includes((j.company || '').toLowerCase())
          ).length;

          const initial = c.name.charAt(0);
          const domBadges = (c.domains || []).map(d => {
            if (d === 'cybersecurity') return '<span class="badge badge-cyber">🔐 Cyber</span>';
            if (d === 'aiml')          return '<span class="badge badge-aiml">🤖 AI/ML</span>';
            if (d === 'cse')           return '<span class="badge badge-cse">💻 CSE</span>';
            return '';
          }).join(' ');

          return `
            <div class="top100-card" data-url="${esc(c.career_url)}" title="Click to open ${esc(c.name)} official careers page">
              <div class="top100-card-head">
                <div class="top100-company-title">
                  <div class="top100-avatar">${initial}</div>
                  <div>
                    <div class="top100-company-name">${esc(c.name)}</div>
                    <span class="top100-badge ${c.cat_key}">${esc(c.category)}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">
                ${domBadges}
              </div>
              ${c.hiring_roles ? `
                <div style="font-size:12px;color:var(--text);background:var(--surface-2);padding:6px 10px;border-radius:6px;border:1px solid var(--border);">
                  <strong style="color:#a5b4fc;font-size:11px;">Hiring:</strong> ${esc(c.hiring_roles)}
                </div>
              ` : ''}
              <div class="top100-loc">📍 ${esc(c.location)}</div>
              <div class="top100-actions">
                <a href="${esc(c.career_url)}" target="_blank" rel="noopener noreferrer" class="top100-btn-portal" title="Open official ${esc(c.name)} careers page">
                  Career Portal ↗
                </a>
                <button class="top100-btn-jobs" data-comp="${esc(c.name)}" data-count="${matchCount}" title="View openings for ${esc(c.name)}">
                  ${matchCount > 0 ? `⚡ Jobs (${matchCount})` : 'Search 🔍'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach search
  const sInput = document.getElementById('top100-search-input');
  if (sInput) {
    sInput.addEventListener('input', e => {
      top100Search = e.target.value.trim();
      renderTop100Directory();
      const nInp = document.getElementById('top100-search-input');
      if (nInp) {
        nInp.focus();
        nInp.setSelectionRange(nInp.value.length, nInp.value.length);
      }
    });
  }

  // Attach domain filter chips
  document.querySelectorAll('.top100-cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      top100DomainFilter = chip.dataset.d;
      renderTop100Directory();
    });
  });

  // Make entire company profile card clickable
  document.querySelectorAll('.top100-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.top100-btn-jobs') || e.target.closest('.top100-btn-portal')) return;
      const url = card.dataset.url;
      if (url && url.startsWith('http')) {
        try {
          const w = window.open(url, '_blank', 'noopener,noreferrer');
          if (!w || w.closed || typeof w.closed === 'undefined') {
            window.location.href = url;
          }
        } catch (err) {
          window.location.href = url;
        }
      }
    });
  });

  // Attach portal buttons direct redirection
  document.querySelectorAll('.top100-btn-portal').forEach(a => {
    a.addEventListener('click', (e) => {
      const url = a.href;
      if (url && url.startsWith('http')) {
        try {
          const w = window.open(url, '_blank', 'noopener,noreferrer');
          if (!w || w.closed || typeof w.closed === 'undefined') {
            window.location.href = url;
          }
        } catch (err) {
          window.location.href = url;
        }
        e.preventDefault();
      }
    });
  });

  // Attach job filter / live search buttons
  document.querySelectorAll('.top100-btn-jobs').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const compName = btn.dataset.comp;
      const count = parseInt(btn.dataset.count || '0', 10);
      if (count > 0) {
        activeDomain = 'all';
        domainTabs.forEach(t => t.classList.toggle('active', t.dataset.domain === 'all'));
        globalSearch.value = compName;
        searchQuery = compName;
        clearSearch.classList.add('visible');
        applyFilters();
        window.scrollTo({ top: 350, behavior: 'smooth' });
      } else {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(compName + ' fresher engineering jobs careers india')}&ibp=htl;jobs`;
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
      }
    });
  });
}


(function init() {
  const savedKey = getKey();
  if (savedKey) {
    updateKeyUI(true);
    loadAllJobs(savedKey);  // auto-load live AI jobs if key saved
  } else {
    updateKeyUI(false);
    loadVerifiedJobs();     // auto-load verified jobs immediately without key
  }
})();
