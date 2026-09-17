"""Small OpenAI-compatible text client used when LLM_PROVIDER=openai."""
import os
from typing import Optional, Tuple

import requests


def generate_text(prompt: str) -> Optional[Tuple[str, str]]:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
    if not api_key:
        return None

    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"], model
