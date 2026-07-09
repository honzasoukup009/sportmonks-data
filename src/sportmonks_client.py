import os
import time
from typing import Any

import requests

BASE_URL = "https://api.sportmonks.com/v3/football"


class SportmonksError(RuntimeError):
    pass


class SportmonksClient:
    def __init__(self, api_token: str | None = None, base_url: str = BASE_URL, max_retries: int = 5):
        self.api_token = api_token or os.environ["SPORTMONKS_API_TOKEN"]
        self.base_url = base_url.rstrip("/")
        self.max_retries = max_retries
        self.session = requests.Session()

    def _request(self, url: str, params: dict[str, Any] | None) -> dict[str, Any]:
        request_params = dict(params or {})
        request_params.setdefault("api_token", self.api_token)
        for attempt in range(self.max_retries):
            response = self.session.get(url, params=request_params, timeout=30)
            if response.status_code == 429:
                wait = int(response.headers.get("Retry-After", 2**attempt))
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response.json()
        raise SportmonksError(f"Rate limited after {self.max_retries} retries: {url}")

    def get(
        self,
        path: str,
        include: str | None = None,
        extra_params: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch a Sportmonks endpoint, following pagination until has_more is false."""
        url = f"{self.base_url}/{path.lstrip('/')}"
        params: dict[str, Any] | None = dict(extra_params or {})
        if include:
            params["include"] = include

        results: list[dict[str, Any]] = []
        next_url: str | None = url
        while next_url:
            payload = self._request(next_url, params)
            data = payload.get("data", [])
            results.extend(data if isinstance(data, list) else [data])

            pagination = payload.get("pagination") or {}
            if pagination.get("has_more") and pagination.get("next_page"):
                next_url = pagination["next_page"]
                params = None  # next_page URL already carries the query string
            else:
                next_url = None

        return results
