import benchmark


def test_bands():
    assert benchmark.size_band(5) == "small" and benchmark.size_band(15) == "medium" and benchmark.size_band(40) == "large"


def test_percentile_uses_reference_without_db(monkeypatch):
    monkeypatch.setattr(benchmark.db, "client", lambda: (_ for _ in ()).throw(RuntimeError("no db")))
    r = benchmark.percentile("x", 6, 72)
    assert r["size_band"] == "small" and 70 <= r["percentile"] <= 80 and r["peers"] == 0 and r["median_score"] is not None


def test_hash_is_not_the_id():
    assert benchmark.chain_hash("abc") != "abc" and len(benchmark.chain_hash("abc")) == 64
