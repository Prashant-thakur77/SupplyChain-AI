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


def test_make_model_openai_compatible(monkeypatch):
    monkeypatch.setenv("AGENT_MODEL_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    monkeypatch.setenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
    monkeypatch.setenv("OPENAI_MODEL_ID", "llama-3.3-70b-versatile")
    import config, models
    reload(config); reload(models)
    m = models.make_model("router", json_mode=True)
    assert type(m).__name__ == "OpenAIModel" and m.config["model_id"] == "llama-3.3-70b-versatile"
    assert models.model_plans("router") == [(None, None)] * 3
    monkeypatch.setenv("AGENT_MODEL_PROVIDER", "gemini"); reload(config); reload(models)


def test_make_model_ollama(monkeypatch):
    monkeypatch.setenv("AGENT_MODEL_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_MODEL_ID", "qwen2.5:7b")
    import config, models
    reload(config); reload(models)
    m = models.make_model("router")
    assert type(m).__name__ == "OllamaModel" and m.config["model_id"] == "qwen2.5:7b"
    monkeypatch.setenv("AGENT_MODEL_PROVIDER", "gemini"); reload(config); reload(models)


def test_ollama_metadata_none_counts_are_coalesced():
    from types import SimpleNamespace

    from models import _harden_ollama

    class Fake:
        def format_chunk(self, event):
            d = event["data"]
            return d.eval_count + d.prompt_eval_count

    _harden_ollama(Fake)
    assert Fake().format_chunk({"chunk_type": "metadata", "data": SimpleNamespace(eval_count=None, prompt_eval_count=None)}) == 0
    assert Fake().format_chunk({"chunk_type": "metadata", "data": SimpleNamespace(eval_count=3, prompt_eval_count=4)}) == 7
