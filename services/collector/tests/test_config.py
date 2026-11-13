import pytest

from flightflow.config import ConfigError, load_settings, public_config


def test_minimal_config_and_defaults(tmp_path, monkeypatch):
    monkeypatch.setenv("FLIGHTFLOW_DATA_DIR", str(tmp_path))
    s = load_settings(data={"receiver": {"url": "http://10.0.0.5/tar1090/", "latitude": 1, "longitude": 2}})
    assert s.receiver.aircraft_url == "http://10.0.0.5/tar1090/data/aircraft.json"
    assert s.database_url.startswith("sqlite:///") and s.database_url.endswith("flightflow.db")
    assert s.ui.language == "en"
    pub = public_config(s)
    assert pub["home_airport"] is None
    assert pub["map"]["metar"] is False  # no home airport → no METAR
    assert "database" not in pub


def test_env_overrides_database_url(monkeypatch):
    monkeypatch.setenv("FLIGHTFLOW_DATABASE_URL", "postgresql://u:p@h/db")
    s = load_settings(data={"receiver": {"url": "mock", "latitude": 0, "longitude": 0}})
    assert s.database_url == "postgresql://u:p@h/db"


@pytest.mark.parametrize(
    "data,needle",
    [
        ({}, "receiver: required setting is missing"),
        ({"receiver": {"url": "10.0.0.5", "latitude": 0, "longitude": 0}}, "receiver.url: must start with http"),
        ({"receiver": {"url": "mock", "latitude": 91, "longitude": 0}}, "receiver.latitude"),
        ({"receiver": {"url": "mock", "latitude": 0, "longitude": 0}, "ui": {"langauge": "es"}}, "ui.langauge: unknown setting"),
        ({"receiver": {"url": "mock", "latitude": 0, "longitude": 0}, "collector": {"compact_at": "25:00"}}, "compact_at"),
        ({"receiver": {"url": "mock", "latitude": 0, "longitude": 0}, "location": {"home_airport": "Madrid!"}}, "ICAO"),
    ],
)
def test_invalid_config_gives_clear_errors(data, needle):
    with pytest.raises(ConfigError) as e:
        load_settings(data=data)
    assert needle in str(e.value)


def test_missing_file(tmp_path):
    with pytest.raises(ConfigError, match="config.example.yaml"):
        load_settings(path=tmp_path / "nope.yaml")


def test_example_config_is_valid(tmp_path):
    """config.example.yaml (with sections that only contain comments) must load as-is."""
    from pathlib import Path

    example = Path(__file__).resolve().parents[3] / "config.example.yaml"
    s = load_settings(path=example)
    assert s.location.home_airport == "LEMD"
    assert s.database.url is None
