#!/usr/bin/env python3
"""Fill missing subscription prices from USA equalizations (unbuffered)."""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID, ISSUER = "PXU75Z3V77", "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
CONFIG = {
    "6770884039": "eyJzIjoiNjc3MDg4NDAzOSIsInQiOiJVU0EiLCJwIjoiMTAwMzYifQ",
    "6770884810": "eyJzIjoiNjc3MDg4NDgxMCIsInQiOiJVU0EiLCJwIjoiMTAxNzcifQ",
}


class ASC:
    def __init__(self):
        key = (Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8").read_text()
        now = int(time.time())
        token = jwt.encode(
            {"iss": ISSUER, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
            key,
            algorithm="ES256",
            headers={"kid": KEY_ID, "typ": "JWT"},
        )
        self.h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def get(self, path: str) -> dict:
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}", headers=self.h
        )
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())

    def post(self, path: str, body: dict) -> bool:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.h,
            method="POST",
        )
        try:
            urllib.request.urlopen(req)
            return True
        except urllib.error.HTTPError as e:
            err = e.read().decode()
            if e.code in (409, 422) or "already" in err.lower():
                return False
            if e.code == 429:
                time.sleep(2)
                return self.post(path, body)
            print("ERR", err[:200], file=sys.stderr)
            return False


def priced_territories(api: ASC, sub_id: str) -> set[str]:
    out: set[str] = set()
    url = f"/v1/subscriptions/{sub_id}/prices?include=territory&limit=200"
    while url:
        path = url.replace("https://api.appstoreconnect.apple.com", "")
        data = api.get(path)
        for row in data.get("data", []):
            tid = row.get("relationships", {}).get("territory", {}).get("data", {}).get("id")
            if tid:
                out.add(tid)
        url = data.get("links", {}).get("next")
    return out


def equalize(api: ASC, sub_id: str, usa_pp: str) -> None:
    have = priced_territories(api, sub_id)
    print(f"{sub_id}: already priced {len(have)} territories", flush=True)

    eq = api.get(f"/v1/subscriptionPricePoints/{usa_pp}/equalizations?limit=200")
    points = eq.get("data", [])
    print(f"{sub_id}: equalizations {len(points)}", flush=True)

    created = 0
    for i, pp in enumerate(points):
        # territory id encoded in price point id — decode via include not available; use equalization territory link
        pp_id = pp["id"]
        body = {
            "data": {
                "type": "subscriptionPrices",
                "relationships": {
                    "subscription": {"data": {"type": "subscriptions", "id": sub_id}},
                    "subscriptionPricePoint": {
                        "data": {"type": "subscriptionPricePoints", "id": pp_id}
                    },
                },
            }
        }
        if api.post("/v1/subscriptionPrices", body):
            created += 1
        if (i + 1) % 25 == 0:
            print(f"  progress {i+1}/{len(points)} created={created}", flush=True)
        time.sleep(0.2)

    sub = api.get(f"/v1/subscriptions/{sub_id}")
    print(f"{sub_id}: done created={created} state={sub['data']['attributes']['state']}", flush=True)


def main() -> None:
    api = ASC()
    for sub_id, usa_pp in CONFIG.items():
        equalize(api, sub_id, usa_pp)


if __name__ == "__main__":
    main()
