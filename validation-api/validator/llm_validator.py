"""
validator/llm_validator.py
LLM-based validation backend using Ollama's chat API.

Calls a local Ollama instance to evaluate prompts against the org policy
and returns a structured ValidationResponse.
"""

import json
import urllib.request
import urllib.error
from .base import ValidatorBase, ValidationResponse, ViolationEntry


SYSTEM_PROMPT = """You are a compliance validator for an organization's AI usage policy.

Your job is to review a user's prompt (and any attached document text) against the provided policy, then return a JSON object.

Rules:
- Be strict but fair. Only flag genuine policy violations, not innocent content.
- If the prompt is clean, return status "valid".
- If there are violations that can be fixed by redacting or rephrasing, return status "invalid - autocorrect" and provide a corrected_prompt.
- The corrected_prompt must be the full original prompt with violations replaced by [REDACTED] or rephrased to be compliant.

Return ONLY a raw JSON object (no markdown, no code fences) with this exact structure:
{
  "status": "valid" | "invalid - autocorrect",
  "message": "<short human-readable summary>",
  "reasons": ["<reason 1>", "<reason 2>"],
  "corrected_prompt": "<corrected text or null>",
  "violations": [
    { "type": "<violation_type>", "text": "<offending excerpt>", "reason": "<explanation>" }
  ]
}

If status is "valid", set reasons to [], corrected_prompt to null, and violations to [].
"""


class LLMValidator(ValidatorBase):
    """
    Validates prompts by sending them to a local Ollama instance.
    """

    def __init__(self, api_url: str, model: str):
        self.chat_endpoint = api_url.rstrip("/") + "/api/chat"
        self.model = model

    def validate(
        self,
        prompt_text: str,
        attachment_text: str,
        policy_text: str,
        domain: str,
    ) -> ValidationResponse:

        user_message = self._build_user_message(prompt_text, attachment_text, policy_text, domain)

        raw = self._call_ollama(user_message)

        try:
            result = json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError(f"LLM returned non-JSON response: {e}\nRaw: {raw[:500]}")

        return ValidationResponse(
            status=result.get("status", "valid"),
            message=result.get("message", ""),
            reasons=result.get("reasons", []),
            corrected_prompt=result.get("corrected_prompt") or None,
            violations=[
                ViolationEntry(
                    type=v.get("type", "unknown"),
                    text=v.get("text", ""),
                    reason=v.get("reason", ""),
                )
                for v in result.get("violations", [])
            ],
        )

    def _build_user_message(self, prompt_text: str, attachment_text: str, policy_text: str, domain: str) -> str:
        parts = [f"ORGANIZATION POLICY:\n{policy_text}"]
        parts.append(f"\nPLATFORM: {domain}")
        parts.append(f"\nUSER PROMPT:\n{prompt_text}")
        if attachment_text:
            parts.append(f"\nATTACHED DOCUMENT TEXT:\n{attachment_text[:5000]}")
        return "\n".join(parts)

    def _call_ollama(self, user_message: str) -> str:
        payload = json.dumps({
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            "stream": False,
            "format": "json",
        }).encode("utf-8")

        req = urllib.request.Request(
            self.chat_endpoint,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                return body["message"]["content"]
        except urllib.error.URLError as e:
            raise ConnectionError(f"Could not reach Ollama at {self.chat_endpoint}: {e}")
