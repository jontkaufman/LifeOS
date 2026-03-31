import re

CRISIS_KEYWORDS = [
    r"\bsuicid\w*\b",
    r"\bkill\s+(my|him|her|them)self\b",
    r"\bwant\s+to\s+die\b",
    r"\bend\s+(my|it\s+all|everything)\b",
    r"\bnot\s+worth\s+living\b",
    r"\bbetter\s+off\s+(dead|without\s+me)\b",
    r"\bhurt\s+myself\b",
    r"\bself[\s-]?harm\b",
    r"\bi'?m\s+in\s+crisis\b",
    r"\bcan'?t\s+go\s+on\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\bgoodbye\s+(forever|everyone|world)\b",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in CRISIS_KEYWORDS]

CRISIS_RESOURCES = {
    "988_lifeline": {
        "name": "988 Suicide & Crisis Lifeline",
        "action": "Call or text 988",
        "available": "24/7",
    },
    "crisis_text": {
        "name": "Crisis Text Line",
        "action": "Text HOME to 741741",
        "available": "24/7",
    },
    "emergency": {
        "name": "Emergency Services",
        "action": "Call 911",
        "available": "24/7",
    },
}


def detect_crisis(text: str) -> dict | None:
    """Detect crisis signals in user text. Returns crisis info or None."""
    text_lower = text.lower()

    for pattern in COMPILED_PATTERNS:
        if pattern.search(text_lower):
            return {
                "detected": True,
                "severity": "high",
                "resources": CRISIS_RESOURCES,
                "message": "If you're in immediate danger, please call 911. You can also reach the 988 Suicide & Crisis Lifeline by calling or texting 988.",
            }

    return None
