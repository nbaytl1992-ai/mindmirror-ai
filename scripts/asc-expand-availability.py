#!/usr/bin/env python3
"""Expand subscription availability to all territories (fix China TestFlight)."""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID = "PXU75Z3V77"
ISSUER_ID = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
SUBS = ["6770884039", "6770884810"]


def find_key() -> Path:
    p = Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8"
    if not p.exists():
        raise FileNotFoundError("Auth key missing")
    return p


class ASC:
    def __init__(self):
        key = find_key().read_text()
        now = int(time.time())
        token = jwt.encode(
            {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
            key,
            algorithm="ES256",
            headers={"kid": KEY_ID, "typ": "JWT"},
        )
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def get(self, path: str) -> dict:
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}", headers=self.headers
        )
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())

    def patch(self, path: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.headers,
            method="PATCH",
        )
        try:
            with urllib.request.urlopen(req) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(e.read().decode()) from e


def main() -> None:
    api = ASC()
    territories = api.get("/v1/territories?limit=200")
    all_ids = [t["id"] for t in territories["data"]]
    print(f"Total territories: {len(all_ids)}, CHN present: {'CHN' in all_ids}")

    for sid in SUBS:
        sub = api.get(f"/v1/subscriptions/{sid}")
        state = sub["data"]["attributes"]["state"]
        print(f"\n{sid} state={state}")

        # PATCH availability — all territories, cleared for new territories
        body = {
            "data": {
                "type": "subscriptionAvailabilities",
                "id": sid,
                "attributes": {"availableInNewTerritories": True},
                "relationships": {
                    "availableTerritories": {
                        "data": [{"type": "territories", "id": tid} for tid in all_ids]
                    }
                },
            }
        }
        try:
            res = api.patch(f"/v1/subscriptionAvailabilities/{sid}", body)
            print("Patched availability OK")
        except RuntimeError as e:
            print("Patch failed:", str(e)[:1200])

        sub2 = api.get(f"/v1/subscriptions/{sid}")
        print("New state:", sub2["data"]["attributes"]["state"])


if __name__ == "__main__":
    main()
