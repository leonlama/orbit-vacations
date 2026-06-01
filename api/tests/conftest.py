"""Shared test fixtures: run an endpoint handler in a real in-process server.

This lets the endpoint tests exercise the full BaseHTTPRequestHandler path
(status codes, CORS headers, OPTIONS preflight, JSON bodies) without any
external dependencies -- just the standard library.
"""

import json
import threading
from contextlib import contextmanager
from http.server import HTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest


@contextmanager
def _running_server(handler_cls):
    # Port 0 -> OS picks a free ephemeral port.
    server = HTTPServer(("127.0.0.1", 0), handler_cls)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        host, port = server.server_address
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


class Response:
    """Lightweight view of an HTTP response for assertions."""

    def __init__(self, status, headers, body_bytes):
        self.status = status
        self.headers = headers
        self.body = body_bytes

    def json(self):
        return json.loads(self.body)


def _request(base_url, method="GET", path="", data=None):
    url = base_url + path
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = Request(url, data=body, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req) as resp:
            return Response(resp.status, dict(resp.headers), resp.read())
    except HTTPError as exc:  # 4xx/5xx still carry a JSON body we want to read.
        return Response(exc.code, dict(exc.headers), exc.read())


@pytest.fixture
def serve():
    """Fixture returning a (handler_cls) -> client callable context manager."""

    @contextmanager
    def _factory(handler_cls):
        with _running_server(handler_cls) as base_url:
            def client(method="GET", path="", data=None):
                return _request(base_url, method=method, path=path, data=data)

            yield client

    return _factory
