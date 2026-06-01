"""Pytest configuration: make the `api` directory importable as the package root.

This lets the tests import the `orbital` package (api/orbital) regardless of
the directory pytest is invoked from.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
