# AI Guard: 3-Year Implementation Plan
**Ontario Public Service — OCCIO / Treasury Board Secretariat | Budget: $1.5M ($500K/year × 3 years)**

---

## Executive Summary

The OPS has 60,000+ public servants across 30 ministries, with 15,000+ already using Microsoft Copilot weekly — the highest adoption rate of any Canadian government. This introduces material risk: inadvertent disclosure of sensitive personal, fiscal, or law-enforcement data to external AI platforms, and non-compliance with Ontario's **Responsible Use of AI Directive** (Dec 1, 2024) and amended **FIPPA** (Bill 194, in force Jul 1, 2025).

AI Guard intercepts prompts before submission to any AI tool, validates them locally against OPS policy, warns employees in real time, and logs flagged interactions — with **no data leaving OPS-controlled infrastructure**.

---

## OPS Context & Priority Ministries

**Key Oversight Bodies**

| Body | Role |
|---|---|
| Treasury Board Secretariat (TBS) | Fiscal oversight, IT governance, enterprise-wide policy |
| OCCIO | GO-ITS standards; accountable for AI governance under AI Directive |
| Infrastructure Technology Services | Delivers shared IT infrastructure; manages enterprise security tooling |
| Information and Privacy Commissioner | Independent FIPPA compliance and AI accountability oversight |

**Why AI Prompt Risk Is Acute**
- 15,000+ active Copilot users with no technical enforcement layer — current controls are advisory only
- Binding AI Directive without enforcement tooling — ministries lack automated mechanisms at the prompt level
- Strengthened FIPPA (Jul 2025) — mandatory IPC breach reporting now applies; a sensitive cloud-submitted prompt could trigger a reportable breach

**Deployment Tiers**

| Tier | Ministries | Rationale |
|---|---|---|
| 1 — Critical | Finance, TBS, Solicitor General, Attorney General, Health | Protected fiscal, law-enforcement, PHI/PHIPA data |
| 2 — High | Children & Social Services, Labour, Education, Economic Dev. | Sensitive personal and social data |
| 3 — Broad | All remaining ministries + Cabinet Office (Year 3) | Enterprise-wide compliance |

---

## Three-Year Phased Plan

### Year 1 (2026) — Pilot & Foundation

**Pilot Parameters**

| Element | Details |
|---|---|
| Pilot Group | OPS co-op students and interns (~750 users) |
| Timeline | Setup: 1 wk / Run: 8–12 wks / Evaluation: 1 wk |
| Success Metrics | ≥75% active users; ≥40% reduction in sensitive prompts; ≤5 sec latency; false positive rate <15% |

**Key Activities**
- Complete Privacy Impact Assessment (PIA) per FIPPA Bill 194 — Q1, before any deployment
- Configure local LLM within OPS network boundaries; deploy via Microsoft Intune/MECM
- Conduct union/employee consultation on monitoring scope — Q1
- Develop Tier 1 ministry-specific policy rulesets — Q4
- Deliver Pilot Findings Report to OCCIO and TBS

**Year 1 Budget: $500,000**

| Category | Item | Cost |
|---|---|---|
| Personnel | Program Manager (12 mo.) | $120,000 |
| Personnel | Cybersecurity Analyst 0.5 FTE | $55,000 |
| Personnel | Privacy/Legal Counsel (contract, 6 mo.) | $45,000 |
| Infrastructure | Local LLM inference server hardware | $60,000 |
| Infrastructure | Software licensing, endpoint management | $25,000 |
| Development | Extension dev + OPS policy ruleset | $80,000 |
| Development | Audit log pipeline + IT security dashboard | $30,000 |
| Training & Comms | Onboarding, materials, change management | $20,000 |
| Evaluation | Survey platform, data analysis, findings report | $15,000 |
| Contingency | 10% reserve | $50,000 |
| **Total** | | **$500,000** |

---

### Year 2 (2027) — Tier 1 & 2 Expansion

**Target:** ~17,500 employees across 9 ministries

**Rollout Schedule:** TBS + Finance (Mo. 4) → AG + Solicitor General (Mo. 5) → Health (Mo. 6) → All Tier 2 staggered (Mo. 7–8)

**Key Activities**
- Scale LLM infrastructure to 15,000–20,000 concurrent users
- Integrate with Microsoft Entra ID for SSO and role-based policy assignment
- Activate ministry-specific rulesets (taxpayer IDs, OPP occurrence numbers, PHI terminology)
- Establish in-extension false positive feedback → weekly analyst review
- File first Annual AI Use Report per AI Directive obligation

**Year 2 Success Metrics**

| Metric | Target |
|---|---|
| Ministries fully deployed | 9 (all Tier 1 + 2) by end of Q3 |
| Total active users | ≥15,000 |
| False positive rate | <10% |
| Employee satisfaction | ≥70% rate AI Guard "helpful" or "neutral" |
| FIPPA breaches from AI prompt activity | 0 |

**Year 2 Budget: $500,000**

| Category | Item | Cost |
|---|---|---|
| Personnel | Program Manager + 2× Cybersecurity Analysts | $235,000 |
| Personnel | Ministry IT Coordinator support (9 ministries) | $45,000 |
| Infrastructure | Additional LLM servers + load balancing | $105,000 |
| Development | Ministry rulesets + Entra ID integration | $65,000 |
| Development | Audit log dashboard enhancement | $15,000 |
| Training & Comms | Ministry onboarding, InsideOPS communications | $15,000 |
| Compliance | PIA update, legal review, AI Directive annual report | $10,000 |
| Contingency | 10% reserve | $10,000 |
| **Total** | | **$500,000** |

