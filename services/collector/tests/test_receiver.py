import pytest
import requests

from flightflow.config import load_settings
from flightflow.receiver import Receiver, ReceiverError


class _Resp:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self._data


class _FlakySession:
    """Fails the first `failures` requests with a dropped keep-alive connection."""

    def __init__(self, failures):
        self.failures = failures
        self.calls = 0
        self.closed = 0

    def get(self, url, timeout):
        self.calls += 1
        if self.calls <= self.failures:
            raise requests.ConnectionError("RemoteDisconnected('Remote end closed connection without response')")
        return _Resp({"now": 1, "messages": 0, "aircraft": [{"hex": "abc123"}]})

    def close(self):
        self.closed += 1


def _receiver(session):
    s = load_settings(data={"receiver": {"url": "http://rx/tar1090", "latitude": 0, "longitude": 0}})
    r = Receiver(s)
    r._session = session
    return r


def test_retries_once_after_dropped_keepalive():
    session = _FlakySession(failures=1)
    data = _receiver(session).aircraft()
    assert data["aircraft"][0]["hex"] == "abc123"
    assert session.calls == 2 and session.closed == 1


def test_gives_up_when_receiver_is_really_down():
    session = _FlakySession(failures=5)
    with pytest.raises(ReceiverError, match="ConnectionError"):
        _receiver(session).aircraft()
    assert session.calls == 2
