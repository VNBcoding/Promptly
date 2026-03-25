# Product Requirements Document
## AI Guard — Pre-Submission AI Compliance Guardrail
**Version:** 1.0
**Status:** Draft
**Owner:** Abdullah Mustafa
**Last Updated:** March 25, 2026

---

## 1. Problem Statement

The Ontario Public Service (OPS) has 60,000+ employees across 30 ministries, with 15,000+ actively using Microsoft Copilot weekly — the highest AI adoption rate of any Canadian government. This creates material risk:

- Employees may inadvertently submit sensitive personal, fiscal, or law-enforcement data to external AI platforms
- Current controls are advisory only — no technical enforcement exists at the prompt level
- Ontario's **Responsible Use of AI Directive** (Dec 1, 2024) is now binding, and amended **FIPPA** (Bill 194, in force Jul 1, 2025) mandates IPC breach reporting
- A single sensitive prompt submitted to an external AI tool could constitute a reportable breach

There is no product today that intercepts and validates AI prompts locally before submission, without routing sensitive data through external infrastructure.

---

## 2. Product Vision

AI Guard is a lightweight browser extension paired with a local validation API that intercepts prompts before they reach any AI platform, validates them against organizational policy in real time, warns the user, and logs flagged interactions — **with zero data leaving OPS-controlled infrastructure**.

> "AI Guard lets OPS employees use AI tools confidently, knowing a guardrail exists between them and a potential breach."

---

## 3. Goals & Success Metrics

### Goals
- Prevent sensitive data from being submitted to external AI tools
- Provide real-time, non-blocking feedback to users (not a hard blocker)
- Generate audit logs that support Treasury Board and IPC oversight
- Achieve compliance with the AI Directive and FIPPA without disrupting productivity

### Success Metrics

| Metric | Year 1 (Pilot) | Year 2 | Year 3 |
|---|---|---|---|
| Active users | ≥75% of deployed base | ≥15,000 | ≥50,000 |
| Reduction in sensitive prompts submitted | ≥40% | ≥50% | ≥60% |
| Validation latency | ≤5 sec | ≤5 sec | ≤5 sec |
| False positive rate | <15% | <10% | <8% |
| FIPPA breaches from AI prompt activity | 0 | 0 | 0 |
| Employee satisfaction ("helpful" or "neutral") | — | ≥70% | ≥75% |

---

## 4. Users & Stakeholders

### Primary Users
| User | Description | Key Need |
|---|---|---|
| OPS Employee | Public servant using Copilot or ChatGPT for daily work | Fast, non-intrusive guardrail that doesn't slow them down |
| IT Administrator | Deploys and configures AI Guard across ministry devices | Simple deployment via Intune/MECM; centralized policy config |
| Ministry Compliance Officer | Monitors policy adherence across their ministry | Audit log access and violation trend reporting |

### Stakeholders
| Stakeholder | Interest |
|---|---|
| Treasury Board Secretariat (TBS) | Fiscal and IT governance oversight |
| OCCIO | GO-ITS standards; accountable for AI Directive compliance |
| Information & Privacy Commissioner (IPC) | FIPPA breach reporting and AI accountability |
| Employee unions | Monitoring scope, employee rights, complaint mechanism |

---

## 5. Scope

### In Scope (v1.0 — Pilot)
- Browser extension for Microsoft Edge (Manifest V3)
- Prompt interception on ChatGPT and Microsoft Copilot
- PDF attachment text extraction and validation
- Rule-based local validation against a configurable policy text
- Real-time warning UI with autocorrect suggestion
- Local audit logging to Excel (`.xlsx`)
- Extension popup for policy configuration
- Local Flask validation API (runs on employee device or OPS server)

### Out of Scope (v1.0)
- LLM-based validation (planned for v1.1+)
- Support for platforms beyond ChatGPT and Copilot
- Centralized audit log aggregation across users
- Microsoft Entra ID / SSO integration (Year 2)
- Mobile or non-browser AI tool coverage
- Hard blocking of prompt submission (by design — warn only)

---

## 6. Features & Requirements

### 6.1 Prompt Interception
**Priority:** P0

- The extension MUST intercept the prompt text before it is submitted to the AI platform
- Interception MUST be invisible to the AI platform (no modification to the DOM that breaks platform functionality)
- Interception MUST work on ChatGPT (`chatgpt.com`) and Microsoft Copilot (`copilot.microsoft.com`)
- The extension MUST support platform-specific adapters to handle DOM differences per AI tool

### 6.2 Attachment Handling
**Priority:** P0

- The extension MUST extract text from PDF attachments before validation
- PDF extraction MUST happen locally (no external service calls)
- Extraction failures MUST be noted in the validation request as an attachment note, not treated as a blocking error

### 6.3 Validation
**Priority:** P0

- All validation MUST occur locally — no prompt data may be sent to external services
- Validation MUST complete within 5 seconds under normal load
- The rule-based validator MUST check prompts against a user-configured policy text
- Validation results MUST include: status, reasons for flagging, specific violations (type, text, reason), and a corrected prompt when applicable
- The validator backend MUST be swappable (rule-based → LLM) via configuration without code changes

