from importlib import reload


def test_role_temperatures_cover_all_agents():
    from models import ROLE_TEMPERATURE
    for role in ["sentinel", "analyst", "router", "impact", "strategist", "forecaster", "scenario", "copilot", "orchestrator"]:
        assert role in ROLE_TEMPERATURE


def test_make_model_gemini(monkeypatch):
    monkeypatch.setenv("AGENT_MODEL_PROVIDER", "gemini")
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    import config, models
    reload(config); reload(models)
    m = models.make_model("router")
    assert type(m).__name__ == "GeminiModel"
