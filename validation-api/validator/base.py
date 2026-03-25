"""
validator/base.py
Abstract base class for all validator backends.

To add a new validator backend:
  1. Create a class that inherits ValidatorBase
  2. Implement the validate() method
  3. Register it in app.py's get_validator() factory

The contract between the extension and the API is defined by
the request/response schema — not by this class.
"""

from abc import ABC, abstractmethod
from typing import TypedDict, Optional, List


class ViolationEntry(TypedDict):
    type: str       # e.g., "policy_violation", "pii_detected"
    text: str       # The offending text excerpt
    reason: str     # Human-readable explanation


class ValidationResponse(TypedDict):
    status: str                         # "valid" | "invalid - autocorrect"
    message: str                        # Human-readable summary
    reasons: List[str]                  # List of reason strings
    corrected_prompt: Optional[str]     # Corrected prompt if status is invalid
    violations: List[ViolationEntry]    # Detailed violation entries


class ValidatorBase(ABC):
    """
    Abstract base class for prompt validation backends.
    """

    @abstractmethod
    def validate(
        self,
        prompt_text: str,
        attachment_text: str,
        policy_text: str,
        domain: str,
    ) -> ValidationResponse:
        """
        Validate a prompt against an organization policy.

        Args:
            prompt_text: The typed prompt from the user.
            attachment_text: Extracted text from uploaded files (e.g., PDFs).
            policy_text: The stored organization policy text.
            domain: The AI platform domain (e.g., "chatgpt.com").

        Returns:
            A ValidationResponse dict with status, message, reasons,
            corrected_prompt, and violations.
        """
        pass
