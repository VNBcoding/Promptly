"""
validator/rule_based.py
Rule-based validation backend.

This is the MVP implementation. It uses simple keyword and pattern matching
to detect policy violations. It is intentionally modular so it can be
replaced with a real LLM backend (e.g., Phi-4-mini-instruct via Ollama)
without changing the extension contract.

EXTENDING THIS MODULE:
  - Add patterns to VIOLATION_PATTERNS to detect more policy violations.
  - The corrected_prompt returned here is a simple redaction.
  - When swapping in a real LLM, this whole file can be replaced with
    an LLMValidator that calls a local model endpoint.
"""

import re
from typing import List, Tuple
from .base import ValidatorBase, ValidationResponse, ViolationEntry


# ---------------------------------------------------------------------------
# Violation pattern definitions
# Each entry: (pattern_regex, violation_type, reason_message)
# TODO: Replace or augment with LLM-based detection in a future version.
# ---------------------------------------------------------------------------
VIOLATION_PATTERNS: List[Tuple[re.Pattern, str, str]] = [
    # PII patterns
    (
        re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        "pii_ssn",
        "Possible Social Security Number detected. SSNs must not be shared with external AI tools."
    ),
    (
        re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b'),
        "pii_email",
        "Email address detected. Personal email addresses should not be shared with external AI tools."
    ),
    (
        re.compile(r'\b(?:\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b'),
        "pii_phone",
        "Phone number detected. Phone numbers should not be shared with external AI tools."
    ),
    # Financial data patterns
    (
        re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b'),
        "financial_card_number",
        "Possible credit card number detected. Financial data must not be shared externally."
    ),
    # Confidential keywords
    (
        re.compile(r'\b(confidential|proprietary|internal only|trade secret|top secret|classified)\b', re.IGNORECASE),
        "confidentiality_marker",
        "Document contains confidentiality markers. This content should not be shared with external AI tools."
    ),
    # Password / credential patterns
    (
        re.compile(r'\b(password|passwd|api[_\s]?key|secret[_\s]?key|bearer[_\s]?token)\s*[:=]\s*\S+', re.IGNORECASE),
        "credential_leak",
        "Possible credential or API key detected. Credentials must never be shared with external AI tools."
    ),
]


class RuleBasedValidator(ValidatorBase):
    """
    Validates prompts using regex-based pattern matching.
    Returns a corrected prompt with violations redacted.
    """

    def validate(
        self,
        prompt_text: str,
        attachment_text: str,
        policy_text: str,
        domain: str,
    ) -> ValidationResponse:

        combined_text = (prompt_text + "\n" + attachment_text).strip()
        violations: List[ViolationEntry] = []
        corrected = prompt_text  # Only correct the typed prompt, not attachment

        # Run all patterns against the combined content
        for pattern, violation_type, reason in VIOLATION_PATTERNS:
            matches = pattern.findall(combined_text)
            for match in matches:
                match_str = match if isinstance(match, str) else match[0]
                violations.append(ViolationEntry(
                    type=violation_type,
                    text=_truncate(match_str, 80),
                    reason=reason,
                ))
                # Redact the violation in the corrected prompt
                corrected = pattern.sub("[REDACTED]", corrected)

        # Also check if combined text mentions any policy keywords from policy_text
        policy_violations = _check_policy_keywords(combined_text, policy_text)
        violations.extend(policy_violations)
        for pv in policy_violations:
            corrected = re.sub(re.escape(pv["text"]), "[REDACTED]", corrected, flags=re.IGNORECASE)

        if not violations:
            return ValidationResponse(
                status="valid",
                message="Your prompt complies with the organization policy.",
                reasons=[],
                corrected_prompt=None,
                violations=[],
            )

        reasons = list(dict.fromkeys(v["reason"] for v in violations))  # deduplicate

        return ValidationResponse(
            status="invalid - autocorrect",
            message=(
                f"Your prompt contains {len(violations)} potential policy violation(s). "
                "A corrected version has been prepared with sensitive content redacted."
            ),
            reasons=reasons,
            corrected_prompt=corrected if corrected != prompt_text else None,
            violations=violations,
        )


def _check_policy_keywords(text: str, policy_text: str) -> List[ViolationEntry]:
    """
    Extract explicit prohibition keywords from the policy text and
    check whether the prompt contains them.

    This is a very simple heuristic: looks for lines like "Do not share X"
    or "Never include Y" in the policy and checks for X/Y in the prompt.

    TODO: Replace with LLM-based policy understanding in a future version.
    """
    violations = []
    if not policy_text:
        return violations

    # Look for "do not", "never", "must not" followed by a noun phrase
    prohibition_pattern = re.compile(
        r'(?:do not|never|must not|should not|shall not)\s+(?:share|include|send|use|disclose)\s+([^\.\,\n]{3,60})',
        re.IGNORECASE
    )

    for match in prohibition_pattern.finditer(policy_text):
        prohibited_phrase = match.group(1).strip().lower()
        # Check if the prohibited phrase (or keywords from it) appear in the text
        keywords = [w for w in prohibited_phrase.split() if len(w) > 3]
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text, re.IGNORECASE):
                violations.append(ViolationEntry(
                    type="policy_keyword_match",
                    text=kw,
                    reason=f"Prompt contains '{kw}' which may be prohibited by policy: '{prohibited_phrase}'."
                ))
                break  # one violation per prohibition rule is enough

    return violations


def _truncate(s: str, max_len: int) -> str:
    return s if len(s) <= max_len else s[:max_len] + "..."
