"""Model provider factory. AGENT_MODEL_PROVIDER decides Gemini vs Bedrock; nothing else changes."""
from config import settings

ROLE_TEMPERATURE: dict[str, float] = {
    "sentinel": 0.2,
    "analyst": 0.2,
    "router": 0.1,
    "impact": 0.2,
    "strategist": 0.4,
    "forecaster": 0.3,
    "scenario": 0.6,
    "copilot": 0.5,
    "orchestrator": 0.3,
}


def make_model(role: str):
    temperature = ROLE_TEMPERATURE.get(role, 0.3)
    if settings.agent_model_provider == "bedrock":
        from strands.models import BedrockModel

        return BedrockModel(model_id=settings.bedrock_model_id, region_name=settings.aws_region, temperature=temperature)
    from strands.models.gemini import GeminiModel

    return GeminiModel(
        client_args={"api_key": settings.gemini_key(role)},
        model_id=settings.gemini_model_id,
        params={"temperature": temperature, "max_output_tokens": 4096},
    )