---

### Year 3 (2028) — Enterprise-Wide Deployment & Sustainability

**Target:** ~55,000–60,000 employees — all 30 ministries + Cabinet Office

**Key Activities**
- Deploy to all Tier 3 ministries + Cabinet Office — Q1
- Submit AI Guard for formal inclusion in GO-ITS standards framework — Q2
- Engage IPC on joint guidance document — Q3
- Explore Broader Public Sector (BPS) shared-service model (school boards, hospitals, municipalities) — Q3
- Publish public transparency report on program outcomes — Q4
- Transition to run-state funding (~$200K/year ongoing) — Q4

**Year 3 Success Metrics**

| Metric | Target |
|---|---|
| Total ministries deployed | 30 + Cabinet Office (100%) |
| Total active users | ≥50,000 |
| False positive rate | <8% |
| GO-ITS standard inclusion | Formally adopted |
| FIPPA breaches from AI prompt activity | 0 |
| BPS feasibility report | Completed |
| Public transparency report | Published |

**Year 3 Budget: $500,000**

| Category | Item | Cost |
|---|---|---|
| Personnel | Program Manager + 2× Cybersecurity Analysts | $245,000 |
| Personnel | Policy/Standards Analyst — GO-ITS (6 mo.) | $40,000 |
| Infrastructure | Enterprise HA/DR completion + maintenance | $90,000 |
| Development | Remaining ministry rulesets + BPS portal | $55,000 |
| Development | Audit log anonymization and archival system | $15,000 |
| Training & Comms | Enterprise rollout communications campaign | $15,000 |
| Compliance | 3-year evaluation, public transparency report, IPC engagement | $20,000 |
| Contingency | 10% reserve | $20,000 |
| **Total** | | **$500,000** |

---

## Consolidated Budget

| Category | Year 1 | Year 2 | Year 3 | 3-Year Total |
|---|---|---|---|---|
| Personnel | $220,000 | $280,000 | $285,000 | $785,000 |
| Infrastructure | $85,000 | $105,000 | $90,000 | $280,000 |
| Development | $110,000 | $80,000 | $70,000 | $260,000 |
| Training & Comms | $20,000 | $15,000 | $15,000 | $50,000 |
| Compliance & Reporting | $15,000 | $10,000 | $20,000 | $45,000 |
| Contingency | $50,000 | $10,000 | $20,000 | $80,000 |
| **Total** | **$500,000** | **$500,000** | **$500,000** | **$1,500,000** |

---

## Return on Investment

**Cost Per User**

| Year | Users | Cost/User/Year |
|---|---|---|
| Year 1 | ~750 | ~$667 (includes all infrastructure build-out) |
| Year 2 | ~17,500 | ~$29 |
| Year 3 | ~55,000 | ~$9 |
| Ongoing | ~60,000+ | ~$3.33 |

**Risk Avoidance:** A single material AI-related breach costs $150K–$500K in IPC investigation, breach notification, legal fees, and remediation. Preventing three such incidents over three years fully justifies the $1.5M program cost on risk-avoidance grounds alone.

**Strategic Returns**

| Return | Value |
|---|---|
| AI Directive compliance | Technical layer to operationalize OPS's legal obligations |
| Audit-readiness | Audit logs support Treasury Board oversight and IPC inquiries |
| Employee confidence | Staff use AI tools more confidently with guardrails in place |
| Policy feedback loop | Audit data enables evidence-based refinement of AI use rules |
| National leadership | Positions OPS as the national model for responsible AI governance |
| BPS multiplier | Shared-service model extends protection to school boards, hospitals, municipalities |

---

## Governance & Privacy Compliance

| Requirement | How AI Guard Addresses It |
|---|---|
| PIA (mandatory Jul 1, 2025) | Completed Year 1 Q1 before any deployment; updated Year 2 |
| Data residency | Local LLM on-premise or OPS-managed Azure Canada — no prompt data leaves Ontario |
| Breach prevention | Intercepts sensitive data before it reaches external AI tools |
| AI Directive accountability | Audit logs support mandatory annual AI use reports |
| Employee complaint mechanism | In-extension false positive feedback satisfies AI Directive accessible complaint requirement |

---

## Risks & Mitigation

| Risk | Mitigation |
|---|---|
| High false positive rate frustrates users | Invest in ruleset tuning Year 1; feedback button; target <10% by Year 2 |
| Validation latency exceeds 5 sec at scale | Right-size infrastructure before each phase; load-test before go-live |
| Employee/union resistance to monitoring | Frame as employee protection; log only flagged prompts; union consultation Year 1 Q1 |
| Ministry-specific terminology misclassified | Engage ministry SMEs to build vocabulary exceptions per deployment |
| LLM model updates require external connectivity | Use open-weight models (Llama, Mistral); updates occur offline, tested before deployment |

---

## Roadmap Summary

| | Year 1 (2026) ~750 users | Year 2 (2027) ~17,500 users | Year 3 (2028) ~55,000 users |
|---|---|---|---|
| Q1 | Infrastructure build + PIA | Scale infra + onboarding | All remaining ministries + Cabinet Office |
| Q2 | Pilot launch (co-op cohort) | Finance + TBS + AG + Solicitor General | GO-ITS integration submission |
| Q3 | Pilot monitoring + tuning | Health + Tier 2 rollout | BPS exploration + IPC engagement |
| Q4 | Evaluation + Year 2 plan | Annual AI report filed | Sustainability transition + public report |
| **Budget** | **$500,000** | **$500,000** | **$500,000** |
