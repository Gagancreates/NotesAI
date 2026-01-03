from anthropic import Anthropic
from app.core.config import get_settings
import json

settings = get_settings()

class ClaudeClient:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def generate(self, system: str, user: str, max_tokens: int = 4000) -> str:
        """
        Generate text using Claude
        """
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[
                {"role": "user", "content": user}
            ]
        )

        return response.content[0].text

    def generate_structured(self, system: str, user: str) -> dict:
        """
        Generate and parse JSON response
        """
        response_text = self.generate(system, user, max_tokens=4000)

        # Extract JSON from response (handle code blocks)
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()

        return json.loads(json_str)