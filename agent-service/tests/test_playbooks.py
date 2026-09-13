import playbooks as pb


def test_trigger_hits_rank_first():
    m = pb.match(pb.BUILTIN, "OTHER", "Suez Canal blocked by grounded container ship")
    assert m and m[0]["key"] == "chokepoint"


def test_category_fallback_without_triggers():
    m = pb.match(pb.BUILTIN, "WEATHER", "Something unusual happened")
    assert [p["key"] for p in m] == ["severe_weather"]


def test_disabled_playbooks_skipped_and_render_has_steps():
    custom = [{**pb.BUILTIN[0], "enabled": False}]
    assert pb.match(custom, "LOGISTICS", "port closure") == []
    text = pb.render(pb.match(pb.BUILTIN, "LOGISTICS", "port closure"))
    assert "Playbook 'Port closure" in text and "1. Confirm closure" in text
