"""Environment-driven settings. AGENT_MODEL_PROVIDER picks Gemini or Bedrock; nothing else changes."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    agent_model_provider: str = "gemini"  # gemini | bedrock | openai | ollama
    gemini_model_id: str = "gemini-flash-latest"  # resolves to the newest Gemini Flash (3.8 at time of writing)
    google_api_key: str = ""
    google_api_key_agents: str = ""
    google_api_key_orchestrator: str = ""
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-6"
    aws_region: str = "us-east-1"
    # OpenAI-compatible providers (OpenAI, Groq, xAI Grok, Together…): AGENT_MODEL_PROVIDER=openai
    openai_api_key: str = ""
    openai_base_url: str = ""  # e.g. https://api.groq.com/openai/v1 or https://api.x.ai/v1
    openai_model_id: str = "gpt-4o-mini"  # e.g. llama-3.3-70b-versatile (Groq), grok-4-fast (xAI)
    # Local models via Ollama: AGENT_MODEL_PROVIDER=ollama
    ollama_host: str = "http://localhost:11434"
    ollama_model_id: str = "qwen2.5:7b"

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    tavily_api_key: str = ""
    news_provider: str = "auto"  # auto (Tavily if key, else Gemini grounding) | gemini
    openweather_api_key: str = ""
    mem0_api_key: str = ""

    agent_service_secret: str = ""  # shared secret with the Next.js proxies
    app_url: str = ""  # public web URL for deep links in notifications
    decision_webhook_url: str = ""  # default Slack-compatible webhook (per-twin policy can override)
    action_secret: str = ""  # shared with the web app (ACTION_SECRET) to sign one-click approve links
    port: int = 8080

    def gemini_key(self, role: str) -> str:
        if role == "orchestrator" and self.google_api_key_orchestrator:
            return self.google_api_key_orchestrator
        return self.google_api_key_agents or self.google_api_key


settings = Settings()
