"""
config.py
Central configuration for the AI Compliance Guard validation API.
Environment variables take precedence over defaults.
"""

import os

class Config:
    # Flask settings
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 5000))

    # CORS: only allow requests from the Edge extension background worker
    # In production, restrict this further to your extension's ID origin.
    ALLOWED_ORIGINS = ["*"]  # TODO: Restrict to extension origin in production

    # Audit log settings
    AUDIT_LOG_ENABLED = os.getenv("AUDIT_LOG_ENABLED", "true").lower() == "true"
    AUDIT_LOG_DIR = os.getenv("AUDIT_LOG_DIR", os.path.join(os.path.dirname(__file__), "audit_logs"))
    AUDIT_LOG_FILENAME = os.getenv("AUDIT_LOG_FILENAME", "prompt_audit_log.xlsx")

    # Validator backend: "rule_based" | "llm" (LLM not yet implemented)
    VALIDATOR_BACKEND = os.getenv("VALIDATOR_BACKEND", "rule_based")

    # LLM settings (for future use with Phi-4-mini-instruct or similar)
    LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:11434")  # e.g., Ollama
    LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "phi4-mini")