### 6.4 User Warning UI
**Priority:** P0

- When a violation is detected, the extension MUST display an inline warning to the user before submission completes
- The warning MUST show the specific reasons the prompt was flagged
- The user MUST be offered an autocorrected version of their prompt
- The user MUST be able to accept the autocorrected prompt, dismiss the warning and submit anyway, or cancel
- The UI MUST NOT permanently block submission — the user retains final control
- Warning display latency MUST be ≤5 seconds from submit click

### 6.5 Audit Logging
**Priority:** P0

- All validated prompts MUST be logged locally (on OPS-managed infrastructure)
- Log entries MUST include: timestamp, platform/domain, prompt text, attachment text, validation status, violation types, and whether autocorrect was accepted
- Audit logs MUST be stored in `.xlsx` format for compatibility with OPS reporting tools
- No audit data MAY be transmitted to any external service
- Audit logging MUST be configurable (enable/disable) via environment variable

### 6.6 Extension Popup
**Priority:** P1

- The popup MUST allow users to view and configure their org policy text
- The popup MUST show the current validation status / last result
- The popup MUST allow IT admins to set the API endpoint URL

### 6.7 Policy Configuration
**Priority:** P1

- Policy text MUST be configurable per deployment without a code change
- Ministry-specific rulesets MUST be supported (e.g. taxpayer IDs, OPP occurrence numbers, PHI terminology)
- Policy updates MUST take effect without reinstalling the extension

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Validation latency (p95) | ≤5 seconds |
| Extension load impact | No measurable page load regression |
| Data residency | All data stays within OPS-controlled infrastructure |
| Browser compatibility | Microsoft Edge (primary), Chrome (secondary) |
| Deployment method | Microsoft Intune / MECM compatible |
| Offline behaviour | Extension MUST fail gracefully if local API is unreachable (warn user, do not block) |
| Accessibility | Warning UI must meet WCAG 2.1 AA |

---

## 8. Architecture Overview

```
[User types prompt]
        ↓
[Edge Extension — content script]
  • Intercepts submit event
  • Extracts prompt + attachment text
  • Sends to local validation API
        ↓
[Local Validation API — Flask on localhost:5000]
  • Rule-based or LLM validator
  • Returns: status, violations, corrected prompt
  • Appends audit log entry
        ↓
[Extension — UI component]
  • Renders warning if violations found
  • User accepts autocorrect / dismisses / cancels
        ↓
[Prompt submitted to AI platform — or cancelled]
```

No data exits this flow to any external service.

---

## 9. Rollout Plan

| Phase | Timeline | Users | Scope |
|---|---|---|---|
| Pilot | 2026 Q2–Q3 | ~750 co-op students | ChatGPT + Copilot, rule-based validator |
| Tier 1 | 2027 Q2–Q3 | ~17,500 | Finance, TBS, AG, Solicitor General, Health |
| Tier 2 | 2027 Q3 | +additional | Children & Social Services, Labour, Education, Economic Dev. |
| Enterprise | 2028 Q1 | ~55,000+ | All 30 ministries + Cabinet Office |

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| High false positive rate frustrates users | Medium | High | Invest in ruleset tuning in Year 1; add feedback button; target <10% by Year 2 |
| Validation latency >5 sec disrupts workflow | Low | High | Load-test before each phase; right-size infrastructure |
| Employee/union resistance to prompt monitoring | Medium | High | Frame as employee protection; only log flagged prompts; conduct union consultation Q1 2026 |
| Extension breaks on AI platform DOM updates | Medium | Medium | Adapter pattern isolates platform-specific code; monitor platform changelogs |
| Sensitive prompt submitted before extension loads | Low | Medium | Document known gap; extension loads at `document_idle` to minimize window |
| PAT / credential exposure in dev workflow | Low | Medium | Never embed credentials in shared code; use environment variables |

---

## 11. Open Questions

- [ ] Will audit logs be aggregated centrally (e.g. via SharePoint or a shared OPS server) or remain per-device?
- [ ] What is the approved LLM model for v1.1? (config references `phi4-mini` via Ollama)
- [ ] Should the extension hard-block submission for Tier 1 ministries (law enforcement, health) after user warnings are dismissed multiple times?
- [ ] Who owns policy ruleset maintenance per ministry — IT, compliance officer, or OCCIO centrally?
- [ ] What is the retention period for audit logs under FIPPA?

---

## 12. Dependencies

| Dependency | Owner | Notes |
|---|---|---|
| Privacy Impact Assessment (PIA) | Privacy/Legal Counsel | Must complete before any deployment (Q1 2026) |
| Union/employee consultation | HR / Labour Relations | Required before pilot launch |
| Microsoft Intune deployment package | ITS | Needed for managed device rollout |
| Ministry-specific policy rulesets | Ministry IT / Compliance | Required before each ministry goes live |
| LLM inference server (v1.1+) | Infrastructure | On-premise or OPS-managed Azure Canada |
