# app/utils/response_parser.py

import json
import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedTaskSuggestion:
    requires_task: bool
    title: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    reason: Optional[str] = None
    summary: Optional[str] = None


def _extract_json(text: str) -> Optional[dict]:
    """
    Robustly extracts JSON from Gemini response.
    Handles cases where Gemini wraps JSON in markdown code blocks.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()

    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try finding first JSON object in the string
    match = re.search(r"\{.*?\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None


def parse_email_classification(gemini_response: str) -> ParsedTaskSuggestion:
    """
    Parses Gemini's response to the email classification prompt.
    Never raises — always returns something usable.
    """
    data = _extract_json(gemini_response)

    if data is None:
        return ParsedTaskSuggestion(requires_task=False)

    summary = data.get("summary")
    requires = data.get("requires_task", False)

    if not requires:
        return ParsedTaskSuggestion(requires_task=False, summary=summary)

    # Validate priority — default to medium if Gemini returns garbage
    priority = data.get("priority", "medium")
    if priority not in ("high", "medium", "low"):
        priority = "medium"

    return ParsedTaskSuggestion(
        requires_task=True,
        title=data.get("title"),
        priority=priority,
        due_date=data.get("due_date"),
        reason=data.get("reason"),
        summary=summary,
    )


def is_valid_task_suggestion(parsed: ParsedTaskSuggestion) -> bool:
    """
    Gate before writing to DB.
    Ensures minimum viable data is present.
    """
    return (
        parsed.requires_task is True
        and parsed.title is not None
        and len(parsed.title.strip()) > 3
    )